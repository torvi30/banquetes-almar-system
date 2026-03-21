const API_URL = "http://localhost:3001/api/events";

const calendarGrid = document.getElementById("calendarGrid");
const calendarTitle = document.getElementById("calendarTitle");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const selectedDayTitle = document.getElementById("selectedDayTitle");
const selectedDayEvents = document.getElementById("selectedDayEvents");
const upcomingEvents = document.getElementById("upcomingEvents");
const logoutBtn = document.getElementById("logoutBtn");

let eventos = [];
let currentDate = new Date();
let selectedDateStr = "";

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

function normalizarFechaTexto(fechaStr) {
  if (!fechaStr) return "";
  return String(fechaStr).slice(0, 10);
}

function formatMoney(value) {
  return "$" + Number(value || 0).toLocaleString("es-CO");
}

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLongDate(dateStr) {
  if (!dateStr) return "Sin fecha";
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getEventsByDate(dateStr) {
  return eventos.filter(ev => normalizarFechaTexto(ev.fecha_evento) === dateStr);
}

function getUpcomingEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [...eventos]
    .filter(ev => {
      const fecha = normalizarFechaTexto(ev.fecha_evento);
      if (!fecha) return false;
      return parseLocalDate(fecha) >= today;
    })
    .sort((a, b) => normalizarFechaTexto(a.fecha_evento).localeCompare(normalizarFechaTexto(b.fecha_evento)))
    .slice(0, 8);
}

function construirWhatsappUrl(ev) {
  const telefonoLimpio = String(ev.telefono || "").replace(/\D/g, "");
  if (!telefonoLimpio) return "";

  const mensaje = `Hola ${ev.cliente || ""}, te escribimos de Banquetes Almar sobre tu evento ${ev.tipo_evento || ""} del ${normalizarFechaTexto(ev.fecha_evento) || ""}. Estado: ${ev.estado || "Pendiente"}. Saldo pendiente: ${formatMoney(ev.saldo)}.`;
  return `https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
}

function renderUpcomingEvents() {
  const list = getUpcomingEvents();

  if (!list.length) {
    upcomingEvents.innerHTML = `
      <div class="empty-state-card">
        <h3>Sin próximos eventos</h3>
        <p>Aún no hay eventos programados.</p>
      </div>
    `;
    return;
  }

  upcomingEvents.innerHTML = list.map(ev => `
    <article class="event-row-card">
      <div class="event-row-main">
        <strong>${ev.cliente || "Sin cliente"}</strong>
        <p>${ev.tipo_evento || "Sin tipo"} · ${formatLongDate(normalizarFechaTexto(ev.fecha_evento))}</p>
      </div>

      <div class="event-row-side">
        <span class="event-status-text">${ev.estado || "Pendiente"}</span>
        <small>${formatMoney(ev.saldo)}</small>
      </div>
    </article>
  `).join("");
}

function renderSelectedDay(dateStr) {
  selectedDateStr = dateStr;
  const list = getEventsByDate(dateStr);

  selectedDayTitle.textContent = formatLongDate(dateStr);

  if (!list.length) {
    selectedDayEvents.innerHTML = `
      <div class="empty-state-card">
        <h3>Sin eventos este día</h3>
        <p>No hay reservas registradas para esta fecha.</p>
      </div>
    `;
    return;
  }

  selectedDayEvents.innerHTML = list.map(ev => `
    <article class="event-row-card event-row-card-large">
      <div class="event-row-main">
        <strong>${ev.cliente || "Sin cliente"}</strong>
        <p>${ev.tipo_evento || "Sin tipo"} · ${ev.lugar || "Sin lugar"}</p>
        <p>Tel: ${ev.telefono || "No definido"}</p>
        <p>Personas: ${ev.personas || 0}</p>
        <p>Total: ${formatMoney(ev.valor_total)} · Abono: ${formatMoney(ev.abono)} · Saldo: ${formatMoney(ev.saldo)}</p>
        <p>Obs: ${ev.observaciones || "Sin observaciones"}</p>
      </div>

      <div class="event-row-side">
        <span class="event-status-text">${ev.estado || "Pendiente"}</span>

        <div class="event-actions-stack">
          <button class="btn btn-primary" onclick="abrirEditar(${ev.id})">Editar</button>
          <button class="btn btn-success" onclick="marcarPagado(${ev.id})">Marcar pagado</button>
          ${ev.telefono ? `
            <a class="btn btn-secondary" target="_blank" href="${construirWhatsappUrl(ev)}">WhatsApp</a>
          ` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  calendarTitle.textContent = `${meses[month]} ${year}`;
  calendarGrid.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let firstWeekday = firstDay.getDay();
  firstWeekday = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const totalDays = lastDay.getDate();

  for (let i = 0; i < firstWeekday; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-cell empty";
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = getEventsByDate(dateStr);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-cell";
    if (dayEvents.length) cell.classList.add("has-events");
    if (selectedDateStr === dateStr) cell.classList.add("selected");

    cell.innerHTML = `
      <span class="calendar-day-number">${day}</span>
      ${dayEvents.length ? `<span class="calendar-day-badge">${dayEvents.length}</span>` : ""}
    `;

    cell.addEventListener("click", () => {
      renderSelectedDay(dateStr);
      renderCalendar();
    });

    calendarGrid.appendChild(cell);
  }
}

async function cargarEventos() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar los eventos");
    }

    eventos = Array.isArray(data) ? data : [];

    if (!selectedDateStr) {
      const today = new Date();
      selectedDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }

    renderCalendar();
    renderSelectedDay(selectedDateStr);
    renderUpcomingEvents();
  } catch (error) {
    console.error("ERROR CALENDARIO:", error);
    calendarGrid.innerHTML = `
      <div class="empty-state-card" style="grid-column:1/-1;">
        <h3>Error cargando calendario</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

window.abrirEditar = function(id) {
  const ev = eventos.find(e => Number(e.id) === Number(id));
  if (!ev) return;

  const modalHTML = `
    <div class="modal-edit" id="modalEditarEvento">
      <div class="modal-content">
        <h3>Editar evento</h3>

        <input id="editCliente" value="${ev.cliente || ""}" placeholder="Cliente" />
        <input id="editTelefono" value="${ev.telefono || ""}" placeholder="Teléfono" />
        <input id="editTipoEvento" value="${ev.tipo_evento || ""}" placeholder="Tipo de evento" />
        <input id="editFechaEvento" type="date" value="${normalizarFechaTexto(ev.fecha_evento) || ""}" />
        <input id="editLugar" value="${ev.lugar || ""}" placeholder="Lugar" />
        <input id="editPersonas" type="number" value="${ev.personas || 0}" placeholder="Personas" />
        <input id="editValorTotal" type="number" value="${ev.valor_total || 0}" placeholder="Valor total" />
        <input id="editAbono" type="number" value="${ev.abono || 0}" placeholder="Abono" />
        <textarea id="editObservaciones" rows="4" placeholder="Observaciones">${ev.observaciones || ""}</textarea>

        <div class="modal-current-image">
          ${ev.imagen ? `
            <img src="http://localhost:3001/uploads/${ev.imagen}" alt="${ev.cliente || "Evento"}" class="modal-preview-image">
          ` : `<p>Este evento no tiene imagen.</p>`}
        </div>

        <label class="modal-file-label" for="editImagen">Cambiar imagen</label>
        <input id="editImagen" type="file" accept="image/*" />

        <div class="event-form-actions">
          <button class="btn btn-primary" onclick="guardarEdicion(${ev.id})">Guardar</button>
          <button class="btn btn-success" onclick="marcarPagado(${ev.id})">Marcar pagado</button>
          ${ev.telefono ? `
            <a class="btn btn-secondary" target="_blank" href="${construirWhatsappUrl(ev)}">WhatsApp</a>
          ` : ""}
          <button class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
};

