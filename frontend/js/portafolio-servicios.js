const API_URL = "http://localhost:3001/api/gallery/public/sections";
const sectionsGrid = document.getElementById("sectionsGrid");

function crearTarjetaSeccion(section) {
  return `
    <article class="gallery-section-card">
      <a href="./portafolio-servicios-detalle.html?categoria_id=${section.id}&nombre=${encodeURIComponent(section.nombre)}" class="gallery-section-link">
        <div class="gallery-section-image-wrap">
          ${
            section.portada
              ? `<img src="http://localhost:3001/uploads/${section.portada}" alt="${section.nombre}" class="gallery-section-image" />`
              : `<div class="gallery-section-placeholder">Sin portada</div>`
          }
        </div>

        <div class="gallery-section-content">
          <div class="gallery-section-top">
            <h3>${section.nombre}</h3>
            <span class="event-chip">${section.total_fotos || 0} foto${Number(section.total_fotos) === 1 ? "" : "s"}</span>
          </div>

          <p>Descubre montajes y referencias visuales de esta sección.</p>
          <span class="gallery-section-cta">Ver sección</span>
        </div>
      </a>
    </article>
  `;
}

async function cargarSeccionesGaleria() {
  if (!sectionsGrid) return;

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudieron cargar las secciones");
    }

    if (!Array.isArray(data) || !data.length) {
      sectionsGrid.innerHTML = `
        <div class="empty-state-card">
          <h3>Sin secciones</h3>
          <p>Aún no hay categorías con contenido.</p>
        </div>
      `;
      return;
    }

    sectionsGrid.innerHTML = data.map(crearTarjetaSeccion).join("");
  } catch (error) {
    console.error("ERROR CARGANDO SECCIONES:", error);
    sectionsGrid.innerHTML = `
      <div class="empty-state-card">
        <h3>Error</h3>
        <p>No se pudieron cargar las secciones.</p>
      </div>
    `;
  }
}

cargarSeccionesGaleria();