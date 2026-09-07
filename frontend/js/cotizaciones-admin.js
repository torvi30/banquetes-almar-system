/**
 * Gestión del Tablero Kanban / Pipeline CRM de Cotizaciones - Banquetes Almar
 * Conectado en vivo con Firebase Cloud Firestore y dbService.
 * Organizado por defecto según la FECHA MÁS PRÓXIMA del evento.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

// Elementos de interfaz
const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const filterOrigen = document.getElementById("filterOrigen");
const filterOrden = document.getElementById("filterOrden");
const btnRefreshBoard = document.getElementById("btnRefreshBoard");

const colNuevos = document.getElementById("colNuevos");
const colContactados = document.getElementById("colContactados");
const colConvertidos = document.getElementById("colConvertidos");
const colCancelados = document.getElementById("colCancelados");

const countNuevos = document.getElementById("countNuevos");
const countContactados = document.getElementById("countContactados");
const countConvertidos = document.getElementById("countConvertidos");
const countCancelados = document.getElementById("countCancelados");

// Métricas de banner
const metricTotalQuotes = document.getElementById("metricTotalQuotes");
const metricPipelineValue = document.getElementById("metricPipelineValue");
const metricNewQuotes = document.getElementById("metricNewQuotes");
const metricConverted = document.getElementById("metricConverted");

let registrosCache = [];

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
  const str = String(fecha).trim();
  const d = new Date(str.length === 10 ? `${str}T00:00:00` : str);
  if (Number.isNaN(d.getTime())) return str.slice(0, 10);
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getInitials(name) {
  if (!name || typeof name !== "string") return "AL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function normalizarEstado(estado) {
  const valor = String(estado || "").toLowerCase().trim();
  if (valor === "nuevo" || valor === "pendiente") return "nuevo";
  if (valor === "contactado" || valor === "confirmada" || valor === "confirmado" || valor === "en_proceso") return "contactado";
  if (valor === "convertido" || valor === "convertida" || valor === "finalizado") return "convertido";
  if (valor === "cancelado" || valor === "cancelada") return "cancelado";
  return "nuevo";
}

function getStatusTitle(key) {
  switch (key) {
    case "nuevo": return "Pendiente";
    case "contactado": return "Contactado";
    case "convertido": return "Convertido";
    case "cancelado": return "Cancelado";
    default: return "Pendiente";
  }
}

function renderEmptyCol(texto, icon = "📥") {
  return `
    <div class="pipeline-empty">
      <span class="pipeline-empty-icon">${icon}</span>
      <p>${texto}</p>
    </div>
  `;
}

function getEventTimestamp(item) {
  const str = item.fechaEvento || item.fecha_evento || item.fecha;
  if (str) {
    const d = new Date(str.length === 10 ? `${str}T00:00:00` : str);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  if (item.createdAt) {
    const d = new Date(item.createdAt);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  return Infinity;
}

function calcularDiasFaltantes(strFecha) {
  if (!strFecha) return null;
  const str = String(strFecha).trim();
  const d = new Date(str.length === 10 ? `${str}T00:00:00` : str);
  if (Number.isNaN(d.getTime())) return null;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diffMs = d.getTime() - hoy.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function buildWhatsAppLink(item) {
  const rawPhone = String(item.telefono || "").replace(/\D/g, "");
  const cleanPhone = rawPhone.startsWith("57") ? rawPhone : `57${rawPhone}`;
  const nombre = item.nombre || "Estimado cliente";
  const evento = item.evento || item.tipo_evento || "su evento";
  const personas = item.personas ? ` para ${item.personas} personas` : "";
  const locacion = item.locacion ? ` en ${item.locacion}` : "";
  const fechaStr = item.fechaEvento || item.fecha_evento ? ` (fecha: ${formatearFecha(item.fechaEvento || item.fecha_evento)})` : "";
  
  const text = `Hola ${nombre}, un gusto saludarte de Banquetes Almar (Marinilla). Vimos tu solicitud de cotización para ${evento}${personas}${locacion}${fechaStr}. Con gusto te brindamos asesoría personalizada para tu fecha. ¿Qué detalles o inquietudes tienes?`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

function crearCardPipeline(item) {
  const esCotizacion = item.origen !== "reserva" && item.origen !== "carrito_alquiler";
  const totalVal = Number(item.totalEstimado || item.total || 0);
  const totalDisplay = totalVal > 0 ? formatearDinero(totalVal) : "Por cotizar";
  const cleanPhone = String(item.telefono || "").replace(/\D/g, "");
  const initials = getInitials(item.nombre);
  const waLink = buildWhatsAppLink(item);
  const estadoNorm = normalizarEstado(item.estado);

  // Fecha del evento y cálculo de proximidad
  const fechaEventoStr = item.fechaEvento || item.fecha_evento || item.fecha;
  const diasFaltantes = calcularDiasFaltantes(fechaEventoStr);

  let badgeProximidad = "";
  if (diasFaltantes !== null) {
    if (diasFaltantes < 0) {
      badgeProximidad = `<span class="pipeline-proximity-badge badge-past">Finalizado</span>`;
    } else if (diasFaltantes === 0) {
      badgeProximidad = `<span class="pipeline-proximity-badge badge-today">🚨 ¡Hoy!</span>`;
    } else if (diasFaltantes <= 7) {
      badgeProximidad = `<span class="pipeline-proximity-badge badge-urgent">⚡ En ${diasFaltantes} días</span>`;
    } else if (diasFaltantes <= 30) {
      badgeProximidad = `<span class="pipeline-proximity-badge badge-near">📅 En ${diasFaltantes} días</span>`;
    } else {
      badgeProximidad = `<span class="pipeline-proximity-badge badge-far">📅 En ${diasFaltantes} días</span>`;
    }
  }

  // Botón de acción inteligente según la etapa
  let stageActionHtml = "";
  if (estadoNorm === "nuevo") {
    stageActionHtml = `
      <div class="pipeline-stage-row">
        <button class="btn-advance-stage btn-stage-action" data-id="${item.id}" data-target="Contactado" title="Mover a En Seguimiento">
          Seguimiento ➔
        </button>
      </div>
    `;
  } else if (estadoNorm === "contactado") {
    stageActionHtml = `
      <div class="pipeline-stage-row">
        <button class="btn-advance-stage btn-gold-action btn-convert-action" data-id="${item.id}" title="Agendar como Reserva confirmada">
          ✨ Agendar como Reserva
        </button>
      </div>
    `;
  } else if (estadoNorm === "convertido") {
    stageActionHtml = `
      <div class="pipeline-stage-row">
        <span class="badge-stage-converted" title="Cotización confirmada como reserva">
          ✓ Reserva en Agenda
        </span>
      </div>
    `;
  } else if (estadoNorm === "cancelado") {
    stageActionHtml = `
      <div class="pipeline-cancel-grid">
        <button class="btn-cancel-reactivate btn-stage-action" data-id="${item.id}" data-target="Pendiente" title="Reactivar cotización y pasar a Pendientes">
          🔄 Reactivar
        </button>
        <button class="btn-cancel-delete btn-delete-action" data-id="${item.id}" title="Eliminar definitivamente esta cotización">
          🗑️ Eliminar
        </button>
      </div>
    `;
  }

  return `
    <article class="pipeline-card" data-id="${item.id}" draggable="true">
      <div class="pipeline-card-header">
        <div class="pipeline-client-meta">
          <div class="pipeline-avatar">${initials}</div>
          <div>
            <h4>${item.nombre || "Cliente sin nombre"}</h4>
            <span class="pipeline-origin-tag origin-${item.origen || "cotizacion"}">
              ${item.origen === "carrito_alquiler" ? "🛒 Mobiliario" : esCotizacion ? "✨ Cotizador Web" : "📅 Reserva"}
            </span>
          </div>
        </div>

        <button class="btn-card-kebab" data-id="${item.id}" title="Más opciones">
          ···
        </button>
      </div>

      <div class="pipeline-chips-row">
        <span class="pipeline-chip">
          🎉 ${item.evento || item.tipo_evento || "Evento Social"}
        </span>
        <span class="pipeline-chip">
          👥 ${item.personas || 1} invitados
        </span>
      </div>

      <div class="pipeline-price-box">
        <span class="pipeline-price-label">Presupuesto Estimado</span>
        <span class="pipeline-price-val">${totalDisplay}</span>
      </div>

      <div class="pipeline-info-list">
        ${item.locacion ? `
          <div class="pipeline-info-item">
            <span>📍</span>
            <span style="font-weight: 500;">${item.locacion}</span>
          </div>
        ` : ""}
        
        <div class="pipeline-info-item">
          <span>📞</span>
          <a href="tel:${cleanPhone}">${item.telefono || "Sin teléfono"}</a>
        </div>
      </div>

      ${item.mensaje ? `
        <div class="pipeline-card-message">
          "${item.mensaje}"
        </div>
      ` : ""}

      <div class="pipeline-card-footer">
        <div class="pipeline-date-row">
          <div class="pipeline-event-date" title="Fecha del evento">
            <span>🗓️</span>
            <span><strong>${formatearFecha(fechaEventoStr || item.createdAt)}</strong></span>
          </div>
          ${badgeProximidad}
        </div>

        <div class="pipeline-contact-row">
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-luxury" title="Abrir chat de WhatsApp">
            <svg viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>WhatsApp</span>
          </a>

          <a href="tel:${cleanPhone}" class="btn-icon-secondary" title="Llamar directamente a ${item.nombre}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </a>
        </div>

        ${stageActionHtml}
      </div>
    </article>
  `;
}

function actualizarMetricas(lista) {
  const total = lista.length;
  let sumaValor = 0;
  let nuevos = 0;
  let convertidos = 0;

  lista.forEach(item => {
    const estadoNorm = normalizarEstado(item.estado);
    const monto = Number(item.totalEstimado || item.total || 0);

    if (estadoNorm !== "cancelado") {
      sumaValor += monto;
    }
    if (estadoNorm === "nuevo") {
      nuevos++;
    }
    if (estadoNorm === "convertido") {
      convertidos++;
    }
  });

  if (metricTotalQuotes) metricTotalQuotes.textContent = total;
  if (metricPipelineValue) metricPipelineValue.textContent = formatearDinero(sumaValor);
  if (metricNewQuotes) metricNewQuotes.textContent = nuevos;
  if (metricConverted) metricConverted.textContent = convertidos;
}

function aplicarFiltros() {
  const query = (searchInput?.value || "").toLowerCase().trim();
  const origen = (filterOrigen?.value || "").toLowerCase().trim();
  const criterioOrden = filterOrden?.value || "proxima";

  // 1. Filtrado
  let filtrados = registrosCache.filter(item => {
    const textoCompleto = `${item.nombre || ""} ${item.telefono || ""} ${item.evento || item.tipo_evento || ""} ${item.locacion || ""} ${item.mensaje || ""}`.toLowerCase();
    const cumpleTexto = !query || textoCompleto.includes(query);
    const cumpleOrigen = !origen || (item.origen || "cotizacion").toLowerCase() === origen;
    return cumpleTexto && cumpleOrigen;
  });

  // 2. Ordenamiento: por defecto según la FECHA MÁS PRÓXIMA
  const hoy = new Date().setHours(0, 0, 0, 0);

  filtrados.sort((a, b) => {
    if (criterioOrden === "reciente") {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    
    if (criterioOrden === "mayor_presupuesto") {
      const valA = Number(a.totalEstimado || a.total || 0);
      const valB = Number(b.totalEstimado || b.total || 0);
      return valB - valA;
    }

    // "proxima" (Por defecto): La fecha de evento más cercana a hoy primero
    const tA = getEventTimestamp(a);
    const tB = getEventTimestamp(b);

    const esFuturoA = tA >= hoy;
    const esFuturoB = tB >= hoy;

    // Si ambos son futuros: el más próximo a hoy va primero (ascendente)
    if (esFuturoA && esFuturoB) {
      return tA - tB;
    }
    // Los eventos futuros tienen prioridad sobre los pasados
    if (esFuturoA && !esFuturoB) return -1;
    if (!esFuturoA && esFuturoB) return 1;

    // Si ambos son pasados: el más reciente va primero
    return tB - tA;
  });

  actualizarMetricas(filtrados);
  renderPipeline(filtrados);
}

function renderPipeline(lista) {
  const colN = [];
  const colC = [];
  const colV = [];
  const colX = [];

  lista.forEach(item => {
    const estado = normalizarEstado(item.estado);
    if (estado === "nuevo") colN.push(item);
    else if (estado === "contactado") colC.push(item);
    else if (estado === "convertido") colV.push(item);
    else if (estado === "cancelado") colX.push(item);
  });

  if (countNuevos) countNuevos.textContent = colN.length;
  if (countContactados) countContactados.textContent = colC.length;
  if (countConvertidos) countConvertidos.textContent = colV.length;
  if (countCancelados) countCancelados.textContent = colX.length;

  if (colNuevos) colNuevos.innerHTML = colN.length ? colN.map(crearCardPipeline).join("") : renderEmptyCol("Sin cotizaciones pendientes", "📥");
  if (colContactados) colContactados.innerHTML = colC.length ? colC.map(crearCardPipeline).join("") : renderEmptyCol("Sin prospectos en seguimiento", "💬");
  if (colConvertidos) colConvertidos.innerHTML = colV.length ? colV.map(crearCardPipeline).join("") : renderEmptyCol("Sin cotizaciones convertidas", "🏆");
  if (colCancelados) colCancelados.innerHTML = colX.length ? colX.map(crearCardPipeline).join("") : renderEmptyCol("Sin cotizaciones canceladas", "✕");

  asignarEventosAcciones();
  inicializarDragAndDrop();
}

async function convertirAReserva(item) {
  if (!item) return;

  const result = await Swal.fire({
    title: "¿Convertir en Reserva Oficial?",
    html: `
      <div style="text-align: left; font-size: 0.9rem; line-height: 1.6; color: #ccc;">
        <p><strong style="color: #fff;">Cliente:</strong> ${item.nombre}</p>
        <p><strong style="color: #fff;">Evento:</strong> ${item.evento || item.tipo_evento || "Evento Social"}</p>
        <p><strong style="color: #fff;">Fecha:</strong> <span style="color: #38bdf8; font-weight: 600;">${formatearFecha(item.fechaEvento || item.fecha_evento)}</span></p>
        <p><strong style="color: #fff;">Presupuesto:</strong> <span style="color: #e6c77b; font-weight: 700;">${formatearDinero(item.totalEstimado || item.total || 0)}</span></p>
        <p><strong style="color: #fff;">Locación:</strong> ${item.locacion || "Por definir"}</p>
        <p style="margin-top: 12px; font-size: 0.8rem; color: #10b981; border-top: 1px solid #333; padding-top: 8px;">
          ✓ Se agendará automáticamente en la sección de Reservas y Calendario.
        </p>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, agendar Reserva",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#10b981",
    cancelButtonColor: "#444"
  });

  if (!result.isConfirmed) return;

  try {
    // 1. Actualizar estado de cotización
    await dbService.updateQuoteStatus(item.id, "Convertido");

    // 2. Crear reserva
    await dbService.createReservation({
      cliente: item.nombre,
      telefono: item.telefono,
      tipo_evento: item.evento || item.tipo_evento || "Evento Social",
      personas: item.personas || 50,
      total: Number(item.totalEstimado || item.total || 0),
      anticipo: Number(item.anticipoSugerido || 0),
      saldo: Math.max(0, Number(item.totalEstimado || item.total || 0) - Number(item.anticipoSugerido || 0)),
      fecha_evento: item.fechaEvento || item.fecha_evento || new Date().toISOString().slice(0, 10),
      locacion: item.locacion || "Salón de Gala Almar (Marinilla)",
      observaciones: item.mensaje || "Generado automáticamente desde Cotizaciones CRM"
    });

    Swal.fire({
      icon: "success",
      title: "¡Reserva Creada!",
      text: `La cotización de ${item.nombre} ahora está en tu agenda de reservas.`,
      timer: 2000,
      showConfirmButton: false
    });

    await cargarCotizaciones();
  } catch (error) {
    console.error("Error al convertir a reserva:", error);
    Swal.fire({
      icon: "error",
      title: "Error al convertir",
      text: error.message
    });
  }
}

function abrirMenuOpciones(id) {
  const item = registrosCache.find(r => String(r.id) === String(id));
  if (!item) return;

  Swal.fire({
    title: item.nombre,
    html: `
      <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 15px;">Selecciona una acción para esta cotización:</p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="swalMoveNuevo" class="btn btn-secondary" style="font-size: 0.85rem; text-align: left; padding: 10px;">
          🟡 Mover a Nuevos / Pendientes
        </button>
        <button id="swalMoveContactado" class="btn btn-secondary" style="font-size: 0.85rem; text-align: left; padding: 10px;">
          🔵 Mover a En Seguimiento
        </button>
        <button id="swalMoveConvertido" class="btn btn-secondary" style="font-size: 0.85rem; text-align: left; padding: 10px; color: #10b981;">
          🟢 Convertir a Reserva Oficial
        </button>
        <button id="swalMoveCancelado" class="btn btn-secondary" style="font-size: 0.85rem; text-align: left; padding: 10px; color: #94a3b8;">
          ⚪ Marcar como Cancelado
        </button>
        <button id="swalDeleteQuote" class="btn btn-secondary" style="font-size: 0.85rem; text-align: left; padding: 10px; color: #ef4444; border-color: rgba(239,68,68,0.3);">
          🗑️ Eliminar cotización del tablero
        </button>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => {
      document.getElementById("swalMoveNuevo")?.addEventListener("click", async () => {
        Swal.close();
        await dbService.updateQuoteStatus(id, "Pendiente");
        await cargarCotizaciones();
      });
      document.getElementById("swalMoveContactado")?.addEventListener("click", async () => {
        Swal.close();
        await dbService.updateQuoteStatus(id, "Contactado");
        await cargarCotizaciones();
      });
      document.getElementById("swalMoveConvertido")?.addEventListener("click", async () => {
        Swal.close();
        await convertirAReserva(item);
      });
      document.getElementById("swalMoveCancelado")?.addEventListener("click", async () => {
        Swal.close();
        await dbService.updateQuoteStatus(id, "Cancelado");
        await cargarCotizaciones();
      });
      document.getElementById("swalDeleteQuote")?.addEventListener("click", async () => {
        Swal.close();
        const conf = await Swal.fire({
          title: "¿Eliminar cotización?",
          text: "Esta acción no se puede deshacer.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar",
          confirmButtonColor: "#ef4444"
        });
        if (conf.isConfirmed) {
          await dbService.deleteQuote(id);
          await cargarCotizaciones();
        }
      });
    }
  });
}

function asignarEventosAcciones() {
  // Botones de avance de etapa (1 solo clic)
  document.querySelectorAll(".btn-stage-action").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const target = btn.dataset.target;
      try {
        await dbService.updateQuoteStatus(id, target);
        await cargarCotizaciones();
      } catch (err) {
        console.error("Error al avanzar etapa:", err);
      }
    });
  });

  // Botón directo de convertir en reserva
  document.querySelectorAll(".btn-convert-action").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const item = registrosCache.find(r => String(r.id) === String(id));
      await convertirAReserva(item);
    });
  });

  // Botón directo de eliminar en columna Cancelados
  document.querySelectorAll(".btn-delete-action").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const item = registrosCache.find(r => String(r.id) === String(id));
      const nombre = item?.nombre || "esta cotización";

      const conf = await Swal.fire({
        title: `¿Eliminar cotización?`,
        html: `
          <div style="text-align: left; font-size: 0.9rem; line-height: 1.5; color: #ccc;">
            <p>¿Deseas retirar definitivamente la cotización de <strong style="color: #fff;">${nombre}</strong>?</p>
            <p style="margin-top: 10px; font-size: 0.8rem; color: #888;">
              💡 <em>Si prefieres conservarla por registro histórico, puedes dejarla aquí en la columna de Cancelados.</em>
            </p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar definitivamente",
        cancelButtonText: "Conservar en Cancelados",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#555"
      });

      if (conf.isConfirmed) {
        await dbService.deleteQuote(id);
        await cargarCotizaciones();
        Swal.fire({
          icon: "success",
          title: "Cotización eliminada",
          timer: 1400,
          showConfirmButton: false
        });
      }
    });
  });

  // Menú de opciones de 3 puntos (···)
  document.querySelectorAll(".btn-card-kebab").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirMenuOpciones(btn.dataset.id);
    });
  });
}

function inicializarDragAndDrop() {
  const cards = document.querySelectorAll(".pipeline-card");
  const columns = document.querySelectorAll(".pipeline-list");

  cards.forEach(card => {
    card.addEventListener("dragstart", (e) => {
      card.classList.add("is-dragging");
      e.dataTransfer.setData("text/plain", card.dataset.id);
      e.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      document.querySelectorAll(".pipeline-column").forEach(col => col.classList.remove("drag-over"));
    });
  });

  columns.forEach(list => {
    const column = list.closest(".pipeline-column");

    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      column.classList.add("drag-over");
    });

    list.addEventListener("dragleave", (e) => {
      if (!list.contains(e.relatedTarget)) {
        column.classList.remove("drag-over");
      }
    });

    list.addEventListener("drop", async (e) => {
      e.preventDefault();
      column.classList.remove("drag-over");

      const quoteId = e.dataTransfer.getData("text/plain");
      if (!quoteId) return;

      const targetStatusKey = list.dataset.status; // "nuevo", "contactado", "convertido", "cancelado"
      const targetStatus = getStatusTitle(targetStatusKey);

      const item = registrosCache.find(r => String(r.id) === String(quoteId));
      if (!item) return;

      const currentStatusNorm = normalizarEstado(item.estado);
      if (currentStatusNorm === targetStatusKey) return; // Ya está en esa columna

      try {
        if (targetStatus === "Convertido") {
          await convertirAReserva(item);
        } else {
          await dbService.updateQuoteStatus(quoteId, targetStatus);
          await cargarCotizaciones();
        }
      } catch (err) {
        console.error("Error al mover cotización:", err);
      }
    });
  });
}

async function cargarCotizaciones() {
  try {
    const quotes = await dbService.getQuotes();
    registrosCache = quotes;
    aplicarFiltros();
  } catch (error) {
    console.error("Error cargando cotizaciones:", error);
  }
}

if (searchInput) searchInput.addEventListener("input", aplicarFiltros);
if (filterOrigen) filterOrigen.addEventListener("change", aplicarFiltros);
if (filterOrden) filterOrden.addEventListener("change", aplicarFiltros);

if (btnRefreshBoard) {
  btnRefreshBoard.addEventListener("click", async () => {
    btnRefreshBoard.textContent = "⏳ Cargando...";
    await cargarCotizaciones();
    btnRefreshBoard.textContent = "🔄 Refrescar";
  });
}

// Carga inicial
cargarCotizaciones();
