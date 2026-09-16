/**
 * Portafolio de Servicios - Banquetes Almar
 * Carga las secciones de galería directamente desde Firebase Firestore NoSQL.
 */

import { dbService } from "./firebase/db.js";

const sectionsGrid = document.getElementById("sectionsGrid");

function crearTarjetaSeccion(section) {
  const fotoText = `${section.total_fotos || 0} foto${Number(section.total_fotos) === 1 ? "" : "s"}`;
  const portadaImg = section.portada 
    ? `<img src="${section.portada}" alt="${section.nombre}" class="gallery-section-image" loading="lazy" />`
    : `<div class="gallery-section-placeholder">Sin portada</div>`;

  return `
    <article class="gallery-section-card">
      <a href="./portafolio-servicios-detalle.html?categoria=${encodeURIComponent(section.nombre)}" class="gallery-section-link">
        <div class="gallery-section-image-wrap">
          ${portadaImg}
        </div>

        <div class="gallery-section-content">
          <div class="gallery-section-top">
            <h3>${section.nombre}</h3>
            <span class="event-chip">${fotoText}</span>
          </div>

          <p>Descubre montajes de gala y referencias visuales exclusivas en Marinilla y Oriente.</p>
          <span class="gallery-section-cta">Ver sección</span>
        </div>
      </a>
    </article>
  `;
}

async function cargarSeccionesGaleria() {
  if (!sectionsGrid) return;

  try {
    const items = await dbService.getGallery();
    const categories = await dbService.getGalleryCategories();

    if (!categories.length && !items.length) {
      sectionsGrid.innerHTML = `
        <div class="empty-state-card">
          <h3>Sin secciones</h3>
          <p>Aún no hay categorías con contenido en la base de datos.</p>
        </div>
      `;
      return;
    }

    // Agrupar items por categoría
    const countMap = {};
    const coverMap = {};

    items.forEach((item) => {
      const cat = item.categoria || "General";
      countMap[cat] = (countMap[cat] || 0) + 1;
      if (!coverMap[cat] || item.es_portada) {
        coverMap[cat] = item.imagen;
      }
    });

    const activeCats = categories.length ? categories : Object.keys(countMap);

    const sections = activeCats.map((nombre, index) => {
      return {
        id: "cat-" + (index + 1),
        nombre,
        total_fotos: countMap[nombre] || 0,
        portada: coverMap[nombre] || (items[index]?.imagen || "")
      };
    });

    sectionsGrid.innerHTML = sections.map(crearTarjetaSeccion).join("");
  } catch (error) {
    console.error("ERROR CARGANDO SECCIONES DESDE FIRESTORE:", error);
    sectionsGrid.innerHTML = `
      <div class="empty-state-card">
        <h3>Error al cargar portafolio</h3>
        <p>No se pudieron sincronizar las fotos desde Firebase Firestore.</p>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", cargarSeccionesGaleria);