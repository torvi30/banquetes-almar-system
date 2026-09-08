/**
 * Controlador Principal de la Aplicación Web Banquetes Almar
 * Integra el Cotizador E-commerce, el Carrito de Alquiler, la Galería y Firebase.
 */

import { dbService } from "./firebase/db.js";
import { initCotizadorEcommerce, aplicarPaqueteAlCotizador } from "./cotizador-ecommerce.js";
import { initRentalStore, rentalCart } from "./alquiler-cart.js";
import { BUSINESS_INFO } from "./firebase/seed-data.js";
import { EventStudio } from "./apple-configurator.js";

document.addEventListener("DOMContentLoaded", async () => {
  initNavigation();
  initSecretAdminAccess();
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

// Acceso secreto a Administración (Invisible para el público):
// 1. Triple clic en el logo de Banquetes Almar (en menos de 1.2 segundos).
// 2. Atajo de teclado: Ctrl + Alt + A (o Cmd + Alt + A en Mac).
function initSecretAdminAccess() {
  // Atajo de teclado global
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === "a" || e.key === "A")) {
      e.preventDefault();
      window.location.href = "./admin/login.html";
    }
  });

  // Triple clic en el logo
  const brand = document.querySelector(".brand");
  if (brand) {
    let clickCount = 0;
    let clickTimer = null;

    brand.addEventListener("click", (e) => {
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 1200);
      } else if (clickCount >= 3) {
        e.preventDefault();
        clearTimeout(clickTimer);
        clickCount = 0;
        window.location.href = "./admin/login.html";
      }
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
            <span class="price-val">$${(pkg.precioPorPersona || 0).toLocaleString("es-CO")} COP</span>
          </div>

          <ul class="package-inclusions-list">
            ${(pkg.inclusiones || pkg.inclusions || []).slice(0, 4).map(inc => `<li>${inc}</li>`).join("")}
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

  } catch (err) {
    console.error("Error cargando paquetes:", err);
  }
}

// Helper de iconos de categoría para la galería
function getCategoryIcon(cat) {
  const c = (cat || "").toLowerCase();
  if (c.includes("boda")) return "💍";
  if (c.includes("15") || c.includes("quince")) return "👑";
  if (c.includes("marinilla") || c.includes("salón") || c.includes("salon")) return "🏛️";
  if (c.includes("peñol") || c.includes("campestre") || c.includes("finca")) return "🌿";
  if (c.includes("cater") || c.includes("comida") || c.includes("cena")) return "🍽️";
  if (c.includes("mobiliario") || c.includes("silla") || c.includes("mesa")) return "🪑";
  if (c.includes("corp")) return "👔";
  if (c.includes("grado")) return "🎓";
  return "✨";
}

