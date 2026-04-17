const API_URL = "http://localhost:3001/api/calendar";
const token = localStorage.getItem("token");

const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const logoutBtn = document.getElementById("logoutBtn");

let currentDate = new Date();
let reservas = [];
let eventos = [];

if (!token) {
  Swal.fire({
    icon: "warning",
    title: "Sesión expirada",
    text: "Debes iniciar sesión nuevamente."
  }).then(() => {
    window.location.href = "./login.html";
  });
}

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    ...extra
  };
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
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

  if (valor === "pendiente" || valor === "nuevo" || valor === "contactado") return "badge-pendiente";
  if (valor === "confirmada" || valor === "confirmado" || valor === "finalizado") return "badge-confirmada";
  if (valor === "cancelada" || valor === "cancelado") return "badge-cancelada";
  if (valor === "convertida" || valor === "convertido" || valor === "en_proceso") return "badge-convertida";

  return "badge-pendiente";
}

function obtenerEtiquetaOrigen(item) {
  return item.origen === "evento" ? "Evento" : "Reserva";
}

function obtenerClaseOrigen(item) {
  return item.origen === "evento" ? "origin-evento" : "origin-reserva";
}

async function leerRespuestaJSON(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Respuesta no JSON:", text);
    throw new Error("El servidor devolvió una respuesta inválida.");
  }
}

async function cargarCalendario() {
  try {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const res = await fetch(`${API_URL}?month=${month}&year=${year}`, {
      headers: authHeaders()
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudo cargar el calendario");
    }

    reservas = Array.isArray(data.reservas) ? data.reservas : [];
    eventos = Array.isArray(data.eventos) ? data.eventos : [];

    renderCalendar();
  } catch (error) {
    console.error("ERROR CARGANDO CALENDARIO:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo cargar el calendario"
    });
  }
}

function renderCalendar() {
  calendarGrid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  monthTitle.textContent = firstDay.toLocaleString("es-CO", {
    month: "long",
    year: "numeric"
  });

  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day-card calendar-day-empty";
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const fechaStr = formatearFechaISO(date);

    const reservasDia = reservas.filter(r => normalizarFechaTexto(r.fecha_evento) === fechaStr);
    const eventosDia = eventos.filter(e => normalizarFechaTexto(e.fecha_evento) === fechaStr);

    const itemsDia = [...reservasDia, ...eventosDia];

    const dayCard = document.createElement("div");
    dayCard.className = "calendar-day-card";

    const preview = itemsDia.slice(0, 3).map(item => {
      return `
        <span class="calendar-event-badge ${obtenerClaseEstado(item.estado)} ${obtenerClaseOrigen(item)}">
          ${item.origen === "evento" ? "🎉" : "📅"} ${item.tipo_evento || "Registro"}
        </span>
      `;
    }).join("");

    const extraCount = itemsDia.length > 3
      ? `<span class="calendar-more">+${itemsDia.length - 3} más</span>`
      : "";

    dayCard.innerHTML = `
      <div class="calendar-day-top">
        <span class="calendar-day-number">${day}</span>
        <span class="calendar-day-total">${itemsDia.length} registro${itemsDia.length === 1 ? "" : "s"}</span>
      </div>

      <div class="calendar-day-events">
        ${preview || `<span class="calendar-empty-label">Disponible</span>`}
        ${extraCount}
      </div>
    `;

    if (itemsDia.length > 0) {
      dayCard.classList.add("calendar-day-has-events");
    }

    dayCard.addEventListener("click", () => {
      mostrarDetalleDia(fechaStr, reservasDia, eventosDia);
    });

    calendarGrid.appendChild(dayCard);
  }
}

function mostrarDetalleDia(fecha, reservasDia, eventosDia) {
  const total = reservasDia.length + eventosDia.length;

  if (!total) {
    Swal.fire({
      icon: "info",
      title: `Sin actividad`,
      html: `
        <p>No hay reservas ni eventos para <strong>${fecha}</strong>.</p>
      `,
      footer: `
        <a href="./reservas.html" style="text-decoration:none; margin-right:10px;">Ir a reservas</a>
        <a href="./eventos.html" style="text-decoration:none;">Ir a eventos</a>
      `
    });
    return;
  }

  const reservasHtml = reservasDia.length
    ? reservasDia.map(item => `
        <div class="calendar-modal-item">
          <strong>📅 ${item.cliente || "Sin cliente"}</strong><br>
          <span>${item.tipo_evento || "Reserva"}</span><br>
          <span>Estado: ${item.estado || "Pendiente"}</span><br>
          <span>Tel: ${item.telefono || "No definido"}</span><br>
          <span>Personas: ${item.personas || 0}</span><br>
          <span>Lugar: ${item.lugar || "Por definir"}</span>
        </div>
      `).join("")
    : `<p style="opacity:.7;">No hay reservas este día.</p>`;

  const eventosHtml = eventosDia.length
    ? eventosDia.map(item => `
        <div class="calendar-modal-item">
          <strong>🎉 ${item.cliente || "Sin cliente"}</strong><br>
          <span>${item.tipo_evento || "Evento"}</span><br>
          <span>Estado: ${item.estado || "Pendiente"}</span><br>
          <span>Tel: ${item.telefono || "No definido"}</span><br>
          <span>Personas: ${item.personas || 0}</span><br>
          <span>Lugar: ${item.lugar || "Por definir"}</span>
        </div>
      `).join("")
    : `<p style="opacity:.7;">No hay eventos este día.</p>`;

  Swal.fire({
    title: `Agenda del ${fecha}`,
    html: `
      <div style="text-align:left;">
        <h3 style="margin:0 0 10px 0;">Reservas</h3>
        ${reservasHtml}
        <hr style="margin:16px 0; border-color:rgba(255,255,255,0.08);" />
        <h3 style="margin:0 0 10px 0;">Eventos</h3>
        ${eventosHtml}
      </div>
    `,
    width: 700,
    confirmButtonText: "Cerrar",
    footer: `
      <a href="./reservas.html" style="text-decoration:none; margin-right:12px;">Ver reservas</a>
      <a href="./eventos.html" style="text-decoration:none;">Ver eventos</a>
    `
  });
}

prevMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  cargarCalendario();
});

nextMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  cargarCalendario();
});

cargarCalendario();