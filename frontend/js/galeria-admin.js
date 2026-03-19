const token = localStorage.getItem("token");
const form = document.getElementById("galleryForm");
const grid = document.getElementById("galleryGrid");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveGalleryBtn = document.getElementById("saveGalleryBtn");

const galleryIdInput = document.getElementById("galleryId");
const tituloInput = document.getElementById("titulo");
const seccionInput = document.getElementById("seccion");
const imagenInput = document.getElementById("imagen");

if (!token) {
  alert("Debes iniciar sesión primero.");
  window.location.href = "./login.html";
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

function limpiarFormulario() {
  galleryIdInput.value = "";
  tituloInput.value = "";
  seccionInput.value = "";
  imagenInput.value = "";
  saveGalleryBtn.textContent = "Subir imagen";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    limpiarFormulario();
  });
}

async function cargarGaleria() {
  try {
    const res = await fetch("http://localhost:3001/api/gallery");
    const data = await res.json();

    grid.innerHTML = "";

    if (!Array.isArray(data) || !data.length) {
      grid.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay imágenes aún</h3>
          <p>Sube la primera imagen de la galería.</p>
        </div>
      `;
      return;
    }

    data.forEach((item) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      card.innerHTML = `
        <img 
          src="http://localhost:3001/uploads/${item.imagen}" 
          alt="${item.titulo}"
          style="width:100%; height:220px; object-fit:cover; border-radius:16px; margin-bottom:1rem;"
        >
        <h3>${item.titulo}</h3>
        <p><strong>Sección:</strong> ${item.seccion || "Sin sección"}</p>

        <div class="quote-card-actions">
          <button class="btn btn-success edit-gallery-btn" data-id="${item.id}">
            Editar
          </button>
          <button class="btn btn-danger delete-gallery-btn" data-id="${item.id}">
            Eliminar
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    document.querySelectorAll(".delete-gallery-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        await eliminarImagen(button.dataset.id);
      });
    });

    document.querySelectorAll(".edit-gallery-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const item = data.find(g => String(g.id) === String(button.dataset.id));
        if (item) {
          cargarImagenEnFormulario(item);
        }
      });
    });

  } catch (error) {
    console.error("ERROR CARGAR GALERIA:", error);
    alert("No se pudo cargar la galería.");
  }
}

function cargarImagenEnFormulario(item) {
  galleryIdInput.value = item.id;
  tituloInput.value = item.titulo || "";
  seccionInput.value = item.seccion || "";
  saveGalleryBtn.textContent = "Actualizar imagen";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function eliminarImagen(id) {
  const confirmar = confirm("¿Eliminar imagen?");
  if (!confirmar) return;

  try {
    const res = await fetch(`http://localhost:3001/api/gallery/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al eliminar imagen");
    }

    alert("Imagen eliminada correctamente.");
    await cargarGaleria();
  } catch (error) {
    console.error("ERROR ELIMINAR GALERIA:", error);
    alert(error.message);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = galleryIdInput.value;
  const imagenFile = imagenInput.files[0];

  const formData = new FormData();
  formData.append("titulo", tituloInput.value);
  formData.append("seccion", seccionInput.value);

  if (imagenFile) {
    formData.append("imagen", imagenFile);
  }

  try {
    let res;

    if (id) {
      res = await fetch(`http://localhost:3001/api/gallery/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
    } else {
      if (!imagenFile) {
        alert("Debes seleccionar una imagen.");
        return;
      }

      res = await fetch("http://localhost:3001/api/gallery", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al guardar imagen");
    }

    alert(id ? "Imagen actualizada correctamente." : "Imagen subida correctamente.");
    limpiarFormulario();
    await cargarGaleria();
  } catch (error) {
    console.error("ERROR GUARDAR GALERIA:", error);
    alert(error.message);
  }
});

cargarGaleria();