const API_URL = "http://localhost:3001/api/gallery";
const token = localStorage.getItem("token");

const categoryForm = document.getElementById("categoryForm");
const categoryName = document.getElementById("categoryName");
const categoriesList = document.getElementById("categoriesList");

const galleryForm = document.getElementById("galleryForm");
const galleryId = document.getElementById("galleryId");
const categoriaId = document.getElementById("categoriaId");
const galleryTitle = document.getElementById("galleryTitle");
const galleryDescription = document.getElementById("galleryDescription");
const galleryImage = document.getElementById("galleryImage");
const imagePreview = document.getElementById("imagePreview");
const previewPlaceholder = document.getElementById("previewPlaceholder");
const saveGalleryBtn = document.getElementById("saveGalleryBtn");
const cancelGalleryEditBtn = document.getElementById("cancelGalleryEditBtn");

const filterCategory = document.getElementById("filterCategory");
const searchGallery = document.getElementById("searchGallery");
const galleryGrid = document.getElementById("galleryGrid");
const logoutBtn = document.getElementById("logoutBtn");

let categoriesCache = [];
let galleryCache = [];

if (!token) {
  Swal.fire({
    icon: "warning",
    title: "Sesión expirada",
    text: "Debes iniciar sesión nuevamente."
  }).then(() => {
    window.location.href = "./login.html";
  });
}

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    ...extra
  };
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

function limpiarFormularioGaleria() {
  galleryId.value = "";
  categoriaId.value = "";
  galleryTitle.value = "";
  galleryDescription.value = "";
  galleryImage.value = "";
  saveGalleryBtn.textContent = "Guardar imagen";
  imagePreview.style.display = "none";
  imagePreview.src = "";
  previewPlaceholder.style.display = "block";
  previewPlaceholder.textContent = "Sin imagen seleccionada";
}

cancelGalleryEditBtn.addEventListener("click", async () => {
  limpiarFormularioGaleria();

  await Swal.fire({
    icon: "info",
    title: "Edición cancelada",
    timer: 900,
    showConfirmButton: false
  });
});

galleryImage.addEventListener("change", () => {
  const file = galleryImage.files[0];

  if (!file) {
    imagePreview.style.display = "none";
    imagePreview.src = "";
    previewPlaceholder.style.display = "block";
    previewPlaceholder.textContent = "Sin imagen seleccionada";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = "block";
    previewPlaceholder.style.display = "none";
  };
  reader.readAsDataURL(file);
});

async function cargarCategorias() {
  const res = await fetch(`${API_URL}/categories`, {
    headers: authHeaders()
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "No se pudieron cargar las categorías");
  }

  categoriesCache = Array.isArray(data) ? data : [];

  categoriaId.innerHTML = `<option value="">Sin categoría</option>`;
  filterCategory.innerHTML = `<option value="">Todas</option>`;

  categoriesCache.forEach(cat => {
    categoriaId.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
    filterCategory.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
  });

  categoriesList.innerHTML = categoriesCache.length
    ? categoriesCache.map(cat => `
        <article class="dashboard-item">
          <div class="dashboard-item-top">
            <div>
              <h4>${cat.nombre}</h4>
              <p>ID: ${cat.id}</p>
            </div>
          </div>
        </article>
      `).join("")
    : `<div class="dashboard-empty"><h4>Sin categorías</h4><p>No hay categorías creadas.</p></div>`;
}

async function cargarGaleria() {
  const res = await fetch(API_URL, {
    headers: authHeaders()
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "No se pudo cargar la galería");
  }

  galleryCache = Array.isArray(data) ? data : [];
  renderGaleria();
}

function filtrarGaleria() {
  const categoria = filterCategory.value;
  const texto = String(searchGallery.value || "").toLowerCase().trim();

  return galleryCache.filter(item => {
    const matchCategoria = !categoria || String(item.categoria_id || "") === String(categoria);
    const matchTexto =
      !texto ||
      String(item.titulo || "").toLowerCase().includes(texto) ||
      String(item.descripcion || "").toLowerCase().includes(texto) ||
      String(item.categoria_nombre || "").toLowerCase().includes(texto);

    return matchCategoria && matchTexto;
  });
}

