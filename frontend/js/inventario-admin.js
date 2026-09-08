/**
 * Gestión de Inventario y Mobiliario - Banquetes Almar (Marinilla, Antioquia)
 * Conectado a dbService de Firebase con persistencia y edición de alta gama.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

// Elementos del DOM
const form = document.getElementById("inventoryForm");
const categoryForm = document.getElementById("categoryForm");
const newCategoryNameInput = document.getElementById("newCategoryName");
const categoriesChipsList = document.getElementById("categoriesChipsList");

const grid = document.getElementById("inventoryGrid");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveInventoryBtn = document.getElementById("saveInventoryBtn");
const formItemTitle = document.getElementById("formItemTitle");
const inventoryCounter = document.getElementById("inventoryCounter");

const inventoryIdInput = document.getElementById("inventoryId");
const inventoryCurrentImage = document.getElementById("inventoryCurrentImage");
const nombreInput = document.getElementById("nombre");
const categoriaInput = document.getElementById("categoria_id");
const precioInput = document.getElementById("precio");
const unidadInput = document.getElementById("unidad");
const cantidadTotalInput = document.getElementById("cantidad_total");
const cantidadDisponibleInput = document.getElementById("cantidad_disponible");
const descripcionInput = document.getElementById("descripcion");
const imagenInput = document.getElementById("imagen");
const imagenUrlInput = document.getElementById("imagenUrl");
const previewWrapper = document.getElementById("previewWrapper");
const imagePreview = document.getElementById("imagePreview");

const searchInput = document.getElementById("searchInventoryInput");
const filterCategorySelect = document.getElementById("filterCategorySelect");

let inventarioCache = [];
let categoriesCache = [];
let base64Preview = "";

// Cerrar sesión
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

// Icono y etiqueta amigable de categoría
function getCategoryMeta(cat) {
  const c = String(cat || "").toLowerCase();
  if (c.includes("silla")) return { icon: "🪑", name: "Sillas" };
  if (c.includes("mesa") || c.includes("tablón") || c.includes("tablon")) return { icon: "🍽️", name: "Mesas" };
  if (c.includes("carpa") || c.includes("toldo")) return { icon: "⛺", name: "Carpas" };
  if (c.includes("menaje") || c.includes("vajilla") || c.includes("plato") || c.includes("copa")) return { icon: "🍷", name: "Menaje" };
  if (c.includes("mante")) return { icon: "✨", name: "Mantelería" };
  if (c.includes("lounge") || c.includes("sala")) return { icon: "🛋️", name: "Lounge" };
  return { icon: "📦", name: cat || "General" };
}

// Vista previa de imagen
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
    } else if (inventoryCurrentImage.value) {
      setPreview(inventoryCurrentImage.value);
    } else {
      setPreview("");
    }
  });
}

// Limpiar formulario
function limpiarFormulario() {
  if (inventoryIdInput) inventoryIdInput.value = "";
  if (inventoryCurrentImage) inventoryCurrentImage.value = "";
  if (nombreInput) nombreInput.value = "";
  if (categoriaInput && categoriaInput.options.length) categoriaInput.selectedIndex = 0;
  if (precioInput) precioInput.value = "";
  if (unidadInput) unidadInput.value = "día/evento";
  if (cantidadTotalInput) cantidadTotalInput.value = "";
  if (cantidadDisponibleInput) cantidadDisponibleInput.value = "";
  if (descripcionInput) descripcionInput.value = "";
  if (imagenInput) imagenInput.value = "";
  if (imagenUrlInput) imagenUrlInput.value = "";
  base64Preview = "";
  setPreview("");

  if (saveInventoryBtn) saveInventoryBtn.textContent = "Guardar artículo";
  if (formItemTitle) formItemTitle.textContent = "Agregar nuevo artículo";
  if (cancelEditBtn) cancelEditBtn.style.display = "none";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", limpiarFormulario);
}

// ------------------- CARGA Y GESTIÓN DE CATEGORÍAS -------------------
async function cargarCategorias(selectedCategory = null) {
  try {
    categoriesCache = await dbService.getInventoryCategories();

    // 1. Poblar el <select id="categoria_id"> del formulario
    if (categoriaInput) {
      categoriaInput.innerHTML = categoriesCache.map(cat => {
        const meta = getCategoryMeta(cat);
        const isSelected = selectedCategory && selectedCategory.toLowerCase() === cat.toLowerCase();
        return `<option value="${cat}" ${isSelected ? "selected" : ""}>${meta.icon} ${cat}</option>`;
      }).join("");

      // Si selectedCategory fue pasado pero no está en categoriesCache, añadirlo
      if (selectedCategory && !categoriesCache.some(c => c.toLowerCase() === selectedCategory.toLowerCase())) {
        const opt = document.createElement("option");
        opt.value = selectedCategory;
        opt.textContent = `📦 ${selectedCategory}`;
        opt.selected = true;
        categoriaInput.appendChild(opt);
      }
    }

    // 2. Poblar el <select id="filterCategorySelect"> de filtros
    if (filterCategorySelect) {
      const currentFilter = filterCategorySelect.value || "todos";
      filterCategorySelect.innerHTML = `
        <option value="todos" ${currentFilter === "todos" ? "selected" : ""}>Todas las categorías</option>
        ${categoriesCache.map(cat => {
          const meta = getCategoryMeta(cat);
          const isSel = currentFilter.toLowerCase() === cat.toLowerCase();
          return `<option value="${cat}" ${isSel ? "selected" : ""}>${meta.icon} ${cat}</option>`;
        }).join("")}
      `;
    }

    // 3. Renderizar listado de chips en el panel lateral
    renderCategoryChips();
  } catch (err) {
    console.error("Error cargando categorías:", err);
  }
}

function renderCategoryChips() {
  if (!categoriesChipsList) return;

  const counts = {};
  inventarioCache.forEach(item => {
    const c = String(item.categoria || "Otros").toLowerCase();
    counts[c] = (counts[c] || 0) + 1;
  });

  categoriesChipsList.innerHTML = categoriesCache.map(cat => {
    const meta = getCategoryMeta(cat);
    const count = counts[cat.toLowerCase()] || 0;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.18); padding: 0.5rem 0.8rem; border-radius: 8px; font-size: 0.85rem;">
        <span style="color: #fff; display: flex; align-items: center; gap: 6px;">
          ${meta.icon} <strong>${cat}</strong>
        </span>
        <span style="background: rgba(212,175,55,0.2); color: var(--gold-light); padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">
          ${count} items
        </span>
      </div>
    `;
  }).join("");
}

// Evento: Crear nueva categoría
if (categoryForm) {
  categoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newCat = newCategoryNameInput.value.trim();
    if (!newCat) return;

    try {
      await dbService.addInventoryCategory(newCat);
      newCategoryNameInput.value = "";
      await cargarCategorias(newCat);

      Swal.fire({
        icon: "success",
        title: "¡Categoría creada!",
        text: `Se ha agregado "${newCat}" a las categorías de inventario.`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error creando categoría:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo crear la categoría."
      });
    }
  });
}

// ------------------- RENDER CUADRÍCULA DE ITEMS -------------------
function renderInventario(items) {
  if (!grid) return;

  if (inventoryCounter) {
    inventoryCounter.textContent = `${items.length} artículo${items.length === 1 ? "" : "s"} registrado${items.length === 1 ? "" : "s"}`;
  }

  if (!items.length) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; color: var(--apple-text-secondary); background: #111115; border-radius: 18px; border: 1px dashed var(--apple-border);">
        <span style="font-size: 2.8rem; display: block; margin-bottom: 0.8rem;">📦</span>
        <h3 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.4rem;">No se encontraron artículos</h3>
        <p style="font-size: 0.9rem;">Prueba agregando un nuevo elemento o cambiando los filtros de búsqueda.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => {
    const meta = getCategoryMeta(item.categoria);
    const precioFmt = Number(item.precio || 10000).toLocaleString("es-CO");
    const stockTotal = item.stock !== undefined ? item.stock : (item.cantidad_total || 0);
    const stockDisp = item.cantidad_disponible !== undefined ? item.cantidad_disponible : stockTotal;
    const imgUrl = item.imagen || "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80";

    return `
      <article class="service-card" style="background: #111115; border: 1px solid var(--apple-border); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
        <div style="position: relative; width: 100%; height: 190px; background: #070709; overflow: hidden;">
          <img src="${imgUrl}" alt="${item.nombre}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
          <span style="position: absolute; top: 12px; left: 12px; background: rgba(10, 10, 14, 0.88); backdrop-filter: blur(8px); border: 1px solid rgba(212, 175, 55, 0.35); color: var(--gold-light); font-size: 0.76rem; font-weight: 600; padding: 4px 12px; border-radius: 999px;">
            ${meta.icon} ${item.categoria || "Mobiliario"}
          </span>
          <span style="position: absolute; top: 12px; right: 12px; background: rgba(0, 0, 0, 0.75); color: #9df0b5; border: 1px solid rgba(80, 200, 120, 0.4); font-size: 0.76rem; font-weight: 700; padding: 4px 10px; border-radius: 999px;">
            Disp: ${stockDisp} / ${stockTotal}
          </span>
        </div>

        <div style="padding: 1.3rem; display: flex; flex-direction: column; flex-grow: 1;">
          <h3 style="color: #fff; font-family: 'Playfair Display', serif; font-size: 1.2rem; margin: 0 0 0.4rem 0; line-height: 1.35;">${item.nombre}</h3>
          <p style="color: var(--apple-text-secondary); font-size: 0.85rem; line-height: 1.55; margin: 0 0 1rem 0; flex-grow: 1;">${item.descripcion || "Mobiliario exclusivo para eventos y recepciones en Marinilla."}</p>

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.7rem 0.9rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.82rem; display: flex; justify-content: space-between; align-items: center;">
            <span>Tarifa alquiler:</span>
            <strong style="color: var(--gold-light); font-size: 0.95rem;">$${precioFmt} <span style="font-size: 0.75rem; color: #aaa; font-weight: 400;">/ ${item.unidad || 'evento'}</span></strong>
          </div>

          <div style="display: flex; gap: 0.6rem; padding-top: 0.8rem; border-top: 1px solid rgba(255,255,255,0.06);">
            <button class="btn btn-secondary btn-sm edit-inv-btn" data-id="${item.id}" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0.6rem 0.8rem;">
              ✏️ Editar
            </button>
            <button class="btn btn-secondary btn-sm delete-inv-btn" data-id="${item.id}" style="color: #ff6b6b; padding: 0.6rem 0.9rem;" title="Eliminar artículo">
              🗑️
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  // Acciones: Conectar Editar
  grid.querySelectorAll(".edit-inv-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const item = inventarioCache.find(i => String(i.id) === String(id));
      if (!item) return;

      // Actualizar campos
      inventoryIdInput.value = item.id;
      inventoryCurrentImage.value = item.imagen || "";
      nombreInput.value = item.nombre || "";

      // Seleccionar categoría (y añadirla si es necesario)
      if (categoriaInput) {
        let found = false;
        for (let i = 0; i < categoriaInput.options.length; i++) {
          if (categoriaInput.options[i].value.toLowerCase() === String(item.categoria || "").toLowerCase()) {
            categoriaInput.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found && item.categoria) {
          const opt = document.createElement("option");
          opt.value = item.categoria;
          opt.textContent = `📦 ${item.categoria}`;
          opt.selected = true;
          categoriaInput.appendChild(opt);
        }
      }

      precioInput.value = item.precio || 10000;
      unidadInput.value = item.unidad || "día/evento";
      cantidadTotalInput.value = item.stock !== undefined ? item.stock : (item.cantidad_total || 0);
      cantidadDisponibleInput.value = item.cantidad_disponible !== undefined ? item.cantidad_disponible : (item.stock || 0);
      descripcionInput.value = item.descripcion || "";

      base64Preview = "";
      if (imagenUrlInput) imagenUrlInput.value = item.imagen && item.imagen.startsWith("http") ? item.imagen : "";
      setPreview(item.imagen || "");

      saveInventoryBtn.textContent = "Actualizar artículo";
      formItemTitle.textContent = `Editar: "${item.nombre}"`;
      cancelEditBtn.style.display = "inline-block";

      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Acciones: Conectar Eliminar
  grid.querySelectorAll(".delete-inv-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const item = inventarioCache.find(i => String(i.id) === String(id));
      const nombre = item ? item.nombre : "este artículo";

      const confirm = await Swal.fire({
        title: "¿Eliminar artículo?",
        text: `¿Estás seguro de retirar "${nombre}" del inventario?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (confirm.isConfirmed) {
        try {
          await dbService.deleteRentalItem(id);
          Swal.fire({
            icon: "success",
            title: "Artículo eliminado",
            timer: 1500,
            showConfirmButton: false
          });
          await cargarInventario();
        } catch (err) {
          console.error("Error eliminando item:", err);
          Swal.fire("Error", "No se pudo eliminar el artículo.", "error");
        }
      }
    });
  });
}

// ------------------- FILTRADO EN TIEMPO REAL -------------------
function filtrarInventario() {
  const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
  const cat = filterCategorySelect ? filterCategorySelect.value : "todos";

  let filtrados = inventarioCache;

  if (cat !== "todos") {
    filtrados = filtrados.filter(item => String(item.categoria || "").toLowerCase() === cat.toLowerCase());
  }

  if (query) {
    filtrados = filtrados.filter(item =>
      String(item.nombre || "").toLowerCase().includes(query) ||
      String(item.descripcion || "").toLowerCase().includes(query) ||
      String(item.categoria || "").toLowerCase().includes(query)
    );
  }

  renderInventario(filtrados);
}

if (searchInput) searchInput.addEventListener("input", filtrarInventario);
if (filterCategorySelect) filterCategorySelect.addEventListener("change", filtrarInventario);

// ------------------- CARGA PRINCIPAL -------------------
async function cargarInventario() {
  try {
    const items = await dbService.getRentalItems();
    inventarioCache = items;
    await cargarCategorias();
    filtrarInventario();
  } catch (error) {
    console.error("Error cargando inventario:", error);
  }
}

// ------------------- GUARDAR / ACTUALIZAR ARTÍCULO -------------------
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = inventoryIdInput?.value;
    const nombre = nombreInput?.value.trim();
    const categoria = categoriaInput?.value || "Sillas";
    const precio = Number(precioInput?.value) || 10000;
    const unidad = unidadInput?.value.trim() || "día/evento";
    const stockTotal = parseInt(cantidadTotalInput?.value || "10", 10);
    const stockDisp = parseInt(cantidadDisponibleInput?.value || String(stockTotal), 10);
    const descripcion = descripcionInput?.value.trim() || "";

    // Foto: Priorizar nueva subida o URL, o conservar la imagen anterior
    let finalImage = base64Preview || (imagenUrlInput ? imagenUrlInput.value.trim() : "") || inventoryCurrentImage.value;
    if (!finalImage) {
      finalImage = "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80";
    }

    const payload = {
      id: id || ("mob-" + Date.now()),
      nombre,
      categoria,
      precio,
      unidad,
      stock: stockTotal,
      cantidad_total: stockTotal,
      cantidad_disponible: stockDisp,
      descripcion,
      imagen: finalImage
    };

    try {
      saveInventoryBtn.disabled = true;
      saveInventoryBtn.textContent = "Guardando...";

      await dbService.saveRentalItem(payload);

      Swal.fire({
        icon: "success",
        title: id ? "¡Artículo actualizado!" : "¡Artículo guardado!",
        text: `"${nombre}" está listo en el catálogo de inventario.`,
        timer: 1600,
        showConfirmButton: false
      });

      limpiarFormulario();
      await cargarInventario();
    } catch (err) {
      console.error("Error guardando artículo:", err);
      Swal.fire("Error al guardar", err.message || "No se pudo guardar el artículo.", "error");
    } finally {
      saveInventoryBtn.disabled = false;
      saveInventoryBtn.textContent = id ? "Actualizar artículo" : "Guardar artículo";
    }
  });
}

// Inicialización
cargarInventario();