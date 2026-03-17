const token = localStorage.getItem("token");

const form = document.getElementById("eventForm");
const grid = document.getElementById("eventsGrid");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEventBtn = document.getElementById("saveEventBtn");

const eventoIdInput = document.getElementById("eventoId");
const clienteInput = document.getElementById("cliente");
const telefonoInput = document.getElementById("telefono");
const tipoEventoInput = document.getElementById("tipo_evento");
const fechaEventoInput = document.getElementById("fecha_evento");
const lugarInput = document.getElementById("lugar");
const personasInput = document.getElementById("personas");
const valorTotalInput = document.getElementById("valor_total");
const abonoInput = document.getElementById("abono");
const estadoInput = document.getElementById("estado");
const observacionesInput = document.getElementById("observaciones");

if (!token) {
  alert("Debes iniciar sesión");
  window.location.href = "./login.html";
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

function limpiarFormulario() {
  eventoIdInput.value = "";
  clienteInput.value = "";
  telefonoInput.value = "";
  tipoEventoInput.value = "";
  fechaEventoInput.value = "";
  lugarInput.value = "";
  personasInput.value = "";
  valorTotalInput.value = "";
  abonoInput.value = "";
  estadoInput.value = "Nuevo";
  observacionesInput.value = "";
  saveEventBtn.textContent = "Guardar evento";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    limpiarFormulario();
  });
}

async function cargarEventos() {
  try {
    const res = await fetch("http://localhost:3001/api/events", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al cargar eventos");
    }

    grid.innerHTML = "";

    if (!data.length) {
      grid.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay eventos registrados</h3>
          <p>Cuando registres eventos aparecerán aquí.</p>
        </div>
      `;
      return;
    }

    data.forEach((evento) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      card.innerHTML = `
        <h3>${evento.cliente}</h3>
        <p><strong>Teléfono:</strong> ${evento.telefono || "No definido"}</p>
        <p><strong>Tipo de evento:</strong> ${evento.tipo_evento || "No definido"}</p>
        <p><strong>Fecha:</strong> ${evento.fecha_evento || "No definida"}</p>
        <p><strong>Lugar:</strong> ${evento.lugar || "No definido"}</p>
        <p><strong>Personas:</strong> ${evento.personas || 0}</p>
        <p><strong>Valor total:</strong> $${evento.valor_total || 0}</p>
        <p><strong>Abono:</strong> $${evento.abono || 0}</p>
        <p><strong>Saldo:</strong> $${evento.saldo || 0}</p>
        <p><strong>Estado:</strong> ${evento.estado || "Nuevo"}</p>
        <p><strong>Observaciones:</strong> ${evento.observaciones || "Sin observaciones"}</p>

        <div class="quote-card-actions">
          <button class="btn btn-success edit-event-btn" data-id="${evento.id}">
            Editar
          </button>
          <button class="btn btn-danger delete-event-btn" data-id="${evento.id}">
            Eliminar
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    document.querySelectorAll(".delete-event-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        await eliminarEvento(button.dataset.id);
      });
    });

    document.querySelectorAll(".edit-event-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const evento = data.find(ev => String(ev.id) === String(button.dataset.id));
        if (evento) {
          cargarEventoEnFormulario(evento);
        }
      });
    });

  } catch (error) {
    console.error("ERROR EVENTOS:", error);
    alert(error.message);
  }
}

function cargarEventoEnFormulario(evento) {
  eventoIdInput.value = evento.id || "";
  clienteInput.value = evento.cliente || "";
  telefonoInput.value = evento.telefono || "";
  tipoEventoInput.value = evento.tipo_evento || "";
  fechaEventoInput.value = evento.fecha_evento || "";
  lugarInput.value = evento.lugar || "";
  personasInput.value = evento.personas || "";
  valorTotalInput.value = evento.valor_total || "";
  abonoInput.value = evento.abono || "";
  estadoInput.value = evento.estado || "Nuevo";
  observacionesInput.value = evento.observaciones || "";

  saveEventBtn.textContent = "Actualizar evento";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function eliminarEvento(id) {
  const confirmar = confirm("¿Deseas eliminar este evento?");
  if (!confirmar) return;

  try {
    const res = await fetch(`http://localhost:3001/api/events/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al eliminar evento");
    }

    await cargarEventos();
  } catch (error) {
    console.error("ERROR DELETE EVENTO:", error);
    alert(error.message);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = eventoIdInput.value;

  const data = {
    cliente: clienteInput.value,
    telefono: telefonoInput.value,
    tipo_evento: tipoEventoInput.value,
    fecha_evento: fechaEventoInput.value,
    lugar: lugarInput.value,
    personas: personasInput.value,
    valor_total: valorTotalInput.value,
    abono: abonoInput.value,
    estado: estadoInput.value,
    observaciones: observacionesInput.value
  };

  try {
    let res;

    if (id) {
      res = await fetch(`http://localhost:3001/api/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } else {
      res = await fetch("http://localhost:3001/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    }

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Error al guardar evento");
    }

    alert(id ? "Evento actualizado correctamente" : "Evento guardado correctamente");
    limpiarFormulario();
    await cargarEventos();

  } catch (error) {
    console.error("ERROR EVENTO:", error);
    alert(error.message);
  }
});

cargarEventos();