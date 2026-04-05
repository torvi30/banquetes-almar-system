const QUOTES_API = "http://localhost:3001/api/quotes";
const STATS_API = "http://localhost:3001/api/stats";

const token = localStorage.getItem("token");

const quotesContainer = document.getElementById("quotesContainer");
const totalQuotes = document.getElementById("totalQuotes");
const totalEventos = document.getElementById("totalEventos");
const confirmados = document.getElementById("confirmados");
const ingresos = document.getElementById("ingresos");
const pendiente = document.getElementById("pendiente");
const adminWelcome = document.getElementById("adminWelcome");
const logoutBtn = document.getElementById("logoutBtn");

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

function normalizarEstado(estado) {
  const valor = String(estado || "").toLowerCase().trim();

  if (valor === "nuevo") return "Contactado";
  if (valor === "contactado") return "Contactado";
  if (valor === "confirmado") return "Confirmado";
  if (valor === "cancelado") return "Cancelado";
  if (valor === "convertido") return "Convertido";

  return "Contactado";
}

function textoEstado(estado) {
  const value = normalizarEstado(estado);

  if (value === "Contactado") return "Contactado";
  if (value === "Confirmado") return "Confirmado";
  if (value === "Cancelado") return "Cancelado";
  if (value === "Convertido") return "Convertido";

  return "Contactado";
}

function claseEstado(estado) {
  const value = normalizarEstado(estado);

  if (value === "Contactado") return "estado-contactado";
  if (value === "Confirmado") return "estado-confirmado";
  if (value === "Cancelado") return "estado-cancelado";
  if (value === "Convertido") return "estado-convertido";

  return "estado-contactado";
}

function formatearDinero(valor) {
  return `$${Number(valor || 0).toLocaleString("es-CO")}`;
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;

  return d.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

async function leerRespuestaJSON(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Respuesta no JSON:", text);
    throw new Error("El servidor devolvió HTML o una respuesta inválida.");
  }
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

async function actualizarEstado(id, estado) {
  try {
    const res = await fetch(`${QUOTES_API}/${id}/status`, {
      method: "PUT",
      headers: authHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        estado: normalizarEstado(estado)
      })
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudo actualizar el estado");
    }

    await Swal.fire({
      icon: "success",
      title: "Estado actualizado",
      text: "La cotización fue actualizada correctamente.",
      timer: 1200,
      showConfirmButton: false
    });

    await cargarCotizaciones();
    await cargarResumen();
  } catch (error) {
    console.error("ERROR ACTUALIZANDO ESTADO:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo actualizar el estado"
    });
  }
}

