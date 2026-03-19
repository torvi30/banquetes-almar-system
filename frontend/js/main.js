const header = document.getElementById("header");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const quoteForm = document.getElementById("quoteForm");
const revealElements = document.querySelectorAll(".reveal");
const serviceGrid = document.querySelector(".service-grid");
const galleryGrid = document.getElementById("galleryGrid");
const galleryFilters = document.getElementById("galleryFilters");

window.addEventListener("scroll", () => {
  if (header) {
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
});

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

navLinks?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
    }
  });
}, { threshold: 0.15 });

revealElements.forEach(el => observer.observe(el));

if (quoteForm) {
  quoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      nombre: document.getElementById("nombre").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      evento: document.getElementById("evento").value.trim(),
      personas: document.getElementById("personas").value.trim(),
      mensaje: document.getElementById("mensaje").value.trim()
    };

    const whatsappMessage = `Hola Banquetes Almar, soy ${data.nombre}. Quiero cotizar un ${data.evento} para ${data.personas} personas. Mi teléfono es ${data.telefono}. Detalles: ${data.mensaje}`;

    try {
      const res = await fetch("http://localhost:3001/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "No se pudo guardar la cotización");
      }

      window.open(
        `https://wa.me/573148849011?text=${encodeURIComponent(whatsappMessage)}`,
        "_blank"
      );

      alert("Cotización enviada correctamente");
      quoteForm.reset();

    } catch (error) {
      console.error("ERROR QUOTE:", error);

      const abrirWhatsapp = confirm(
        "No se pudo guardar la cotización en el sistema. ¿Quieres abrir WhatsApp de todos modos?"
      );

      if (abrirWhatsapp) {
        window.open(
          `https://wa.me/573148849011?text=${encodeURIComponent(whatsappMessage)}`,
          "_blank"
        );
      }
    }
  });
}

async function cargarServicios() {
  if (!serviceGrid) return;

  try {
    const res = await fetch("http://localhost:3001/api/services");
    const data = await res.json();

    serviceGrid.innerHTML = "";

    if (!Array.isArray(data) || !data.length) {
      serviceGrid.innerHTML = `
        <article class="service-card reveal active">
          <div class="service-card-content">
            <h3>No hay servicios aún</h3>
            <p>Pronto estaremos mostrando nuestros servicios aquí.</p>
          </div>
        </article>
      `;
      return;
    }

    data.forEach((servicio) => {
      const card = document.createElement("article");
      card.className = "service-card reveal active";

      card.innerHTML = `
        <img src="http://localhost:3001/uploads/${servicio.imagen}" alt="${servicio.titulo}">
        <div class="service-card-content">
          <h3>${servicio.titulo}</h3>
          <p>${servicio.descripcion}</p>
        </div>
      `;

      serviceGrid.appendChild(card);
    });
  } catch (error) {
    console.error("ERROR SERVICIOS:", error);
    serviceGrid.innerHTML = `
      <article class="service-card reveal active">
        <div class="service-card-content">
          <h3>No se pudieron cargar los servicios</h3>
          <p>Verifica que el backend esté corriendo correctamente.</p>
        </div>
      </article>
    `;
  }
}

function renderGalleryItems(items) {
  if (!galleryGrid) return;

  galleryGrid.innerHTML = "";

  if (!items.length) {
    galleryGrid.innerHTML = `
      <article class="gallery-photo reveal active">
        <div class="empty-state-card">
          <h3>No hay imágenes en esta sección</h3>
          <p>Pronto verás aquí nuevos montajes.</p>
        </div>
      </article>
    `;
    return;
  }

  items.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = index === 0 ? "gallery-photo large reveal active" : "gallery-photo reveal active";

    article.innerHTML = `
      <img src="http://localhost:3001/uploads/${item.imagen}" alt="${item.titulo}">
    `;

    galleryGrid.appendChild(article);
  });
}

function renderGalleryFilters(items) {
  if (!galleryFilters) return;

  const secciones = [...new Set(items.map(item => item.seccion || "Otros"))];
  const allSections = ["Todas", ...secciones];

  galleryFilters.innerHTML = "";

  allSections.forEach((seccion, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === 0 ? "gallery-filter-btn active" : "gallery-filter-btn";
    button.textContent = seccion;

    button.addEventListener("click", () => {
      document.querySelectorAll(".gallery-filter-btn").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      if (seccion === "Todas") {
        renderGalleryItems(items);
      } else {
        const filtradas = items.filter(item => (item.seccion || "Otros") === seccion);
        renderGalleryItems(filtradas);
      }
    });

    galleryFilters.appendChild(button);
  });
}

async function cargarGaleria() {
  if (!galleryGrid) return;

  try {
    const res = await fetch("http://localhost:3001/api/gallery");
    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      galleryGrid.innerHTML = `
        <article class="gallery-photo reveal active">
          <div class="empty-state-card">
            <h3>No hay imágenes aún</h3>
            <p>Pronto verás aquí los mejores momentos de Banquetes Almar.</p>
          </div>
        </article>
      `;
      if (galleryFilters) galleryFilters.innerHTML = "";
      return;
    }

    renderGalleryFilters(data);
    renderGalleryItems(data);
  } catch (error) {
    console.error("ERROR GALERIA:", error);
    galleryGrid.innerHTML = `
      <article class="gallery-photo reveal active">
        <div class="empty-state-card">
          <h3>No se pudo cargar la galería</h3>
          <p>Verifica que el backend esté corriendo correctamente.</p>
        </div>
      </article>
    `;
  }
}

cargarServicios();
cargarGaleria();