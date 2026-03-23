const API_URL = "http://localhost:3001/api";

document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initReveal();
  cargarServicios();
  cargarGaleria();
  initQuoteForm();
});

function initMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });
}

function initReveal() {
  const reveals = document.querySelectorAll(".reveal");

  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    { threshold: 0.15 }
  );

  reveals.forEach((el) => observer.observe(el));
}

async function cargarServicios() {
  const serviceGrid = document.querySelector(".service-grid");
  if (!serviceGrid) return;

  try {
    const response = await fetch(`${API_URL}/services`);
    const data = await response.json();

    serviceGrid.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      serviceGrid.innerHTML = `<p>No hay servicios disponibles.</p>`;
      return;
    }

    data.forEach((servicio, index) => {
      const article = document.createElement("article");
      article.className = "service-card reveal active";

      article.innerHTML = `
        <div class="service-image-wrap">
          <img 
            src="http://localhost:3001/uploads/${servicio.imagen}" 
            alt="${servicio.titulo}"
            class="service-image"
          />
        </div>
        <div class="service-content">
          <h3>${servicio.titulo}</h3>
          <p>${servicio.descripcion || ""}</p>
        </div>
      `;

      serviceGrid.appendChild(article);
    });
  } catch (error) {
    console.error("ERROR CARGANDO SERVICIOS:", error);
    serviceGrid.innerHTML = `<p>Error cargando servicios.</p>`;
  }
}

async function cargarGaleria() {
  const galleryGrid = document.getElementById("galleryGrid");
  const galleryFilters = document.getElementById("galleryFilters");

  if (!galleryGrid || !galleryFilters) return;

  try {
    const response = await fetch(`${API_URL}/gallery`);
    const data = await response.json();

    galleryGrid.innerHTML = "";
    galleryFilters.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      galleryGrid.innerHTML = `<p>No hay imágenes en galería.</p>`;
      return;
    }

    const categoriasMap = {};

    data.forEach((item) => {
      const categoria = item.categoria || "Todos";
      if (!categoriasMap[categoria]) {
        categoriasMap[categoria] = [];
      }
      categoriasMap[categoria].push(item);
    });

    const categorias = ["Todos", ...Object.keys(categoriasMap)];

    categorias.forEach((categoria, index) => {
      const button = document.createElement("button");
      button.className = index === 0 ? "gallery-filter active" : "gallery-filter";
      button.type = "button";
      button.textContent = categoria;

      button.addEventListener("click", () => {
        document.querySelectorAll(".gallery-filter").forEach((btn) => {
          btn.classList.remove("active");
        });
        button.classList.add("active");

        if (categoria === "Todos") {
          renderGaleria(data);
        } else {
          renderGaleria(categoriasMap[categoria] || []);
        }
      });

      galleryFilters.appendChild(button);
    });

    renderGaleria(data);
  } catch (error) {
    console.error("ERROR CARGANDO GALERÍA:", error);
    galleryGrid.innerHTML = `<p>Error cargando galería.</p>`;
  }
}

function renderGaleria(items) {
  const galleryGrid = document.getElementById("galleryGrid");
  if (!galleryGrid) return;

  galleryGrid.innerHTML = "";

  if (!items.length) {
    galleryGrid.innerHTML = `<p>No hay imágenes en esta categoría.</p>`;
    return;
  }

  items.forEach((item, index) => {
    const article = document.createElement("article");
    article.className =
      index === 0
        ? "gallery-photo large reveal active"
        : "gallery-photo reveal active";

    article.innerHTML = `
      <img
        src="http://localhost:3001/uploads/${item.imagen}"
        alt="${item.titulo || "Imagen de galería"}"
      />
      <div class="gallery-overlay">
        <h3>${item.titulo || "Banquetes Almar"}</h3>
        <p>${item.categoria || ""}</p>
      </div>
    `;

    galleryGrid.appendChild(article);
  });
}

function initQuoteForm() {
  const quoteForm = document.getElementById("quoteForm");
  if (!quoteForm) return;

  quoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre")?.value.trim();
    const telefono = document.getElementById("telefono")?.value.trim();
    const evento = document.getElementById("evento")?.value.trim();
    const personas = document.getElementById("personas")?.value.trim();
    const mensaje = document.getElementById("mensaje")?.value.trim();

    if (!nombre || !telefono || !evento || !personas || !mensaje) {
      alert("Completa todos los campos.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/quotes`, {
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
        throw new Error(data.message || "No se pudo enviar la solicitud");
      }

      const textoWhatsapp =
        `Hola, soy ${nombre}. ` +
        `Quiero cotizar un evento tipo ${evento} para ${personas} personas. ` +
        `Detalles: ${mensaje}`;

      const telefonoDestino = "573148849011";
      const whatsappUrl = `https://wa.me/${telefonoDestino}?text=${encodeURIComponent(textoWhatsapp)}`;

      window.open(whatsappUrl, "_blank");

      alert("Solicitud enviada correctamente.");
      quoteForm.reset();
    } catch (error) {
      console.error("ERROR ENVIANDO COTIZACIÓN:", error);
      alert("No se pudo conectar con el servidor.");
    }
  });
}