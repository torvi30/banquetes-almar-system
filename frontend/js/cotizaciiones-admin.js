const API_URL = "http://localhost:3001/api/quotes";
const token = localStorage.getItem("token");

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

if (!token) {
  Swal.fire({
    icon: "warning",
    title: "Sesión expirada",
    text: "Debes iniciar sesión de nuevo."
  }).then(() => {
    window.location.href = "./login.html";
  });
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

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return String(fecha).slice(0, 10);

  return d.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function normalizarEstado(estado) {
  const valor = String(estado || "").toLowerCase().trim();

  if (valor === "nuevo") return "nuevo";
  if (valor === "pendiente") return "nuevo";
  if (valor === "contactado") return "contactado";
  if (valor === "confirmada") return "contactado";
  if (valor === "confirmado") return "contactado";
  if (valor === "cancelado") return "cancelado";
  if (valor === "cancelada") return "cancelado";
  if (valor === "convertido") return "convertido";
  if (valor === "convertida") return "convertido";

  return "nuevo";
}

function textoEstado(estado) {
  const value = normalizarEstado(estado);

  if (value === "nuevo") return "Nuevo / Pendiente";
  if (value === "contactado") return "Contactado / Confirmada";
  if (value === "cancelado") return "Cancelado";
  if (value === "convertido") return "Convertido";

  return "Nuevo / Pendiente";
}

function claseEstado(estado) {
  const value = normalizarEstado(estado);

  if (value === "nuevo") return "estado-contactado";
  if (value === "contactado") return "estado-confirmado";
  if (value === "cancelado") return "estado-cancelado";
  if (value === "convertido") return "estado-convertido";

  return "estado-contactado";
}

function obtenerOpcionesEstado(item) {
  if (item.origen === "reserva") {
    return `
      <option value="Pendiente" ${String(item.estado).toLowerCase() === "pendiente" ? "selected" : ""}>Pendiente</option>
      <option value="Confirmada" ${String(item.estado).toLowerCase() === "confirmada" ? "selected" : ""}>Confirmada</option>
      <option value="Cancelada" ${String(item.estado).toLowerCase() === "cancelada" ? "selected" : ""}>Cancelada</option>
      <option value="Convertida" ${String(item.estado).toLowerCase() === "convertida" ? "selected" : ""}>Convertida</option>
    `;
  }

  return `
    <option value="Nuevo" ${String(item.estado).toLowerCase() === "nuevo" ? "selected" : ""}>Nuevo</option>
    <option value="Contactado" ${String(item.estado).toLowerCase() === "contactado" ? "selected" : ""}>Contactado</option>
    <option value="Confirmado" ${String(item.estado).toLowerCase() === "confirmado" ? "selected" : ""}>Confirmado</option>
    <option value="Cancelado" ${String(item.estado).toLowerCase() === "cancelado" ? "selected" : ""}>Cancelado</option>
    <option value="Convertido" ${String(item.estado).toLowerCase() === "convertido" ? "selected" : ""}>Convertido</option>
  `;
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

async function cargarRegistros() {
  try {
    const res = await fetch(API_URL, {
      headers: authHeaders()
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar los registros");
    }

    registrosCache = Array.isArray(data) ? data : [];
    renderPipeline();
  } catch (error) {
    console.error("ERROR CARGANDO REGISTROS:", error);

    [colNuevos, colContactados, colCancelados, colConvertidos].forEach(col => {
      col.innerHTML = `
        <div class="dashboard-empty">
          <h4>Error</h4>
          <p>No se pudieron cargar los registros.</p>
        </div>
      `;
    });
  }
}

function filtrarRegistros() {
  const texto = String(searchInput.value || "").toLowerCase().trim();
  const origen = filterOrigen.value;

  return registrosCache.filter(item => {
    const matchTexto =
      !texto ||
      String(item.nombre || "").toLowerCase().includes(texto) ||
      String(item.telefono || "").toLowerCase().includes(texto) ||
      String(item.tipo_evento || "").toLowerCase().includes(texto);

    const matchOrigen = !origen || item.origen === origen;

    return matchTexto && matchOrigen;
  });
}

function limpiarColumnas() {
  colNuevos.innerHTML = "";
  colContactados.innerHTML = "";
  colCancelados.innerHTML = "";
  colConvertidos.innerHTML = "";
}

function crearCard(item) {
  const card = document.createElement("article");
  card.className = "pipeline-card";

  const esReserva = item.origen === "reserva";
  const estadoClass = claseEstado(item.estado);

  card.innerHTML = `
    <div class="pipeline-card-top">
      <div>
        <h4>${item.nombre || "Sin nombre"} ${esReserva ? "📅" : "🧾"}</h4>
        <p>${item.tipo_evento || "Evento"}</p>
      </div>

      <span class="status-badge ${estadoClass}">
        ${textoEstado(item.estado)}
      </span>
    </div>

    <div class="pipeline-card-body">
      <p><strong>Origen:</strong> ${esReserva ? "Reserva" : "Cotización"}</p>
      <p><strong>Teléfono:</strong> ${item.telefono || "No definido"}</p>
      <p><strong>Personas:</strong> ${item.personas || 0}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(item.created_at)}</p>
      <p><strong>Obs:</strong> ${item.mensaje || "Sin mensaje"}</p>
    </div>

    <div class="pipeline-card-actions">
      <select class="status-select-pro status-change-select">
        ${obtenerOpcionesEstado(item)}
      </select>

      <button class="btn btn-primary whatsapp-btn" type="button">WhatsApp</button>
      ${esReserva ? `<a href="./reservas.html" class="btn btn-success">Abrir reserva</a>` : `<button class="btn btn-success convert-btn" type="button">Convertir</button>`}
      ${esReserva ? "" : `<button class="btn btn-danger delete-btn" type="button">Eliminar</button>`}
    </div>
  `;

  const select = card.querySelector(".status-change-select");
  const whatsappBtn = card.querySelector(".whatsapp-btn");
  const convertBtn = card.querySelector(".convert-btn");
  const deleteBtn = card.querySelector(".delete-btn");

  whatsappBtn.addEventListener("click", () => responderWhatsapp(item));

  select.addEventListener("change", async (e) => {
    const nuevoEstado = e.target.value;
    if (esReserva) {
      await cambiarEstadoReserva(item, nuevoEstado);
    } else {
      await cambiarEstadoCotizacion(item, nuevoEstado);
    }
  });

  if (convertBtn) {
    convertBtn.addEventListener("click", async () => {
      await convertirCotizacion(item.id);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      await eliminarCotizacion(item.id);
    });
  }

  return card;
}

function renderPipeline() {
  limpiarColumnas();

  const lista = filtrarRegistros();

  const nuevos = [];
  const contactados = [];
  const cancelados = [];
  const convertidos = [];

  lista.forEach(item => {
    const estado = normalizarEstado(item.estado);

    if (estado === "nuevo") nuevos.push(item);
    if (estado === "contactado") contactados.push(item);
    if (estado === "cancelado") cancelados.push(item);
    if (estado === "convertido") convertidos.push(item);
  });

  countNuevos.textContent = nuevos.length;
  countContactados.textContent = contactados.length;
  countCancelados.textContent = cancelados.length;
  countConvertidos.textContent = convertidos.length;

  const mapRender = [
    [nuevos, colNuevos, "Sin nuevos"],
    [contactados, colContactados, "Sin contactados"],
    [cancelados, colCancelados, "Sin cancelados"],
    [convertidos, colConvertidos, "Sin convertidos"]
  ];

  mapRender.forEach(([items, container, emptyText]) => {
    if (!items.length) {
      container.innerHTML = `
        <div class="dashboard-empty">
          <h4>${emptyText}</h4>
          <p>No hay registros en esta columna.</p>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      container.appendChild(crearCard(item));
    });
  });
}

function responderWhatsapp(item) {
  const telefono = String(item.telefono || "").replace(/\D/g, "");

  if (!telefono) {
    Swal.fire({
      icon: "warning",
      title: "Sin teléfono",
      text: "Este registro no tiene teléfono."
    });
    return;
  }

  const mensaje = `Hola ${item.nombre || ""}, te escribimos desde Banquetes Almar sobre tu ${item.origen === "reserva" ? "reserva" : "cotización"} de ${item.tipo_evento || "evento"}.`;
  const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

async function cambiarEstadoCotizacion(item, estado) {
  try {
    const res = await fetch(`${API_URL}/${item.id}/status`, {
      method: "PUT",
      headers: authHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({ estado })
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudo actualizar la cotización");
    }

    await cargarRegistros();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message
    });
  }
}

async function cambiarEstadoReserva(item, estado) {
  try {
    const res = await fetch(`http://localhost:3001/api/reservations/${item.id}`, {
      method: "PUT",
      headers: authHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        cliente_id: item.cliente_id || null,
        cliente: item.nombre,
        telefono: item.telefono || "",
        tipo_evento: item.tipo_evento || "",
        fecha_evento: String(item.created_at).slice(0, 10),
        lugar: item.lugar || "",
        personas: item.personas || 0,
        estado,
        observaciones: item.mensaje || ""
      })
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudo actualizar la reserva");
    }

    await cargarRegistros();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message
    });
  }
}

