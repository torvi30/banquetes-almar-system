/**
 * Gestión de Galería y Portafolio - Banquetes Almar (Marinilla, Antioquia)
 * Conectado a dbService (Firestore / Firebase).
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

const galleryForm = document.getElementById("galleryForm");
const galleryTitle = document.getElementById("galleryTitle");
const categoriaId = document.getElementById("categoriaId");
const galleryDescription = document.getElementById("galleryDescription");
const galleryImage = document.getElementById("galleryImage");
const imagePreview = document.getElementById("imagePreview");
const previewPlaceholder = document.getElementById("previewPlaceholder");
const galleryGrid = document.getElementById("galleryGrid");
const logoutBtn = document.getElementById("logoutBtn");

let galleryCache = [];

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

function renderGaleria(items) {
  if (!galleryGrid) return;

  if (!items.length) {
    galleryGrid.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-soft); grid-column: 1 / -1;">
        <h3>No hay fotos en la galería</h3>
        <p>Sube las fotos de tus eventos en Marinilla para mostrarlas en la web.</p>
      </div>
    `;
    return;
  }

  galleryGrid.innerHTML = items.map(item => `
    <article class="gallery-photo-card" style="background: rgba(22, 22, 22, 0.9); border: 1px solid var(--border-glass); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1rem;">
      <div style="height: 180px; position: relative;">
        <img src="${item.imagen}" alt="${item.titulo}" style="width: 100%; height: 100%; object-fit: cover;" />
        <span style="position: absolute; top: 0.6rem; right: 0.6rem; background: rgba(0,0,0,0.8); color: var(--gold-light); font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 4px;">
          ${item.categoria || "Eventos"}
        </span>
      </div>
      <div style="padding: 1rem;">
        <h4 style="color: #fff; font-size: 1rem; margin-bottom: 0.3rem;">${item.titulo}</h4>
        <p style="color: var(--text-soft); font-size: 0.82rem; margin-bottom: 0.8rem;">${item.descripcion || ""}</p>
        <button class="btn btn-secondary btn-sm delete-gallery-btn" data-id="${item.id}" style="color: #e74c3c; width: 100%;">
          Eliminar foto
        </button>
      </div>
    </article>
  `).join("");

  galleryGrid.querySelectorAll(".delete-gallery-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const confirm = await Swal.fire({
        title: "¿Eliminar fotografía?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (confirm.isConfirmed) {
        let items = await dbService.getGallery();
        items = items.filter(i => i.id !== id);
        localStorage.setItem("almar_galeria", JSON.stringify(items));
        await cargarGaleria();
        Swal.fire("Eliminada", "La fotografía ha sido retirada.", "success");
      }
    });
  });
}

// Vista previa de imagen si es URL o archivo
if (galleryImage) {
  galleryImage.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (imagePreview) {
          imagePreview.src = ev.target.result;
          imagePreview.style.display = "block";
        }
        if (previewPlaceholder) previewPlaceholder.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  });
}

if (galleryForm) {
  galleryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = galleryTitle?.value.trim() || "Evento Banquetes Almar";
    const categoria = categoriaId?.value || "Bodas";
    const descripcion = galleryDescription?.value.trim() || "";
    const imagenSrc = imagePreview?.src || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";

    await dbService.addGalleryItem({
      titulo,
      categoria,
      descripcion,
      imagen: imagenSrc
    });

    Swal.fire("Foto agregada", "La imagen se publicó en la galería.", "success");
    galleryForm.reset();
    if (imagePreview) imagePreview.style.display = "none";
    if (previewPlaceholder) previewPlaceholder.style.display = "block";
    await cargarGaleria();
  });
}

async function cargarGaleria() {
  try {
    const items = await dbService.getGallery();
    galleryCache = items;
    renderGaleria(items);
  } catch (error) {
    console.error("Error cargando galería:", error);
  }
}

cargarGaleria();