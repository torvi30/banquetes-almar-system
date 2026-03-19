const quotesContainer = document.getElementById("quotesContainer");
const adminWelcome = document.getElementById("adminWelcome");
const logoutBtn = document.getElementById("logoutBtn");
const totalQuotes = document.getElementById("totalQuotes");
const totalEventos = document.getElementById("totalEventos");
const confirmados = document.getElementById("confirmados");
const ingresos = document.getElementById("ingresos");
const pendiente = document.getElementById("pendiente");

const token = localStorage.getItem("token");
const adminNombre = localStorage.getItem("adminNombre");

if (!token) {
  alert("Debes iniciar sesión primero.");
  window.location.href = "./login.html";
}

if (adminWelcome) {
  adminWelcome.textContent = `Bienvenido, ${adminNombre || "Administrador"}`;
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  return new Date(fecha).toLocaleString("es-CO");
}

function formatearDinero(valor) {
  return "$" + Number(valor || 0).toLocaleString("es-CO");
}

function construirWhatsappLink(quote) {
  const telefonoLimpio = String(quote.telefono || "").replace(/\D/g, "");
  const mensaje = `Hola ${quote.nombre}, recibimos tu solicitud para ${quote.evento} en Banquetes Almar. Queremos ayudarte con tu cotización.`;
  return `https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
}

function obtenerClaseEstado(estado) {
  const estadoNormalizado = String(estado || "Nuevo").toLowerCase();

  if (estadoNormalizado === "nuevo") return "estado-nuevo";
  if (estadoNormalizado === "contactado") return "estado-contactado";
  if (estadoNormalizado === "confirmado") return "estado-confirmado";
  if (estadoNormalizado === "cancelado") return "estado-cancelado";
  if (estadoNormalizado === "convertido") return "estado-convertido";

  return "estado-nuevo";
}

async function cargarStats() {
  try {
    const res = await fetch("http://localhost:3001/api/stats", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar las estadísticas.");
    }

    if (totalEventos) totalEventos.textContent = data.totalEventos;
    if (confirmados) confirmados.textContent = data.confirmados;
    if (ingresos) ingresos.textContent = formatearDinero(data.ingresos);
    if (pendiente) pendiente.textContent = formatearDinero(data.pendiente);
  } catch (error) {
    console.error("ERROR STATS:", error);
  }
}

async function eliminarCotizacion(id) {
  const confirmar = confirm("¿Deseas eliminar esta cotización?");
  if (!confirmar) return;

  try {
    const res = await fetch(`http://localhost:3001/api/quotes/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo eliminar la cotización.");
    }

    await cargarCotizaciones();
    await cargarStats();
  } catch (error) {
    console.error("ERROR DELETE:", error);
    alert(error.message);
  }
}

async function cambiarEstado(id, estado) {
  try {
    const res = await fetch(`http://localhost:3001/api/quotes/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ estado })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo actualizar el estado.");
    }

    await cargarCotizaciones();
    await cargarStats();
  } catch (error) {
    console.error("ERROR STATUS:", error);
    alert(error.message);
  }
}

async function convertirCotizacion(id) {
  const confirmar = confirm("¿Convertir esta cotización en evento?");
  if (!confirmar) return;

  try {
    const res = await fetch(`http://localhost:3001/api/quotes/${id}/convert`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo convertir la cotización.");
    }

    alert("Cotización convertida a evento correctamente.");
    await cargarCotizaciones();
    await cargarStats();
  } catch (error) {
    console.error("ERROR CONVERT:", error);
    alert(error.message);
  }
}

async function cargarCotizaciones() {
  try {
    const res = await fetch("http://localhost:3001/api/quotes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al obtener cotizaciones");
    }

    if (quotesContainer) quotesContainer.innerHTML = "";
    if (totalQuotes) totalQuotes.textContent = data.length;

    if (!data.length) {
      if (quotesContainer) {
        quotesContainer.innerHTML = `
          <div class="empty-state-card">
            <h3>No hay cotizaciones aún</h3>
            <p>Cuando lleguen solicitudes aparecerán aquí organizadas automáticamente.</p>
          </div>
        `;
      }
      await cargarStats();
      return;
    }

    data.forEach((quote) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      const whatsappLink = construirWhatsappLink(quote);
      const claseEstado = obtenerClaseEstado(quote.estado);

      card.innerHTML = `
        <div class="quote-card-header">
          <div>
            <h3>${quote.nombre}</h3>
            <span class="quote-date">${formatearFecha(quote.fecha || quote.created_at)}</span>
          </div>
          <span class="quote-badge">${quote.evento}</span>
        </div>

        <div class="quote-card-body">
          <p><strong>Teléfono:</strong> ${quote.telefono}</p>
          <p><strong>Personas:</strong> ${quote.personas}</p>
          <p>
            <strong>Estado:</strong>
            <span class="estado-badge ${claseEstado}">
              ${quote.estado || "Nuevo"}
            </span>
          </p>
          <p><strong>Mensaje:</strong> ${quote.mensaje ? quote.mensaje : "Sin detalles adicionales."}</p>
        </div>

        <div class="quote-card-actions">
          <a href="${whatsappLink}" target="_blank" class="btn btn-primary">
            Responder por WhatsApp
          </a>

          <select class="status-select" data-id="${quote.id}">
            <option value="Nuevo" ${quote.estado === "Nuevo" ? "selected" : ""}>Nuevo</option>
            <option value="Contactado" ${quote.estado === "Contactado" ? "selected" : ""}>Contactado</option>
            <option value="Confirmado" ${quote.estado === "Confirmado" ? "selected" : ""}>Confirmado</option>
            <option value="Cancelado" ${quote.estado === "Cancelado" ? "selected" : ""}>Cancelado</option>
            <option value="Convertido" ${quote.estado === "Convertido" ? "selected" : ""}>Convertido</option>
          </select>

          <button class="btn btn-success convert-btn" data-id="${quote.id}">
            Convertir a evento
          </button>

          <button class="btn btn-danger delete-btn" data-id="${quote.id}">
            Eliminar
          </button>
        </div>
      `;

      quotesContainer.appendChild(card);
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", () => {
        eliminarCotizacion(button.dataset.id);
      });
    });

    document.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", () => {
        cambiarEstado(select.dataset.id, select.value);
      });
    });

    document.querySelectorAll(".convert-btn").forEach((button) => {
      button.addEventListener("click", () => {
        convertirCotizacion(button.dataset.id);
      });
    });

    await cargarStats();
  } catch (error) {
    console.error("ERROR DASHBOARD:", error);
    alert(error.message);
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

cargarCotizaciones();