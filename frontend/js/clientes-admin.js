/**
 * Gestión Ejecutiva del Directorio de Clientes - Banquetes Almar
 * Conectado en vivo con Firebase Cloud Firestore y dbService.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

// Elementos del DOM
const clientsGrid = document.getElementById("clientsGrid");
const searchClienteInput = document.getElementById("searchClienteInput");
const filterTipoCliente = document.getElementById("filterTipoCliente");
const sortClientes = document.getElementById("sortClientes");

// KPIs
const metricTotalClientes = document.getElementById("metricTotalClientes");
const metricClientesVip = document.getElementById("metricClientesVip");
const metricTotalLtv = document.getElementById("metricTotalLtv");
const metricConEventos = document.getElementById("metricConEventos");

// Modal y Formulario
const clientModalOverlay = document.getElementById("clientModalOverlay");
const clientModalTitle = document.getElementById("clientModalTitle");
const btnOpenNewClientModal = document.getElementById("btnOpenNewClientModal");
const btnCloseClientModal = document.getElementById("btnCloseClientModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const clientForm = document.getElementById("clientForm");
const saveClientBtn = document.getElementById("saveClientBtn");

// Campos del formulario
const clientIdInput = document.getElementById("clientId");
const nombreInput = document.getElementById("nombre");
const telefonoInput = document.getElementById("telefono");
const emailInput = document.getElementById("email");
const documentoInput = document.getElementById("documento");
const direccionInput = document.getElementById("direccion");
const tipoClienteInput = document.getElementById("tipo_cliente");

// Estado en memoria
let allClients = [];
let allReservations = [];

// Formateador de moneda en pesos colombianos
function formatMoney(amount) {
  return "$" + Number(amount || 0).toLocaleString("es-CO");
}

// Obtener iniciales para el avatar
function getInitials(name) {
  if (!name) return "CL";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await loadData();
});

function setupEventListeners() {
  // Búsqueda y filtros instantáneos
  if (searchClienteInput) {
    searchClienteInput.addEventListener("input", applyFilters);
  }
  if (filterTipoCliente) {
    filterTipoCliente.addEventListener("change", applyFilters);
  }
  if (sortClientes) {
    sortClientes.addEventListener("change", applyFilters);
  }

  // Apertura y cierre del modal
  if (btnOpenNewClientModal) {
    btnOpenNewClientModal.addEventListener("click", () => openModal());
  }
  if (btnCloseClientModal) {
    btnCloseClientModal.addEventListener("click", closeModal);
  }
  if (btnCancelModal) {
    btnCancelModal.addEventListener("click", closeModal);
  }
  if (clientModalOverlay) {
    clientModalOverlay.addEventListener("click", (e) => {
      if (e.target === clientModalOverlay) closeModal();
    });
  }

  // Envío del formulario
  if (clientForm) {
    clientForm.addEventListener("submit", handleFormSubmit);
  }
}

// Cargar clientes y reservas
async function loadData() {
  try {
    const [clientsData, reservationsData] = await Promise.all([
      dbService.getClients().catch(() => []),
      dbService.getReservations().catch(() => [])
    ]);

    allClients = clientsData || [];
    allReservations = reservationsData || [];

    updateMetrics();
    applyFilters();
  } catch (err) {
    console.error("Error al cargar clientes:", err);
    clientsGrid.innerHTML = `
      <div class="empty-state-card" style="grid-column: 1 / -1;">
        <h3>Error de conexión</h3>
        <p>No se pudo cargar el directorio de clientes: ${err.message}</p>
      </div>
    `;
  }
}

// Actualizar métricas KPI
function updateMetrics() {
  const total = allClients.length;
  let vipCount = 0;
  let totalLtvSum = 0;
  const clientsWithEventsSet = new Set();

  allClients.forEach(c => {
    const tipo = (c.tipo_cliente || "").toLowerCase();
    if (tipo.includes("vip") || tipo.includes("empresa")) {
      vipCount++;
    }
  });

  allReservations.forEach(r => {
    totalLtvSum += Number(r.total || 0);
    if (r.cliente_id) {
      clientsWithEventsSet.add(String(r.cliente_id));
    } else if (r.cliente) {
      // Búsqueda por nombre de cliente si no tiene id
      const matched = allClients.find(c => c.nombre && c.nombre.toLowerCase() === r.cliente.toLowerCase());
      if (matched) clientsWithEventsSet.add(String(matched.id));
    }
  });

  if (metricTotalClientes) metricTotalClientes.textContent = total;
  if (metricClientesVip) metricClientesVip.textContent = vipCount;
  if (metricTotalLtv) metricTotalLtv.textContent = formatMoney(totalLtvSum);
  if (metricConEventos) metricConEventos.textContent = clientsWithEventsSet.size;
}

// Filtrar y ordenar clientes
function applyFilters() {
  const query = (searchClienteInput?.value || "").toLowerCase().trim();
  const filterType = (filterTipoCliente?.value || "").toLowerCase().trim();
  const sortBy = sortClientes?.value || "recientes";

  let filtered = allClients.filter(c => {
    const fullText = `${c.nombre || ""} ${c.telefono || ""} ${c.documento || ""} ${c.email || ""} ${c.direccion || ""}`.toLowerCase();
    const matchQuery = !query || fullText.includes(query);

    const clientType = (c.tipo_cliente || "cliente").toLowerCase();
    const matchType = !filterType || clientType.includes(filterType);

    return matchQuery && matchType;
  });

  // Ordenamiento
  filtered.sort((a, b) => {
    if (sortBy === "az") {
      return (a.nombre || "").localeCompare(b.nombre || "");
    }
    if (sortBy === "za") {
      return (b.nombre || "").localeCompare(a.nombre || "");
    }
    // "recientes" por defecto
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  renderClientsGrid(filtered);
}

// Renderizar la cuadrícula de clientes
function renderClientsGrid(clients) {
  clientsGrid.innerHTML = "";

  if (!Array.isArray(clients) || clients.length === 0) {
    clientsGrid.innerHTML = `
      <div class="empty-state-card" style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center;">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.8rem;">👥</span>
        <h3>Sin clientes encontrados</h3>
        <p>No se encontraron clientes que coincidan con los criterios de búsqueda.</p>
      </div>
    `;
    return;
  }

  clients.forEach(client => {
    const initials = getInitials(client.nombre);
    const tipo = client.tipo_cliente || "Cliente";
    let badgeClass = "badge-estandar";
    let typeIcon = "👤";

    if (tipo.toLowerCase().includes("vip")) {
      badgeClass = "badge-vip";
      typeIcon = "👑";
    } else if (tipo.toLowerCase().includes("empresa")) {
      badgeClass = "badge-empresa";
      typeIcon = "🏢";
    }

    const cleanPhone = String(client.telefono || "").replace(/\D/g, "");
    const waUrl = cleanPhone
      ? `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(`¡Hola ${client.nombre}! ✨ Te saludamos desde Banquetes Almar en Marinilla. ¿En qué podemos asesorarte hoy?`)}`
      : "";

    // Contar eventos asociados
    const eventCount = allReservations.filter(r => {
      if (r.cliente_id && String(r.cliente_id) === String(client.id)) return true;
      if (r.cliente && client.nombre && r.cliente.toLowerCase() === client.nombre.toLowerCase()) return true;
      return false;
    }).length;

    const card = document.createElement("article");
    card.className = "client-card-luxury";

    card.innerHTML = `
      <div>
        <div class="client-header-row">
          <div class="client-avatar">${initials}</div>
          <div class="client-meta-info">
            <h3 class="client-name-title" title="${client.nombre || "Sin nombre"}">${client.nombre || "Sin nombre"}</h3>
            <span class="client-type-badge ${badgeClass}">${typeIcon} ${tipo}</span>
          </div>
        </div>

        <div class="client-details-list">
          <div class="client-detail-item">
            <span>📱</span>
            ${cleanPhone ? `<a href="tel:${cleanPhone}"><strong>${client.telefono}</strong></a>` : `<span style="color: #64748b;">Sin teléfono</span>`}
          </div>

          ${client.email ? `
            <div class="client-detail-item">
              <span>✉️</span>
              <a href="mailto:${client.email}" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${client.email}</a>
            </div>
          ` : ""}

          ${client.documento ? `
            <div class="client-detail-item">
              <span>🪪</span>
              <span>Doc: <strong>${client.documento}</strong></span>
            </div>
          ` : ""}

          ${client.direccion ? `
            <div class="client-detail-item">
              <span>📍</span>
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${client.direccion}</span>
            </div>
          ` : ""}

          <div class="client-detail-item" style="margin-top: 4px;">
            <span>🎉</span>
            <span><strong>${eventCount}</strong> evento${eventCount === 1 ? "" : "s"} registrado${eventCount === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      <div class="client-action-footer">
        <a href="./cliente.html?id=${client.id}" class="btn btn-secondary btn-sm" style="color: var(--gold-light); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
          Ver Ficha ➔
        </a>

        <div style="display: flex; gap: 6px;">
          ${waUrl ? `
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="color: #10b981; border-color: rgba(16,185,129,0.3);" title="Escribir por WhatsApp">
              💬
            </a>
          ` : ""}

          <button class="btn btn-secondary btn-sm edit-client-btn" data-id="${client.id}" title="Editar información del cliente">
            ✏️
          </button>

          <button class="btn btn-secondary btn-sm delete-client-btn" data-id="${client.id}" style="color: #ff6b6b; border-color: rgba(255,107,107,0.3);" title="Eliminar cliente">
            🗑️
          </button>
        </div>
      </div>
    `;

    clientsGrid.appendChild(card);
  });

  // Conectar botones de edición
  clientsGrid.querySelectorAll(".edit-client-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const client = allClients.find(c => String(c.id) === String(btn.dataset.id));
      if (client) openModal(client);
    });
  });

  // Conectar botones de eliminación
  clientsGrid.querySelectorAll(".delete-client-btn").forEach(btn => {
    btn.addEventListener("click", () => handleDeleteClient(btn.dataset.id));
  });
}

// Abrir modal de creación / edición
function openModal(client = null) {
  if (client) {
    clientModalTitle.textContent = "Editar Ficha de Cliente";
    clientIdInput.value = client.id;
    nombreInput.value = client.nombre || "";
    telefonoInput.value = client.telefono || "";
    emailInput.value = client.email || "";
    documentoInput.value = client.documento || "";
    direccionInput.value = client.direccion || "";
    tipoClienteInput.value = client.tipo_cliente || "Cliente";
    saveClientBtn.textContent = "Guardar Cambios";
  } else {
    clientModalTitle.textContent = "Registrar Nuevo Cliente";
    clientForm.reset();
    clientIdInput.value = "";
    tipoClienteInput.value = "Cliente";
    saveClientBtn.textContent = "Guardar Cliente";
  }

  clientModalOverlay.classList.add("is-open");
  nombreInput.focus();
}

// Cerrar modal
function closeModal() {
  clientModalOverlay.classList.remove("is-open");
  clientForm.reset();
  clientIdInput.value = "";
}

// Manejar guardado del formulario
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = clientIdInput.value;
  const payload = {
    nombre: nombreInput.value.trim(),
    telefono: telefonoInput.value.trim(),
    email: emailInput.value.trim(),
    documento: documentoInput.value.trim(),
    direccion: direccionInput.value.trim(),
    tipo_cliente: tipoClienteInput.value || "Cliente"
  };

  if (!payload.nombre || !payload.telefono) {
    Swal.fire({
      icon: "warning",
      title: "Campos obligatorios",
      text: "El nombre y el teléfono son obligatorios para el registro del cliente."
    });
    return;
  }

  saveClientBtn.disabled = true;
  saveClientBtn.textContent = "Guardando...";

  try {
    if (id) {
      await dbService.updateClient(id, payload);
    } else {
      await dbService.createClient(payload);
    }

    Swal.fire({
      icon: "success",
      title: id ? "¡Cliente actualizado!" : "¡Cliente registrado con éxito!",
      timer: 1500,
      showConfirmButton: false
    });

    closeModal();
    await loadData();
  } catch (err) {
    console.error("Error al guardar cliente:", err);
    Swal.fire({
      icon: "error",
      title: "Error al guardar",
      text: err.message || "Ocurrió un error inesperado."
    });
  } finally {
    saveClientBtn.disabled = false;
    saveClientBtn.textContent = id ? "Guardar Cambios" : "Guardar Cliente";
  }
}

// Eliminar cliente
async function handleDeleteClient(id) {
  const client = allClients.find(c => String(c.id) === String(id));
  const clientName = client ? client.nombre : "este cliente";

  const confirm = await Swal.fire({
    icon: "warning",
    title: "¿Eliminar cliente?",
    text: `¿Estás seguro de que deseas eliminar a "${clientName}" del directorio?`,
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc2626"
  });

  if (!confirm.isConfirmed) return;

  try {
    await dbService.deleteClient(id);
    Swal.fire({
      icon: "success",
      title: "Cliente eliminado",
      timer: 1200,
      showConfirmButton: false
    });
    await loadData();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message
    });
  }
}