/**
 * Panel de Administración de Paquetes Todo Incluido - Banquetes Almar
 * Permite crear, editar, eliminar y sincronizar en tiempo real con la Landing Page del Cliente.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

// Proteger ruta con autenticación
authService.requireAuth("./login.html");

// Elementos del DOM
const form = document.getElementById("packageForm");
const formTitle = document.getElementById("packageFormTitle");
const grid = document.getElementById("packagesAdminGrid");
const packagesCount = document.getElementById("packagesCount");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditPkgBtn");
const saveBtn = document.getElementById("savePackageBtn");
const resetDefaultsBtn = document.getElementById("resetDefaultsBtn");

// KPIs
const kpiTotalPackages = document.getElementById("kpiTotalPackages");
const kpiAvgPrice = document.getElementById("kpiAvgPrice");
const kpiCategories = document.getElementById("kpiCategories");

// Inputs del formulario
const idInput = document.getElementById("packageId");
const currentImageInput = document.getElementById("packageCurrentImage");
const tituloInput = document.getElementById("pkgTitulo");
const categoriaSelect = document.getElementById("pkgCategoria");
const badgeInput = document.getElementById("pkgBadge");
const precioInput = document.getElementById("pkgPrecio");
const priceFormattedPreview = document.getElementById("priceFormattedPreview");
const minPersonasInput = document.getElementById("pkgMinPersonas");
const imagenUrlInput = document.getElementById("pkgImagenUrl");
const imageFileInput = document.getElementById("pkgImageFile");
const descripcionInput = document.getElementById("pkgDescripcion");

// Preview
const previewWrap = document.getElementById("pkgPreviewWrap");
const imagePreview = document.getElementById("pkgImagePreview");
const badgePreview = document.getElementById("pkgBadgePreview");

// Gestor de inclusiones
const newInclusionInput = document.getElementById("newInclusionInput");
const addInclusionBtn = document.getElementById("addInclusionBtn");
const inclusionsList = document.getElementById("inclusionsList");

// Filtros
const searchInput = document.getElementById("searchPkgInput");
const filterCatSelect = document.getElementById("filterPkgCat");

// Estado en memoria
let packagesCache = [];
let currentInclusions = [];
let fileBase64 = "";

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  initEventListeners();
  await cargarPaquetes();
});

function initEventListeners() {
  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      authService.logout();
      window.location.href = "./login.html";
    });
  }

  // Formato de precio en tiempo real
  if (precioInput) {
    precioInput.addEventListener("input", () => {
      const val = Number(precioInput.value) || 0;
      priceFormattedPreview.textContent = `$${val.toLocaleString("es-CO")} COP / persona`;
    });
  }

  // Previsualización de badge
  if (badgeInput) {
    badgeInput.addEventListener("input", () => {
      const text = badgeInput.value.trim() || "Vista Previa";
      badgePreview.textContent = text;
    });
  }

  // URL manual de imagen
  if (imagenUrlInput) {
    imagenUrlInput.addEventListener("input", () => {
      const url = imagenUrlInput.value.trim();
      if (url) {
        fileBase64 = "";
        setPreviewImage(url);
      } else if (currentImageInput.value) {
        setPreviewImage(currentImageInput.value);
      } else {
        previewWrap.style.display = "none";
      }
    });
  }

  // Subida de imagen local (Base64)
  if (imageFileInput) {
    imageFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          fileBase64 = event.target.result;
          setPreviewImage(fileBase64);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Clic en fotos predeterminadas / recomendadas
  document.querySelectorAll(".preset-photo-thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      document.querySelectorAll(".preset-photo-thumb").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
      imagenUrlInput.value = thumb.src;
      fileBase64 = "";
      setPreviewImage(thumb.src);
    });
  });

  // Agregar inclusión al presionar botón o Enter
  if (addInclusionBtn && newInclusionInput) {
    addInclusionBtn.addEventListener("click", agregarInclusion);
    newInclusionInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        agregarInclusion();
      }
    });
  }

  // Submit del formulario
  if (form) {
    form.addEventListener("submit", guardarPaquete);
  }

  // Cancelar edición
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetearFormulario);
  }

  // Búsqueda y filtros
  if (searchInput) searchInput.addEventListener("input", filtrarPaquetes);
  if (filterCatSelect) filterCatSelect.addEventListener("change", filtrarPaquetes);

  // Restablecer valores predeterminados
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener("click", confirmarRestablecerPredeterminados);
  }
}

// Actualizar vista previa de imagen
function setPreviewImage(src) {
  if (src && src.trim()) {
    imagePreview.src = src;
    badgePreview.textContent = badgeInput.value.trim() || "Paquete Almar";
    previewWrap.style.display = "block";
  } else {
    previewWrap.style.display = "none";
  }
}

// Gestión de inclusiones
function agregarInclusion() {
  const text = newInclusionInput.value.trim();
  if (!text) return;

  currentInclusions.push(text);
  newInclusionInput.value = "";
  renderInclusions();
}

function eliminarInclusion(index) {
  currentInclusions.splice(index, 1);
  renderInclusions();
}

function renderInclusions() {
  if (!inclusionsList) return;

  if (currentInclusions.length === 0) {
    inclusionsList.innerHTML = `<span style="color: #666; font-size: 0.85rem; font-style: italic;">No hay inclusiones añadidas aún. Agrega la primera arriba.</span>`;
    return;
  }

  inclusionsList.innerHTML = currentInclusions.map((inc, i) => `
    <span class="inclusion-item-tag">
      <span>✨ ${escapeHtml(inc)}</span>
      <button type="button" data-idx="${i}" title="Quitar inclusión">×</button>
    </span>
  `).join("");

  inclusionsList.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      eliminarInclusion(idx);
    });
  });
}

// Carga de paquetes desde la base de datos
async function cargarPaquetes() {
  try {
    packagesCache = await dbService.getPackages();
    actualizarKPIs(packagesCache);
    filtrarPaquetes();
  } catch (err) {
    console.error("Error al cargar paquetes:", err);
    packagesCount.textContent = "Error al conectar con la base de datos.";
  }
}

// Actualización de métricas
function actualizarKPIs(list) {
  if (!kpiTotalPackages) return;

  kpiTotalPackages.textContent = list.length;
  
  if (list.length > 0) {
    const sum = list.reduce((acc, p) => acc + (Number(p.precioPorPersona) || 0), 0);
    const avg = Math.round(sum / list.length);
    kpiAvgPrice.textContent = `$${avg.toLocaleString("es-CO")} COP`;

    const uniqueCats = new Set(list.map(p => p.categoria || "otros"));
    kpiCategories.textContent = `${uniqueCats.size} Ocasiones`;
  } else {
    kpiAvgPrice.textContent = "$0";
    kpiCategories.textContent = "0";
  }
}

// Filtrado y renderizado
function filtrarPaquetes() {
  const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
  const cat = filterCatSelect ? filterCatSelect.value : "todos";

  const filtrados = packagesCache.filter(pkg => {
    const coincideTexto = 
      (pkg.titulo || "").toLowerCase().includes(query) ||
      (pkg.descripcion || "").toLowerCase().includes(query) ||
      (pkg.badge || "").toLowerCase().includes(query);

    const coincideCat = (cat === "todos") || ((pkg.categoria || "").toLowerCase() === cat.toLowerCase());

    return coincideTexto && coincideCat;
  });

  renderizarGrilla(filtrados);
}

// Render de la cuadrícula
function renderizarGrilla(list) {
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--apple-card); border-radius: 16px; border: 1px dashed var(--apple-border);">
        <p style="color: var(--apple-gold-light); font-size: 1.2rem; font-family: 'Playfair Display', serif;">No se encontraron paquetes con ese criterio.</p>
        <p style="color: var(--apple-text-secondary); font-size: 0.9rem;">Crea un nuevo paquete arriba o restablece los filtros.</p>
      </div>
    `;
    packagesCount.textContent = "0 paquetes mostrados";
    return;
  }

  packagesCount.textContent = `${list.length} de ${packagesCache.length} paquetes activos en la web`;

  grid.innerHTML = list.map(pkg => `
    <article class="package-card" style="background: var(--apple-card); border-color: var(--apple-border);">
      <div class="package-image-wrap" style="height: 220px;">
        <img src="${pkg.imagen || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}" alt="${escapeHtml(pkg.titulo)}" class="package-image" loading="lazy" />
        <span class="package-badge" style="background: var(--apple-gold-gradient); color: #111;">${escapeHtml(pkg.badge || 'Todo Incluido')}</span>
      </div>
      <div class="package-body">
        <h3 class="package-title" style="font-family: 'Playfair Display', serif; font-size: 1.4rem;">${escapeHtml(pkg.titulo)}</h3>
        <p class="package-desc">${escapeHtml(pkg.descripcion || '')}</p>
        
        <div class="package-price-wrap">
          <span class="price-label">Desde (por invitado)</span>
          <span class="price-val">$${(pkg.precioPorPersona || 0).toLocaleString("es-CO")} COP</span>
        </div>

        <div style="font-size: 0.8rem; color: var(--apple-gold-light); margin-bottom: 0.8rem;">
          👥 Min. sugerido: <strong>${pkg.minimoPersonas || 40} invitados</strong>
        </div>

        <ul class="package-inclusions-list">
          ${(pkg.inclusiones || pkg.inclusions || []).slice(0, 4).map(inc => `<li>${escapeHtml(inc)}</li>`).join("")}
          ${(pkg.inclusiones || []).length > 4 ? `<li style="list-style: none; color: var(--apple-gold-light); font-size: 0.82rem; font-weight: 600;">+ ${(pkg.inclusiones.length - 4)} inclusiones adicionales</li>` : ''}
        </ul>

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button type="button" class="btn btn-secondary edit-pkg-btn" data-id="${pkg.id}" style="flex: 1; padding: 0.65rem; font-size: 0.85rem; border-color: var(--apple-gold);">
            ✏️ Editar
          </button>
          <button type="button" class="btn btn-secondary delete-pkg-btn" data-id="${pkg.id}" style="padding: 0.65rem 0.9rem; font-size: 0.85rem; border-color: rgba(255, 75, 75, 0.4); color: #ff6b6b;">
            🗑️
          </button>
        </div>
      </div>
    </article>
  `).join("");

  // Conectar botones de edición
  grid.querySelectorAll(".edit-pkg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      cargarEnFormulario(id);
    });
  });

  // Conectar botones de eliminación
  grid.querySelectorAll(".delete-pkg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      confirmarEliminarPaquete(id);
    });
  });
}

// Cargar datos en el formulario para edición
function cargarEnFormulario(id) {
  const pkg = packagesCache.find(p => String(p.id) === String(id));
  if (!pkg) return;

  idInput.value = pkg.id;
  currentImageInput.value = pkg.imagen || "";
  tituloInput.value = pkg.titulo || "";
  categoriaSelect.value = pkg.categoria || "bodas";
  badgeInput.value = pkg.badge || "";
  precioInput.value = pkg.precioPorPersona || "";
  minPersonasInput.value = pkg.minimoPersonas || 40;
  descripcionInput.value = pkg.descripcion || "";
  imagenUrlInput.value = pkg.imagen || "";
  fileBase64 = "";

  priceFormattedPreview.textContent = `$${(pkg.precioPorPersona || 0).toLocaleString("es-CO")} COP / persona`;
  setPreviewImage(pkg.imagen || "");

  currentInclusions = Array.isArray(pkg.inclusiones) ? [...pkg.inclusiones] : (Array.isArray(pkg.inclusions) ? [...pkg.inclusions] : []);
  renderInclusions();

  formTitle.textContent = `✏️ Editando: ${pkg.titulo}`;
  saveBtn.textContent = "💾 Actualizar Paquete";
  cancelEditBtn.style.display = "inline-flex";

  // Scroll suave al formulario
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Resetear formulario a estado inicial
function resetearFormulario() {
  form.reset();
  idInput.value = "";
  currentImageInput.value = "";
  fileBase64 = "";
  currentInclusions = [];
  renderInclusions();
  previewWrap.style.display = "none";
  priceFormattedPreview.textContent = "$0 COP / persona";
  formTitle.textContent = "Agregar Nuevo Paquete de Gala";
  saveBtn.textContent = "💾 Guardar y Publicar Paquete";
  cancelEditBtn.style.display = "none";
  document.querySelectorAll(".preset-photo-thumb").forEach(t => t.classList.remove("active"));
}

// Guardar o Actualizar Paquete
async function guardarPaquete(e) {
  e.preventDefault();

  const id = idInput.value;
  const titulo = tituloInput.value.trim();
  const categoria = categoriaSelect.value;
  const badge = badgeInput.value.trim() || "Todo Incluido";
  const precioPorPersona = Number(precioInput.value) || 0;
  const minimoPersonas = Number(minPersonasInput.value) || 40;
  const descripcion = descripcionInput.value.trim();

  // Determinar la imagen final
  let imagen = fileBase64 || imagenUrlInput.value.trim() || currentImageInput.value || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";

  // Validar al menos una inclusión
  if (currentInclusions.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Inclusiones Requeridas",
      text: "Por favor agrega al menos una inclusión (ej: Menú a 3 tiempos, Sillas Tiffany, etc.) para que los clientes vean qué incluye el paquete.",
      confirmButtonColor: "#d4af37"
    });
    return;
  }

  const pkgData = {
    titulo,
    categoria,
    badge,
    precioPorPersona,
    minimoPersonas,
    descripcion,
    imagen,
    inclusiones: currentInclusions
  };

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳ Guardando...";

    if (id) {
      // Actualizar existente
      await dbService.updatePackage(id, pkgData);
      Swal.fire({
        icon: "success",
        title: "¡Paquete Actualizado!",
        text: `El paquete "${titulo}" ha sido actualizado y ya está en vivo en la landing page.`,
        confirmButtonColor: "#d4af37",
        timer: 2000
      });
    } else {
      // Crear nuevo
      await dbService.addPackage(pkgData);
      Swal.fire({
        icon: "success",
        title: "¡Paquete Creado!",
        text: `El nuevo paquete "${titulo}" ha sido publicado exitosamente en la web.`,
        confirmButtonColor: "#d4af37",
        timer: 2000
      });
    }

    resetearFormulario();
    await cargarPaquetes();
  } catch (err) {
    console.error("Error al guardar paquete:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar el paquete. Inténtalo de nuevo.",
      confirmButtonColor: "#d4af37"
    });
  } finally {
    saveBtn.disabled = false;
  }
}

// Confirmar eliminación
async function confirmarEliminarPaquete(id) {
  const pkg = packagesCache.find(p => String(p.id) === String(id));
  if (!pkg) return;

  const result = await Swal.fire({
    title: "¿Eliminar este paquete?",
    text: `Se eliminará "${pkg.titulo}" y dejará de aparecer en la landing page del cliente.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ff4b4b",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (result.isConfirmed) {
    try {
      await dbService.deletePackage(id);
      Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "El paquete fue retirado del catálogo.",
        confirmButtonColor: "#d4af37",
        timer: 1500
      });
      await cargarPaquetes();
    } catch (err) {
      console.error("Error al eliminar paquete:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el paquete.",
        confirmButtonColor: "#d4af37"
      });
    }
  }
}

// Restablecer plantillas predeterminadas de gala
async function confirmarRestablecerPredeterminados() {
  const result = await Swal.fire({
    title: "¿Restablecer paquetes iniciales?",
    text: "Esta acción restaurará la colección oficial de Almar (Boda Imperial, Quinceañera Glam, Grados Soñados).",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#d4af37",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sí, restablecer",
    cancelButtonText: "Cancelar"
  });

  if (result.isConfirmed) {
    try {
      await dbService.resetDefaultPackages();
      Swal.fire({
        icon: "success",
        title: "¡Restablecidos!",
        text: "Se han restaurado los paquetes oficiales de gala.",
        confirmButtonColor: "#d4af37",
        timer: 1800
      });
      await cargarPaquetes();
    } catch (err) {
      console.error("Error al restablecer:", err);
    }
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
