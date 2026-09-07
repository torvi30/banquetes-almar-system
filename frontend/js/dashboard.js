/**
 * Dashboard Administrativo de Banquetes Almar (Marinilla, Antioquia)
 * Migrado a Firebase Firestore / Servicio Unificado dbService.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

// Verificar sesión
authService.requireAuth("./login.html");

const totalQuotes = document.getElementById("totalQuotes");
const totalEventos = document.getElementById("totalEventos");
const confirmados = document.getElementById("confirmados");
const ingresos = document.getElementById("ingresos");
const pendiente = document.getElementById("pendiente");
const adminWelcome = document.getElementById("adminWelcome");
const logoutBtn = document.getElementById("logoutBtn");

const latestQuotes = document.getElementById("latestQuotes");
const latestReservas = document.getElementById("latestReservas");
const upcomingEvents = document.getElementById("upcomingEvents");

const currentUser = authService.getCurrentUser();
if (adminWelcome && currentUser) {
  adminWelcome.textContent = `Bienvenido, ${currentUser.nombre}`;
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

function formatearDinero(valor) {
  return `$${Number(valor || 0).toLocaleString("es-CO")}`;
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

function normalizarTextoEstado(estado) {
  const valor = String(estado || "").toLowerCase().trim();
  if (valor === "nuevo") return "Nuevo";
  if (valor === "contactado") return "Contactado";
  if (valor === "confirmado" || valor === "confirmada") return "Confirmado";
  if (valor === "cancelado" || valor === "cancelada") return "Cancelado";
  if (valor === "convertido" || valor === "convertida") return "Convertido";
  if (valor === "pendiente") return "Pendiente";
  if (valor === "en_proceso") return "En proceso";
  if (valor === "finalizado") return "Finalizado";
  return estado || "Sin estado";
}

function claseEstado(estado) {
  const valor = String(estado || "").toLowerCase().trim();
  if (valor === "nuevo" || valor === "contactado" || valor === "pendiente") return "estado-contactado";
  if (valor === "confirmado" || valor === "confirmada" || valor === "finalizado") return "estado-confirmado";
  if (valor === "cancelado" || valor === "cancelada") return "estado-cancelado";
  if (valor === "convertido" || valor === "convertida" || valor === "en_proceso") return "estado-convertido";
  return "estado-contactado";
}

function renderEmpty(container, titulo, texto) {
  if (!container) return;
  container.innerHTML = `
    <div class="dashboard-empty" style="padding: 1.5rem; text-align: center; color: var(--text-soft);">
      <h4 style="color: #fff; margin-bottom: 0.3rem;">${titulo}</h4>
      <p style="font-size: 0.85rem;">${texto}</p>
    </div>
  `;
}

function crearItemDashboard({ titulo, subtitulo, fecha, estado, badgeTexto, link, linkTexto }) {
  return `
    <article class="dashboard-item" style="padding: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
      <div class="dashboard-item-top" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
        <div>
          <h4 style="color: #fff; font-size: 0.95rem;">${titulo}</h4>
          <p style="color: var(--text-soft); font-size: 0.82rem;">${subtitulo}</p>
        </div>

        <span class="status-badge ${claseEstado(estado)}" style="font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 999px; font-weight: 600;">
          ${badgeTexto || normalizarTextoEstado(estado)}
        </span>
      </div>

      <div class="dashboard-item-bottom" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #888;">
        <span class="dashboard-date">📅 ${fecha}</span>
        ${link ? `<a href="${link}" class="dashboard-inline-link" style="color: var(--gold-light); font-weight: 600;">${linkTexto || "Ver más"}</a>` : ""}
      </div>
    </article>
  `;
}

async function cargarResumen() {
  try {
    const stats = await dbService.getStats();

    if (totalQuotes) totalQuotes.textContent = stats.totalQuotes ?? 0;
    if (totalEventos) totalEventos.textContent = stats.totalEventos ?? 0;
    if (confirmados) confirmados.textContent = stats.confirmados ?? 0;
    if (ingresos) ingresos.textContent = formatearDinero(stats.ingresos ?? 0);
    if (pendiente) pendiente.textContent = formatearDinero(stats.pendiente ?? 0);
  } catch (error) {
    console.error("ERROR CARGANDO RESUMEN:", error);
  }
}

async function cargarCotizacionesYReservas() {
  try {
    const quotes = await dbService.getQuotes();
    const reservas = await dbService.getReservations();

    const topQuotes = quotes.slice(0, 5);
    const topReservas = reservas.slice(0, 5);

    if (!topQuotes.length) {
      renderEmpty(latestQuotes, "Sin cotizaciones", "No hay cotizaciones recientes.");
    } else {
      latestQuotes.innerHTML = topQuotes.map(item => {
        return crearItemDashboard({
          titulo: item.nombre || "Sin nombre",
          subtitulo: `${item.evento || "Evento"} · ${item.personas || 0} pers · ${item.telefono || ""}`,
          fecha: formatearFecha(item.createdAt),
          estado: item.estado,
          badgeTexto: normalizarTextoEstado(item.estado),
          link: "./cotizaciones.html",
          linkTexto: "Gestionar"
        });
      }).join("");
    }

    if (!topReservas.length) {
      renderEmpty(latestReservas, "Sin reservas", "No hay reservas registradas.");
    } else {
      latestReservas.innerHTML = topReservas.map(item => {
        return crearItemDashboard({
          titulo: item.cliente || "Sin cliente",
          subtitulo: `${item.tipo_evento || "Evento"} · ${item.locacion || "Marinilla"}`,
          fecha: formatearFecha(item.fecha_evento),
          estado: item.estado,
          badgeTexto: normalizarTextoEstado(item.estado),
          link: "./reservas.html",
          linkTexto: "Ver reserva"
        });
      }).join("");
    }
  } catch (error) {
    console.error("ERROR CARGANDO DASHBOARD:", error);
    renderEmpty(latestQuotes, "Error", "No se pudieron cargar las cotizaciones.");
    renderEmpty(latestReservas, "Error", "No se pudieron cargar las reservas.");
  }
}

async function cargarEventosProximos() {
  try {
    const reservas = await dbService.getReservations();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const eventos = reservas
      .filter(r => r.fecha_evento)
      .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento))
      .slice(0, 5);

    if (!eventos.length) {
      renderEmpty(upcomingEvents, "Sin próximos eventos", "No hay eventos próximos en agenda.");
      return;
    }

    upcomingEvents.innerHTML = eventos.map(evento => {
      return crearItemDashboard({
        titulo: evento.cliente || "Sin cliente",
        subtitulo: `${evento.tipo_evento || "Evento"} · ${evento.locacion || "Salón Almar Marinilla"}`,
        fecha: formatearFecha(evento.fecha_evento),
        estado: evento.estado || "Confirmada",
        badgeTexto: normalizarTextoEstado(evento.estado || "Confirmada"),
        link: "./calendario.html",
        linkTexto: "Ver agenda"
      });
    }).join("");
  } catch (error) {
    console.error("ERROR CARGANDO EVENTOS:", error);
    renderEmpty(upcomingEvents, "Error", "No se pudieron cargar los eventos.");
  }
}

(async function init() {
  await cargarResumen();
  await cargarCotizacionesYReservas();
  await cargarEventosProximos();
})();