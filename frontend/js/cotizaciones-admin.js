/**
 * Gestión del Tablero Kanban de Cotizaciones - Banquetes Almar
 * Conectado a dbService (Firestore / Firebase).
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const filterOrigen = document.getElementById("filterOrigen");

const colNuevos = document.getElementById("colNuevos");
const colContactados = document.getElementById("colContactados");
const colCancelados = document.getElementById("colCancelados");
const colConvertidos = document.getElementById("colConvertidos");

const countNuevos = document.getElementById("countNuevos");
const countContactados = document.getElementById("countContactados");
const countCancelados = document.getElementById("countCancelados");
const countConvertidos = document.getElementById("countConvertidos");

let registrosCache = [];

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
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

function normalizarEstado(estado) {
  const valor = String(estado || "").toLowerCase().trim();
  if (valor === "nuevo" || valor === "pendiente") return "nuevo";
  if (valor === "contactado" || valor === "confirmada" || valor === "confirmado") return "contactado";
  if (valor === "cancelado" || valor === "cancelada") return "cancelado";
  if (valor === "convertido" || valor === "convertida" || valor === "finalizado") return "convertido";
  return "nuevo";
}

function renderEmptyCol(texto) {
  return `<div class="pipeline-empty"><p>${texto}</p></div>`;
}

function crearCardPipeline(item) {
  const esCotizacion = item.origen !== "reserva";
  const totalDisplay = item.totalEstimado ? `$${Number(item.totalEstimado).toLocaleString("es-CO")}` : "Por definir";

  return `
    <article class="pipeline-card" data-id="${item.id}">
      <div class="pipeline-card-header">
        <div>
          <h4>${item.nombre || "Sin nombre"}</h4>
          <span class="pipeline-origin-tag origin-${item.origen || "cotizacion"}">
            ${item.origen === "carrito_alquiler" ? "🛒 Alquiler" : esCotizacion ? "📝 Cotizador" : "📅 Reserva"}
          </span>
        </div>
      </div>

      <div class="pipeline-card-body">
        <p><strong>Evento:</strong> ${item.evento || item.tipo_evento || "Evento Social"}</p>
        <p><strong>Invitados:</strong> ${item.personas || 1} personas</p>
        <p><strong>Total estimado:</strong> <span style="color: var(--gold-light); font-weight: 700;">${totalDisplay}</span></p>
        <p><strong>Teléfono:</strong> <a href="tel:${item.telefono}" style="color: #88c0d0;">${item.telefono}</a></p>
        ${item.locacion ? `<p><strong>Locación:</strong> ${item.locacion}</p>` : ""}
        ${item.mensaje ? `<p class="pipeline-card-message">"${item.mensaje}"</p>` : ""}
      </div>

      <div class="pipeline-card-footer">
        <span class="pipeline-card-date">📅 ${formatearFecha(item.createdAt || item.fechaEvento)}</span>
        
        <div class="pipeline-card-actions" style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.6rem;">
          <a href="https://wa.me/57${String(item.telefono).replace(/\D/g, "")}?text=Hola%20${encodeURIComponent(item.nombre || "")},%20te%20saludamos%20de%20Banquetes%20Almar%20en%20Marinilla..." 
             target="_blank" class="btn btn-secondary btn-sm" style="background: #25d366; color: #000; font-weight: 700;">
            WhatsApp
          </a>

          <select class="change-status-select" data-id="${item.id}" style="padding: 0.3rem 0.5rem; background: #222; color: #fff; border: 1px solid var(--border-glass); border-radius: 4px; font-size: 0.8rem;">
            <option value="Pendiente" ${item.estado === "Pendiente" ? "selected" : ""}>Pendiente</option>
            <option value="Contactado" ${item.estado === "Contactado" ? "selected" : ""}>Contactado</option>
            <option value="Convertido" ${item.estado === "Convertido" ? "selected" : ""}>Convertido a Reserva</option>
            <option value="Cancelado" ${item.estado === "Cancelado" ? "selected" : ""}>Cancelado</option>
          </select>

          <button class="btn btn-secondary btn-sm delete-quote-btn" data-id="${item.id}" style="color: #e74c3c;">
            Eliminar
          </button>
        </div>
      </div>
    </article>
  `;
}

function aplicarFiltros() {
  const query = (searchInput?.value || "").toLowerCase().trim();
  const origen = (filterOrigen?.value || "").toLowerCase().trim();

  const filtrados = registrosCache.filter(item => {
    const textoCompleto = `${item.nombre} ${item.telefono} ${item.evento || item.tipo_evento} ${item.mensaje}`.toLowerCase();
    const cumpleTexto = !query || textoCompleto.includes(query);
    const cumpleOrigen = !origen || (item.origen || "cotizacion").toLowerCase() === origen;
    return cumpleTexto && cumpleOrigen;
  });

  renderPipeline(filtrados);
}

function renderPipeline(lista) {
  const colN = [];
  const colC = [];
  const colX = [];
  const colV = [];

  lista.forEach(item => {
    const estado = normalizarEstado(item.estado);
    if (estado === "nuevo") colN.push(item);
    else if (estado === "contactado") colC.push(item);
    else if (estado === "cancelado") colX.push(item);
    else if (estado === "convertido") colV.push(item);
  });

  if (countNuevos) countNuevos.textContent = colN.length;
  if (countContactados) countContactados.textContent = colC.length;
  if (countCancelados) countCancelados.textContent = colX.length;
  if (countConvertidos) countConvertidos.textContent = colV.length;

  if (colNuevos) colNuevos.innerHTML = colN.length ? colN.map(crearCardPipeline).join("") : renderEmptyCol("Sin cotizaciones nuevas");
  if (colContactados) colContactados.innerHTML = colC.length ? colC.map(crearCardPipeline).join("") : renderEmptyCol("Sin contactados");
  if (colCancelados) colCancelados.innerHTML = colX.length ? colX.map(crearCardPipeline).join("") : renderEmptyCol("Sin cancelados");
  if (colConvertidos) colConvertidos.innerHTML = colV.length ? colV.map(crearCardPipeline).join("") : renderEmptyCol("Sin convertidos");

  asignarEventosAcciones();
}

function asignarEventosAcciones() {
  // Cambio de estado
  document.querySelectorAll(".change-status-select").forEach(sel => {
    sel.addEventListener("change", async (e) => {
      const id = sel.dataset.id;
      const nuevoEstado = sel.value;

      try {
        await dbService.updateQuoteStatus(id, nuevoEstado);

        // Si se marca como convertido, preguntar si desea crear la reserva automáticamente
        if (nuevoEstado === "Convertido") {
          const item = registrosCache.find(r => r.id === id);
          if (item) {
            await dbService.createReservation({
              cliente: item.nombre,
              telefono: item.telefono,
              tipo_evento: item.evento || "Evento Social",
              personas: item.personas || 50,
              total: item.totalEstimado || 0,
              anticipo: item.anticipoSugerido || 0,
              saldo: Math.max(0, (item.totalEstimado || 0) - (item.anticipoSugerido || 0)),
              fecha_evento: item.fechaEvento || new Date().toISOString().slice(0, 10),
              locacion: item.locacion || "Salón Almar Marinilla",
              observaciones: item.mensaje || ""
            });

            Swal.fire({
              icon: "success",
              title: "¡Convertido a Reserva!",
              text: `Se ha generado la reserva para ${item.nombre} en el sistema.`,
              timer: 2000
            });
          }
        }

        await cargarCotizaciones();
      } catch (err) {
        console.error("Error al actualizar estado:", err);
      }
    });
  });

  // Eliminar
  document.querySelectorAll(".delete-quote-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const result = await Swal.fire({
        title: "¿Eliminar cotización?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (result.isConfirmed) {
        await dbService.deleteQuote(id);
        await cargarCotizaciones();
        Swal.fire("Eliminado", "La cotización ha sido retirada.", "success");
      }
    });
  });
}

async function cargarCotizaciones() {
  try {
    const quotes = await dbService.getQuotes();
    registrosCache = quotes;
    aplicarFiltros();
  } catch (error) {
    console.error("Error cargando cotizaciones:", error);
  }
}

if (searchInput) searchInput.addEventListener("input", aplicarFiltros);
if (filterOrigen) filterOrigen.addEventListener("change", aplicarFiltros);

cargarCotizaciones();
