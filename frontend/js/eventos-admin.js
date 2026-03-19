const API_URL = "http://localhost:3001/api/events";

const form = document.getElementById("eventForm");
const grid = document.getElementById("eventsGrid");
const logoutBtn = document.getElementById("logoutBtn");

const eventIdInput = document.getElementById("eventId");
const nombreInput = document.getElementById("nombre");
const fechaInput = document.getElementById("fecha");
const tipoInput = document.getElementById("tipo");
const personasInput = document.getElementById("personas");
const estadoInput = document.getElementById("estado");
const imagenInput = document.getElementById("imagen");
const descripcionInput = document.getElementById("descripcion");

const saveBtn = document.getElementById("saveEventBtn");
const cancelBtn = document.getElementById("cancelEditBtn");

let enviando = false;

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

function limpiarFormulario() {
  eventIdInput.value = "";
  nombreInput.value = "";
  fechaInput.value = "";
  tipoInput.value = "";
  personasInput.value = "";
  estadoInput.value = "Pendiente";
  imagenInput.value = "";
  descripcionInput.value = "";
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
            alt="${evento.nombre || "Evento"}"
            style="width:100%; height:220px; object-fit:cover; border-radius:16px; margin-bottom:1rem;"
          >
        ` : ""}

        <h3>${evento.nombre || "Sin nombre"}</h3>
        <p><strong>Fecha:</strong> ${evento.fecha || "Sin fecha"}</p>
        <p><strong>Tipo:</strong> ${evento.tipo || "Sin tipo"}</p>
        <p><strong>Personas:</strong> ${evento.personas || 0}</p>
        <p><strong>Estado:</strong> ${evento.estado || "Pendiente"}</p>
        <p style="margin-top: 0.8rem; opacity: 0.9;">
          <strong>Detalles:</strong> ${evento.descripcion || "Sin descripción"}
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
        nombreInput.value = evento.nombre || "";
        fechaInput.value = evento.fecha || "";
        tipoInput.value = evento.tipo || "";
        personasInput.value = evento.personas || "";
        estadoInput.value = evento.estado || "Pendiente";
        descripcionInput.value = evento.descripcion || "";

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
    alert("Error cargando eventos");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (enviando) return;
  enviando = true;

  const id = eventIdInput.value;

  const formData = new FormData();
  formData.append("nombre", nombreInput.value);
  formData.append("fecha", fechaInput.value);
  formData.append("tipo", tipoInput.value);
  formData.append("personas", Number(personasInput.value || 0));
  formData.append("estado", estadoInput.value);
  formData.append("descripcion", descripcionInput.value);

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
    alert("Error guardando evento");
  }

  enviando = false;
});

cargarEventos();