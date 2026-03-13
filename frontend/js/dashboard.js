const quotesContainer = document.getElementById("quotesContainer");
const adminWelcome = document.getElementById("adminWelcome");
const logoutBtn = document.getElementById("logoutBtn");

const token = localStorage.getItem("token");
const adminNombre = localStorage.getItem("adminNombre");

if (!token) {
  window.location.href = "./login.html";
}

if (adminWelcome && adminNombre) {
  adminWelcome.textContent = `Bienvenido, ${adminNombre}`;
}

const loadQuotes = async () => {
  try {
    const response = await fetch("http://localhost:3001/api/quotes", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudieron cargar las cotizaciones.");
    }

    if (!data.length) {
      quotesContainer.innerHTML = `
        <div class="reason-card">
          <h3>No hay cotizaciones aún</h3>
          <p>Cuando lleguen solicitudes aparecerán aquí.</p>
        </div>
      `;
      return;
    }

    quotesContainer.innerHTML = data.map((quote) => `
      <article class="reason-card" style="text-align:left;">
        <h3>${quote.nombre}</h3>
        <p><strong>Teléfono:</strong> ${quote.telefono}</p>
        <p><strong>Evento:</strong> ${quote.evento}</p>
        <p><strong>Personas:</strong> ${quote.personas}</p>
        <p><strong>Mensaje:</strong> ${quote.mensaje}</p>
        <p><strong>Fecha:</strong> ${new Date(quote.created_at).toLocaleString()}</p>
      </article>
    `).join("");
  } catch (error) {
    console.error(error);
    alert(error.message);

    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  }
};

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

loadQuotes();