function renderGaleria() {
  const lista = filtrarGaleria();

  if (!lista.length) {
    galleryGrid.innerHTML = `
      <div class="empty-state-card">
        <h3>Sin imágenes</h3>
        <p>No hay imágenes registradas con esos filtros.</p>
      </div>
    `;
    return;
  }

  galleryGrid.innerHTML = lista.map(item => `
    <article class="gallery-card-pro">
      <div class="gallery-card-image-wrap">
        <img
          src="http://localhost:3001/uploads/${item.imagen}"
          alt="${item.titulo}"
          class="gallery-card-image"
          data-view="${item.id}"
        />
        <div class="gallery-card-overlay">
          <button class="btn btn-secondary gallery-view-btn" data-view="${item.id}" type="button">Ver</button>
        </div>
      </div>

      <div class="gallery-card-content">
        <span class="event-chip">${item.categoria_nombre || "Sin categoría"}</span>
        <h3>${item.titulo || "Sin título"}</h3>
        <p>${item.descripcion || "Sin descripción"}</p>

        <div class="quote-card-actions">
          <button class="btn btn-success edit-gallery-btn" data-id="${item.id}" type="button">Editar</button>
          <button class="btn btn-danger delete-gallery-btn" data-id="${item.id}" type="button">Eliminar</button>
        </div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".gallery-view-btn, .gallery-card-image").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = galleryCache.find(g => String(g.id) === String(btn.dataset.view || btn.getAttribute("data-view")));
      if (!item) return;

      Swal.fire({
        title: item.titulo || "Imagen",
        html: `
          <div style="text-align:left;">
            <img src="http://localhost:3001/uploads/${item.imagen}" alt="${item.titulo}" style="width:100%; max-height:420px; object-fit:cover; border-radius:14px; margin-bottom:14px;" />
            <p><strong>Categoría:</strong> ${item.categoria_nombre || "Sin categoría"}</p>
            <p><strong>Descripción:</strong> ${item.descripcion || "Sin descripción"}</p>
          </div>
        `,
        width: 760,
        confirmButtonText: "Cerrar"
      });
    });
  });

  document.querySelectorAll(".edit-gallery-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const item = galleryCache.find(g => String(g.id) === String(btn.dataset.id));
      if (!item) return;

      galleryId.value = item.id;
      categoriaId.value = item.categoria_id || "";
      galleryTitle.value = item.titulo || "";
      galleryDescription.value = item.descripcion || "";
      saveGalleryBtn.textContent = "Actualizar imagen";

      imagePreview.src = `http://localhost:3001/uploads/${item.imagen}`;
      imagePreview.style.display = "block";
      previewPlaceholder.style.display = "none";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      await Swal.fire({
        icon: "info",
        title: "Imagen cargada",
        text: "Ya puedes editar la imagen.",
        timer: 1100,
        showConfirmButton: false
      });
    });
  });

  document.querySelectorAll(".delete-gallery-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const confirmar = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar imagen?",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (!confirmar.isConfirmed) return;

      const res = await fetch(`${API_URL}/${btn.dataset.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire("Error", data.message || "No se pudo eliminar", "error");
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Imagen eliminada",
        timer: 1000,
        showConfirmButton: false
      });

      await cargarGaleria();
    });
  });
}

categoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const res = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: authHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        nombre: categoryName.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo crear la categoría");
    }

    await Swal.fire({
      icon: "success",
      title: "Categoría creada",
      timer: 1000,
      showConfirmButton: false
    });

    categoryName.value = "";
    await cargarCategorias();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
});

galleryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const id = galleryId.value;

    const formData = new FormData();
    formData.append("categoria_id", categoriaId.value || "");
    formData.append("titulo", galleryTitle.value || "");
    formData.append("descripcion", galleryDescription.value || "");

    if (galleryImage.files[0]) {
      formData.append("imagen", galleryImage.files[0]);
    }

    let res;

    if (id) {
      res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: formData
      });
    } else {
      if (!galleryImage.files[0]) {
        Swal.fire({
          icon: "warning",
          title: "Imagen obligatoria",
          text: "Debes seleccionar una imagen."
        });
        return;
      }

      res = await fetch(API_URL, {
        method: "POST",
        headers: authHeaders(),
        body: formData
      });
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo guardar la imagen");
    }

    await Swal.fire({
      icon: "success",
      title: id ? "Imagen actualizada" : "Imagen subida",
      timer: 1100,
      showConfirmButton: false
    });

    limpiarFormularioGaleria();
    await cargarGaleria();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
});

filterCategory.addEventListener("change", renderGaleria);
searchGallery.addEventListener("input", renderGaleria);

(async function init() {
  try {
    await cargarCategorias();
    await cargarGaleria();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
})();