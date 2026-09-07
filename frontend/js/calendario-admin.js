/**
 * Calendario y Agenda de Eventos - Banquetes Almar (Marinilla, Antioquia)
 * Conectado a dbService (Firestore / Firebase).
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const logoutBtn = document.getElementById("logoutBtn");

let currentDate = new Date();
let reservas = [];

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

function formatearFechaISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizarFechaTexto(fecha) {
  if (!fecha) return "";
  return String(fecha).slice(0, 10);
}

function obtenerClaseEstado(estado) {
  const valor = String(estado || "").toLowerCase().trim();
  if (valor === "pendiente" || valor === "nuevo") return "badge-pendiente";
  if (valor === "confirmada" || valor === "confirmado" || valor === "finalizado") return "badge-confirmada";
  if (valor === "cancelada" || valor === "cancelado") return "badge-cancelada";
  return "badge-pendiente";
}

function renderCalendario() {
  if (!calendarGrid || !monthTitle) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

    const eventosDelDia = reservas.filter(item => {
      const fechaItem = normalizarFechaTexto(item.fecha_evento || item.fecha);
      return fechaItem === fechaISO;
    });

    const itemsHTML = eventosDelDia.map(ev => {
      const clase = obtenerClaseEstado(ev.estado);
      const titulo = ev.cliente || "Evento";
      const tipo = ev.tipo_evento || "Social";

      return `
        <div class="calendar-event-pill ${clase}" title="${titulo} - ${tipo} (${ev.estado})">
          <strong>${titulo}</strong>
          <span>${tipo}</span>
        </div>
      `;
    }).join("");

    html += `
      <div class="calendar-day ${eventosDelDia.length > 0 ? "has-events" : ""}" data-date="${fechaISO}">
        <div class="calendar-day-header">
          <span class="day-number">${diaNumero}</span>
          ${eventosDelDia.length > 0 ? `<span class="event-count-badge">${eventosDelDia.length}</span>` : ""}
        </div>
        <div class="calendar-day-events">
          ${itemsHTML}
        </div>
      </div>
    `;
  }

  calendarGrid.innerHTML = html;
}

if (prevMonthBtn) {
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendario();
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendario();
  });
}

async function cargarDatosCalendario() {
  try {
    reservas = await dbService.getReservations();
    renderCalendario();
  } catch (error) {
    console.error("Error cargando calendario:", error);
  }
}

cargarDatosCalendario();