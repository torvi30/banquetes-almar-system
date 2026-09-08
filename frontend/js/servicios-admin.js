/**
 * Gestión de Servicios Admin - Banquetes Almar (Marinilla, Antioquia)
 * Conectado a dbService (Firestore / Firebase con persistencia local).
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

const form = document.getElementById("serviceForm");
const grid = document.getElementById("servicesGrid");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveServiceBtn = document.getElementById("saveServiceBtn");
const formTitle = document.getElementById("formTitle");
const servicesCount = document.getElementById("servicesCount");

const serviceIdInput = document.getElementById("serviceId");
const serviceCurrentImage = document.getElementById("serviceCurrentImage");
const tituloInput = document.getElementById("titulo");
const categoriaInput = document.getElementById("categoria");
const descripcionInput = document.getElementById("descripcion");
const imagenInput = document.getElementById("imagen");
const imagenUrlInput = document.getElementById("imagenUrl");
const previewWrapper = document.getElementById("previewWrapper");
const imagePreview = document.getElementById("imagePreview");
const searchInput = document.getElementById("searchServiceInput");
const filterCategorySelect = document.getElementById("filterCategorySelect");

let servicesCache = [];
let base64Preview = "";

// Cerrar sesión
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

// Vista previa de imagen seleccionada
function setPreview(src) {
  if (src && src.trim()) {
    imagePreview.src = src;
    previewWrapper.style.display = "block";
  } else {
    imagePreview.src = "";
    previewWrapper.style.display = "none";
  }
}

if (imagenInput) {
  imagenInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        base64Preview = event.target.result;
        setPreview(base64Preview);
      };
      reader.readAsDataURL(file);
    }
  });
}

if (imagenUrlInput) {
  imagenUrlInput.addEventListener("input", () => {
    if (imagenUrlInput.value.trim()) {
      base64Preview = "";
      setPreview(imagenUrlInput.value.trim());
    } else if (serviceCurrentImage.value) {
      setPreview(serviceCurrentImage.value);
    } else {
      setPreview("");
    }
  });
}

function limpiarFormulario() {
  if (serviceIdInput) serviceIdInput.value = "";
  if (serviceCurrentImage) serviceCurrentImage.value = "";
  if (tituloInput) tituloInput.value = "";
  if (categoriaInput) categoriaInput.value = "Catering";
  if (descripcionInput) descripcionInput.value = "";
  if (imagenInput) imagenInput.value = "";
  if (imagenUrlInput) imagenUrlInput.value = "";
  base64Preview = "";
  setPreview("");

  if (saveServiceBtn) saveServiceBtn.textContent = "Guardar servicio";
  if (formTitle) formTitle.textContent = "Agregar nuevo servicio";
  if (cancelEditBtn) cancelEditBtn.style.display = "none";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", limpiarFormulario);
}

function getCategoryBadge(cat) {
  const c = (cat || "").toLowerCase();
  if (c.includes("cater")) return { icon: "🍽️", label: "Catering" };
  if (c.includes("decor") || c.includes("flor")) return { icon: "💐", label: "Decoración" };
  if (c.includes("mobil") || c.includes("silla")) return { icon: "🪑", label: "Mobiliario" };
  if (c.includes("loca") || c.includes("salón") || c.includes("finca")) return { icon: "🏛️", label: "Locación" };
  if (c.includes("prod") || c.includes("dj") || c.includes("sonido")) return { icon: "🎵", label: "Producción" };
  if (c.includes("proto") || c.includes("mesero")) return { icon: "🤵", label: "Protocolo" };
  return { icon: "✨", label: cat || "Servicio" };
}

function renderServices(items) {
  if (!grid) return;

  if (servicesCount) {
    servicesCount.textContent = `${items.length} servicio${items.length === 1 ? "" : "s"} registrado${items.length === 1 ? "" : "s"}`;
  }

  if (!items.length) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; color: var(--apple-text-secondary); background: #111115; border-radius: 18px; border: 1px dashed var(--apple-border);">
        <span style="font-size: 2.8rem; display: block; margin-bottom: 0.8rem;">✨</span>
        <h3 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.4rem;">No se encontraron servicios</h3>
        <p style="font-size: 0.9rem;">Agrega un nuevo servicio o prueba cambiando los filtros de búsqueda.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => {
    const badge = getCategoryBadge(item.categoria);
    const imgUrl = item.imagen || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";

    return `
      <article class="service-card" style="background: #111115; border: 1px solid var(--apple-border); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
        <div style="position: relative; width: 100%; height: 190px; background: #070709; overflow: hidden;">
          <img src="${imgUrl}" alt="${item.titulo}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;" loading="lazy" />
          <span style="position: absolute; top: 12px; left: 12px; background: rgba(10, 10, 14, 0.88); backdrop-filter: blur(8px); border: 1px solid rgba(212, 175, 55, 0.35); color: var(--gold-light); font-size: 0.76rem; font-weight: 600; padding: 4px 12px; border-radius: 999px;">
            ${badge.icon} ${badge.label}
          </span>
        </div>

        <div style="padding: 1.3rem; display: flex; flex-direction: column; flex-grow: 1;">
          <h3 style="color: #fff; font-family: 'Playfair Display', serif; font-size: 1.2rem; margin: 0 0 0.5rem 0; line-height: 1.35;">${item.titulo}</h3>
          <p style="color: var(--apple-text-secondary); font-size: 0.86rem; line-height: 1.55; margin: 0 0 1.2rem 0; flex-grow: 1;">${item.descripcion || ""}</p>

          <div style="display: flex; gap: 0.6rem; padding-top: 0.8rem; border-top: 1px solid rgba(255,255,255,0.06);">
            <button class="btn btn-secondary btn-sm edit-btn" data-id="${item.id}" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0.6rem 0.8rem;">
              ✏️ Editar
            </button>
            <button class="btn btn-secondary btn-sm delete-btn" data-id="${item.id}" style="color: #ff6b6b; padding: 0.6rem 0.9rem;" title="Eliminar servicio">
              🗑️
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  // Conectar botones de edición
  grid.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const item = servicesCache.find(s => String(s.id) === String(id));
      if (!item) return;

      serviceIdInput.value = item.id;
      serviceCurrentImage.value = item.imagen || "";
      tituloInput.value = item.titulo || "";
      if (categoriaInput) categoriaInput.value = item.categoria || "Catering";
      descripcionInput.value = item.descripcion || "";
      if (imagenUrlInput) imagenUrlInput.value = item.imagen && item.imagen.startsWith("http") ? item.imagen : "";

      base64Preview = "";
      setPreview(item.imagen || "");

      saveServiceBtn.textContent = "Actualizar servicio";
      formTitle.textContent = `Editar: "${item.titulo}"`;
      cancelEditBtn.style.display = "inline-block";

      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Conectar botones de eliminación
  grid.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const item = servicesCache.find(s => String(s.id) === String(id));
      const nombre = item ? item.titulo : "este servicio";

      const confirmacion = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar servicio?",
        text: `¿Estás seguro de que deseas eliminar "${nombre}"?`,
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (!confirmacion.isConfirmed) return;

      try {
        await dbService.deleteService(id);
        Swal.fire({
          icon: "success",
          title: "Servicio eliminado",
          timer: 1500,
          showConfirmButton: false
        });
        await cargarServiciosAdmin();
      } catch (err) {
        console.error("Error eliminando servicio:", err);
        Swal.fire({
          icon: "error",
          title: "Error al eliminar",
          text: err.message || "No se pudo eliminar el servicio."
        });
      }
    });
  });
}

function filtrarServicios() {
  const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
  const cat = filterCategorySelect ? filterCategorySelect.value : "Todos";

  let filtrados = servicesCache;

  if (cat !== "Todos") {
    filtrados = filtrados.filter(s => (s.categoria || "").toLowerCase().includes(cat.toLowerCase()));
  }

  if (query) {
    filtrados = filtrados.filter(s =>
      (s.titulo || "").toLowerCase().includes(query) ||
      (s.descripcion || "").toLowerCase().includes(query) ||
      (s.categoria || "").toLowerCase().includes(query)
    );
  }

  renderServices(filtrados);
}

if (searchInput) searchInput.addEventListener("input", filtrarServicios);
if (filterCategorySelect) filterCategorySelect.addEventListener("change", filtrarServicios);

async function cargarServiciosAdmin() {
  try {
    servicesCache = await dbService.getServices();
    filtrarServicios();
  } catch (error) {
    console.error("ERROR CARGANDO SERVICIOS ADMIN:", error);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: #ff6b6b; background: rgba(255,107,107,0.08); border-radius: 14px;">
        <p style="font-weight: 600; margin-bottom: 0.5rem;">Error al sincronizar servicios.</p>
        <p style="font-size: 0.85rem; color: var(--apple-text-secondary);">${error.message || "Intenta recargar la página."}</p>
      </div>
    `;
  }
}

// Guardar / Actualizar servicio
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = serviceIdInput.value;
  const titulo = tituloInput.value.trim();
  const categoria = categoriaInput.value;
  const descripcion = descripcionInput.value.trim();

  let finalImage = base64Preview || (imagenUrlInput ? imagenUrlInput.value.trim() : "") || serviceCurrentImage.value;

  if (!finalImage) {
    // Si no se proporcionó imagen, asignar una por defecto según categoría
    const badge = getCategoryBadge(categoria);
    if (badge.label === "Catering") finalImage = "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80";
    else if (badge.label === "Decoración") finalImage = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";
    else if (badge.label === "Mobiliario") finalImage = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80";
    else if (badge.label === "Locación") finalImage = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80";
    else finalImage = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80";
  }

  const payload = {
    titulo,
    categoria,
    descripcion,
    imagen: finalImage
  };

  try {
    saveServiceBtn.disabled = true;
    saveServiceBtn.textContent = "Guardando...";

    if (id) {
      await dbService.updateService(id, payload);
      Swal.fire({
        icon: "success",
        title: "¡Servicio actualizado!",
        text: `El servicio "${titulo}" se ha actualizado con éxito.`,
        timer: 1800,
        showConfirmButton: false
      });
    } else {
      await dbService.addService(payload);
      Swal.fire({
        icon: "success",
        title: "¡Servicio publicado!",
        text: `El servicio "${titulo}" se ha agregado al catálogo.`,
        timer: 1800,
        showConfirmButton: false
      });
    }

    limpiarFormulario();
    await cargarServiciosAdmin();
  } catch (err) {
    console.error("Error guardando servicio:", err);
    Swal.fire({
      icon: "error",
      title: "Error al guardar",
      text: err.message || "Ocurrió un fallo al guardar el servicio."
    });
  } finally {
    saveServiceBtn.disabled = false;
    saveServiceBtn.textContent = id ? "Actualizar servicio" : "Guardar servicio";
  }
});

// Inicializar
cargarServiciosAdmin();