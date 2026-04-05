const API_URL = "http://localhost:3001/api/clients";
const token = localStorage.getItem("token");

const form = document.getElementById("clientForm");
const clientsGrid = document.getElementById("clientsGrid");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveClientBtn = document.getElementById("saveClientBtn");
const btnBuscarCliente = document.getElementById("btnBuscarCliente");

const clientIdInput = document.getElementById("clientId");
const nombreInput = document.getElementById("nombre");
const telefonoInput = document.getElementById("telefono");
const emailInput = document.getElementById("email");
const documentoInput = document.getElementById("documento");
const direccionInput = document.getElementById("direccion");
const tipoClienteInput = document.getElementById("tipo_cliente");

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
  clientIdInput.value = "";
  nombreInput.value = "";
  telefonoInput.value = "";
  emailInput.value = "";
  documentoInput.value = "";
  direccionInput.value = "";
  tipoClienteInput.value = "Cliente";
  saveClientBtn.textContent = "Guardar cliente";
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", limpiarFormulario);
}

function renderClientes(data) {
  clientsGrid.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    clientsGrid.innerHTML = `
      <div class="empty-state-card">
        <h3>Sin clientes</h3>
        <p>No hay clientes registrados.</p>
      </div>
    `;
    return;
  }

  data.forEach((cliente) => {
    const card = document.createElement("article");
    card.className = "quote-card";

    card.innerHTML = `
      <h3>${cliente.nombre || "Sin nombre"}</h3>
      <p><strong>ID:</strong> ${cliente.id}</p>
      <p><strong>Teléfono:</strong> ${cliente.telefono || "No definido"}</p>
      <p><strong>Correo:</strong> ${cliente.email || "No definido"}</p>
      <p><strong>Documento:</strong> ${cliente.documento || "No definido"}</p>
      <p><strong>Dirección:</strong> ${cliente.direccion || "No definida"}</p>
      <p><strong>Tipo:</strong> ${cliente.tipo_cliente || "Cliente"}</p>

      <div class="quote-card-actions">
        <a href="./cliente.html?id=${cliente.id}" class="btn btn-secondary">Ver cliente</a>
        <button class="btn btn-success edit-btn" data-id="${cliente.id}">Editar</button>
        <button class="btn btn-danger delete-btn" data-id="${cliente.id}">Eliminar</button>
      </div>
    `;

    clientsGrid.appendChild(card);
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      try {
        const res = await fetch(`${API_URL}/${id}`, {
          headers: authHeaders()
        });

        const cliente = await res.json();

        if (!res.ok) {
          throw new Error(cliente.message || "No se pudo cargar el cliente");
        }

        clientIdInput.value = cliente.id;
        nombreInput.value = cliente.nombre || "";
        telefonoInput.value = cliente.telefono || "";
        emailInput.value = cliente.email || "";
        documentoInput.value = cliente.documento || "";
        direccionInput.value = cliente.direccion || "";
        tipoClienteInput.value = cliente.tipo_cliente || "Cliente";

        saveClientBtn.textContent = "Actualizar cliente";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
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
      const id = btn.dataset.id;

      const confirmacion = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar cliente?",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d33"
      });

      if (!confirmacion.isConfirmed) return;

      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers: authHeaders()
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "No se pudo eliminar el cliente");
        }

        Swal.fire({
          icon: "success",
          title: "Cliente eliminado",
          timer: 1200,
          showConfirmButton: false
        });

        await cargarClientes();
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

async function cargarClientes() {
  try {
    const res = await fetch(API_URL, {
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar los clientes");
    }

    renderClientes(data);
  } catch (error) {
    console.error("ERROR CARGANDO CLIENTES:", error);

    clientsGrid.innerHTML = `
      <div class="empty-state-card">
        <h3>Error</h3>
        <p>No se pudieron cargar los clientes.</p>
      </div>
    `;
  }
}

async function buscarClientes(query) {
  const res = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`, {
    headers: authHeaders()
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error buscando clientes");
  }

  return data;
}

function abrirBuscador() {
  Swal.fire({
    title: "Buscar cliente",
    input: "text",
    inputPlaceholder: "ID, nombre o teléfono...",
    showCancelButton: true,
    confirmButtonText: "Buscar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d4af37",
    preConfirm: async (value) => {
      if (!value || !value.trim()) {
        Swal.showValidationMessage("Escribe algo para buscar");
        return false;
      }

      try {
        const clientes = await buscarClientes(value.trim());

        if (!clientes.length) {
          Swal.fire({
            icon: "info",
            title: "Sin resultados",
            text: "No se encontraron clientes."
          });
          return false;
        }

        mostrarResultados(clientes);
        return true;
      } catch (error) {
        Swal.showValidationMessage(error.message);
        return false;
      }
    }
  });
}

function mostrarResultados(clientes) {
  const html = clientes.map((c) => `
    <div style="padding:12px 10px; border-bottom:1px solid #333; text-align:left;">
      <strong>${c.nombre}</strong><br>
      <small>ID: ${c.id} | ${c.telefono || "Sin teléfono"}</small>
      <div style="margin-top:10px;">
        <a href="./cliente.html?id=${c.id}" 
           style="display:inline-block; padding:8px 14px; background:#d4af37; color:#111; border-radius:10px; text-decoration:none; font-weight:600;">
          Ver cliente
        </a>
      </div>
    </div>
  `).join("");

  Swal.fire({
    title: "Resultados",
    html,
    width: 650,
    showConfirmButton: false,
    showCloseButton: true
  });
}

if (btnBuscarCliente) {
  btnBuscarCliente.addEventListener("click", abrirBuscador);
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = clientIdInput.value;

    const payload = {
      nombre: nombreInput.value.trim(),
      telefono: telefonoInput.value.trim(),
      email: emailInput.value.trim(),
      documento: documentoInput.value.trim(),
      direccion: direccionInput.value.trim(),
      tipo_cliente: tipoClienteInput.value.trim() || "Cliente"
    };

    if (!payload.nombre) {
      Swal.fire({
        icon: "warning",
        title: "Campo obligatorio",
        text: "El nombre es obligatorio."
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
        throw new Error(data.message || "No se pudo guardar el cliente");
      }

      Swal.fire({
        icon: "success",
        title: id ? "Cliente actualizado" : "Cliente creado",
        timer: 1200,
        showConfirmButton: false
      });

      limpiarFormulario();
      await cargarClientes();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message
      });
    }
  });
}

cargarClientes();