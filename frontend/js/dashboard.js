const quotesContainer = document.getElementById("quotesContainer");
const adminWelcome = document.getElementById("adminWelcome");
const logoutBtn = document.getElementById("logoutBtn");
const totalQuotes = document.getElementById("totalQuotes");

const token = localStorage.getItem("token");
const adminNombre = localStorage.getItem("adminNombre");

if (!token) {
  alert("Debes iniciar sesión primero.");
  window.location.href = "./login.html";
}

adminWelcome.textContent = `Bienvenido, ${adminNombre || "Administrador"}`;

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  return new Date(fecha).toLocaleString("es-CO");
}

function construirWhatsappLink(quote) {
  const telefonoLimpio = String(quote.telefono).replace(/\D/g, "");
  const mensaje = `Hola ${quote.nombre}, recibimos tu solicitud para ${quote.evento} en Banquetes Almar. Queremos ayudarte con tu cotización.`;
  return `https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
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
  } catch (error) {
    console.error("ERROR DELETE:", error);
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

    quotesContainer.innerHTML = "";
    totalQuotes.textContent = data.length;

    if (!data.length) {
      quotesContainer.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay cotizaciones aún</h3>
          <p>Cuando lleguen solicitudes aparecerán aquí organizadas automáticamente.</p>
        </div>
      `;
      return;
    }

    data.forEach((quote) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      const whatsappLink = construirWhatsappLink(quote);

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
          <p><strong>Mensaje:</strong> ${quote.mensaje ? quote.mensaje : "Sin detalles adicionales."}</p>
        </div>

        <div class="quote-card-actions">
          <a href="${whatsappLink}" target="_blank" class="btn btn-primary">
            Responder por WhatsApp
          </a>
          <button class="btn btn-danger" data-id="${quote.id}">
            Eliminar
          </button>
        </div>
      `;

      quotesContainer.appendChild(card);
    });

    document.querySelectorAll(".btn-danger").forEach((button) => {
      button.addEventListener("click", () => {
        eliminarCotizacion(button.dataset.id);
      });
    });
  } catch (error) {
    console.error("ERROR DASHBOARD:", error);
    alert(error.message);
  }
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("adminNombre");
  window.location.href = "./login.html";
});

cargarCotizaciones();