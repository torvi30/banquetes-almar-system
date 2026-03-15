const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const quoteForm = document.getElementById("quoteForm");
const revealElements = document.querySelectorAll(".reveal");
const header = document.getElementById("header");
const galleryGrid = document.getElementById("galleryGrid");
const servicesGrid = document.getElementById("servicesGrid");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

const revealOnScroll = () => {
  document.querySelectorAll(".reveal").forEach((element) => {
    const windowHeight = window.innerHeight;
    const elementTop = element.getBoundingClientRect().top;
    const visiblePoint = 100;

    if (elementTop < windowHeight - visiblePoint) {
      element.classList.add("active");
    }
  });
};

window.addEventListener("scroll", () => {
  revealOnScroll();

  if (header) {
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
});

revealOnScroll();

async function cargarGaleriaPublica() {
  if (!galleryGrid) return;

  try {
    const res = await fetch("http://localhost:3001/api/gallery");
    const data = await res.json();

    galleryGrid.innerHTML = "";

    if (!data.length) {
      galleryGrid.innerHTML = `
        <article class="gallery-photo reveal">
          <div class="empty-state-card">
            <h3>No hay imágenes aún</h3>
            <p>Pronto verás aquí los mejores momentos de Banquetes Almar.</p>
          </div>
        </article>
      `;
      revealOnScroll();
      return;
    }

    data.forEach((item, index) => {
      const article = document.createElement("article");
      article.className = index === 0 ? "gallery-photo large reveal" : "gallery-photo reveal";

      article.innerHTML = `
        <img src="http://localhost:3001/uploads/${item.imagen}" alt="${item.titulo}" />
      `;

      galleryGrid.appendChild(article);
    });

    revealOnScroll();
  } catch (error) {
    console.error("ERROR GALERIA PUBLICA:", error);

    galleryGrid.innerHTML = `
      <article class="gallery-photo reveal">
        <div class="empty-state-card">
          <h3>No se pudo cargar la galería</h3>
          <p>Verifica que el backend esté corriendo correctamente.</p>
        </div>
      </article>
    `;

    revealOnScroll();
  }
}

async function cargarServiciosPublicos() {
  if (!servicesGrid) return;

  try {
    const res = await fetch("http://localhost:3001/api/services");
    const data = await res.json();

    servicesGrid.innerHTML = "";

    if (!data.length) {
      servicesGrid.innerHTML = `
        <article class="service-card reveal">
          <div class="service-card-content">
            <h3>No hay servicios aún</h3>
            <p>Pronto estaremos mostrando nuestros servicios disponibles.</p>
          </div>
        </article>
      `;
      revealOnScroll();
      return;
    }

    data.forEach((service) => {
      const article = document.createElement("article");
      article.className = "service-card reveal";

      article.innerHTML = `
        <img src="http://localhost:3001/uploads/${service.imagen}" alt="${service.titulo}" />
        <div class="service-card-content">
          <h3>${service.titulo}</h3>
          <p>${service.descripcion}</p>
        </div>
      `;

      servicesGrid.appendChild(article);
    });

    revealOnScroll();
  } catch (error) {
    console.error("ERROR SERVICIOS PUBLICOS:", error);

    servicesGrid.innerHTML = `
      <article class="service-card reveal">
        <div class="service-card-content">
          <h3>No se pudieron cargar los servicios</h3>
          <p>Verifica que el backend esté corriendo correctamente.</p>
        </div>
      </article>
    `;

    revealOnScroll();
  }
}

if (quoteForm) {
  quoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const evento = document.getElementById("evento").value.trim();
    const personas = document.getElementById("personas").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();

    try {
      const response = await fetch("http://localhost:3001/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre,
          telefono,
          evento,
          personas,
          mensaje
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar la cotización.");
      }

      alert("Solicitud enviada correctamente.");
      quoteForm.reset();
    } catch (error) {
      console.error("ERROR FORM:", error);
      alert(error.message);
    }
  });
}

cargarGaleriaPublica();
cargarServiciosPublicos();