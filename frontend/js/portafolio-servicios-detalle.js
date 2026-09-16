/**
 * Detalle de Galería de Portafolio - Banquetes Almar
 * Consume los montajes directamente desde Firebase Cloud Firestore NoSQL.
 */

import { dbService } from "./firebase/db.js";

const params = new URLSearchParams(window.location.search);
const categoriaParam = params.get("categoria") || params.get("nombre") || "";

const detalleTitulo = document.getElementById("detalleTitulo");
const detalleTexto = document.getElementById("detalleTexto");
const publicGalleryGrid = document.getElementById("publicGalleryGrid");

if (detalleTitulo) {
  detalleTitulo.textContent = categoriaParam || "Catálogo de Montajes";
}

if (detalleTexto) {
  detalleTexto.textContent = categoriaParam
    ? `Explora los montajes de gala y decoración para ${categoriaParam}.`
    : "Explora todas las fotografías y montajes de Banquetes Almar.";
}

async function cargarDetalleGaleria() {
  if (!publicGalleryGrid) return;

  try {
    const allItems = await dbService.getGallery();

    const data = categoriaParam
      ? allItems.filter(item => String(item.categoria || "").trim().toLowerCase() === categoriaParam.trim().toLowerCase())
      : allItems;

    if (!Array.isArray(data) || !data.length) {
      publicGalleryGrid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <h3>Sin imágenes disponibles</h3>
          <p>Aún no hay fotos registradas para ${categoriaParam || "esta sección"}.</p>
          <a href="./portafolio-servicios.html" class="btn btn-secondary" style="margin-top: 1rem;">← Volver al portafolio</a>
        </div>
      `;
      return;
    }

    publicGalleryGrid.innerHTML = data.map(item => `
      <article class="gallery-card-pro gallery-card-public gallery-detail-card">
        <div class="gallery-card-image-wrap gallery-detail-image-wrap">
          <img
            src="${item.imagen}"
            alt="${item.titulo || "Montaje Almar"}"
            class="gallery-card-image public-gallery-view"
            loading="lazy"
            data-imagen="${item.imagen}"
            data-titulo="${item.titulo || "Montaje Almar"}"
            data-descripcion="${item.descripcion || ""}"
          />
        </div>

        <div class="gallery-card-content gallery-detail-content">
          <span class="event-chip">${item.categoria || "Gala"}</span>
          <h3>${item.titulo || "Montaje de Evento"}</h3>
          <p>${item.descripcion || ""}</p>

          <button
            type="button"
            class="btn btn-secondary public-gallery-open-btn public-gallery-view"
            data-imagen="${item.imagen}"
            data-titulo="${item.titulo || "Montaje Almar"}"
            data-descripcion="${item.descripcion || ""}"
          >
            Ver en alta resolución
          </button>
        </div>
      </article>
    `).join("");

    document.querySelectorAll(".public-gallery-view").forEach(el => {
      el.addEventListener("click", () => {
        abrirModalImagen({
          imagen: el.dataset.imagen,
          titulo: el.dataset.titulo,
          descripcion: el.dataset.descripcion
        });
      });
    });
  } catch (error) {
    console.error("ERROR DETALLE GALERÍA DESDE FIRESTORE:", error);
    publicGalleryGrid.innerHTML = `
      <div class="empty-state-card">
        <h3>Error de conexión</h3>
        <p>No se pudieron cargar las fotos desde Firebase Firestore.</p>
      </div>
    `;
  }
}

function abrirModalImagen(item) {
  let modal = document.getElementById("publicGalleryModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "publicGalleryModal";
    modal.className = "public-gallery-modal";
    modal.innerHTML = `
      <div class="public-gallery-modal-backdrop"></div>
      <div class="public-gallery-modal-content">
        <button class="public-gallery-modal-close" type="button">×</button>
        <img id="publicGalleryModalImg" src="" alt="" />
        <h3 id="publicGalleryModalTitle"></h3>
        <p id="publicGalleryModalDesc"></p>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".public-gallery-modal-close").addEventListener("click", cerrarModalImagen);
    modal.querySelector(".public-gallery-modal-backdrop").addEventListener("click", cerrarModalImagen);
  }

  document.getElementById("publicGalleryModalImg").src = item.imagen;
  document.getElementById("publicGalleryModalTitle").textContent = item.titulo || "";
  document.getElementById("publicGalleryModalDesc").textContent = item.descripcion || "";

  modal.classList.add("show");
}

function cerrarModalImagen() {
  const modal = document.getElementById("publicGalleryModal");
  if (modal) modal.classList.remove("show");
}

document.addEventListener("DOMContentLoaded", cargarDetalleGaleria);