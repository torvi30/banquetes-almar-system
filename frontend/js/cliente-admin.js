/**
 * Ficha Integral y Expediente de Cliente - Banquetes Almar
 * Conectado en vivo con Firebase Cloud Firestore y dbService.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";
import { openWhatsAppModal } from "./components/whatsapp-concierge.js";

authService.requireAuth("./login.html");

const params = new URLSearchParams(window.location.search);
const clienteId = params.get("id");

const clienteHeroCard = document.getElementById("clienteHeroCard");
const kpiEventosCount = document.getElementById("kpiEventosCount");
const kpiTotalContratado = document.getElementById("kpiTotalContratado");
const kpiTotalPagado = document.getElementById("kpiTotalPagado");
const kpiSaldoPendiente = document.getElementById("kpiSaldoPendiente");
const eventosCliente = document.getElementById("eventosCliente");
const pagosCliente = document.getElementById("pagosCliente");

let currentCliente = null;
let cachedReservations = [];
let cachedPayments = [];
let cachedTotalContracted = 0;
let cachedTotalPaid = 0;

// Formateador de moneda en pesos colombianos
function formatMoney(amount) {
  return "$" + Number(amount || 0).toLocaleString("es-CO");
}

// Formateador de fecha
function formatDate(dateStr) {
  if (!dateStr) return "Por definir";
  try {
    const parts = String(dateStr).split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
    }
  } catch (e) {}
  return String(dateStr);
}

// Iniciales
function getInitials(name) {
  if (!name) return "CL";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!clienteId) {
    clienteHeroCard.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h3 style="color: #ef4444; font-size: 1.3rem; margin-bottom: 0.5rem;">Falta el identificador de cliente</h3>
        <p style="color: #94a3b8; margin-bottom: 1.2rem;">Por favor regresa al directorio y selecciona un cliente.</p>
        <a href="./clientes.html" class="btn btn-primary">Ir al Directorio de Clientes</a>
      </div>
    `;
    return;
  }

  await loadClientDossier();
});

async function loadClientDossier() {
  try {
    // 1. Obtener datos del cliente
    let cliente = await dbService.getClientById(clienteId);

    // Fallback si no encuentra por ID directo
    if (!cliente) {
      const all = await dbService.getClients();
      cliente = all.find(c => String(c.id) === String(clienteId));
    }

    if (!cliente) {
      clienteHeroCard.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h3 style="color: #ef4444; font-size: 1.3rem; margin-bottom: 0.5rem;">Cliente no encontrado</h3>
          <p style="color: #94a3b8; margin-bottom: 1.2rem;">El cliente con ID "${clienteId}" no existe o fue eliminado.</p>
          <a href="./clientes.html" class="btn btn-primary">Volver al Directorio</a>
        </div>
      `;
      return;
    }

    currentCliente = cliente;

    // 2. Obtener reservas asociadas
    const allReservations = await dbService.getReservations().catch(() => []);
    const clientReservations = allReservations.filter(r => {
      if (r.cliente_id && String(r.cliente_id) === String(cliente.id)) return true;
      if (r.cliente && cliente.nombre && r.cliente.toLowerCase() === cliente.nombre.toLowerCase()) return true;
      return false;
    });

    // 3. Obtener pagos asociados
    const allPayments = await dbService.getPayments().catch(() => []);
    const eventIdsSet = new Set(clientReservations.map(r => String(r.id)));

    const clientPayments = allPayments.filter(p => {
      if (p.cliente_id && String(p.cliente_id) === String(cliente.id)) return true;
      if (p.evento_id && eventIdsSet.has(String(p.evento_id))) return true;
      if (p.cliente && cliente.nombre && p.cliente.toLowerCase() === cliente.nombre.toLowerCase()) return true;
      return false;
    });

    cachedReservations = clientReservations;
    cachedPayments = clientPayments;

    // 4. Renderizar componentes
    renderHero(cliente);
    renderFinancialStats(clientReservations, clientPayments);
    renderEventsList(clientReservations);
    renderPaymentsList(clientPayments);

  } catch (err) {
    console.error("Error cargando ficha del cliente:", err);
    clienteHeroCard.innerHTML = `
      <div style="text-align: center; color: #ef4444; padding: 2rem;">
        Error al cargar la ficha: ${err.message}
      </div>
    `;
  }
}

// Renderizar cabecera de perfil
function renderHero(cliente) {
  const initials = getInitials(cliente.nombre);
  const tipo = cliente.tipo_cliente || "Cliente";
  let badgeClass = "badge-estandar";
  let typeIcon = "👤";

  if (tipo.toLowerCase().includes("vip")) {
    badgeClass = "badge-vip";
    typeIcon = "👑";
  } else if (tipo.toLowerCase().includes("empresa")) {
    badgeClass = "badge-empresa";
    typeIcon = "🏢";
  }

  const cleanPhone = String(cliente.telefono || "").replace(/\D/g, "");
  const waUrl = cleanPhone
    ? `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(`¡Hola ${cliente.nombre}! ✨ Te saludamos desde Banquetes Almar (Marinilla, Antioquia).`)}`
    : "";

  clienteHeroCard.innerHTML = `
    <div class="profile-hero-content">
      <div class="profile-avatar-large">${initials}</div>

      <div class="profile-header-meta">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <h1 style="font-size: 1.6rem; font-weight: 800; color: #f8fafc; margin: 0;">${cliente.nombre}</h1>
          <span class="client-type-badge ${badgeClass}" style="font-size: 0.78rem;">${typeIcon} ${tipo}</span>
        </div>

        <div class="client-info-pills">
          <div class="client-pill-item">
            <span>🪪</span>
            <span>Doc: <strong>${cliente.documento || "No registrado"}</strong></span>
          </div>

          <div class="client-pill-item">
            <span>📱</span>
            ${cleanPhone ? `<a href="tel:${cleanPhone}"><strong>${cliente.telefono}</strong></a>` : `<span style="color: #64748b;">Sin teléfono</span>`}
          </div>

          ${cliente.email ? `
            <div class="client-pill-item">
              <span>✉️</span>
              <a href="mailto:${cliente.email}">${cliente.email}</a>
            </div>
          ` : ""}

          ${cliente.direccion ? `
            <div class="client-pill-item">
              <span>📍</span>
              <span>${cliente.direccion}</span>
            </div>
          ` : ""}
        </div>
      </div>

      <div class="profile-header-actions">
        <button type="button" id="btnClientWhatsApp" class="btn btn-secondary" style="background: #10b981; color: #fff; font-weight: 700; border: none; display: inline-flex; align-items: center; gap: 6px;">
          💬 WhatsApp
        </button>

        <button id="btnEditProfile" class="btn btn-secondary" style="color: var(--gold-light); border-color: rgba(230,199,123,0.35);">
          ✏️ Editar Datos
        </button>
      </div>
    </div>
  `;

  document.getElementById("btnClientWhatsApp")?.addEventListener("click", () => {
    const primaryEvent = cachedReservations[0] || {};
    openWhatsAppModal({
      id: primaryEvent.id || cliente.id,
      clientName: cliente.nombre,
      phone: cliente.telefono,
      eventType: primaryEvent.tipo_evento || "Celebración de Gala",
      guestCount: primaryEvent.personas || 0,
      location: primaryEvent.locacion || primaryEvent.lugar || "",
      eventDate: primaryEvent.fecha_evento || "",
      totalAmount: cachedTotalContracted,
      downPayment: cachedTotalPaid,
      remainingBalance: Math.max(0, cachedTotalContracted - cachedTotalPaid),
      origin: "cliente"
    });
  });

  document.getElementById("btnEditProfile")?.addEventListener("click", openEditModal);
}

// Renderizar métricas financieras
function renderFinancialStats(reservations, payments) {
  let totalContracted = 0;
  let totalPaid = 0;

  reservations.forEach(r => {
    totalContracted += Number(r.total || r.valor_total || 0);
  });

  if (payments.length > 0) {
    payments.forEach(p => {
      totalPaid += Number(p.monto || p.valor || 0);
    });
  } else {
    // Si no hay libro contable explícito, sumar anticipos de las reservas
    reservations.forEach(r => {
      totalPaid += Number(r.anticipo || r.abono || 0);
    });
  }

  cachedTotalContracted = totalContracted;
  cachedTotalPaid = totalPaid;
  const balance = Math.max(0, totalContracted - totalPaid);

  if (kpiEventosCount) kpiEventosCount.textContent = reservations.length;
  if (kpiTotalContratado) kpiTotalContratado.textContent = formatMoney(totalContracted);
  if (kpiTotalPagado) kpiTotalPagado.textContent = formatMoney(totalPaid);
  if (kpiSaldoPendiente) kpiSaldoPendiente.textContent = formatMoney(balance);
}

// Renderizar lista de eventos
function renderEventsList(reservations) {
  if (!reservations.length) {
    eventosCliente.innerHTML = `
      <div class="empty-state-card" style="grid-column: 1 / -1; padding: 2.5rem; text-align: center;">
        <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">📅</span>
        <h3>Sin eventos registrados</h3>
        <p>Este cliente no tiene reservas confirmadas en la agenda actualmente.</p>
      </div>
    `;
    return;
  }

  eventosCliente.innerHTML = reservations.map(ev => {
    const total = Number(ev.total || ev.valor_total || 0);
    const anticipo = Number(ev.anticipo || ev.abono || 0);
    const saldo = Math.max(0, total - anticipo);

    return `
      <article class="history-card-luxury">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: #f8fafc; margin-bottom: 2px;">
                ${ev.tipo_evento || "Evento Social"}
              </h3>
              <span style="font-size: 0.75rem; color: #94a3b8;">Folio: ALM-${String(ev.id).toUpperCase().slice(-6)}</span>
            </div>
            <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); font-weight: 700;">
              ${ev.estado || "Confirmada"}
            </span>
          </div>

          <div style="font-size: 0.84rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem;">
            <div>🗓️ <strong>${formatDate(ev.fecha_evento)}</strong> ${ev.hora_evento ? `• ${ev.hora_evento}` : ""}</div>
            <div>📍 ${ev.locacion || ev.lugar || "Salón Almar Marinilla"}</div>
            <div>👥 <strong>${ev.personas || 0}</strong> invitados</div>
          </div>

          <div style="background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); font-size: 0.83rem; margin-bottom: 1.1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #94a3b8;">Total Evento:</span>
              <strong style="color: var(--gold-light);">${formatMoney(total)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #94a3b8;">Anticipo:</span>
              <span style="color: #10b981; font-weight: 600;">${formatMoney(anticipo)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Saldo:</span>
              <span style="color: ${saldo > 0 ? '#ef4444' : '#10b981'}; font-weight: 700;">${formatMoney(saldo)}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.8rem;">
          <button type="button" class="btn btn-secondary btn-sm btn-event-wa" data-id="${ev.id}" style="color: #25d366; border-color: rgba(37,211,102,0.4); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
            💬 WhatsApp
          </button>
          <a href="./contrato.html?id=${ev.id}" target="_blank" class="btn btn-secondary btn-sm" style="color: var(--gold-light); border-color: rgba(200,155,60,0.4); font-weight: 700;">
            📄 Contrato Oficial
          </a>
          <a href="./pagos.html?reserva_id=${ev.id}" class="btn btn-secondary btn-sm" style="color: #93c5fd;">
            💵 Ver Abonos
          </a>
        </div>
      </article>
    `;
  }).join("");

  eventosCliente.querySelectorAll(".btn-event-wa").forEach(btn => {
    btn.addEventListener("click", () => {
      const ev = cachedReservations.find(r => String(r.id) === String(btn.dataset.id));
      if (ev) {
        const total = Number(ev.total || ev.valor_total || 0);
        const anticipo = Number(ev.anticipo || ev.abono || 0);
        const saldo = Math.max(0, total - anticipo);
        openWhatsAppModal({
          id: ev.id,
          clientName: ev.cliente || (currentCliente ? currentCliente.nombre : "Cliente"),
          phone: ev.telefono || (currentCliente ? currentCliente.telefono : ""),
          eventType: ev.tipo_evento,
          guestCount: ev.personas,
          location: ev.locacion || ev.lugar,
          eventDate: ev.fecha_evento,
          totalAmount: total,
          downPayment: anticipo,
          remainingBalance: saldo,
          origin: "reserva"
        });
      }
    });
  });
}

// Renderizar lista de pagos
function renderPaymentsList(payments) {
  if (!payments.length) {
    pagosCliente.innerHTML = `
      <div class="empty-state-card" style="grid-column: 1 / -1; padding: 2.5rem; text-align: center;">
        <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">💵</span>
        <h3>Sin pagos registrados</h3>
        <p>No se registran transacciones bancarias o recibos para este cliente.</p>
      </div>
    `;
    return;
  }

  pagosCliente.innerHTML = payments.map(p => `
    <article class="history-card-luxury">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.6rem;">
          <strong style="font-size: 1.25rem; color: #10b981;">${formatMoney(p.monto || p.valor)}</strong>
          <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.3); font-weight: 700;">
            ${p.estado || "Aprobado"}
          </span>
        </div>

        <div style="font-size: 0.84rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.35rem;">
          <div>📝 Concepto: <strong>${p.concepto || p.tipo_evento || "Abono de evento"}</strong></div>
          <div>💳 Método: ${p.metodo || "Transferencia Bancaria (Bancolombia)"}</div>
          <div>🗓️ Fecha: ${formatDate(p.fecha || p.createdAt)}</div>
          ${p.id ? `<div style="font-size: 0.75rem; color: #64748b;">Comprobante ID: ${p.id}</div>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

// Modal para editar datos del cliente
async function openEditModal() {
  if (!currentCliente) return;

  const { value: formValues } = await Swal.fire({
    title: "Editar Ficha de Cliente",
    html: `
      <div style="display: flex; flex-direction: column; gap: 10px; text-align: left; font-size: 0.85rem;">
        <div>
          <label style="color: #aaa; display: block; margin-bottom: 3px;">Nombre Completo:</label>
          <input id="swalNombre" class="swal2-input" style="margin: 0; width: 100%;" value="${currentCliente.nombre || ""}">
        </div>
        <div>
          <label style="color: #aaa; display: block; margin-bottom: 3px;">Teléfono:</label>
          <input id="swalTelefono" class="swal2-input" style="margin: 0; width: 100%;" value="${currentCliente.telefono || ""}">
        </div>
        <div>
          <label style="color: #aaa; display: block; margin-bottom: 3px;">Cédula o NIT:</label>
          <input id="swalDocumento" class="swal2-input" style="margin: 0; width: 100%;" value="${currentCliente.documento || ""}">
        </div>
        <div>
          <label style="color: #aaa; display: block; margin-bottom: 3px;">Correo Electrónico:</label>
          <input id="swalEmail" class="swal2-input" style="margin: 0; width: 100%;" value="${currentCliente.email || ""}">
        </div>
        <div>
          <label style="color: #aaa; display: block; margin-bottom: 3px;">Dirección / Municipio:</label>
          <input id="swalDireccion" class="swal2-input" style="margin: 0; width: 100%;" value="${currentCliente.direccion || ""}">
        </div>
        <div>
          <label style="color: #aaa; display: block; margin-bottom: 3px;">Perfil de Cliente:</label>
          <select id="swalTipo" class="swal2-input" style="margin: 0; width: 100%;">
            <option value="Cliente" ${currentCliente.tipo_cliente === "Cliente" ? "selected" : ""}>👤 Cliente Estándar</option>
            <option value="VIP" ${currentCliente.tipo_cliente === "VIP" ? "selected" : ""}>👑 Cliente VIP</option>
            <option value="Empresarial" ${currentCliente.tipo_cliente === "Empresarial" ? "selected" : ""}>🏢 Corporativo / Empresa</option>
          </select>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Guardar Cambios",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#c89b3c",
    preConfirm: () => {
      const nombre = document.getElementById("swalNombre").value.trim();
      const telefono = document.getElementById("swalTelefono").value.trim();
      if (!nombre || !telefono) {
        Swal.showValidationMessage("El nombre y el teléfono son requeridos.");
        return false;
      }
      return {
        nombre,
        telefono,
        documento: document.getElementById("swalDocumento").value.trim(),
        email: document.getElementById("swalEmail").value.trim(),
        direccion: document.getElementById("swalDireccion").value.trim(),
        tipo_cliente: document.getElementById("swalTipo").value
      };
    }
  });

  if (!formValues) return;

  try {
    await dbService.updateClient(currentCliente.id, formValues);
    Swal.fire({
      icon: "success",
      title: "Cliente actualizado",
      timer: 1200,
      showConfirmButton: false
    });
    await loadClientDossier();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error al actualizar",
      text: err.message
    });
  }
}