async function convertirCotizacion(id) {
  const confirmar = await Swal.fire({
    icon: "question",
    title: "¿Convertir a evento?",
    text: "Se creará un evento basado en esta cotización.",
    showCancelButton: true,
    confirmButtonText: "Sí, convertir",
    cancelButtonText: "Cancelar"
  });

  if (!confirmar.isConfirmed) return;

  try {
    const res = await fetch(`${API_URL}/${id}/convert`, {
      method: "POST",
      headers: authHeaders()
    });

    const data = await leerRespuestaJSON(res);

    if (!res.ok) {
      throw new Error(data.message || "No se pudo convertir");
    }

    await Swal.fire({
      icon: "success",
      title: "Convertido",
      timer: 1200,
      showConfirmButton: false
    });

    await cargarRegistros();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message
    });
  }
}

async function eliminarCotizacion(id) {
  const confirmar = await Swal.fire({
    icon: "warning",
    title: "¿Eliminar?",
    text: "Esta acción no se puede deshacer.",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!confirmar.isConfirmed) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
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
      timer: 1200,
      showConfirmButton: false
    });

    await cargarRegistros();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message
    });
  }
}

searchInput.addEventListener("input", renderPipeline);
filterOrigen.addEventListener("change", renderPipeline);

cargarRegistros();