window.guardarEdicion = async function(id) {
  const valorTotal = Number(document.getElementById("editValorTotal").value || 0);
  const abono = Number(document.getElementById("editAbono").value || 0);

  if (abono > valorTotal) {
    alert("El abono no puede ser mayor que el valor total.");
    return;
  }

  const data = {
    cliente: document.getElementById("editCliente").value,
    telefono: document.getElementById("editTelefono").value,
    tipo_evento: document.getElementById("editTipoEvento").value,
    fecha_evento: document.getElementById("editFechaEvento").value,
    lugar: document.getElementById("editLugar").value,
    personas: document.getElementById("editPersonas").value,
    valor_total: valorTotal,
    abono: abono,
    observaciones: document.getElementById("editObservaciones").value
  };

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Error al actualizar evento");
    }

    const imagenFile = document.getElementById("editImagen").files[0];

    if (imagenFile) {
      const formData = new FormData();
      formData.append("imagen", imagenFile);

      const imagenRes = await fetch(`${API_URL}/${id}/imagen`, {
        method: "PUT",
        body: formData
      });

      const imagenResult = await imagenRes.json();

      if (!imagenRes.ok) {
        throw new Error(imagenResult.message || "Error al actualizar imagen");
      }
    }

    alert("Evento actualizado correctamente");
    cerrarModal();
    await cargarEventos();
  } catch (error) {
    console.error("ERROR ACTUALIZANDO EVENTO:", error);
    alert(error.message);
  }
};

window.marcarPagado = async function(id) {
  const ev = eventos.find(e => Number(e.id) === Number(id));
  if (!ev) return;

  const confirmar = confirm("¿Marcar este evento como pagado?");
  if (!confirmar) return;

  const valorTotal = Number(ev.valor_total || 0);

  const data = {
    cliente: ev.cliente,
    telefono: ev.telefono,
    tipo_evento: ev.tipo_evento,
    fecha_evento: normalizarFechaTexto(ev.fecha_evento),
    lugar: ev.lugar,
    personas: ev.personas,
    valor_total: valorTotal,
    abono: valorTotal,
    observaciones: ev.observaciones
  };

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "No se pudo marcar como pagado");
    }

    alert("Evento marcado como pagado");
    cerrarModal();
    await cargarEventos();
  } catch (error) {
    console.error("ERROR MARCAR PAGADO:", error);
    alert(error.message);
  }
};

window.cerrarModal = function() {
  const modal = document.getElementById("modalEditarEvento");
  if (modal) modal.remove();
};

prevMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

cargarEventos();