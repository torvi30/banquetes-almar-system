const quotesContainer = document.getElementById("quotesContainer");
const adminWelcome = document.getElementById("adminWelcome");
const logoutBtn = document.getElementById("logoutBtn");

const token = localStorage.getItem("token");

if (!token) {
  alert("Debes iniciar sesión primero.");
  window.location.href = "./login.html";
}

adminWelcome.textContent = "Bienvenido, Administrador";

async function cargarCotizaciones() {
  try {
    const res = await fetch("http://localhost:3001/api/quotes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al obtener cotizaciones");
    }

    quotesContainer.innerHTML = "";

    if (!data.length) {
      quotesContainer.innerHTML = `
        <div class="reason-card">
          <h3>No hay cotizaciones aún</h3>
          <p>Cuando lleguen solicitudes aparecerán aquí.</p>
        </div>
      `;
      return;
    }

    data.forEach((quote) => {
      const card = document.createElement("div");
      card.className = "reason-card";
      card.style.textAlign = "left";

      card.innerHTML = `
        <h3>${quote.nombre}</h3>
        <p><strong>Teléfono:</strong> ${quote.telefono}</p>
        <p><strong>Evento:</strong> ${quote.evento}</p>
        <p><strong>Personas:</strong> ${quote.personas}</p>
        <p><strong>Mensaje:</strong> ${quote.mensaje ?? ""}</p>
      `;

      quotesContainer.appendChild(card);
    });
  } catch (error) {
    console.error("ERROR DASHBOARD:", error);
    alert(error.message);
  }
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "./login.html";
});

cargarCotizaciones();