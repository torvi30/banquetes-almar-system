/**
 * Gestión de Clientes en el Panel Administrativo - Banquetes Almar
 * Conectado en vivo con Firebase Cloud Firestore y dbService.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

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
    authService.logout();
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
        <p>No hay clientes registrados aún. Puedes agregar uno en el formulario superior.</p>
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
      <p><strong>Tipo:</strong> <span class="badge" style="background: rgba(212,175,55,0.15); color: #d4af37; padding: 2px 8px; border-radius: 6px;">${cliente.tipo_cliente || "Cliente"}</span></p>

      <div class="quote-card-actions">
        <a href="./cliente.html?id=${cliente.id}" class="btn btn-secondary">Ver ficha</a>
        <button class="btn btn-success edit-btn" data-id="${cliente.id}">Editar</button>
        <button class="btn btn-danger delete-btn" data-id="${cliente.id}">Eliminar</button>
      </div>
    `;

    clientsGrid.appendChild(card);
  });

  // Conectar botones de edición
  clientsGrid.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      try {
        const cliente = await dbService.getClientById(id);

        if (!cliente) {
          throw new Error("No se encontró el cliente seleccionado");
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
          top: form.offsetTop - 50,
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

  // Conectar botones de eliminación
  clientsGrid.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      const confirmacion = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar cliente?",
        text: "Esta acción removerá el cliente de la base de datos.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d33"
      });

      if (!confirmacion.isConfirmed) return;

      try {
        await dbService.deleteClient(id);

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
    const data = await dbService.getClients();
    renderClientes(data);
  } catch (error) {
    console.error("ERROR CARGANDO CLIENTES:", error);
    clientsGrid.innerHTML = `
      <div class="empty-state-card">
        <h3>Error</h3>
        <p>No se pudieron cargar los clientes: ${error.message}</p>
      </div>
    `;
  }
}

async function buscarClientes(query) {
  return await dbService.searchClients(query);
}

function abrirBuscador() {
  Swal.fire({
    title: "Buscar cliente",
    input: "text",
    inputPlaceholder: "Nombre, teléfono, documento o ID...",
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
            text: "No se encontraron clientes que coincidan con la búsqueda."
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
      <small>ID: ${c.id} | Tel: ${c.telefono || "Sin teléfono"} | Doc: ${c.documento || "S/D"}</small>
      <div style="margin-top:10px;">
        <a href="./cliente.html?id=${c.id}" 
           style="display:inline-block; padding:6px 12px; background:#d4af37; color:#111; border-radius:8px; text-decoration:none; font-weight:600; font-size:0.85rem;">
          Ver ficha completa
        </a>
      </div>
    </div>
  `).join("");

  Swal.fire({
    title: `Resultados (${clientes.length})`,
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

    saveClientBtn.disabled = true;
    saveClientBtn.textContent = id ? "Actualizando..." : "Guardando...";

    try {
      if (id) {
        await dbService.updateClient(id, payload);
      } else {
        await dbService.createClient(payload);
      }

      Swal.fire({
        icon: "success",
        title: id ? "¡Cliente actualizado!" : "¡Cliente guardado con éxito!",
        timer: 1500,
        showConfirmButton: false
      });

      limpiarFormulario();
      await cargarClientes();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error.message || "Ocurrió un error inesperado al guardar el cliente."
      });
    } finally {
      saveClientBtn.disabled = false;
      saveClientBtn.textContent = id ? "Actualizar cliente" : "Guardar cliente";
    }
  });
}

// Carga inicial
cargarClientes();