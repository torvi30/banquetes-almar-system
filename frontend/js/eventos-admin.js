const API_URL = "http://localhost:3001/api/events";
const CLIENTS_API = "http://localhost:3001/api/clients";
const token = localStorage.getItem("token");

const form = document.getElementById("eventForm");
const grid =
  document.getElementById("eventsGrid") ||
  document.getElementById("eventosGrid");

const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEventBtn = document.getElementById("saveEventBtn");

const eventIdInput = document.getElementById("eventId");
const clienteIdInput = document.getElementById("cliente_id");
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

let clientesCache = [];
let eventosCache = [];

window.irPagos = function (id) {
  const eventoId = String(id || "").trim();

  if (!eventoId) {
    alert("No se pudo obtener el ID del evento.");
    return;
  }

  localStorage.setItem("eventoIdPago", eventoId);
  window.location.href = `./pagos.html?evento_id=${eventoId}`;
};

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

function limpiarFormulario() {
  if (eventIdInput) eventIdInput.value = "";
  if (clienteIdInput) clienteIdInput.value = "";
  if (clienteInput) clienteInput.value = "";
  if (telefonoInput) telefonoInput.value = "";
  if (tipoEventoInput) tipoEventoInput.value = "";
  if (fechaEventoInput) fechaEventoInput.value = "";
  if (lugarInput) lugarInput.value = "";
  if (personasInput) personasInput.value = "";
  if (valorTotalInput) valorTotalInput.value = "";
  if (abonoInput) abonoInput.value = "";
  if (imagenInput) imagenInput.value = "";
  if (observacionesInput) observacionesInput.value = "";
  if (saveEventBtn) saveEventBtn.textContent = "Guardar evento";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", limpiarFormulario);
}

async function cargarClientes() {
  try {
    const res = await fetch(CLIENTS_API);
    const data = await res.json();
    clientesCache = Array.isArray(data) ? data : [];

    if (clienteIdInput) {
      clienteIdInput.innerHTML = `<option value="">Selecciona un cliente</option>`;

      clientesCache.forEach((cliente) => {
        clienteIdInput.innerHTML += `
          <option value="${cliente.id}">
            ${cliente.nombre} - ${cliente.telefono || ""}
          </option>
        `;
      });
    }
  } catch (error) {
    console.error("ERROR CARGANDO CLIENTES:", error);
  }
}

if (clienteIdInput) {
  clienteIdInput.addEventListener("change", () => {
    const id = clienteIdInput.value;
    const cliente = clientesCache.find((c) => String(c.id) === String(id));

    if (!cliente) return;

    if (clienteInput) clienteInput.value = cliente.nombre || "";
    if (telefonoInput) telefonoInput.value = cliente.telefono || "";
  });
}

async function cargarEventos() {
  if (!grid) return;

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    eventosCache = Array.isArray(data) ? data : [];
    grid.innerHTML = "";

    if (!eventosCache.length) {
      grid.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay eventos</h3>
          <p>Crea el primer evento.</p>
        </div>
      `;
      return;
    }

    eventosCache.forEach((evento) => {
      const saldo = Number(evento.saldo || 0);
      const estado = evento.estado || "Pendiente";

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
        <p><strong>Fecha:</strong> ${String(evento.fecha_evento || "").slice(0, 10)}</p>
        <p><strong>Lugar:</strong> ${evento.lugar || "Sin lugar"}</p>
        <p><strong>Personas:</strong> ${evento.personas || 0}</p>
        <p><strong>Total:</strong> $${Number(evento.valor_total || 0).toLocaleString("es-CO")}</p>
        <p><strong>Abono:</strong> $${Number(evento.abono || 0).toLocaleString("es-CO")}</p>
        <p><strong>Saldo:</strong> $${saldo.toLocaleString("es-CO")}</p>
        <p><strong>Estado:</strong> ${estado}</p>
        <p><strong>Observaciones:</strong> ${evento.observaciones || "Sin observaciones"}</p>

        <div class="quote-card-actions">
          <button type="button" class="btn btn-secondary" onclick="irPagos(${evento.id})">Pagos</button>
          <button type="button" class="btn btn-success edit-btn" data-id="${evento.id}">Editar</button>
          <button type="button" class="btn btn-danger delete-btn" data-id="${evento.id}">Eliminar</button>
        </div>
      `;

      grid.appendChild(card);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const evento = eventosCache.find((e) => String(e.id) === String(btn.dataset.id));
        if (!evento) return;

        if (eventIdInput) eventIdInput.value = evento.id;
        if (clienteIdInput) clienteIdInput.value = evento.cliente_id || "";
        if (clienteInput) clienteInput.value = evento.cliente || "";
        if (telefonoInput) telefonoInput.value = evento.telefono || "";
        if (tipoEventoInput) tipoEventoInput.value = evento.tipo_evento || "";
        if (fechaEventoInput) fechaEventoInput.value = String(evento.fecha_evento || "").slice(0, 10);
        if (lugarInput) lugarInput.value = evento.lugar || "";
        if (personasInput) personasInput.value = evento.personas || "";
        if (valorTotalInput) valorTotalInput.value = evento.valor_total || "";
        if (abonoInput) abonoInput.value = evento.abono || "";
        if (observacionesInput) observacionesInput.value = evento.observaciones || "";

        if (saveEventBtn) saveEventBtn.textContent = "Actualizar evento";

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

        try {
          const res = await fetch(`${API_URL}/${btn.dataset.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.message || "No se pudo eliminar");
          }

          await cargarEventos();
        } catch (error) {
          console.error("ERROR ELIMINANDO EVENTO:", error);
          alert(error.message);
        }
      });
    });
  } catch (error) {
    console.error("ERROR CARGANDO EVENTOS:", error);
    grid.innerHTML = `<p>Error cargando eventos.</p>`;
  }
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = eventIdInput ? eventIdInput.value : "";
    const total = Number(valorTotalInput?.value || 0);
    const abono = Number(abonoInput?.value || 0);

    if (abono > total) {
      alert("El abono no puede ser mayor que el valor total.");
      return;
    }

    const formData = new FormData();
    formData.append("cliente_id", clienteIdInput ? (clienteIdInput.value || "") : "");
    formData.append("cliente", clienteInput?.value || "");
    formData.append("telefono", telefonoInput?.value || "");
    formData.append("tipo_evento", tipoEventoInput?.value || "");
    formData.append("fecha_evento", fechaEventoInput?.value || "");
    formData.append("lugar", lugarInput?.value || "");
    formData.append("personas", personasInput?.value || 0);
    formData.append("valor_total", total);
    formData.append("abono", abono);
    formData.append("observaciones", observacionesInput?.value || "");

    if (imagenInput && imagenInput.files[0]) {
      formData.append("imagen", imagenInput.files[0]);
    }

    try {
      let res;

      if (id) {
        res = await fetch(`${API_URL}/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
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
  });
}

(async function init() {
  await cargarClientes();
  await cargarEventos();
})();