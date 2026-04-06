const API_URL = "http://localhost:3001/api/reservations";
const token = localStorage.getItem("token");

const form = document.getElementById("reservationForm");
const reservationsGrid = document.getElementById("reservationsGrid");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveReservationBtn = document.getElementById("saveReservationBtn");
const btnFiltrar = document.getElementById("btnFiltrar");

const reservationIdInput = document.getElementById("reservationId");
const clienteIdInput = document.getElementById("cliente_id");
const clienteInput = document.getElementById("cliente");
const telefonoInput = document.getElementById("telefono");
const tipoEventoInput = document.getElementById("tipo_evento");
const fechaEventoInput = document.getElementById("fecha_evento");
const lugarInput = document.getElementById("lugar");
const personasInput = document.getElementById("personas");
const estadoInput = document.getElementById("estado");
const observacionesInput = document.getElementById("observaciones");

const filterFecha = document.getElementById("filterFecha");
const filterEstado = document.getElementById("filterEstado");
const filterSearch = document.getElementById("filterSearch");

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

function limpiarFormulario() {
  reservationIdInput.value = "";
  clienteIdInput.value = "";
  clienteInput.value = "";
  telefonoInput.value = "";
  tipoEventoInput.value = "";
  fechaEventoInput.value = "";
  lugarInput.value = "";
  personasInput.value = "";
  estadoInput.value = "Pendiente";
  observacionesInput.value = "";
  saveReservationBtn.textContent = "Guardar reserva";
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  return String(fecha).slice(0, 10);
}

function claseEstadoReserva(estado) {
  const valor = String(estado || "").toLowerCase();

  if (valor === "pendiente") return "estado-contactado";
  if (valor === "confirmada") return "estado-confirmado";
  if (valor === "cancelada") return "estado-cancelado";
  if (valor === "convertida") return "estado-convertido";

  return "estado-contactado";
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    limpiarFormulario();

    Swal.fire({
      icon: "info",
      title: "Edición cancelada",
      timer: 900,
      showConfirmButton: false
    });
  });
}

function renderReservas(data) {
  reservationsGrid.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    reservationsGrid.innerHTML = `
      <div class="empty-state-card">
        <h3>Sin reservas</h3>
        <p>No se encontraron reservas con esos filtros.</p>
      </div>
    `;
    return;
  }

  data.forEach((reserva) => {
    const card = document.createElement("article");
    card.className = "quote-card";

    const estadoClass = claseEstadoReserva(reserva.estado);

    card.innerHTML = `
      <div class="quote-card-top">
        <div>
          <h3>${reserva.cliente || "Sin cliente"}</h3>
          <p><strong>ID reserva:</strong> ${reserva.id}</p>
          <p><strong>Teléfono:</strong> ${reserva.telefono || "No definido"}</p>
          <p><strong>Fecha:</strong> ${formatearFecha(reserva.fecha_evento)}</p>
          <p><strong>Lugar:</strong> ${reserva.lugar || "No definido"}</p>
          <p><strong>Personas:</strong> ${reserva.personas || 0}</p>
        </div>

        <span class="event-chip">
          ${reserva.tipo_evento || "Evento"}
        </span>
      </div>

      <div class="quote-status-row">
        <span class="status-badge ${estadoClass}">
          ${reserva.estado || "Pendiente"}
        </span>
      </div>

      <p><strong>Observaciones:</strong> ${reserva.observaciones || "Sin observaciones"}</p>

      <div class="quote-card-actions">
        <button class="btn btn-success edit-btn" data-id="${reserva.id}">Editar</button>
        <button class="btn btn-primary convert-btn" data-id="${reserva.id}">Convertir a evento</button>
        <button class="btn btn-danger delete-btn" data-id="${reserva.id}">Eliminar</button>
      </div>
    `;

    reservationsGrid.appendChild(card);
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      try {
        const res = await fetch(`${API_URL}/${id}`, {
          headers: authHeaders()
        });

        const reserva = await res.json();

        if (!res.ok) {
          throw new Error(reserva.message || "No se pudo cargar la reserva");
        }

        reservationIdInput.value = reserva.id;
        clienteIdInput.value = reserva.cliente_id || "";
        clienteInput.value = reserva.cliente || "";
        telefonoInput.value = reserva.telefono || "";
        tipoEventoInput.value = reserva.tipo_evento || "";
        fechaEventoInput.value = reserva.fecha_evento ? String(reserva.fecha_evento).slice(0, 10) : "";
        lugarInput.value = reserva.lugar || "";
        personasInput.value = reserva.personas || "";
        estadoInput.value = reserva.estado || "Pendiente";
        observacionesInput.value = reserva.observaciones || "";

        saveReservationBtn.textContent = "Actualizar reserva";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

        Swal.fire({
          icon: "info",
          title: "Reserva cargada",
          text: "Ya puedes editar la reserva.",
          timer: 1200,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message
        });
      }
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const confirmar = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar esta reserva?",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d"
      });

      if (!confirmar.isConfirmed) return;

      try {
        const res = await fetch(`${API_URL}/${btn.dataset.id}`, {
          method: "DELETE",
          headers: authHeaders()
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "No se pudo eliminar la reserva");
        }

        await Swal.fire({
          icon: "success",
          title: "Reserva eliminada",
          timer: 1200,
          showConfirmButton: false
        });

        await cargarReservas();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message
        });
      }
    });
  });

  document.querySelectorAll(".convert-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const confirmar = await Swal.fire({
        icon: "question",
        title: "¿Convertir esta reserva a evento?",
        text: "Se creará un evento con los datos de esta reserva.",
        showCancelButton: true,
        confirmButtonText: "Sí, convertir",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#6c757d"
      });

      if (!confirmar.isConfirmed) return;

      try {
        const res = await fetch(`${API_URL}/${btn.dataset.id}/convert`, {
          method: "POST",
          headers: authHeaders()
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "No se pudo convertir la reserva");
        }

        await Swal.fire({
          icon: "success",
          title: "Reserva convertida",
          text: "La reserva fue convertida a evento correctamente.",
          timer: 1400,
          showConfirmButton: false
        });

        await cargarReservas();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message
        });
      }
    });
  });
}

