const header = document.getElementById("header");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const quoteForm = document.getElementById("quoteForm");
const revealElements = document.querySelectorAll(".reveal");
const serviceGrid = document.querySelector(".service-grid");
const galleryGrid = document.querySelector(".gallery-grid-real");

window.addEventListener("scroll", () => {
  if (window.scrollY > 30) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
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
      nombre: document.getElementById("nombre").value,
      telefono: document.getElementById("telefono").value,
      evento: document.getElementById("evento").value,
      personas: document.getElementById("personas").value,
      mensaje: document.getElementById("mensaje").value
    };

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

      const whatsappMessage = `Hola, soy ${data.nombre}. Estoy interesado en un ${data.evento} para ${data.personas} personas. Detalles: ${data.mensaje}`;
      window.open(`https://wa.me/573148849011?text=${encodeURIComponent(whatsappMessage)}`, "_blank");

      alert("Cotización enviada correctamente");
      quoteForm.reset();
    } catch (error) {
      console.error("ERROR QUOTE:", error);
      alert(error.message);
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

async function cargarGaleria() {
  if (!galleryGrid) return;

  try {
    const res = await fetch("http://localhost:3001/api/gallery");
    const data = await res.json();

    galleryGrid.innerHTML = "";

    if (!Array.isArray(data) || !data.length) {
      galleryGrid.innerHTML = `
        <article class="gallery-photo large reveal active">
          <div style="padding:2rem;">No hay imágenes aún</div>
        </article>
      `;
      return;
    }

    data.forEach((imagen, index) => {
      const article = document.createElement("article");
      article.className = index === 0 ? "gallery-photo large reveal active" : "gallery-photo reveal active";

      article.innerHTML = `
        <img src="http://localhost:3001/uploads/${imagen.imagen}" alt="${imagen.titulo}">
      `;

      galleryGrid.appendChild(article);
    });
  } catch (error) {
    console.error("ERROR GALERIA:", error);
  }
}

cargarServicios();
cargarGaleria();