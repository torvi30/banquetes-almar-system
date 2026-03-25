const API_URL = "http://localhost:3001/api/clients";
const token = localStorage.getItem("token");

const form = document.getElementById("clientForm");
const grid = document.getElementById("clientsGrid");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveClientBtn = document.getElementById("saveClientBtn");

const clientIdInput = document.getElementById("clientId");
const nombreInput = document.getElementById("nombre");
const telefonoInput = document.getElementById("telefono");
const emailInput = document.getElementById("email");
const documentoInput = document.getElementById("documento");
const direccionInput = document.getElementById("direccion");
const tipoClienteInput = document.getElementById("tipo_cliente");
const observacionesInput = document.getElementById("observaciones");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

function limpiarFormulario() {
  clientIdInput.value = "";
  nombreInput.value = "";
  telefonoInput.value = "";
  emailInput.value = "";
  documentoInput.value = "";
  direccionInput.value = "";
  tipoClienteInput.value = "Persona";
  observacionesInput.value = "";
  saveClientBtn.textContent = "Guardar cliente";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    limpiarFormulario();
  });
}

async function cargarClientes() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    grid.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay clientes</h3>
          <p>Crea el primer cliente.</p>
        </div>
      `;
      return;
    }

    data.forEach((cliente) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      card.innerHTML = `
        <h3>${cliente.nombre}</h3>
        <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
        <p><strong>Correo:</strong> ${cliente.email || "Sin correo"}</p>
        <p><strong>Documento:</strong> ${cliente.documento || "Sin documento"}</p>
        <p><strong>Dirección:</strong> ${cliente.direccion || "Sin dirección"}</p>
        <p><strong>Tipo:</strong> ${cliente.tipo_cliente || "Persona"}</p>
        <p>${cliente.observaciones || ""}</p>

        <div class="quote-card-actions">
          <button class="btn btn-success edit-btn" data-id="${cliente.id}">Editar</button>
          <button class="btn btn-danger delete-btn" data-id="${cliente.id}">Eliminar</button>
        </div>
      `;

      grid.appendChild(card);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cliente = data.find((c) => String(c.id) === String(btn.dataset.id));
        if (!cliente) return;

        clientIdInput.value = cliente.id;
        nombreInput.value = cliente.nombre || "";
        telefonoInput.value = cliente.telefono || "";
        emailInput.value = cliente.email || "";
        documentoInput.value = cliente.documento || "";
        direccionInput.value = cliente.direccion || "";
        tipoClienteInput.value = cliente.tipo_cliente || "Persona";
        observacionesInput.value = cliente.observaciones || "";

        saveClientBtn.textContent = "Actualizar cliente";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const confirmar = confirm("¿Eliminar cliente?");
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

          await cargarClientes();
        } catch (error) {
          console.error("ERROR ELIMINANDO CLIENTE:", error);
          alert(error.message);
        }
      });
    });

  } catch (error) {
    console.error("ERROR CARGANDO CLIENTES:", error);
    grid.innerHTML = `<p>Error cargando clientes.</p>`;
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = clientIdInput.value;

  const data = {
    nombre: nombreInput.value,
    telefono: telefonoInput.value,
    email: emailInput.value,
    documento: documentoInput.value,
    direccion: direccionInput.value,
    tipo_cliente: tipoClienteInput.value,
    observaciones: observacionesInput.value
  };

  try {
    let res;

    if (id) {
      res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } else {
      res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    }

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Error guardando cliente");
    }

    alert(id ? "Cliente actualizado correctamente" : "Cliente creado correctamente");
    limpiarFormulario();
    await cargarClientes();
  } catch (error) {
    console.error("ERROR GUARDANDO CLIENTE:", error);
    alert(error.message);
  }
});

cargarClientes();