/**
 * Controlador Principal de la Aplicación Web Banquetes Almar
 * Integra el Cotizador E-commerce, el Carrito de Alquiler, la Galería y Firebase.
 */

import { dbService } from "./firebase/db.js";
import { initCotizadorEcommerce, aplicarPaqueteAlCotizador } from "./cotizador-ecommerce.js";
import { initRentalStore, rentalCart } from "./alquiler-cart.js";
import { BUSINESS_INFO } from "./firebase/seed-data.js";

document.addEventListener("DOMContentLoaded", async () => {
  initNavigation();
  initCotizadorEcommerce();
  initRentalStore();
  await cargarPaquetesDestacados();
  await cargarGaleria();
});

// Navegación móvil y scroll suave
function initNavigation() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
      });
    });
  }
}

// Carga y renderizado de paquetes todo incluido
async function cargarPaquetesDestacados() {
  const container = document.getElementById("packagesListContainer");
  if (!container) return;

  try {
    const packages = await dbService.getPackages();

    container.innerHTML = packages.map(pkg => `
      <article class="package-card reveal active">
        <div class="package-image-wrap">
          <img src="${pkg.imagen}" alt="${pkg.titulo}" class="package-image" loading="lazy" />
          <span class="package-badge">${pkg.badge}</span>
        </div>
        <div class="package-body">
          <h3 class="package-title">${pkg.titulo}</h3>
          <p class="package-desc">${pkg.descripcion}</p>
          
          <div class="package-price-wrap">
            <span class="price-label">Desde (por invitado)</span>
            <span class="price-val">$${pkg.precioPorPersona.toLocaleString("es-CO")} COP</span>
          </div>

          <ul class="package-inclusions-list">
            ${pkg.inclusions.slice(0, 4).map(inc => `<li>${inc}</li>`).join("")}
          </ul>

          <button class="btn btn-primary select-package-btn" data-id="${pkg.id}" style="width: 100%;">
            Personalizar este paquete
          </button>
        </div>
      </article>
    `).join("");

    // Conectar botón para seleccionar paquete y auto-completar cotizador
    container.querySelectorAll(".select-package-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pkgId = btn.dataset.id;
        aplicarPaqueteAlCotizador(pkgId);
      });
    });

    // Conectar botones de selección de sede (Marinilla vs El Peñol)
    document.querySelectorAll(".select-venue-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const venue = btn.dataset.venue;
        if (window.EventStudio) {
          window.EventStudio.state.location = venue;
          window.EventStudio.render();
        }
        const cotSection = document.getElementById("cotizador");
        if (cotSection) {
          cotSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

  } catch (err) {
    console.error("Error cargando paquetes:", err);
  }
}

// Carga y filtrado de la galería fotográfica
async function cargarGaleria() {
  const grid = document.getElementById("galleryGrid");
  const filtersContainer = document.getElementById("galleryFilters");
  if (!grid) return;

  try {
    const items = await dbService.getGallery();

    function render(lista) {
      grid.innerHTML = lista.map(item => `
        <article class="gallery-photo reveal active">
          <img src="${item.imagen}" alt="${item.titulo}" loading="lazy" />
          <div class="gallery-overlay">
            <h3>${item.titulo}</h3>
            <p>${item.categoria || "Banquetes Almar"}</p>
          </div>
        </article>
      `).join("");
    }

    render(items);

    if (filtersContainer) {
      const categorias = ["Todos", ...new Set(items.map(i => i.categoria))];
      filtersContainer.innerHTML = categorias.map((cat, idx) => `
        <button class="gallery-filter ${idx === 0 ? "active" : ""}" data-category="${cat}">
          ${cat}
        </button>
      `).join("");

      filtersContainer.querySelectorAll(".gallery-filter").forEach(btn => {
        btn.addEventListener("click", () => {
          filtersContainer.querySelectorAll(".gallery-filter").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const cat = btn.dataset.category;
          if (cat === "Todos") {
            render(items);
          } else {
            render(items.filter(i => i.categoria === cat));
          }
        });
      });
    }
  } catch (err) {
    console.error("Error cargando galería:", err);
  }
}
