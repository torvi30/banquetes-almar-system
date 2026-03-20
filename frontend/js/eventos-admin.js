const API_URL = "http://localhost:3001/api/events";

const form = document.getElementById("eventForm");
const grid = document.getElementById("eventsGrid");
const logoutBtn = document.getElementById("logoutBtn");

const eventIdInput = document.getElementById("eventId");
const clienteInput = document.getElementById("cliente");
const telefonoInput = document.getElementById("telefono");
const tipoEventoInput = document.getElementById("tipo_evento");
const fechaEventoInput = document.getElementById("fecha_evento");
const lugarInput = document.getElementById("lugar");
const personasInput = document.getElementById("personas");
const valorTotalInput = document.getElementById("valor_total");
const abonoInput = document.getElementById("abono");
const imagenInput = document.getElementById("imagen");
const observacionesInput = document.getElementById("observaciones");

const saveBtn = document.getElementById("saveEventBtn");
const cancelBtn = document.getElementById("cancelEditBtn");

let enviando = false;

function formatearDinero(valor) {
  return "$" + Number(valor || 0).toLocaleString("es-CO");
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

function limpiarFormulario() {
  eventIdInput.value = "";
  clienteInput.value = "";
  telefonoInput.value = "";
  tipoEventoInput.value = "";
  fechaEventoInput.value = "";
  lugarInput.value = "";
  personasInput.value = "";
  valorTotalInput.value = "";
  abonoInput.value = "";
  imagenInput.value = "";
  observacionesInput.value = "";
  saveBtn.textContent = "Crear evento";
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    limpiarFormulario();
  });
}

async function cargarEventos() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    grid.innerHTML = "";

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar los eventos");
    }

    if (!Array.isArray(data) || !data.length) {
      grid.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay eventos</h3>
          <p>Crea el primer evento.</p>
        </div>
      `;
      return;
    }

    data.forEach((evento) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      card.innerHTML = `
        ${evento.imagen ? `
          <img
            src="http://localhost:3001/uploads/${evento.imagen}"
            alt="${evento.cliente || "Evento"}"
            style="width:100%; height:220px; object-fit:cover; border-radius:16px; margin-bottom:1rem;"
          >
        ` : ""}

        <h3>${evento.cliente || "Sin cliente"}</h3>
        <p><strong>Teléfono:</strong> ${evento.telefono || "No definido"}</p>
        <p><strong>Tipo:</strong> ${evento.tipo_evento || "Sin tipo"}</p>
        <p><strong>Fecha:</strong> ${evento.fecha_evento || "Sin fecha"}</p>
        <p><strong>Lugar:</strong> ${evento.lugar || "Sin lugar"}</p>
        <p><strong>Personas:</strong> ${evento.personas || 0}</p>
        <p><strong>Total:</strong> ${formatearDinero(evento.valor_total)}</p>
        <p><strong>Abono:</strong> ${formatearDinero(evento.abono)}</p>
        <p><strong>Saldo:</strong> ${formatearDinero(evento.saldo)}</p>
        <p><strong>Estado:</strong> ${evento.estado || "Pendiente"}</p>
        <p style="margin-top: 0.8rem; opacity: 0.9;">
          <strong>Observaciones:</strong> ${evento.observaciones || "Sin observaciones"}
        </p>

        <div class="quote-card-actions">
          <button class="btn btn-success edit-btn" data-id="${evento.id}">
            Editar
          </button>
          <button class="btn btn-danger delete-btn" data-id="${evento.id}">
            Eliminar
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const evento = data.find((e) => String(e.id) === String(btn.dataset.id));
        if (!evento) return;

        eventIdInput.value = evento.id;
        clienteInput.value = evento.cliente || "";
        telefonoInput.value = evento.telefono || "";
        tipoEventoInput.value = evento.tipo_evento || "";
        fechaEventoInput.value = evento.fecha_evento || "";
        lugarInput.value = evento.lugar || "";
        personasInput.value = evento.personas || "";
        valorTotalInput.value = evento.valor_total || "";
        abonoInput.value = evento.abono || "";
        observacionesInput.value = evento.observaciones || "";

        saveBtn.textContent = "Actualizar evento";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const confirmar = confirm("¿Eliminar evento?");
        if (!confirmar) return;

        await fetch(`${API_URL}/${btn.dataset.id}`, {
          method: "DELETE"
        });

        await cargarEventos();
      });
    });

  } catch (error) {
    console.error("ERROR CARGANDO EVENTOS:", error);
    alert(error.message);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (enviando) return;
  enviando = true;

  const id = eventIdInput.value;

  const formData = new FormData();
  formData.append("cliente", clienteInput.value);
  formData.append("telefono", telefonoInput.value);
  formData.append("tipo_evento", tipoEventoInput.value);
  formData.append("fecha_evento", fechaEventoInput.value);
  formData.append("lugar", lugarInput.value);
  formData.append("personas", Number(personasInput.value || 0));
  formData.append("valor_total", Number(valorTotalInput.value || 0));
  formData.append("abono", Number(abonoInput.value || 0));
  formData.append("observaciones", observacionesInput.value);

  if (imagenInput.files[0]) {
    formData.append("imagen", imagenInput.files[0]);
  }

  try {
    let res;

    if (id) {
      res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        body: formData
      });
    } else {
      res = await fetch(API_URL, {
        method: "POST",
        body: formData
      });
    }

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Error guardando evento");
    }

    alert(id ? "Evento actualizado correctamente" : "Evento creado correctamente");

    limpiarFormulario();
    await cargarEventos();

  } catch (error) {
    console.error("ERROR GUARDANDO EVENTO:", error);
    alert(error.message);
  }

  enviando = false;
});

cargarEventos();