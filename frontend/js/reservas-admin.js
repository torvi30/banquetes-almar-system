/**
 * Gestión de Reservas y Eventos Confirmados - Banquetes Almar (Marinilla, Antioquia)
 * Migrado a Firebase Firestore / dbService.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

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

let reservasCache = [];

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

function limpiarFormulario() {
  if (reservationIdInput) reservationIdInput.value = "";
  if (clienteIdInput) clienteIdInput.value = "";
  if (clienteInput) clienteInput.value = "";
  if (telefonoInput) telefonoInput.value = "";
  if (tipoEventoInput) tipoEventoInput.value = "";
  if (fechaEventoInput) fechaEventoInput.value = "";
  if (lugarInput) lugarInput.value = "";
  if (personasInput) personasInput.value = "";
  if (estadoInput) estadoInput.value = "Pendiente";
  if (observacionesInput) observacionesInput.value = "";
  if (saveReservationBtn) saveReservationBtn.textContent = "Guardar reserva";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", limpiarFormulario);
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return String(fecha).slice(0, 10);
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function claseEstadoReserva(estado) {
  const valor = String(estado || "").toLowerCase();
  if (valor === "pendiente") return "estado-contactado";
  if (valor === "confirmada" || valor === "confirmado") return "estado-confirmado";
  if (valor === "cancelada" || valor === "cancelado") return "estado-cancelado";
  if (valor === "finalizado" || valor === "finalizada") return "estado-convertido";
  return "estado-contactado";
}

function crearCardReserva(reserva) {
  const total = Number(reserva.total || 0).toLocaleString("es-CO");
  const anticipo = Number(reserva.anticipo || 0).toLocaleString("es-CO");
  const saldo = Number(reserva.saldo || 0).toLocaleString("es-CO");

  return `
    <article class="reservation-card" data-id="${reserva.id}" style="background: rgba(22, 22, 22, 0.9); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 1.5rem; margin-bottom: 1rem;">
      <div class="reservation-card-head" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
        <div>
          <h3 style="color: #fff; font-size: 1.15rem;">${reserva.cliente || "Sin cliente"}</h3>
          <p style="color: var(--gold-light); font-size: 0.9rem;">${reserva.tipo_evento || "Evento Social"}</p>
        </div>
        <span class="status-badge ${claseEstadoReserva(reserva.estado)}" style="padding: 0.25rem 0.7rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600;">
          ${reserva.estado || "Pendiente"}
        </span>
      </div>

      <div class="reservation-card-body" style="font-size: 0.88rem; color: #ccc; display: flex; flex-direction: column; gap: 0.4rem;">
        <p>📅 <strong>Fecha:</strong> ${formatearFecha(reserva.fecha_evento)} ${reserva.hora_evento ? `· ⏰ ${reserva.hora_evento}` : ""}</p>
        <p>📍 <strong>Locación:</strong> ${reserva.locacion || reserva.lugar || "Salón Almar Marinilla"}</p>
        <p>👥 <strong>Invitados:</strong> ${reserva.personas || 0} personas</p>
        <p>📱 <strong>Teléfono:</strong> <a href="tel:${reserva.telefono}" style="color: #88c0d0;">${reserva.telefono || "No registrado"}</a></p>
        
        <div style="background: rgba(255, 255, 255, 0.04); padding: 0.8rem; border-radius: 6px; margin: 0.5rem 0;">
          <div style="display: flex; justify-content: space-between;">
            <span>Total: <strong>$${total}</strong></span>
            <span>Abono: <strong style="color: #a8d5ba;">$${anticipo}</strong></span>
            <span>Saldo: <strong style="color: #e74c3c;">$${saldo}</strong></span>
          </div>
        </div>

        ${reserva.observaciones ? `<p style="font-style: italic; color: #999;">"${reserva.observaciones}"</p>` : ""}
      </div>

      <div class="reservation-card-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
        <a href="https://wa.me/57${String(reserva.telefono || "").replace(/\D/g, "")}?text=Hola%20${encodeURIComponent(reserva.cliente || "")},%20te%20contactamos%20de%20Banquetes%20Almar%20respecto%20a%20tu%20evento%20del%20${formatearFecha(reserva.fecha_evento)}..." 
           target="_blank" class="btn btn-secondary btn-sm" style="background: #25d366; color: #000; font-weight: 700;">
          WhatsApp
        </a>

        <a href="./contrato.html?id=${reserva.id}" target="_blank" class="btn btn-secondary btn-sm" style="color: var(--gold-light); font-weight: 600; border-color: var(--gold);">
          📄 Contrato PDF
        </a>

        <button class="btn btn-secondary btn-sm edit-reserva-btn" data-id="${reserva.id}">
          Editar
        </button>

        <button class="btn btn-secondary btn-sm delete-reserva-btn" data-id="${reserva.id}" style="color: #e74c3c;">
          Eliminar
        </button>
      </div>
    </article>
  `;
}

function renderReservas(lista) {
  if (!reservationsGrid) return;

  if (!lista.length) {
    reservationsGrid.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-soft); grid-column: 1 / -1;">
        <h3>No se encontraron reservas</h3>
        <p>Crea una nueva reserva o ajusta los filtros de búsqueda.</p>
      </div>
    `;
    return;
  }

  reservationsGrid.innerHTML = lista.map(crearCardReserva).join("");

  // Acciones
  reservationsGrid.querySelectorAll(".edit-reserva-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const res = reservasCache.find(r => r.id === id);
      if (res) {
        if (reservationIdInput) reservationIdInput.value = res.id;
        if (clienteInput) clienteInput.value = res.cliente || "";
        if (telefonoInput) telefonoInput.value = res.telefono || "";
        if (tipoEventoInput) tipoEventoInput.value = res.tipo_evento || "";
        if (fechaEventoInput) fechaEventoInput.value = (res.fecha_evento || "").slice(0, 10);
        if (lugarInput) lugarInput.value = res.locacion || res.lugar || "";
        if (personasInput) personasInput.value = res.personas || "";
        if (estadoInput) estadoInput.value = res.estado || "Pendiente";
        if (observacionesInput) observacionesInput.value = res.observaciones || "";

        if (saveReservationBtn) saveReservationBtn.textContent = "Actualizar reserva";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  reservationsGrid.querySelectorAll(".delete-reserva-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const confirm = await Swal.fire({
        title: "¿Eliminar reserva?",
        text: "Se borrará la reserva del sistema.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (confirm.isConfirmed) {
        await dbService.deleteReservation(id);
        await cargarReservas();
        Swal.fire("Eliminada", "La reserva ha sido eliminada.", "success");
      }
    });
  });
}

function aplicarFiltros() {
  const texto = (filterSearch?.value || "").toLowerCase().trim();
  const fecha = filterFecha?.value || "";
  const estado = (filterEstado?.value || "").toLowerCase().trim();

  const filtradas = reservasCache.filter(item => {
    const cumpleTexto = !texto || 
      `${item.cliente} ${item.telefono} ${item.tipo_evento} ${item.locacion || item.lugar}`.toLowerCase().includes(texto);
    const cumpleFecha = !fecha || String(item.fecha_evento || "").startsWith(fecha);
    const cumpleEstado = !estado || String(item.estado || "").toLowerCase() === estado;

    return cumpleTexto && cumpleFecha && cumpleEstado;
  });

  renderReservas(filtradas);
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = reservationIdInput?.value;
    const datos = {
      cliente: clienteInput?.value.trim(),
      telefono: telefonoInput?.value.trim(),
      tipo_evento: tipoEventoInput?.value.trim(),
      fecha_evento: fechaEventoInput?.value,
      locacion: lugarInput?.value.trim() || "Salón Almar Marinilla",
      personas: parseInt(personasInput?.value || "50", 10),
      estado: estadoInput?.value || "Confirmada",
      observaciones: observacionesInput?.value.trim() || ""
    };

    try {
      if (id) {
        await dbService.updateReservation(id, datos);
        Swal.fire("Actualizado", "La reserva ha sido modificada.", "success");
      } else {
        await dbService.createReservation(datos);
        Swal.fire("Creada", "La reserva ha sido registrada exitosamente.", "success");
      }

      limpiarFormulario();
      await cargarReservas();
    } catch (err) {
      console.error("Error guardando reserva:", err);
      Swal.fire("Error", "No se pudo guardar la reserva.", "error");
    }
  });
}

async function cargarReservas() {
  try {
    const list = await dbService.getReservations();
    reservasCache = list;
    aplicarFiltros();
  } catch (error) {
    console.error("Error cargando reservas:", error);
  }
}

if (filterSearch) filterSearch.addEventListener("input", aplicarFiltros);
if (filterFecha) filterFecha.addEventListener("change", aplicarFiltros);
if (filterEstado) filterEstado.addEventListener("change", aplicarFiltros);
if (btnFiltrar) btnFiltrar.addEventListener("click", aplicarFiltros);

cargarReservas();