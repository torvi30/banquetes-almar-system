const QUOTES_API = "http://localhost:3001/api/quotes";
const STATS_API = "http://localhost:3001/api/stats";
const EVENTS_API = "http://localhost:3001/api/events";

const token = localStorage.getItem("token");

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

const adminNombre = localStorage.getItem("adminNombre") || "Administrador";

if (!token) {
  Swal.fire({
    icon: "warning",
    title: "Sesión expirada",
    text: "Debes iniciar sesión de nuevo."
  }).then(() => {
    window.location.href = "./login.html";
  });
}

if (adminWelcome) {
  adminWelcome.textContent = `Bienvenido, ${adminNombre}`;
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    ...extra
  };
}

function formatearDinero(valor) {
  return `$${Number(valor || 0).toLocaleString("es-CO")}`;
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return String(fecha).slice(0, 10);

  return d.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function normalizarTextoEstado(estado) {
  const valor = String(estado || "").toLowerCase().trim();

  if (valor === "nuevo") return "Nuevo";
  if (valor === "contactado") return "Contactado";
  if (valor === "confirmado") return "Confirmado";
  if (valor === "cancelado") return "Cancelado";
  if (valor === "convertido") return "Convertido";
  if (valor === "pendiente") return "Pendiente";
  if (valor === "confirmada") return "Confirmada";
  if (valor === "cancelada") return "Cancelada";
  if (valor === "convertida") return "Convertida";
  if (valor === "en_proceso") return "En proceso";
  if (valor === "finalizado") return "Finalizado";

  return estado || "Sin estado";
}

function claseEstado(estado) {
  const valor = String(estado || "").toLowerCase().trim();

  if (valor === "nuevo" || valor === "contactado" || valor === "pendiente") {
    return "estado-contactado";
  }

  if (valor === "confirmado" || valor === "confirmada" || valor === "finalizado") {
    return "estado-confirmado";
  }

  if (valor === "cancelado" || valor === "cancelada") {
    return "estado-cancelado";
  }

  if (valor === "convertido" || valor === "convertida" || valor === "en_proceso") {
    return "estado-convertido";
  }

  return "estado-contactado";
}

async function leerRespuestaJSON(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Respuesta no JSON:", text);
    throw new Error("El servidor devolvió una respuesta inválida.");
  }
}

function renderEmpty(container, titulo, texto) {
  container.innerHTML = `
    <div class="dashboard-empty">
      <h4>${titulo}</h4>
      <p>${texto}</p>
    </div>
  `;
}

function crearItemDashboard({ titulo, subtitulo, fecha, estado, badgeTexto, link, linkTexto }) {
  return `
    <article class="dashboard-item">
      <div class="dashboard-item-top">
        <div>
          <h4>${titulo}</h4>
          <p>${subtitulo}</p>
        </div>

        <span class="status-badge ${claseEstado(estado)}">
          ${badgeTexto || normalizarTextoEstado(estado)}
        </span>
      </div>

      <div class="dashboard-item-bottom">
        <span class="dashboard-date">${fecha}</span>
        ${link ? `<a href="${link}" class="dashboard-inline-link">${linkTexto || "Ver más"}</a>` : ""}
      </div>
    </article>
  `;
}

async function cargarResumen() {
  try {
    const res = await fetch(STATS_API, {
      headers: authHeaders()
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "Error cargando estadísticas");
    }

    if (totalQuotes) totalQuotes.textContent = data.totalQuotes ?? 0;
    if (totalEventos) totalEventos.textContent = data.totalEventos ?? 0;
    if (confirmados) confirmados.textContent = data.confirmados ?? 0;
    if (ingresos) ingresos.textContent = formatearDinero(data.ingresos ?? 0);
    if (pendiente) pendiente.textContent = formatearDinero(data.pendiente ?? 0);
  } catch (error) {
    console.error("ERROR CARGANDO RESUMEN:", error);
  }
}

async function cargarCotizacionesYReservas() {
  try {
    const res = await fetch(QUOTES_API, {
      headers: authHeaders()
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar cotizaciones y reservas");
    }

    const lista = Array.isArray(data) ? data : [];

    const quotes = lista.filter(item => item.origen === "cotizacion").slice(0, 5);
    const reservas = lista.filter(item => item.origen === "reserva").slice(0, 5);

    if (!quotes.length) {
      renderEmpty(latestQuotes, "Sin cotizaciones", "No hay cotizaciones recientes.");
    } else {
      latestQuotes.innerHTML = quotes.map(item => {
        return crearItemDashboard({
          titulo: item.nombre || "Sin nombre",
          subtitulo: `${item.tipo_evento || "Evento"} · ${item.telefono || "Sin teléfono"}`,
          fecha: formatearFecha(item.created_at),
          estado: item.estado,
          badgeTexto: normalizarTextoEstado(item.estado),
          link: "./cotizaciones.html",
          linkTexto: "Gestionar"
        });
      }).join("");
    }

    if (!reservas.length) {
      renderEmpty(latestReservas, "Sin reservas", "No hay reservas recientes.");
    } else {
      latestReservas.innerHTML = reservas.map(item => {
        return crearItemDashboard({
          titulo: item.nombre || "Sin cliente",
          subtitulo: `${item.tipo_evento || "Reserva"} · ${item.telefono || "Sin teléfono"}`,
          fecha: formatearFecha(item.created_at),
          estado: item.estado,
          badgeTexto: normalizarTextoEstado(item.estado),
          link: "./reservas.html",
          linkTexto: "Ver reservas"
        });
      }).join("");
    }
  } catch (error) {
    console.error("ERROR CARGANDO DASHBOARD:", error);
    renderEmpty(latestQuotes, "Error", "No se pudieron cargar las cotizaciones.");
    renderEmpty(latestReservas, "Error", "No se pudieron cargar las reservas.");
  }
}

function obtenerFechaEvento(item) {
  return item.fecha_evento || item.fecha || item.created_at || null;
}

async function cargarEventosProximos() {
  try {
    const res = await fetch(EVENTS_API, {
      headers: authHeaders()
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar los eventos");
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const eventos = (Array.isArray(data) ? data : [])
      .filter(evento => {
        const fecha = obtenerFechaEvento(evento);
        if (!fecha) return true;

        const d = new Date(fecha);
        if (Number.isNaN(d.getTime())) return true;

        return d >= hoy;
      })
      .sort((a, b) => {
        const fechaA = new Date(obtenerFechaEvento(a) || 0);
        const fechaB = new Date(obtenerFechaEvento(b) || 0);
        return fechaA - fechaB;
      })
      .slice(0, 5);

    if (!eventos.length) {
      renderEmpty(upcomingEvents, "Sin próximos eventos", "No hay eventos próximos registrados.");
      return;
    }

    upcomingEvents.innerHTML = eventos.map(evento => {
      return crearItemDashboard({
        titulo: evento.cliente || "Sin cliente",
        subtitulo: `${evento.tipo_evento || "Evento"} · ${evento.lugar || "Lugar por definir"}`,
        fecha: formatearFecha(obtenerFechaEvento(evento)),
        estado: evento.estado || "Pendiente",
        badgeTexto: normalizarTextoEstado(evento.estado || "Pendiente"),
        link: "./eventos.html",
        linkTexto: "Ver eventos"
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