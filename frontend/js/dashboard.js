/**
 * Dashboard Administrativo de Banquetes Almar (Marinilla, Antioquia)
 * Torre de Control Estratégica sin Duplicados - Conectado a dbService de Firebase.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

// Proteger ruta
authService.requireAuth("./login.html");

const totalQuotes = document.getElementById("totalQuotes");
const totalEventos = document.getElementById("totalEventos");
const ingresos = document.getElementById("ingresos");
const pendiente = document.getElementById("pendiente");
const adminWelcome = document.getElementById("adminWelcome");
const logoutBtn = document.getElementById("logoutBtn");

const pendingQuotesList = document.getElementById("pendingQuotesList");
const upcomingEventsList = document.getElementById("upcomingEventsList");
const paymentAlertsList = document.getElementById("paymentAlertsList");

const currentUser = authService.getCurrentUser();
if (adminWelcome && currentUser) {
  adminWelcome.textContent = `Bienvenido(a), ${currentUser.nombre || "Administrador"}. Torre de Control activa.`;
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

function renderEmpty(container, titulo, texto) {
  if (!container) return;
  container.innerHTML = `
    <div style="padding: 2.5rem 1.5rem; text-align: center; color: var(--apple-text-secondary);">
      <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">✨</span>
      <h4 style="color: #fff; font-size: 1rem; margin-bottom: 0.2rem;">${titulo}</h4>
      <p style="font-size: 0.82rem;">${texto}</p>
    </div>
  `;
}

// Cargar métricas ejecutivas en la barra de KPIs
async function cargarMetricas() {
  try {
    const quotes = await dbService.getQuotes();
    const reservas = await dbService.getReservations();
    const payments = await dbService.getPayments();

    const totalIngresos = payments.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
    const totalPendiente = reservas.reduce((acc, r) => acc + (Number(r.saldo) || 0), 0);
    const totalQuotesCount = quotes.length;
    const totalEventosCount = reservas.length;

    if (ingresos) ingresos.textContent = formatearDinero(totalIngresos);
    if (pendiente) pendiente.textContent = formatearDinero(totalPendiente);
    if (totalEventos) totalEventos.textContent = totalEventosCount;
    if (totalQuotes) totalQuotes.textContent = totalQuotesCount;
  } catch (error) {
    console.error("ERROR CARGANDO MÉTRICAS:", error);
  }
}

// Columna 1: Solicitudes pendientes de respuesta
async function cargarSolicitudesPendientes() {
  if (!pendingQuotesList) return;

  try {
    const quotes = await dbService.getQuotes();
    const pendientes = quotes.filter(q => {
      const est = String(q.estado || "").toLowerCase();
      return est === "pendiente" || est === "nuevo" || est === "contactado";
    }).slice(0, 5);

    if (!pendientes.length) {
      renderEmpty(pendingQuotesList, "Al día", "No tienes solicitudes pendientes de respuesta.");
      return;
    }

    pendingQuotesList.innerHTML = pendientes.map(q => {
      const telefonoLimpio = String(q.telefono || "").replace(/\D/g, "");
      const wpUrl = telefonoLimpio
        ? `https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(`Hola ${q.nombre}, te saludamos de Banquetes Almar respecto a tu cotización para ${q.evento || "tu evento"}.`)}`
        : null;

      return `
        <article class="control-card-item">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
            <div>
              <h4 style="color: #fff; font-size: 0.96rem; margin: 0 0 0.2rem 0;">${q.nombre || "Cliente"}</h4>
              <p style="color: var(--apple-text-secondary); font-size: 0.82rem; margin: 0;">
                ${q.evento || "Celebración"} · ${q.personas || 0} personas
              </p>
            </div>
            <span style="font-size: 0.75rem; background: rgba(212,175,55,0.18); color: var(--gold-light); border: 1px solid rgba(212,175,55,0.35); padding: 3px 10px; border-radius: 999px; font-weight: 600;">
              ${q.estado || "Pendiente"}
            </span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #888; margin-top: 0.6rem;">
            <span>📅 ${formatearFecha(q.createdAt || q.fechaEvento)}</span>
            <div style="display: flex; gap: 0.6rem;">
              ${wpUrl ? `<a href="${wpUrl}" target="_blank" rel="noopener noreferrer" style="color: #25d366; font-weight: 600; text-decoration: none;">💬 WhatsApp</a>` : ""}
              <a href="./cotizaciones.html" style="color: var(--gold-light); font-weight: 600; text-decoration: none;">Ver ➔</a>
            </div>
          </div>
        </article>
      `;
    }).join("");
  } catch (err) {
    console.error("Error en solicitudes pendientes:", err);
    renderEmpty(pendingQuotesList, "Error", "No se pudieron cargar las cotizaciones.");
  }
}

// Columna 2: Próximos eventos a montar (agenda operativa)
async function cargarProximosEventos() {
  if (!upcomingEventsList) return;

  try {
    const reservas = await dbService.getReservations();

    // Ordenar cronológicamente
    const ordenados = reservas
      .filter(r => r.fecha_evento && String(r.estado || "").toLowerCase() !== "cancelada")
      .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento))
      .slice(0, 5);

    if (!ordenados.length) {
      renderEmpty(upcomingEventsList, "Sin eventos próximos", "No hay eventos programados en agenda.");
      return;
    }

    upcomingEventsList.innerHTML = ordenados.map(ev => {
      return `
        <article class="control-card-item">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
            <div>
              <h4 style="color: #fff; font-size: 0.96rem; margin: 0 0 0.2rem 0;">${ev.cliente || "Evento Almar"}</h4>
              <p style="color: var(--apple-text-secondary); font-size: 0.82rem; margin: 0;">
                ${ev.tipo_evento || "Evento"} · 📍 ${ev.locacion || "Salón Marinilla"}
              </p>
            </div>
            <span style="font-size: 0.75rem; background: rgba(80, 200, 120, 0.15); color: #9df0b5; border: 1px solid rgba(80, 200, 120, 0.35); padding: 3px 10px; border-radius: 999px; font-weight: 600;">
              ${ev.estado || "Confirmada"}
            </span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #888; margin-top: 0.6rem;">
            <span style="color: #ffffff; font-weight: 600;">🗓️ ${formatearFecha(ev.fecha_evento)}</span>
            <div style="display: flex; gap: 0.6rem;">
              <a href="./contrato.html?id=${ev.id}" style="color: #a0c4ff; font-weight: 600; text-decoration: none;">📄 Contrato</a>
              <a href="./reservas.html" style="color: var(--gold-light); font-weight: 600; text-decoration: none;">Detalles ➔</a>
            </div>
          </div>
        </article>
      `;
    }).join("");
  } catch (err) {
    console.error("Error en próximos eventos:", err);
    renderEmpty(upcomingEventsList, "Error", "No se pudieron cargar los eventos.");
  }
}

// Columna 3: Alertas de cobros & saldos pendientes
async function cargarAlertasCobro() {
  if (!paymentAlertsList) return;

  try {
    const reservas = await dbService.getReservations();

    // Filtrar eventos con saldo pendiente mayor a cero
    const conSaldo = reservas
      .filter(r => {
        const saldo = Number(r.saldo || 0);
        const est = String(r.estado || "").toLowerCase();
        return saldo > 0 && est !== "cancelada";
      })
      .sort((a, b) => new Date(a.fecha_evento || 0) - new Date(b.fecha_evento || 0))
      .slice(0, 5);

    if (!conSaldo.length) {
      renderEmpty(paymentAlertsList, "¡Sin saldos pendientes!", "Todos los eventos en agenda tienen pagos al 100%.");
      return;
    }

    paymentAlertsList.innerHTML = conSaldo.map(ev => {
      const saldoNum = Number(ev.saldo || 0);
      const totalNum = Number(ev.total || ev.valor_total || (saldoNum + (Number(ev.abono) || 0)));

      return `
        <article class="control-card-item">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
            <div>
              <h4 style="color: #fff; font-size: 0.96rem; margin: 0 0 0.2rem 0;">${ev.cliente || "Cliente"}</h4>
              <p style="color: var(--apple-text-secondary); font-size: 0.82rem; margin: 0;">
                ${ev.tipo_evento || "Evento"} · Fecha: ${formatearFecha(ev.fecha_evento)}
              </p>
            </div>
            <span style="font-size: 0.78rem; color: #ffaa5a; font-weight: 700; background: rgba(255, 170, 90, 0.14); border: 1px solid rgba(255, 170, 90, 0.35); padding: 3px 9px; border-radius: 999px;">
              Debe ${formatearDinero(saldoNum)}
            </span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #888; margin-top: 0.6rem;">
            <span>Total: ${formatearDinero(totalNum)}</span>
            <a href="./pagos.html?evento_id=${ev.id}" style="background: rgba(212,175,55,0.2); border: 1px solid var(--gold); color: var(--gold-light); padding: 3px 10px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 0.78rem;">
              💵 Registrar Abono
            </a>
          </div>
        </article>
      `;
    }).join("");
  } catch (err) {
    console.error("Error en alertas de cobro:", err);
    renderEmpty(paymentAlertsList, "Error", "No se pudieron cargar las alertas de cobro.");
  }
}

// Inicialización de la Torre de Control
(async function initDashboard() {
  await cargarMetricas();
  await Promise.all([
    cargarSolicitudesPendientes(),
    cargarProximosEventos(),
    cargarAlertasCobro()
  ]);
})();