async function cargarReservas() {
  try {
    const params = new URLSearchParams();

    if (filterFecha.value) params.append("fecha", filterFecha.value);
    if (filterEstado.value) params.append("estado", filterEstado.value);
    if (filterSearch.value.trim()) params.append("q", filterSearch.value.trim());

    const url = params.toString()
      ? `${API_URL}?${params.toString()}`
      : API_URL;

    const res = await fetch(url, {
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar las reservas");
    }

    renderReservas(data);
  } catch (error) {
    console.error("ERROR CARGANDO RESERVAS:", error);

    reservationsGrid.innerHTML = `
      <div class="empty-state-card">
        <h3>Error</h3>
        <p>No se pudieron cargar las reservas.</p>
      </div>
    `;

    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudieron cargar las reservas"
    });
  }
}

if (btnFiltrar) {
  btnFiltrar.addEventListener("click", async () => {
    await cargarReservas();

    Swal.fire({
      icon: "success",
      title: "Filtros aplicados",
      timer: 900,
      showConfirmButton: false
    });
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = reservationIdInput.value;

    const payload = {
      cliente_id: clienteIdInput.value || null,
      cliente: clienteInput.value,
      telefono: telefonoInput.value,
      tipo_evento: tipoEventoInput.value,
      fecha_evento: fechaEventoInput.value,
      lugar: lugarInput.value,
      personas: personasInput.value || 0,
      estado: estadoInput.value,
      observaciones: observacionesInput.value
    };

    if (!payload.cliente.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo obligatorio",
        text: "El cliente es obligatorio"
      });
      return;
    }

    if (!payload.tipo_evento.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo obligatorio",
        text: "El tipo de evento es obligatorio"
      });
      return;
    }

    if (!payload.fecha_evento) {
      Swal.fire({
        icon: "warning",
        title: "Campo obligatorio",
        text: "La fecha del evento es obligatoria"
      });
      return;
    }

    try {
      let res;

      if (id) {
        res = await fetch(`${API_URL}/${id}`, {
          method: "PUT",
          headers: authHeaders({
            "Content-Type": "application/json"
          }),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: authHeaders({
            "Content-Type": "application/json"
          }),
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo guardar la reserva");
      }

      await Swal.fire({
        icon: "success",
        title: id ? "Reserva actualizada" : "Reserva creada",
        text: id
          ? "La reserva se actualizó correctamente."
          : "La reserva se creó correctamente.",
        timer: 1200,
        showConfirmButton: false
      });

      limpiarFormulario();
      await cargarReservas();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message
      });
    }
  });
}

cargarReservas();