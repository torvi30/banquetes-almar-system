/**
 * Detalle y Ficha del Cliente - Banquetes Almar
 * Conectado con Firebase Cloud Firestore y dbService.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

const params = new URLSearchParams(window.location.search);
const clienteId = params.get("id");

const clienteInfo = document.getElementById("clienteInfo");
const resumenCards = document.getElementById("resumenCards");
const eventosCliente = document.getElementById("eventosCliente");
const pagosCliente = document.getElementById("pagosCliente");
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

function formatearDinero(valor) {
  return `$${Number(valor || 0).toLocaleString("es-CO")}`;
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return String(fecha).slice(0, 10);
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function renderCliente(cliente) {
  clienteInfo.innerHTML = `
    <h2>${cliente.nombre || "Sin nombre"}</h2>
    <p><strong>ID:</strong> ${cliente.id}</p>
    <p><strong>Teléfono:</strong> ${cliente.telefono || "No definido"}</p>
    <p><strong>Correo:</strong> ${cliente.email || "No definido"}</p>
    <p><strong>Documento:</strong> ${cliente.documento || "No definido"}</p>
    <p><strong>Dirección:</strong> ${cliente.direccion || "No definida"}</p>
    <p><strong>Tipo:</strong> <span class="badge" style="background: rgba(212,175,55,0.15); color: #d4af37; padding: 2px 8px; border-radius: 6px;">${cliente.tipo_cliente || "Cliente"}</span></p>
  `;
}

function renderResumen(resumen, totalEventosCount, totalPagosCount) {
  resumenCards.innerHTML = `
    <div class="summary-card">
      <span class="summary-title">Eventos</span>
      <strong>${totalEventosCount}</strong>
    </div>

    <div class="summary-card">
      <span class="summary-title">Pagos registrados</span>
      <strong>${totalPagosCount}</strong>
    </div>

    <div class="summary-card">
      <span class="summary-title">Total eventos</span>
      <strong>${formatearDinero(resumen.totalEventos)}</strong>
    </div>

    <div class="summary-card">
      <span class="summary-title">Total pagado</span>
      <strong>${formatearDinero(resumen.totalPagado)}</strong>
    </div>

    <div class="summary-card">
      <span class="summary-title">Saldo pendiente</span>
      <strong>${formatearDinero(resumen.saldo)}</strong>
    </div>
  `;
}

function renderEventos(eventos) {
  if (!eventos.length) {
    eventosCliente.innerHTML = `
      <div class="empty-state-card">
        <h3>Sin eventos</h3>
        <p>Este cliente aún no tiene eventos registrados en el sistema.</p>
      </div>
    `;
    return;
  }

  eventosCliente.innerHTML = eventos.map(evento => `
    <article class="quote-card">
      <h3>${evento.tipo_evento || "Evento"}</h3>
      <p><strong>ID reserva:</strong> ${evento.id}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(evento.fecha_evento)}</p>
      <p><strong>Lugar:</strong> ${evento.locacion || evento.lugar || "Por definir"}</p>
      <p><strong>Personas:</strong> ${evento.personas || 0}</p>
      <p><strong>Total:</strong> ${formatearDinero(evento.total || evento.valor_total)}</p>
      <p><strong>Anticipo:</strong> ${formatearDinero(evento.anticipo || evento.abono)}</p>
      <p><strong>Saldo:</strong> ${formatearDinero(evento.saldo)}</p>
      <p><strong>Estado:</strong> <span class="badge">${evento.estado || "Confirmada"}</span></p>
      <p><strong>Observaciones:</strong> ${evento.observaciones || "Sin observaciones"}</p>

      <div class="quote-card-actions">
        <a href="./pagos.html?reserva_id=${evento.id}" class="btn btn-secondary">Ver pagos</a>
        <a href="./reservas.html" class="btn btn-success">Ir a reservas</a>
      </div>
    </article>
  `).join("");
}

function renderPagos(pagos) {
  if (!pagos.length) {
    pagosCliente.innerHTML = `
      <div class="empty-state-card">
        <h3>Sin pagos</h3>
        <p>Este cliente aún no tiene pagos registrados.</p>
      </div>
    `;
    return;
  }

  pagosCliente.innerHTML = pagos.map(pago => `
    <article class="quote-card">
      <h3>${formatearDinero(pago.monto)}</h3>
      <p><strong>ID pago:</strong> ${pago.id}</p>
      <p><strong>Concepto:</strong> ${pago.concepto || pago.tipo_evento || "Abono a evento"}</p>
      <p><strong>Método:</strong> ${pago.metodo || "Transferencia"}</p>
      <p><strong>Fecha pago:</strong> ${formatearFecha(pago.fecha || pago.createdAt)}</p>
      <p><strong>Estado:</strong> ${pago.estado || "Aprobado"}</p>
    </article>
  `).join("");
}

async function cargarCliente() {
  if (!clienteId) {
    clienteInfo.innerHTML = `<p>No se especificó ningún ID de cliente.</p>`;
    return;
  }

  try {
    const cliente = await dbService.getClientById(clienteId);

    if (!cliente) {
      clienteInfo.innerHTML = `<div class="empty-state-card"><h3>Cliente no encontrado</h3><p>El ID "${clienteId}" no existe en la base de datos.</p></div>`;
      resumenCards.innerHTML = "";
      eventosCliente.innerHTML = "";
      pagosCliente.innerHTML = "";
      return;
    }

    renderCliente(cliente);

    // Cargar eventos y pagos cruzados del cliente
    const [reservas, pagos] = await Promise.all([
      dbService.getReservations(),
      dbService.getPayments()
    ]);

    const clienteNombreLower = (cliente.nombre || "").toLowerCase().trim();

    const eventosDelCliente = reservas.filter(r => 
      String(r.clienteId || r.cliente_id || "") === String(cliente.id) ||
      (r.cliente && r.cliente.toLowerCase().includes(clienteNombreLower))
    );

    const pagosDelCliente = pagos.filter(p => 
      String(p.clienteId || p.cliente_id || "") === String(cliente.id) ||
      (p.cliente && p.cliente.toLowerCase().includes(clienteNombreLower)) ||
      eventosDelCliente.some(e => e.id === p.reservaId)
    );

    const totalEventos = eventosDelCliente.reduce((acc, e) => acc + Number(e.total || e.valor_total || 0), 0);
    const totalPagado = pagosDelCliente.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const saldo = Math.max(0, totalEventos - totalPagado);

    renderResumen({ totalEventos, totalPagado, saldo }, eventosDelCliente.length, pagosDelCliente.length);
    renderEventos(eventosDelCliente);
    renderPagos(pagosDelCliente);

  } catch (error) {
    console.error("ERROR CARGANDO CLIENTE:", error);
    clienteInfo.innerHTML = `<p>Error cargando los datos del cliente: ${error.message}</p>`;
  }
}

cargarCliente();