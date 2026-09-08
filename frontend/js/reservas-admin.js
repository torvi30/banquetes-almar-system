/**
 * Gestión de Eventos & Agenda - Banquetes Almar (Marinilla, Antioquia)
 * Unificación de Lista de Eventos y Calendario Mensual con dbService de Firebase.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

// Elementos de la vista
const btnViewList = document.getElementById("btnViewList");
const btnViewCalendar = document.getElementById("btnViewCalendar");
const viewListContainer = document.getElementById("viewListContainer");
const viewCalendarContainer = document.getElementById("viewCalendarContainer");

// Formulario de eventos
const form = document.getElementById("reservationForm");
const formEventTitle = document.getElementById("formEventTitle");
const saveReservationBtn = document.getElementById("saveReservationBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const logoutBtn = document.getElementById("logoutBtn");

const reservationIdInput = document.getElementById("reservationId");
const clienteInput = document.getElementById("cliente");
const telefonoInput = document.getElementById("telefono");
const tipoEventoInput = document.getElementById("tipo_evento");
const fechaEventoInput = document.getElementById("fecha_evento");
const lugarInput = document.getElementById("lugar");
const personasInput = document.getElementById("personas");
const estadoInput = document.getElementById("estado");
const totalEventoInput = document.getElementById("totalEvento");
const observacionesInput = document.getElementById("observaciones");

// Filtros de lista
const filterFecha = document.getElementById("filterFecha");
const filterEstado = document.getElementById("filterEstado");
const filterSearch = document.getElementById("filterSearch");
const eventsCounter = document.getElementById("eventsCounter");
const reservationsGrid = document.getElementById("reservationsGrid");

// Calendario Ejecutivo
const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const btnToday = document.getElementById("btnToday");
const calFilterLocacion = document.getElementById("calFilterLocacion");
const statMonthCount = document.getElementById("statMonthCount");
const statMonthAmount = document.getElementById("statMonthAmount");
const calendarDayModal = document.getElementById("calendarDayModal");
const calModalDateTitle = document.getElementById("calModalDateTitle");
const calModalEventsList = document.getElementById("calModalEventsList");
const closeCalModalBtn = document.getElementById("closeCalModalBtn");


let reservasCache = [];
let currentCalendarDate = new Date();

// Cerrar sesión
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

// ------------------- TABS: LISTA VS CALENDARIO -------------------
function switchView(tab) {
  if (tab === "calendar") {
    if (btnViewList) btnViewList.classList.remove("active");
    if (btnViewCalendar) btnViewCalendar.classList.add("active");
    if (viewListContainer) viewListContainer.style.display = "none";
    if (viewCalendarContainer) viewCalendarContainer.style.display = "block";
    renderCalendario();
  } else {
    if (btnViewCalendar) btnViewCalendar.classList.remove("active");
    if (btnViewList) btnViewList.classList.add("active");
    if (viewCalendarContainer) viewCalendarContainer.style.display = "none";
    if (viewListContainer) viewListContainer.style.display = "block";
  }
}

if (btnViewList) btnViewList.addEventListener("click", () => switchView("list"));
if (btnViewCalendar) btnViewCalendar.addEventListener("click", () => switchView("calendar"));

// Detectar ?tab=calendario en la URL
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("tab") === "calendario" || urlParams.get("tab") === "calendar") {
  switchView("calendar");
}

// ------------------- FORMATEADORES -------------------
function formatearDinero(num) {
  return `$${Number(num || 0).toLocaleString("es-CO")}`;
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

function formatearFechaISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function claseEstado(estado) {
  const v = String(estado || "").toLowerCase();
  if (v.includes("confirm")) return "estado-confirmado";
  if (v.includes("cancel")) return "estado-cancelado";
  if (v.includes("finaliz")) return "estado-convertido";
  return "estado-contactado";
}

function limpiarFormulario() {
  if (reservationIdInput) reservationIdInput.value = "";
  if (clienteInput) clienteInput.value = "";
  if (telefonoInput) telefonoInput.value = "";
  if (tipoEventoInput) tipoEventoInput.value = "";
  if (fechaEventoInput) fechaEventoInput.value = "";
  if (lugarInput) lugarInput.value = "";
  if (personasInput) personasInput.value = "";
  if (estadoInput) estadoInput.value = "Confirmada";
  if (totalEventoInput) totalEventoInput.value = "";
  if (observacionesInput) observacionesInput.value = "";

  if (saveReservationBtn) saveReservationBtn.textContent = "Guardar evento";
  if (formEventTitle) formEventTitle.textContent = "Registrar nuevo evento";
  if (cancelEditBtn) cancelEditBtn.style.display = "none";
}

if (cancelEditBtn) cancelEditBtn.addEventListener("click", limpiarFormulario);

// ------------------- RENDER LISTA DE EVENTOS -------------------
function renderListaEventos(lista) {
  if (!reservationsGrid) return;

  if (eventsCounter) {
    eventsCounter.textContent = `${lista.length} evento${lista.length === 1 ? "" : "s"} encontrado${lista.length === 1 ? "" : "s"}`;
  }

  if (!lista.length) {
    reservationsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; color: var(--apple-text-secondary); background: #111115; border-radius: 18px; border: 1px dashed var(--apple-border);">
        <span style="font-size: 2.8rem; display: block; margin-bottom: 0.8rem;">📅</span>
        <h3 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.4rem;">No se encontraron eventos</h3>
        <p style="font-size: 0.9rem;">Prueba ajustando los filtros de fecha o búsqueda.</p>
      </div>
    `;
    return;
  }

  reservationsGrid.innerHTML = lista.map(ev => {
    const total = Number(ev.total || ev.valor_total || 0);
    const anticipo = Number(ev.anticipo || ev.abono || 0);
    const saldo = Number(ev.saldo !== undefined ? ev.saldo : (total - anticipo));
    const telLimpio = String(ev.telefono || "").replace(/\D/g, "");
    const wpUrl = telLimpio
      ? `https://wa.me/57${telLimpio}?text=${encodeURIComponent(`Hola ${ev.cliente || ""}, te saludamos de Banquetes Almar respecto a la celebración de tu ${ev.tipo_evento || "evento"} programado para el ${formatearFecha(ev.fecha_evento)}.`)}`
      : null;

    return `
      <article class="reservation-card" style="background: #111115; border: 1px solid var(--apple-border); border-radius: 18px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
            <div>
              <h3 style="color: #fff; font-family: 'Playfair Display', serif; font-size: 1.25rem; margin: 0 0 0.2rem 0;">${ev.cliente || "Sin cliente"}</h3>
              <p style="color: var(--gold-light); font-size: 0.9rem; margin: 0; font-weight: 500;">${ev.tipo_evento || "Celebración de Gala"}</p>
            </div>
            <span class="status-badge ${claseEstado(ev.estado)}" style="padding: 0.3rem 0.8rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600;">
              ${ev.estado || "Confirmada"}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.88rem; color: #ccc; margin-bottom: 1rem;">
            <p style="margin: 0;">🗓️ <strong>Fecha:</strong> <span style="color: #fff;">${formatearFecha(ev.fecha_evento)}</span></p>
            <p style="margin: 0;">📍 <strong>Locación:</strong> ${ev.locacion || ev.lugar || "Salón Almar Marinilla"}</p>
            <p style="margin: 0;">👥 <strong>Invitados:</strong> ${ev.personas || 0} personas</p>
            <p style="margin: 0;">📱 <strong>Teléfono:</strong> ${ev.telefono || "Sin registrar"}</p>
          </div>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.8rem 1rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.82rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
              <span>Total: <strong style="color: #fff;">${formatearDinero(total)}</strong></span>
              <span>Abonado: <strong style="color: #9df0b5;">${formatearDinero(anticipo)}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.3rem;">
              <span>Saldo Pendiente:</span>
              <strong style="color: ${saldo > 0 ? '#ffaa5a' : '#9df0b5'};">${formatearDinero(saldo)}</strong>
            </div>
          </div>

          ${ev.observaciones ? `<p style="font-size: 0.82rem; color: #888; font-style: italic; margin-bottom: 1rem;">"${ev.observaciones}"</p>` : ""}
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.8rem; border-top: 1px solid rgba(255,255,255,0.06);">
          ${wpUrl ? `
            <a href="${wpUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="background: #25d366; color: #000; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              💬 WhatsApp
            </a>
          ` : ""}

          <a href="./contrato.html?id=${ev.id}" target="_blank" class="btn btn-secondary btn-sm" style="color: #a0c4ff; border-color: rgba(160,196,255,0.3);">
            📄 Contrato
          </a>

          <a href="./pagos.html?evento_id=${ev.id}" class="btn btn-secondary btn-sm" style="color: var(--gold-light); border-color: rgba(212,175,55,0.3);">
            💵 Pagos
          </a>

          <button class="btn btn-secondary btn-sm edit-reserva-btn" data-id="${ev.id}">
            ✏️
          </button>

          <button class="btn btn-secondary btn-sm delete-reserva-btn" data-id="${ev.id}" style="color: #ff6b6b;">
            🗑️
          </button>
        </div>
      </article>
    `;
  }).join("");

  // Acciones: Editar
  reservationsGrid.querySelectorAll(".edit-reserva-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      editarEvento(btn.dataset.id);
    });
  });

  // Acciones: Eliminar
  reservationsGrid.querySelectorAll(".delete-reserva-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const ev = reservasCache.find(r => String(r.id) === String(id));
      const nombre = ev ? ev.cliente : "este evento";

      const confirmacion = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar evento?",
        text: `¿Estás seguro de eliminar el evento de "${nombre}"?`,
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (!confirmacion.isConfirmed) return;

      try {
        await dbService.deleteReservation(id);
        Swal.fire({
          icon: "success",
          title: "Evento eliminado",
          timer: 1500,
          showConfirmButton: false
        });
        await cargarEventos();
      } catch (err) {
        console.error("Error eliminando evento:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "No se pudo eliminar el evento."
        });
      }
    });
  });
}

function editarEvento(id) {
  const ev = reservasCache.find(r => String(r.id) === String(id));
  if (!ev) return;

  reservationIdInput.value = ev.id;
  clienteInput.value = ev.cliente || "";
  telefonoInput.value = ev.telefono || "";
  tipoEventoInput.value = ev.tipo_evento || "";
  fechaEventoInput.value = ev.fecha_evento ? String(ev.fecha_evento).slice(0, 10) : "";
  lugarInput.value = ev.locacion || ev.lugar || "";
  personasInput.value = ev.personas || "";
  estadoInput.value = ev.estado || "Confirmada";
  totalEventoInput.value = ev.total || ev.valor_total || "";
  observacionesInput.value = ev.observaciones || "";

  saveReservationBtn.textContent = "Actualizar evento";
  formEventTitle.textContent = `Editar: "${ev.cliente}"`;
  cancelEditBtn.style.display = "inline-block";

  switchView("list");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ------------------- HELPERS DEL CALENDARIO EJECUTIVO -------------------
function obtenerTipoIcono(tipo) {
  const t = String(tipo || "").toLowerCase();
  if (t.includes("boda") || t.includes("matrimonio")) return "💍";
  if (t.includes("15") || t.includes("quince")) return "👑";
  if (t.includes("grado") || t.includes("graduacion")) return "🎓";
  if (t.includes("corp") || t.includes("empresa")) return "🏢";
  if (t.includes("cumple")) return "🎂";
  return "🎉";
}

function obtenerCalEstadoClase(estado) {
  const v = String(estado || "").toLowerCase();
  if (v.includes("confirm")) return "confirmada";
  if (v.includes("cancel")) return "cancelada";
  if (v.includes("finaliz")) return "finalizada";
  return "pendiente";
}

// ------------------- RENDER CALENDARIO MENSUAL EJECUTIVO -------------------
function renderCalendario() {
  if (!calendarGrid || !monthTitle) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  monthTitle.innerHTML = `${meses[month]} <span>${year}</span>`;

  // Mini KPIs del mes en curso
  const mesISO = `${year}-${String(month + 1).padStart(2, "0")}`;
  const eventosMes = reservasCache.filter(ev => {
    const f = String(ev.fecha_evento || ev.fecha || "").slice(0, 7);
    return f === mesISO;
  });

  const totalContratosMes = eventosMes
    .filter(ev => ev.estado !== "Cancelada")
    .reduce((sum, ev) => sum + (Number(ev.total || ev.valor_total) || 0), 0);

  if (statMonthCount) {
    statMonthCount.innerHTML = `💍 <strong>${eventosMes.length}</strong> ${eventosMes.length === 1 ? "celebración" : "celebraciones"}`;
  }
  if (statMonthAmount) {
    statMonthAmount.innerHTML = `💰 <strong>${formatearDinero(totalContratosMes)}</strong>`;
  }

  const hoy = new Date();
  const hoyISO = formatearFechaISO(hoy);

  const primerDiaMes = new Date(year, month, 1);
  const ultimoDiaMes = new Date(year, month + 1, 0);

  // Ajuste lunes (0 = Lunes, 6 = Domingo)
  let primerDiaSemana = primerDiaMes.getDay() - 1;
  if (primerDiaSemana === -1) primerDiaSemana = 6;

  const totalDias = ultimoDiaMes.getDate();
  const ultimoDiaMesAnterior = new Date(year, month, 0).getDate();
  const totalCeldas = Math.ceil((primerDiaSemana + totalDias) / 7) * 7;

  const locacionFiltro = (calFilterLocacion?.value || "").toLowerCase().trim();

  let html = "";

  for (let i = 0; i < totalCeldas; i++) {
    const diaNumero = i - primerDiaSemana + 1;

    // Días del mes anterior
    if (diaNumero < 1) {
      const diaPrev = ultimoDiaMesAnterior + diaNumero;
      html += `
        <div class="cal-cell is-other-month">
          <div class="cal-cell-header">
            <span class="cal-num-badge">${diaPrev}</span>
          </div>
        </div>
      `;
      continue;
    }

    // Días del mes siguiente
    if (diaNumero > totalDias) {
      const diaSig = diaNumero - totalDias;
      html += `
        <div class="cal-cell is-other-month">
          <div class="cal-cell-header">
            <span class="cal-num-badge">${diaSig}</span>
          </div>
        </div>
      `;
      continue;
    }

    // Días del mes actual
    const fechaActual = new Date(year, month, diaNumero);
    const fechaISO = formatearFechaISO(fechaActual);
    const isToday = fechaISO === hoyISO;

    let eventosDelDia = reservasCache.filter(item => {
      const f = String(item.fecha_evento || item.fecha || "").slice(0, 10);
      return f === fechaISO;
    });

    if (locacionFiltro) {
      eventosDelDia = eventosDelDia.filter(item => 
        String(item.locacion || item.lugar || "").toLowerCase().includes(locacionFiltro)
      );
    }

    const itemsHTML = eventosDelDia.slice(0, 2).map(ev => {
      const estadoClase = obtenerCalEstadoClase(ev.estado);
      const icono = obtenerTipoIcono(ev.tipo_evento);
      const cliente = ev.cliente || "Cliente";
      const tipo = ev.tipo_evento || "Evento";
      const hora = ev.hora_evento ? ` • ${ev.hora_evento}` : "";

      return `
        <div class="cal-chip ${estadoClase}" title="${cliente} - ${tipo} (${ev.estado || 'Confirmada'})">
          <span class="cal-chip-client">${icono} ${cliente}</span>
          <span class="cal-chip-info">${tipo}${hora}</span>
        </div>
      `;
    }).join("");

    const masEventos = eventosDelDia.length > 2 
      ? `<div class="cal-more-btn">+${eventosDelDia.length - 2} más...</div>` 
      : "";

    html += `
      <div class="cal-cell ${isToday ? "is-today" : ""} ${eventosDelDia.length ? "has-events" : ""}" data-date="${fechaISO}">
        <div class="cal-cell-header">
          <span class="cal-num-badge">${diaNumero}</span>
          ${isToday ? '<span class="cal-count-indicator" style="background: var(--gold); color: #111;">HOY</span>' : (eventosDelDia.length ? `<span class="cal-count-indicator">${eventosDelDia.length}</span>` : "")}
        </div>
        <div class="cal-events-stack">
          ${itemsHTML}
          ${masEventos}
        </div>
      </div>
    `;
  }

  calendarGrid.innerHTML = html;

  // Listeners para abrir detalles del día
  calendarGrid.querySelectorAll(".cal-cell[data-date]").forEach(cell => {
    cell.addEventListener("click", () => {
      abrirModalDia(cell.dataset.date);
    });
  });
}

// ------------------- MODAL DE DETALLE DEL DÍA -------------------
function abrirModalDia(fechaISO) {
  if (!calendarDayModal || !calModalDateTitle || !calModalEventsList) return;

  const partes = fechaISO.split("-");
  const fechaObj = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  const fechaTexto = fechaObj.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  calModalDateTitle.textContent = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

  const eventos = reservasCache.filter(item => {
    const f = String(item.fecha_evento || item.fecha || "").slice(0, 10);
    return f === fechaISO;
  });

  if (!eventos.length) {
    calModalEventsList.innerHTML = `
      <div style="text-align: center; padding: 2.2rem 1rem;">
        <span style="font-size: 3rem; display: block; margin-bottom: 0.8rem;">🗓️</span>
        <h4 style="color: #fff; margin: 0 0 0.5rem 0; font-size: 1.2rem;">Fecha Disponible</h4>
        <p style="color: var(--text-soft); font-size: 0.9rem; margin: 0 0 1.8rem 0;">
          No hay ninguna celebración agendada para este día en Marinilla ni El Peñol.
        </p>
        <button type="button" class="btn btn-primary" id="btnAgendarEnFecha">
          ➕ Agendar Evento para este día
        </button>
      </div>
    `;

    const btnAgendar = document.getElementById("btnAgendarEnFecha");
    if (btnAgendar) {
      btnAgendar.addEventListener("click", () => {
        calendarDayModal.classList.remove("active");
        switchView("list");
        limpiarFormulario();
        if (fechaEventoInput) fechaEventoInput.value = fechaISO;
        if (clienteInput) clienteInput.focus();
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  } else {
    calModalEventsList.innerHTML = eventos.map(ev => {
      const estadoClase = obtenerCalEstadoClase(ev.estado);
      const icono = obtenerTipoIcono(ev.tipo_evento);
      const total = Number(ev.total || ev.valor_total || 0);
      const anticipo = Number(ev.anticipo || 0);
      const saldo = Number(ev.saldo || Math.max(0, total - anticipo));

      return `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.3); border-radius: 14px; padding: 1.3rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.8rem; margin-bottom: 0.8rem;">
            <div>
              <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--gold-light);">
                ${icono} ${ev.tipo_evento || "Celebración"}
              </span>
              <h4 style="color: #fff; font-size: 1.25rem; margin: 0.2rem 0 0.1rem 0; font-family: var(--font-heading);">
                ${ev.cliente || "Cliente Almar"}
              </h4>
              <small style="color: var(--text-soft); font-size: 0.82rem;">
                📍 ${ev.locacion || ev.lugar || "Locación por confirmar"}
                ${ev.hora_evento ? ` • ⏰ ${ev.hora_evento}` : ""}
                ${ev.personas ? ` • 👥 ${ev.personas} invitados` : ""}
              </small>
            </div>
            <span class="cal-chip ${estadoClase}" style="font-size: 0.8rem; padding: 4px 10px; border-radius: 999px;">
              ${ev.estado || "Confirmada"}
            </span>
          </div>

          ${ev.observaciones ? `
            <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 0.7rem; font-size: 0.82rem; color: #ddd; margin-bottom: 0.8rem;">
              <strong>📝 Notas:</strong> ${ev.observaciones}
            </div>
          ` : ""}

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; background: rgba(0,0,0,0.4); border-radius: 8px; padding: 0.6rem; font-size: 0.8rem; margin-bottom: 1rem;">
            <div>
              <span style="color: var(--text-soft); display: block; font-size: 0.72rem;">Total</span>
              <strong style="color: #fff;">${formatearDinero(total)}</strong>
            </div>
            <div>
              <span style="color: #a8d5ba; display: block; font-size: 0.72rem;">Abonado</span>
              <strong style="color: #a8d5ba;">${formatearDinero(anticipo)}</strong>
            </div>
            <div>
              <span style="color: ${saldo > 0 ? '#e74c3c' : '#2ecc71'}; display: block; font-size: 0.72rem;">Saldo</span>
              <strong style="color: ${saldo > 0 ? '#e74c3c' : '#2ecc71'};">${formatearDinero(saldo)}</strong>
            </div>
          </div>

          <div style="display: flex; gap: 0.6rem; justify-content: flex-end; flex-wrap: wrap;">
            ${ev.telefono ? `
              <a href="https://api.whatsapp.com/send?phone=57${ev.telefono.replace(/\D/g, '')}" target="_blank" class="btn btn-secondary btn-sm" style="color: #25d366; border-color: rgba(37,211,102,0.4); padding: 4px 10px; font-size: 0.8rem;">
                💬 WhatsApp
              </a>
            ` : ""}
            <a href="./contrato.html?id=${ev.id}" target="_blank" class="btn btn-secondary btn-sm" style="color: var(--gold-light); border-color: rgba(212,175,55,0.4); padding: 4px 10px; font-size: 0.8rem;">
              📄 Contrato
            </a>
            <a href="./pagos.html?evento_id=${ev.id}" class="btn btn-secondary btn-sm" style="color: #a8d5ba; border-color: rgba(46,204,113,0.4); padding: 4px 10px; font-size: 0.8rem;">
              💵 Abonos
            </a>
            <button type="button" class="btn btn-primary btn-sm btn-modal-edit" data-id="${ev.id}" style="padding: 4px 12px; font-size: 0.8rem;">
              ✏️ Editar
            </button>
          </div>
        </div>
      `;
    }).join("");

    calModalEventsList.querySelectorAll(".btn-modal-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        calendarDayModal.classList.remove("active");
        editarEvento(btn.dataset.id);
      });
    });
  }

  calendarDayModal.classList.add("active");
}

if (closeCalModalBtn) {
  closeCalModalBtn.addEventListener("click", () => {
    if (calendarDayModal) calendarDayModal.classList.remove("active");
  });
}

if (calendarDayModal) {
  calendarDayModal.addEventListener("click", (e) => {
    if (e.target === calendarDayModal) {
      calendarDayModal.classList.remove("active");
    }
  });
}

if (btnToday) {
  btnToday.addEventListener("click", () => {
    currentCalendarDate = new Date();
    renderCalendario();
  });
}

if (calFilterLocacion) {
  calFilterLocacion.addEventListener("change", () => {
    renderCalendario();
  });
}

if (prevMonthBtn) {
  prevMonthBtn.addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendario();
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendario();
  });
}


// ------------------- FILTRADO EN TIEMPO REAL -------------------
function aplicarFiltros() {
  const query = (filterSearch ? filterSearch.value : "").toLowerCase().trim();
  const estado = filterEstado ? filterEstado.value : "";
  const fecha = filterFecha ? filterFecha.value : "";

  let filtrados = reservasCache;

  if (estado) {
    filtrados = filtrados.filter(r => String(r.estado || "").toLowerCase() === estado.toLowerCase());
  }

  if (fecha) {
    filtrados = filtrados.filter(r => String(r.fecha_evento || "").slice(0, 10) === fecha);
  }

  if (query) {
    filtrados = filtrados.filter(r =>
      String(r.cliente || "").toLowerCase().includes(query) ||
      String(r.tipo_evento || "").toLowerCase().includes(query) ||
      String(r.locacion || r.lugar || "").toLowerCase().includes(query) ||
      String(r.telefono || "").includes(query)
    );
  }

  renderListaEventos(filtrados);
}

if (filterSearch) filterSearch.addEventListener("input", aplicarFiltros);
if (filterEstado) filterEstado.addEventListener("change", aplicarFiltros);
if (filterFecha) filterFecha.addEventListener("change", aplicarFiltros);

// ------------------- CARGA PRINCIPAL -------------------
async function cargarEventos() {
  try {
    reservasCache = await dbService.getReservations();
    aplicarFiltros();
    renderCalendario();
  } catch (err) {
    console.error("Error cargando eventos:", err);
  }
}

// ------------------- GUARDAR / EDITAR EVENTO -------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = reservationIdInput.value;
  const cliente = clienteInput.value.trim();
  const telefono = telefonoInput.value.trim();
  const tipo_evento = tipoEventoInput.value.trim();
  const fecha_evento = fechaEventoInput.value;
  const lugar = lugarInput.value.trim();
  const personas = Number(personasInput.value) || 0;
  const estado = estadoInput.value;
  const total = Number(totalEventoInput.value) || 0;
  const observaciones = observacionesInput.value.trim();

  const payload = {
    cliente,
    telefono,
    tipo_evento,
    fecha_evento,
    locacion: lugar || "Salón Almar Marinilla",
    lugar: lugar || "Salón Almar Marinilla",
    personas,
    estado,
    total,
    valor_total: total,
    observaciones
  };

  try {
    saveReservationBtn.disabled = true;
    saveReservationBtn.textContent = "Guardando...";

    if (id) {
      await dbService.updateReservation(id, payload);
      Swal.fire({
        icon: "success",
        title: "¡Evento actualizado!",
        text: `Se actualizaron los datos de "${cliente}".`,
        timer: 1600,
        showConfirmButton: false
      });
    } else {
      payload.anticipo = 0;
      payload.abono = 0;
      payload.saldo = total;
      await dbService.createReservation(payload);
      Swal.fire({
        icon: "success",
        title: "¡Evento agendado!",
        text: `El evento de "${cliente}" se ha guardado en la agenda.`,
        timer: 1600,
        showConfirmButton: false
      });
    }

    limpiarFormulario();
    await cargarEventos();
  } catch (err) {
    console.error("Error guardando evento:", err);
    Swal.fire({
      icon: "error",
      title: "Error al guardar",
      text: err.message || "Ocurrió un problema al guardar el evento."
    });
  } finally {
    saveReservationBtn.disabled = false;
    saveReservationBtn.textContent = id ? "Actualizar evento" : "Guardar evento";
  }
});

// Inicializar
cargarEventos();