async function eliminarCotizacion(id) {
  const resultado = await Swal.fire({
    icon: "warning",
    title: "¿Eliminar cotización?",
    text: "Esta acción no se puede deshacer.",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d"
  });

  if (!resultado.isConfirmed) return;

  try {
    const res = await fetch(`${QUOTES_API}/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudo eliminar");
    }

    await Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "La cotización fue eliminada correctamente.",
      timer: 1200,
      showConfirmButton: false
    });

    await cargarCotizaciones();
    await cargarResumen();
  } catch (error) {
    console.error("ERROR ELIMINANDO COTIZACIÓN:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo eliminar la cotización"
    });
  }
}

function responderWhatsapp(quote) {
  const telefono = String(quote.telefono || "").replace(/\D/g, "");

  if (!telefono) {
    Swal.fire({
      icon: "warning",
      title: "Sin teléfono",
      text: "Esta cotización no tiene teléfono."
    });
    return;
  }

  const tipoEvento = quote.evento || "evento";
  const mensaje = `Hola ${quote.nombre || ""}, te escribimos desde Banquetes Almar sobre tu solicitud de ${tipoEvento}.`;
  const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

async function convertirAEvento(id) {
  const resultado = await Swal.fire({
    icon: "question",
    title: "¿Convertir a evento?",
    text: "Esto creará un nuevo evento basado en la cotización.",
    showCancelButton: true,
    confirmButtonText: "Sí, convertir",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d"
  });

  if (!resultado.isConfirmed) return;

  try {
    const res = await fetch(`${QUOTES_API}/${id}/convert`, {
      method: "POST",
      headers: authHeaders()
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudo convertir la cotización");
    }

    await Swal.fire({
      icon: "success",
      title: "Convertido",
      text: "La cotización fue convertida a evento correctamente.",
      timer: 1400,
      showConfirmButton: false
    });

    await cargarCotizaciones();
    await cargarResumen();
  } catch (error) {
    console.error("ERROR CONVIRTIENDO COTIZACIÓN:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo convertir la cotización"
    });
  }
}

function crearTarjetaCotizacion(quote) {
  const estado = normalizarEstado(quote.estado);
  const badgeClass = claseEstado(estado);

  const card = document.createElement("article");
  card.className = "quote-card";

  card.innerHTML = `
    <div class="quote-card-top">
      <div>
        <h3>${quote.nombre || "Sin nombre"}</h3>
        <p><strong>Fecha:</strong> ${formatearFecha(quote.created_at)}</p>
        <p><strong>Teléfono:</strong> ${quote.telefono || "No definido"}</p>
        <p><strong>Personas:</strong> ${quote.personas || 0}</p>
      </div>

      <span class="event-chip">
        ${quote.evento || "Evento"}
      </span>
    </div>

    <div class="quote-status-row">
      <span class="status-badge ${badgeClass}">
        ${textoEstado(estado)}
      </span>

      <select class="status-select-pro" data-id="${quote.id}">
        <option value="Contactado" ${estado === "Contactado" ? "selected" : ""}>Contactado</option>
        <option value="Confirmado" ${estado === "Confirmado" ? "selected" : ""}>Confirmado</option>
        <option value="Cancelado" ${estado === "Cancelado" ? "selected" : ""}>Cancelado</option>
        <option value="Convertido" ${estado === "Convertido" ? "selected" : ""}>Convertido</option>
      </select>
    </div>

    <p><strong>Observaciones:</strong> ${quote.mensaje || "Sin mensaje"}</p>

    <div class="quote-card-actions">
      <button class="btn btn-primary whatsapp-btn" data-id="${quote.id}">Responder por WhatsApp</button>
      <button class="btn btn-success convertir-btn" data-id="${quote.id}">Convertir a evento</button>
      <button class="btn btn-danger eliminar-btn" data-id="${quote.id}">Eliminar</button>
    </div>
  `;

  const select = card.querySelector(".status-select-pro");
  const whatsappBtn = card.querySelector(".whatsapp-btn");
  const convertirBtn = card.querySelector(".convertir-btn");
  const eliminarBtn = card.querySelector(".eliminar-btn");

  select.addEventListener("change", async (e) => {
    const nuevoEstado = e.target.value;
    await actualizarEstado(quote.id, nuevoEstado);
  });

  whatsappBtn.addEventListener("click", () => responderWhatsapp(quote));
  convertirBtn.addEventListener("click", () => convertirAEvento(quote.id));
  eliminarBtn.addEventListener("click", () => eliminarCotizacion(quote.id));

  return card;
}

async function cargarCotizaciones() {
  try {
    const res = await fetch(QUOTES_API, {
      headers: authHeaders()
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar las cotizaciones");
    }

    quotesContainer.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      quotesContainer.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay cotizaciones</h3>
          <p>Aún no se han registrado solicitudes.</p>
        </div>
      `;
      return;
    }

    data.forEach((quote) => {
      const card = crearTarjetaCotizacion(quote);
      quotesContainer.appendChild(card);
    });
  } catch (error) {
    console.error("ERROR CARGANDO COTIZACIONES:", error);
    quotesContainer.innerHTML = `
      <div class="empty-state-card">
        <h3>Error</h3>
        <p>No se pudieron cargar las cotizaciones.</p>
      </div>
    `;
  }
}

(async function init() {
  await cargarResumen();
  await cargarCotizaciones();
})();