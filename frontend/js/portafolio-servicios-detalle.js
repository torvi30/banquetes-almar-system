const params = new URLSearchParams(window.location.search);
const categoriaId = params.get("categoria_id");
const nombre = params.get("nombre");

const detalleTitulo = document.getElementById("detalleTitulo");
const detalleTexto = document.getElementById("detalleTexto");
const publicGalleryGrid = document.getElementById("publicGalleryGrid");

if (detalleTitulo) {
  detalleTitulo.textContent = nombre || "Servicio";
}

if (detalleTexto) {
  detalleTexto.textContent = nombre
    ? `Explora todas las imágenes de la sección ${nombre}.`
    : "Explora todas las imágenes de esta categoría.";
}

async function cargarDetalleGaleria() {
  if (!publicGalleryGrid) return;

  try {
    const url = categoriaId
      ? `http://localhost:3001/api/gallery/public/items?categoria_id=${categoriaId}`
      : `http://localhost:3001/api/gallery/public/items`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo cargar la galería");
    }

    if (!Array.isArray(data) || !data.length) {
      publicGalleryGrid.innerHTML = `
        <div class="empty-state-card">
          <h3>Sin imágenes</h3>
          <p>No hay imágenes en esta sección.</p>
        </div>
      `;
      return;
    }

    publicGalleryGrid.innerHTML = data.map(item => `
      <article class="gallery-card-pro gallery-card-public gallery-detail-card">
        <div class="gallery-card-image-wrap gallery-detail-image-wrap">
          <img
            src="http://localhost:3001/uploads/${item.imagen}"
            alt="${item.titulo || "Imagen"}"
            class="gallery-card-image public-gallery-view"
            data-imagen="http://localhost:3001/uploads/${item.imagen}"
            data-titulo="${item.titulo || "Imagen"}"
            data-descripcion="${item.descripcion || ""}"
          />
        </div>

        <div class="gallery-card-content gallery-detail-content">
          <span class="event-chip">${item.categoria_nombre || "Sin categoría"}</span>
          <h3>${item.titulo || "Sin título"}</h3>
          <p>${item.descripcion || "Sin descripción"}</p>

          <button
            type="button"
            class="btn btn-secondary public-gallery-open-btn public-gallery-view"
            data-imagen="http://localhost:3001/uploads/${item.imagen}"
            data-titulo="${item.titulo || "Imagen"}"
            data-descripcion="${item.descripcion || ""}"
          >
            Ver imagen
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
    console.error("ERROR DETALLE GALERÍA:", error);
    publicGalleryGrid.innerHTML = `
      <div class="empty-state-card">
        <h3>Error</h3>
        <p>No se pudieron cargar las imágenes.</p>
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

cargarDetalleGaleria();