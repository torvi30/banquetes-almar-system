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

// Calendario
const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

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
      const id = btn.dataset.id;
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

      form.scrollIntoView({ behavior: "smooth", block: "start" });
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

// ------------------- RENDER CALENDARIO MENSUAL -------------------
function renderCalendario() {
  if (!calendarGrid || !monthTitle) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  monthTitle.textContent = `${meses[month]} ${year}`;

  const primerDiaMes = new Date(year, month, 1);
  const ultimoDiaMes = new Date(year, month + 1, 0);

  // Ajuste lunes (0 = Lunes, 6 = Domingo)
  let primerDiaSemana = primerDiaMes.getDay() - 1;
  if (primerDiaSemana === -1) primerDiaSemana = 6;

  const totalDias = ultimoDiaMes.getDate();
  const totalCeldas = Math.ceil((primerDiaSemana + totalDias) / 7) * 7;

  let html = "";

  for (let i = 0; i < totalCeldas; i++) {
    const diaNumero = i - primerDiaSemana + 1;
    const esDiaValido = diaNumero >= 1 && diaNumero <= totalDias;

    if (!esDiaValido) {
      html += `<div class="calendar-day empty"></div>`;
      continue;
    }

    const fechaActual = new Date(year, month, diaNumero);
    const fechaISO = formatearFechaISO(fechaActual);

    const eventosDelDia = reservasCache.filter(item => {
      const f = String(item.fecha_evento || item.fecha || "").slice(0, 10);
      return f === fechaISO;
    });

    const itemsHTML = eventosDelDia.map(ev => {
      const cl = claseEstado(ev.estado);
      const titulo = ev.cliente || "Evento";
      const tipo = ev.tipo_evento || "Celebración";

      return `
        <div class="calendar-event-pill ${cl}" title="${titulo} - ${tipo} (${ev.estado || 'Confirmada'})">
          <strong>${titulo}</strong>
          <span>${tipo}</span>
        </div>
      `;
    }).join("");

    html += `
      <div class="calendar-day ${eventosDelDia.length ? "has-events" : ""}">
        <span class="day-number">${diaNumero}</span>
        <div class="calendar-events-wrap">${itemsHTML}</div>
      </div>
    `;
  }

  calendarGrid.innerHTML = html;
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