// Carga, filtrado y Lightbox de la galería fotográfica de gala
async function cargarGaleria() {
  const grid = document.getElementById("galleryGrid");
  const filtersContainer = document.getElementById("galleryFilters");
  if (!grid) return;

  // Elementos del Modal Lightbox
  const lightboxModal = document.getElementById("clientLightboxModal");
  const lightboxImg = document.getElementById("clientLightboxImg");
  const lightboxClose = document.getElementById("clientLightboxClose");
  const lightboxPrev = document.getElementById("clientLightboxPrev");
  const lightboxNext = document.getElementById("clientLightboxNext");
  const lightboxCat = document.getElementById("clientLightboxCategory");
  const lightboxCounter = document.getElementById("clientLightboxCounter");
  const lightboxTitle = document.getElementById("clientLightboxTitle");
  const lightboxDesc = document.getElementById("clientLightboxDesc");
  const lightboxWpBtn = document.getElementById("clientLightboxWpBtn");

  let currentGalleryList = [];
  let currentLightboxIndex = 0;

  function updateLightboxView() {
    if (!currentGalleryList.length || !lightboxModal) return;
    const item = currentGalleryList[currentLightboxIndex];
    if (!item) return;

    const title = (item.titulo || "Montaje de Gala Banquetes Almar").trim();
    const category = (item.categoria || "Banquetes Almar").trim();
    const desc = (item.descripcion || "Experiencia y ambientación de gala con mobiliario, flores y producción profesional en Marinilla.").trim();
    const icon = getCategoryIcon(category);

    if (lightboxImg) {
      lightboxImg.src = item.imagen || "";
      lightboxImg.alt = title;
    }
    if (lightboxCat) lightboxCat.textContent = `${icon} ${category}`;
    if (lightboxCounter) lightboxCounter.textContent = `${currentLightboxIndex + 1} de ${currentGalleryList.length}`;
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxDesc) lightboxDesc.textContent = desc;

    if (lightboxWpBtn) {
      const msg = encodeURIComponent(`Hola Banquetes Almar, me encantó este montaje de su galería: "${title}" (${category}). Deseo cotizar una ambientación similar para mi celebración.`);
      lightboxWpBtn.href = `https://wa.me/573148849011?text=${msg}`;
    }
  }

  function openLightbox(index, list) {
    if (!lightboxModal || !list || !list.length) return;
    currentGalleryList = list;
    currentLightboxIndex = index >= 0 && index < list.length ? index : 0;
    updateLightboxView();
    lightboxModal.classList.add("active");
    lightboxModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove("active");
    lightboxModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function prevLightboxPhoto() {
    if (!currentGalleryList.length) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + currentGalleryList.length) % currentGalleryList.length;
    updateLightboxView();
  }

  function nextLightboxPhoto() {
    if (!currentGalleryList.length) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % currentGalleryList.length;
    updateLightboxView();
  }

  // Inicializar listeners del Lightbox (solo una vez)
  if (lightboxModal && !lightboxModal.dataset.initialized) {
    lightboxModal.dataset.initialized = "true";

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener("click", prevLightboxPhoto);
    if (lightboxNext) lightboxNext.addEventListener("click", nextLightboxPhoto);

    // Cerrar al hacer clic en el fondo oscuro fuera del cuadro
    lightboxModal.addEventListener("click", (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });

    // Navegación por teclado
    document.addEventListener("keydown", (e) => {
      if (!lightboxModal.classList.contains("active")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevLightboxPhoto();
      if (e.key === "ArrowRight") nextLightboxPhoto();
    });
  }

  try {
    const rawItems = await dbService.getGallery();
    const items = Array.isArray(rawItems) ? rawItems : [];

    if (!items.length) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--apple-text-secondary);">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 0.8rem;">✨</span>
          <p style="font-size: 1.1rem; color: #fff; margin-bottom: 0.4rem;">Próximamente más fotografías de nuestros montajes</p>
          <p style="font-size: 0.9rem;">Visítanos en Marinilla para conocer nuestro portafolio impreso y degustaciones.</p>
        </div>
      `;
      return;
    }

    function render(lista) {
      grid.innerHTML = lista.map((item, idx) => {
        const title = (item.titulo || "Montaje Exclusivo").trim();
        const category = (item.categoria || "Banquetes Almar").trim();
        const desc = (item.descripcion || "Diseño y ambientación de gala con mobiliario y producción profesional.").trim();
        const icon = getCategoryIcon(category);

        return `
          <article class="public-gallery-card reveal active" data-index="${idx}">
            <div class="public-gallery-thumb-wrap">
              <img class="public-gallery-thumb" src="${item.imagen || ''}" alt="${title}" loading="lazy" />
              <span class="public-gallery-badge">${icon} ${category}</span>
              <div class="public-gallery-hover-overlay">
                <span class="hover-zoom-btn">🔍 Ver Montaje Completo</span>
              </div>
            </div>
            <div class="public-gallery-body">
              <h3 class="public-gallery-title">${title}</h3>
              <p class="public-gallery-desc">${desc}</p>
              <div class="public-gallery-footer">
                <span class="public-gallery-link">Explorar montaje ➔</span>
              </div>
            </div>
          </article>
        `;
      }).join("");

      // Conectar clic para abrir el Lightbox
      grid.querySelectorAll(".public-gallery-card").forEach((card, idx) => {
        card.addEventListener("click", () => {
          openLightbox(idx, lista);
        });
      });
    }

    // Render inicial con todos los items
    render(items);

    // Barra de filtros con contador dinámico
    if (filtersContainer) {
      const categoryCounts = {};
      items.forEach(i => {
        const c = i.categoria || "Otros";
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });

      const uniqueCategories = Object.keys(categoryCounts);
      const allFilters = [
        { name: "Todos", count: items.length, icon: "✨" },
        ...uniqueCategories.map(c => ({ name: c, count: categoryCounts[c], icon: getCategoryIcon(c) }))
      ];

      filtersContainer.innerHTML = allFilters.map((f, idx) => `
        <button class="gallery-filter ${idx === 0 ? "active" : ""}" data-category="${f.name}">
          <span>${f.icon} ${f.name}</span>
          <span class="gallery-filter-count">${f.count}</span>
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
            const filtered = items.filter(i => (i.categoria || "Otros") === cat);
            render(filtered);
          }
        });
      });
    }
  } catch (err) {
    console.error("Error cargando galería:", err);
  }
}
