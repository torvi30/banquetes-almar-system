const API_URL = "http://localhost:3001/api/reservations";
const token = localStorage.getItem("token");

const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const logoutBtn = document.getElementById("logoutBtn");

let currentDate = new Date();
let reservas = [];

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

  if (valor === "pendiente") return "badge-pendiente";
  if (valor === "confirmada") return "badge-confirmada";
  if (valor === "cancelada") return "badge-cancelada";
  if (valor === "convertida") return "badge-convertida";

  return "badge-pendiente";
}

function obtenerConteoPorEstado(lista) {
  return {
    pendiente: lista.filter(r => String(r.estado).toLowerCase() === "pendiente").length,
    confirmada: lista.filter(r => String(r.estado).toLowerCase() === "confirmada").length,
    cancelada: lista.filter(r => String(r.estado).toLowerCase() === "cancelada").length,
    convertida: lista.filter(r => String(r.estado).toLowerCase() === "convertida").length
  };
}

async function cargarReservas() {
  try {
    const res = await fetch(API_URL, {
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar las reservas");
    }

    reservas = Array.isArray(data) ? data : [];
    renderCalendar();
  } catch (error) {
    console.error("ERROR CARGANDO RESERVAS:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudieron cargar las reservas"
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
    const conteos = obtenerConteoPorEstado(reservasDia);

    const dayCard = document.createElement("div");
    dayCard.className = "calendar-day-card";

    const reservasPreview = reservasDia.slice(0, 3).map(r => `
      <span class="calendar-event-badge ${obtenerClaseEstado(r.estado)}">
        ${r.tipo_evento || "Reserva"}
      </span>
    `).join("");

    const extraCount = reservasDia.length > 3
      ? `<span class="calendar-more">+${reservasDia.length - 3} más</span>`
      : "";

    dayCard.innerHTML = `
      <div class="calendar-day-top">
        <span class="calendar-day-number">${day}</span>
        <span class="calendar-day-total">${reservasDia.length} reserva${reservasDia.length === 1 ? "" : "s"}</span>
      </div>

      <div class="calendar-day-events">
        ${reservasPreview || `<span class="calendar-empty-label">Disponible</span>`}
        ${extraCount}
      </div>
    `;

    if (reservasDia.length > 0) {
      dayCard.classList.add("calendar-day-has-events");
    }

    dayCard.addEventListener("click", () => {
      mostrarReservasDia(fechaStr, reservasDia, conteos);
    });

    calendarGrid.appendChild(dayCard);
  }
}

function mostrarReservasDia(fecha, lista, conteos) {
  if (!lista.length) {
    Swal.fire({
      icon: "info",
      title: `Sin reservas`,
      html: `
        <p>No hay reservas registradas para <strong>${fecha}</strong>.</p>
        <div style="margin-top:16px;">
          <a href="./reservas.html" class="swal2-confirm swal2-styled" style="text-decoration:none;">
            Ir a reservas
          </a>
        </div>
      `,
      showConfirmButton: false
    });
    return;
  }

  const html = `
    <div style="text-align:left;">
      <div style="margin-bottom:14px;">
        <strong>Fecha:</strong> ${fecha}<br>
        <strong>Pendientes:</strong> ${conteos.pendiente}<br>
        <strong>Confirmadas:</strong> ${conteos.confirmada}<br>
        <strong>Canceladas:</strong> ${conteos.cancelada}<br>
        <strong>Convertidas:</strong> ${conteos.convertida}
      </div>

      ${lista.map(r => `
        <div style="padding:12px; border:1px solid #333; border-radius:10px; margin-bottom:10px;">
          <strong>${r.cliente || "Sin cliente"}</strong><br>
          <span>${r.tipo_evento || "Reserva"}</span><br>
          <span>Tel: ${r.telefono || "No definido"}</span><br>
          <span>Estado: ${r.estado || "Pendiente"}</span><br>
          <span>Personas: ${r.personas || 0}</span><br>
          <span>Lugar: ${r.lugar || "Por definir"}</span>
        </div>
      `).join("")}
    </div>
  `;

  Swal.fire({
    title: `Reservas del ${fecha}`,
    html,
    width: 650,
    confirmButtonText: "Cerrar",
    footer: `<a href="./reservas.html" style="text-decoration:none;">Ir a Reservas</a>`
  });
}

prevMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

cargarReservas();