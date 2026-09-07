/**
 * Gestión de Galería y Portafolio - Banquetes Almar (Marinilla, Antioquia)
 * Conectado a dbService (Firestore / Firebase + Fallback local).
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

// Curated high-resolution banquet presets for instant default display
const DEFAULT_IMAGES_BY_CATEGORY = {
  "Bodas": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  "15 Años": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
  "Salón Marinilla": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
  "Finca El Peñol": "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
  "Mobiliario": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
  "Catering": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
  "Eventos Corporativos": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
};

const GENERAL_DEFAULT_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80";

function getDefaultImageForCategory(catName) {
  if (!catName) return GENERAL_DEFAULT_IMAGE;
  const match = Object.keys(DEFAULT_IMAGES_BY_CATEGORY).find(
    k => k.trim().toLowerCase() === catName.trim().toLowerCase()
  );
  return match ? DEFAULT_IMAGES_BY_CATEGORY[match] : GENERAL_DEFAULT_IMAGE;
}

// DOM Elements
const categoryForm = document.getElementById("categoryForm");
const categoryNameInput = document.getElementById("categoryName");
const categoriesList = document.getElementById("categoriesList");

const galleryForm = document.getElementById("galleryForm");
const galleryFormTitle = document.getElementById("galleryFormTitle");
const galleryIdInput = document.getElementById("galleryId");
const categoriaId = document.getElementById("categoriaId");
const categoryPills = document.getElementById("categoryPills");
const galleryTitle = document.getElementById("galleryTitle");
const galleryDescription = document.getElementById("galleryDescription");
const galleryImage = document.getElementById("galleryImage");
const dropzoneBox = document.getElementById("dropzoneBox");
const dropzonePill = document.getElementById("dropzonePill");
const imagePreview = document.getElementById("imagePreview");
const previewPlaceholder = document.getElementById("previewPlaceholder");
const previewBadge = document.getElementById("previewBadge");
const saveGalleryBtn = document.getElementById("saveGalleryBtn");
const cancelGalleryEditBtn = document.getElementById("cancelGalleryEditBtn");

// Controles de Encuadre & Zoom - Formulario de Subida
const uploadFramingViewport = document.getElementById("uploadFramingViewport");
const uploadZoomSlider = document.getElementById("uploadZoomSlider");
const uploadZoomInBtn = document.getElementById("uploadZoomInBtn");
const uploadZoomOutBtn = document.getElementById("uploadZoomOutBtn");
const uploadFitBtn = document.getElementById("uploadFitBtn");
const uploadResetBtn = document.getElementById("uploadResetBtn");

const filterCategory = document.getElementById("filterCategory");
const galleryFilterChips = document.getElementById("galleryFilterChips");
const searchGallery = document.getElementById("searchGallery");
const galleryGrid = document.getElementById("galleryGrid");
const logoutBtn = document.getElementById("logoutBtn");

// Modal de Edición Directa
const editGalleryModal = document.getElementById("editGalleryModal");
const editModalForm = document.getElementById("editModalForm");
const modalItemId = document.getElementById("modalItemId");
const modalImagePreview = document.getElementById("modalImagePreview");
const modalPreviewBadge = document.getElementById("modalPreviewBadge");
const modalDropzoneBox = document.getElementById("modalDropzoneBox");
const modalDropzonePill = document.getElementById("modalDropzonePill");
const modalImageInput = document.getElementById("modalImageInput");

// Controles de Encuadre & Zoom - Modal de Edición
const modalFramingViewport = document.getElementById("modalFramingViewport");
const modalZoomSlider = document.getElementById("modalZoomSlider");
const modalZoomInBtn = document.getElementById("modalZoomInBtn");
const modalZoomOutBtn = document.getElementById("modalZoomOutBtn");
const modalFitBtn = document.getElementById("modalFitBtn");
const modalResetBtn = document.getElementById("modalResetBtn");

const modalCategoria = document.getElementById("modalCategoria");
const modalCategoryPills = document.getElementById("modalCategoryPills");
const modalTitulo = document.getElementById("modalTitulo");
const modalDescripcion = document.getElementById("modalDescripcion");
const modalPosicionSelect = document.getElementById("modalPosicionSelect");
const modalOrderFilmstrip = document.getElementById("modalOrderFilmstrip");
const modalOrderFeedback = document.getElementById("modalOrderFeedback");
const modalMoveFirstBtn = document.getElementById("modalMoveFirstBtn");
const modalMovePrevBtn = document.getElementById("modalMovePrevBtn");
const modalMoveNextBtn = document.getElementById("modalMoveNextBtn");
const modalMoveLastBtn = document.getElementById("modalMoveLastBtn");
const closeEditModalBtn = document.getElementById("closeEditModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");

// Iconos temáticos de lujo para cada categoría
const CATEGORY_ICONS = {
  "Bodas": "💍",
  "15 Años": "👑",
  "Salón Marinilla": "🏛️",
  "Finca El Peñol": "🌲",
  "Mobiliario": "🪑",
  "Catering": "🍽️",
  "Eventos Corporativos": "👔"
};

function getCategoryIcon(catName) {
  if (!catName) return "✨";
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (catName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(catName.toLowerCase())) {
      return icon;
    }
  }
  return "✨";
}

/**
 * Renderiza selector intuitivo de píldoras de categoría (1-clic, imposible de trabar en Linux/móviles)
 */
function renderCategoryPills(container, activeCategory, onSelect) {
  if (!container) return;
  const cats = categoriesCache && categoriesCache.length > 0 ? categoriesCache : [
    "Bodas", "15 Años", "Salón Marinilla", "Finca El Peñol", "Mobiliario", "Catering", "Eventos Corporativos"
  ];

  container.innerHTML = cats.map(cat => {
    const icon = getCategoryIcon(cat);
    const isActive = (cat || "").trim().toLowerCase() === (activeCategory || "").trim().toLowerCase();
    return `
      <button type="button" class="category-pill ${isActive ? 'active' : ''}" data-cat="${cat}">
        <span class="pill-check">✓ </span>${icon} ${cat}
      </button>
    `;
  }).join("");

  container.querySelectorAll(".category-pill").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const chosen = btn.dataset.cat;
      container.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      if (typeof onSelect === "function") {
        onSelect(chosen);
      }
    });
  });
}

/**
 * Renderiza barra de filtros interactiva con chips de categoría
 */
function renderFilterChips() {
  if (!galleryFilterChips) return;
  const currentFilter = filterCategory?.value || "";
  const cats = categoriesCache && categoriesCache.length > 0 ? categoriesCache : [
    "Bodas", "15 Años", "Salón Marinilla", "Finca El Peñol", "Mobiliario", "Catering", "Eventos Corporativos"
  ];

  const allItems = [
    { name: "Todas", value: "", icon: "✨" },
    ...cats.map(c => ({ name: c, value: c, icon: getCategoryIcon(c) }))
  ];

  galleryFilterChips.innerHTML = allItems.map(item => {
    const isActive = (item.value === currentFilter);
    return `
      <button type="button" class="gallery-filter-chip ${isActive ? 'active' : ''}" data-cat="${item.value}">
        ${item.icon} ${item.name}
      </button>
    `;
  }).join("");

  galleryFilterChips.querySelectorAll(".gallery-filter-chip").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const val = btn.dataset.cat;
      if (filterCategory) filterCategory.value = val;
      galleryFilterChips.querySelectorAll(".gallery-filter-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      aplicarFiltros();
    });
  });
}

/**
 * Editor Interactivo de Encuadre, Pan & Zoom de Alta Definición (HTML5 Canvas + Viewport 4:3)
 * Permite arrastrar libremente la imagen, acercar/alejar con slider o botones,
 * y ajustar completa sin recortes para volantes y afiches verticales.
 */
class ImageFrameEditor {
  constructor({
    viewport,
    img,
    zoomSlider,
    zoomInBtn,
    zoomOutBtn,
    fitBtn,
    resetBtn,
    onFrameChange
  }) {
    this.viewport = viewport;
    this.img = img;
    this.zoomSlider = zoomSlider;
    this.zoomInBtn = zoomInBtn;
    this.zoomOutBtn = zoomOutBtn;
    this.fitBtn = fitBtn;
    this.resetBtn = resetBtn;
    this.onFrameChange = onFrameChange;

    this.scale = 1;
    this.posX = 0;
    this.posY = 0;
    this.baseWidth = 300;
    this.baseHeight = 225;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.hasCustomFraming = false;

    this.initEvents();
  }

  initEvents() {
    if (!this.viewport || !this.img) return;

    // Arrastre con ratón (Mouse Pan)
    this.viewport.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      this.isDragging = true;
      this.startX = e.clientX - this.posX;
      this.startY = e.clientY - this.posY;
      this.viewport.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      this.posX = e.clientX - this.startX;
      this.posY = e.clientY - this.startY;
      this.hasCustomFraming = true;
      this.applyTransform();
    });

    window.addEventListener("mouseup", () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.viewport) this.viewport.style.cursor = "grab";
      }
    });

    // Arrastre táctil (Touch Pan en móviles y tablets)
    this.viewport.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.posX;
        this.startY = e.touches[0].clientY - this.posY;
      }
    }, { passive: true });

    this.viewport.addEventListener("touchmove", (e) => {
      if (this.isDragging && e.touches.length === 1) {
        e.preventDefault();
        this.posX = e.touches[0].clientX - this.startX;
        this.posY = e.touches[0].clientY - this.startY;
        this.hasCustomFraming = true;
        this.applyTransform();
      }
    }, { passive: false });

    this.viewport.addEventListener("touchend", () => {
      this.isDragging = false;
    });

    // Zoom con rueda del ratón (sin afectar scroll de la ventana ni del modal)
    this.viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY * -0.0015;
      this.setZoom(this.scale + delta);
    }, { passive: false });

    // Slider de zoom
    if (this.zoomSlider) {
      this.zoomSlider.addEventListener("input", (e) => {
        e.stopPropagation();
        this.setZoom(parseFloat(this.zoomSlider.value));
      });
    }

    // Botón Acercar (+)
    if (this.zoomInBtn) {
      this.zoomInBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setZoom(this.scale + 0.15);
      });
    }

    // Botón Alejar / Mermar (-)
    if (this.zoomOutBtn) {
      this.zoomOutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setZoom(this.scale - 0.15);
      });
    }

    // Botón Ajustar completa (Sin recortar)
    if (this.fitBtn) {
      this.fitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.fitComplete();
      });
    }

    // Botón Centrar / Restaurar
    if (this.resetBtn) {
      this.resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.reset();
      });
    }

    // Recalcular dimensiones al cargar la imagen
    this.img.addEventListener("load", () => {
      this.recalculate();
    });
  }

  recalculate(autoFitIfVertical = true) {
    if (!this.viewport || !this.img) return;
    const vpRect = this.viewport.getBoundingClientRect();
    const vpW = vpRect.width || 300;
    const vpH = vpRect.height || 225;

    const natW = this.img.naturalWidth || vpW;
    const natH = this.img.naturalHeight || vpH;
    const imgAspect = natW / natH;
    const vpAspect = vpW / vpH;

    if (imgAspect > vpAspect) {
      this.baseHeight = vpH;
      this.baseWidth = vpH * imgAspect;
    } else {
      this.baseWidth = vpW;
      this.baseHeight = vpW / imgAspect;
    }

    this.img.style.width = `${this.baseWidth}px`;
    this.img.style.height = `${this.baseHeight}px`;

    // Si la imagen es vertical (afiche/volante donde alto > ancho) y está en encuadre inicial,
    // encajarla a COMPLETA automáticamente para que NUNCA aparezca mocha/cortada por los lados
    if (autoFitIfVertical && (natH > natW * 1.05) && !this.hasCustomFraming) {
      this.fitComplete();
      this.hasCustomFraming = false;
      return;
    }

    this.applyTransform();
  }

  setZoom(newScale) {
    this.scale = Math.max(0.15, Math.min(3.5, newScale));
    if (this.zoomSlider) {
      this.zoomSlider.value = this.scale;
    }
    this.hasCustomFraming = true;
    this.applyTransform();
  }

  fitComplete() {
    if (!this.viewport || !this.img) return;
    const vpRect = this.viewport.getBoundingClientRect();
    const vpW = vpRect.width || 300;
    const vpH = vpRect.height || 225;

    const natW = this.img.naturalWidth || vpW;
    const natH = this.img.naturalHeight || vpH;
    const scaleX = vpW / natW;
    const scaleY = vpH / natH;
    const fitFactor = Math.min(scaleX, scaleY);

    const baseRenderW = this.baseWidth || vpW;
    const actualFitRatio = (natW * fitFactor) / baseRenderW;

    this.scale = Math.max(0.15, Math.min(3.0, actualFitRatio));
    this.posX = 0;
    this.posY = 0;
    if (this.zoomSlider) this.zoomSlider.value = this.scale;
    this.hasCustomFraming = true;
    this.applyTransform();
  }

  reset() {
    this.scale = 1;
    this.posX = 0;
    this.posY = 0;
    this.hasCustomFraming = false;
    if (this.zoomSlider) this.zoomSlider.value = 1;
    this.recalculate(true);
  }

  applyTransform() {
    if (!this.img) return;
    this.img.style.transform = `translate(-50%, -50%) translate(${this.posX}px, ${this.posY}px) scale(${this.scale})`;
    if (typeof this.onFrameChange === "function") {
      this.onFrameChange(this);
    }
  }

  /**
   * Exporta a canvas de alta resolución (1200x900px, 4:3 HD)
   * Nitidez cristalina profesional, fondo de estudio limpio si hay bordes por zoom out.
   */
  exportFramedImage(outputW = 1200, outputH = 900) {
    if (!this.img || !this.img.naturalWidth || !this.img.naturalHeight) {
      return this.img?.src || null;
    }

    const vpRect = this.viewport.getBoundingClientRect();
    const vpW = vpRect.width || 300;
    const vpH = vpRect.height || 225;

    const canvas = document.createElement("canvas");
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Fondo oscuro elegante de estudio
    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const factor = canvas.width / vpW;

    ctx.save();
    ctx.translate(canvas.width / 2 + this.posX * factor, canvas.height / 2 + this.posY * factor);
    ctx.scale(this.scale, this.scale);

    const drawW = (this.baseWidth || vpW) * factor;
    const drawH = (this.baseHeight || vpH) * factor;

    ctx.drawImage(this.img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    try {
      return canvas.toDataURL("image/jpeg", 0.92);
    } catch (err) {
      console.warn("Canvas export fallback to img.src:", err);
      return this.img.src || null;
    }
  }
}

// State
let galleryCache = [];
let categoriesCache = [];
let userUploadedImage = null;
let selectedFileName = "";
let modalUploadedImage = null;
let modalSelectedFileName = "";
let modalOriginalImage = "";
let modalActiveUpdateOrderFn = null;
let draggedItemId = null;

// Instancias de editores de encuadre
let uploadFrameEditor = null;
let modalFrameEditor = null;

if (imagePreview) {
  imagePreview.crossOrigin = "anonymous";
}
if (modalImagePreview) {
  modalImagePreview.crossOrigin = "anonymous";
}

if (uploadFramingViewport && imagePreview) {
  uploadFrameEditor = new ImageFrameEditor({
    viewport: uploadFramingViewport,
    img: imagePreview,
    zoomSlider: uploadZoomSlider,
    zoomInBtn: uploadZoomInBtn,
    zoomOutBtn: uploadZoomOutBtn,
    fitBtn: uploadFitBtn,
    resetBtn: uploadResetBtn
  });
}

if (modalFramingViewport && modalImagePreview) {
  modalFrameEditor = new ImageFrameEditor({
    viewport: modalFramingViewport,
    img: modalImagePreview,
    zoomSlider: modalZoomSlider,
    zoomInBtn: modalZoomInBtn,
    zoomOutBtn: modalZoomOutBtn,
    fitBtn: modalFitBtn,
    resetBtn: modalResetBtn
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

/**
 * Updates the image preview box.
 * Strictly contained inside the preview card with high-end luxury styling.
 */
function updatePreview() {
  if (userUploadedImage) {
    if (imagePreview) {
      imagePreview.src = userUploadedImage;
      imagePreview.style.display = "block";
    }
    if (previewPlaceholder) previewPlaceholder.style.display = "none";
    if (previewBadge) {
      previewBadge.style.display = "block";
      previewBadge.className = "preview-badge custom-photo";
      previewBadge.textContent = "✓ Foto propia: " + (selectedFileName || "Personalizada");
    }
    if (dropzonePill) {
      dropzonePill.style.display = "inline-flex";
      dropzonePill.innerHTML = `<span class="pill-name" title="${selectedFileName || 'Archivo'}">✓ ${selectedFileName || "Archivo seleccionado"}</span><span id="removeFileBtn" class="pill-action" title="Quitar archivo">✕</span>`;
      const removeBtn = document.getElementById("removeFileBtn");
      if (removeBtn) {
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          if (galleryImage) galleryImage.value = "";
          userUploadedImage = null;
          selectedFileName = "";
          updatePreview();
        };
      }
    }
  } else {
    const cat = categoriaId?.value || "Bodas";
    const defaultUrl = getDefaultImageForCategory(cat);
    if (imagePreview) {
      imagePreview.src = defaultUrl;
      imagePreview.style.display = "block";
    }
    if (previewPlaceholder) previewPlaceholder.style.display = "none";
    if (previewBadge) {
      previewBadge.style.display = "block";
      previewBadge.className = "preview-badge";
      previewBadge.textContent = `✨ Imagen por defecto para "${cat}"`;
    }
    if (dropzonePill) {
      dropzonePill.style.display = "none";
      dropzonePill.textContent = "";
    }
  }

  if (uploadFrameEditor) {
    uploadFrameEditor.reset();
  }
}

function handleFileSelected(file) {
  if (file) {
    try {
      const instant = URL.createObjectURL(file);
      if (imagePreview) {
        imagePreview.src = instant;
        imagePreview.style.display = "block";
      }
    } catch (e) {}

    const reader = new FileReader();
    reader.onload = (ev) => {
      userUploadedImage = ev.target.result;
      selectedFileName = file.name;
      updatePreview();
      if (uploadFrameEditor) {
        uploadFrameEditor.reset();
      }
    };
    reader.readAsDataURL(file);
  } else {
    userUploadedImage = null;
    selectedFileName = "";
    updatePreview();
    if (uploadFrameEditor) {
      uploadFrameEditor.reset();
    }
  }
}

// Dropzone click & drag-and-drop
if (dropzoneBox && galleryImage) {
  dropzoneBox.addEventListener("click", () => {
    galleryImage.click();
  });

  dropzoneBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzoneBox.classList.add("dragover");
  });

  dropzoneBox.addEventListener("dragleave", () => {
    dropzoneBox.classList.remove("dragover");
  });

  dropzoneBox.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzoneBox.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      galleryImage.files = e.dataTransfer.files;
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });
}

// Category change event updates default preview automatically
if (categoriaId) {
  categoriaId.addEventListener("change", () => {
    if (!userUploadedImage) {
      updatePreview();
    }
  });
}

// File input preview handler
if (galleryImage) {
  galleryImage.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleFileSelected(file);
  });
}

/**
 * Manejador de selección de foto dentro del Modal de Edición (Vista previa instantánea a 0ms)
 */
function handleModalFileSelected(file) {
  if (!file) return;

  modalSelectedFileName = file.name;

  // 1. Vista previa visual instantánea a 0ms con URL.createObjectURL
  try {
    const instantUrl = URL.createObjectURL(file);
    if (modalImagePreview) {
      modalImagePreview.src = instantUrl;
      modalImagePreview.style.display = "block";
    }
  } catch (e) {
    console.warn("createObjectURL fallback", e);
  }

  // 2. Actualizar badge con nombre de archivo nuevo
  if (modalPreviewBadge) {
    modalPreviewBadge.className = "preview-badge custom-photo";
    modalPreviewBadge.textContent = "✓ Nueva foto: " + (file.name || "Personalizada");
    modalPreviewBadge.style.display = "block";
  }

  // 3. Mostrar píldora con opción de revertir a la foto original
  if (modalDropzonePill) {
    modalDropzonePill.style.display = "inline-flex";
    modalDropzonePill.innerHTML = `<span class="pill-name" title="${file.name}">✓ ${file.name}</span><span id="modalRemoveFileBtn" class="pill-action" title="Revertir a la foto original">✕ Revertir</span>`;

    const removeBtn = document.getElementById("modalRemoveFileBtn");
    if (removeBtn) {
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        revertModalImage();
      };
    }
  }

  // 4. Lectura a Base64 para guardado persistente en Firebase/dbService
  const reader = new FileReader();
  reader.onload = (ev) => {
    modalUploadedImage = ev.target.result;
    if (modalImagePreview) {
      modalImagePreview.src = modalUploadedImage;
    }
    if (modalFrameEditor) {
      modalFrameEditor.reset();
    }
    if (typeof modalActiveUpdateOrderFn === "function") {
      modalActiveUpdateOrderFn();
    }
  };
  reader.readAsDataURL(file);

  if (modalFrameEditor) {
    modalFrameEditor.reset();
  }

  // Actualizar también la tira visual del orden de inmediato
  if (typeof modalActiveUpdateOrderFn === "function") {
    modalActiveUpdateOrderFn();
  }
}

function revertModalImage() {
  modalUploadedImage = null;
  modalSelectedFileName = "";
  if (modalImageInput) modalImageInput.value = "";
  if (modalImagePreview) {
    modalImagePreview.src = modalOriginalImage;
  }
  if (modalPreviewBadge) {
    modalPreviewBadge.className = "preview-badge";
    modalPreviewBadge.textContent = "Foto actual en galería";
  }
  if (modalDropzonePill) {
    modalDropzonePill.style.display = "none";
    modalDropzonePill.innerHTML = "";
  }
  if (modalFrameEditor) {
    modalFrameEditor.reset();
  }
  if (typeof modalActiveUpdateOrderFn === "function") {
    modalActiveUpdateOrderFn();
  }
}

// Modal Dropzone event listeners (Click & Drag-Drop)
if (modalDropzoneBox && modalImageInput) {
  modalDropzoneBox.addEventListener("click", () => {
    modalImageInput.click();
  });

  modalDropzoneBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    modalDropzoneBox.classList.add("dragover");
  });

  modalDropzoneBox.addEventListener("dragleave", () => {
    modalDropzoneBox.classList.remove("dragover");
  });

  modalDropzoneBox.addEventListener("drop", (e) => {
    e.preventDefault();
    modalDropzoneBox.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      modalImageInput.files = e.dataTransfer.files;
      handleModalFileSelected(e.dataTransfer.files[0]);
    }
  });

  modalImageInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleModalFileSelected(file);
    }
  });
}

/**
 * Load categories and render pills and filter chips
 */
async function cargarCategorias() {
  try {
    const fetched = await dbService.getGalleryCategories();
    categoriesCache = Array.isArray(fetched) && fetched.length > 0 ? fetched : [
      "Bodas",
      "15 Años",
      "Salón Marinilla",
      "Finca El Peñol",
      "Mobiliario",
      "Catering",
      "Eventos Corporativos"
    ];

    // 1. Configurar categoría activa en formulario principal y renderizar píldoras
    const currentUploadCat = categoriaId?.value || categoriesCache[0] || "Bodas";
    if (categoriaId) categoriaId.value = currentUploadCat;
    if (categoryPills) {
      renderCategoryPills(categoryPills, currentUploadCat, (selectedCat) => {
        if (categoriaId) categoriaId.value = selectedCat;
        if (!userUploadedImage) {
          updatePreview();
        }
      });
    }

    // 2. Renderizar chips de filtro en la barra de herramientas
    renderFilterChips();

    // 3. Render sidebar categories list
    renderCategoriesList();

    // 4. Update preview with default category image
    updatePreview();
  } catch (err) {
    console.error("Error al cargar categorías:", err);
  }
}

/**
 * Render sidebar categories with count and delete button
 */
function renderCategoriesList() {
  if (!categoriesList) return;

  if (!categoriesCache.length) {
    categoriesList.innerHTML = `
      <div style="padding: 1.2rem; text-align: center; color: var(--text-soft); font-size: 0.88rem;">
        No hay categorías registradas.
      </div>
    `;
    return;
  }

  categoriesList.innerHTML = categoriesCache.map(cat => {
    const count = galleryCache.filter(item => (item.categoria || "").toLowerCase() === cat.toLowerCase()).length;
    return `
      <article class="dashboard-item">
        <div>
          <h4>${cat}</h4>
          <p>${count} ${count === 1 ? 'fotografía' : 'fotografías'}</p>
        </div>
        <button type="button" class="category-del-btn" data-category="${cat}" title="Eliminar categoría">
          Eliminar
        </button>
      </article>
    `;
  }).join("");

  // Attach delete handlers for categories
  categoriesList.querySelectorAll(".category-del-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const catToDelete = btn.dataset.category;
      const count = galleryCache.filter(item => (item.categoria || "").toLowerCase() === catToDelete.toLowerCase()).length;

      const confirm = await Swal.fire({
        title: `¿Eliminar categoría "${catToDelete}"?`,
        text: count > 0 ? `Hay ${count} fotografía(s) vinculadas a esta categoría.` : "Esta categoría se retirará de las opciones.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e74c3c",
        cancelButtonColor: "#333",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (confirm.isConfirmed) {
        await dbService.deleteGalleryCategory(catToDelete);
        await cargarCategorias();
        Swal.fire({
          icon: "success",
          title: "Categoría eliminada",
          text: `La categoría "${catToDelete}" ha sido removida.`,
          timer: 1800,
          showConfirmButton: false
        });
      }
    });
  });
}

/**
 * Category creation handler
 */
if (categoryForm) {
  categoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = categoryNameInput?.value.trim();
    if (!name) return;

    if (categoriesCache.some(c => c.toLowerCase() === name.toLowerCase())) {
      Swal.fire("Ya existe", `La categoría "${name}" ya está registrada.`, "info");
      return;
    }

    await dbService.addGalleryCategory(name);
    if (categoryNameInput) categoryNameInput.value = "";
    await cargarCategorias();

    // Select the new category
    if (categoriaId) categoriaId.value = name;
    if (categoryPills) {
      renderCategoryPills(categoryPills, name, (cat) => {
        if (categoriaId) categoriaId.value = cat;
        if (!userUploadedImage) updatePreview();
      });
    }
    updatePreview();

    Swal.fire({
      icon: "success",
      title: "Categoría creada",
      text: `La categoría "${name}" ya está disponible.`,
      timer: 2000,
      showConfirmButton: false
    });
  });
}

/**
 * Gallery form submit (New or Update)
 */
if (galleryForm) {
  galleryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = galleryIdInput?.value.trim();
    const titulo = galleryTitle?.value.trim();
    const categoria = categoriaId?.value || "Bodas";
    const descripcion = galleryDescription?.value.trim() || "";

    if (!titulo) {
      Swal.fire("Título requerido", "Por favor ingresa un título para la imagen.", "warning");
      return;
    }

    // Determine final image:
    // 1. User uploaded custom file
    // 2. Existing image if editing and no new upload
    // 3. Fallback to high-res category default image!
    let finalImage = userUploadedImage;
    if (!finalImage) {
      if (id) {
        const existing = galleryCache.find(g => String(g.id) === String(id));
        finalImage = existing?.imagen || getDefaultImageForCategory(categoria);
      } else {
        finalImage = getDefaultImageForCategory(categoria);
      }
    }

    // Si el usuario ajustó encuadre (zoom, mover, encajar completa) o subió foto, exportar canvas HD
    if (uploadFrameEditor && (userUploadedImage || uploadFrameEditor.hasCustomFraming)) {
      try {
        const framed = uploadFrameEditor.exportFramedImage(1200, 900);
        if (framed && framed.startsWith("data:image/")) {
          finalImage = framed;
        }
      } catch (err) {
        console.warn("Could not export framed canvas:", err);
      }
    }

    try {
      if (id) {
        // Edit mode
        await dbService.updateGalleryItem(id, {
          titulo,
          categoria,
          descripcion,
          imagen: finalImage
        });

        Swal.fire({
          icon: "success",
          title: "Fotografía actualizada",
          text: "Los cambios se guardaron con éxito.",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Create mode
        await dbService.addGalleryItem({
          titulo,
          categoria,
          descripcion,
          imagen: finalImage
        });

        Swal.fire({
          icon: "success",
          title: "Foto agregada",
          text: userUploadedImage ? "Tu fotografía se ha subido correctamente." : `Se guardó con la imagen por defecto de ${categoria}.`,
          timer: 2500,
          showConfirmButton: false
        });
      }

      resetGalleryForm();
      await cargarGaleria();
      renderCategoriesList();
    } catch (err) {
      console.error("Error guardando imagen:", err);
      Swal.fire("Error", "No se pudo guardar la imagen en la galería.", "error");
    }
  });
}

function resetGalleryForm() {
  if (galleryForm) galleryForm.reset();
  if (galleryIdInput) galleryIdInput.value = "";
  userUploadedImage = null;
  selectedFileName = "";
  if (galleryFormTitle) galleryFormTitle.textContent = "Subir imagen";
  if (saveGalleryBtn) saveGalleryBtn.textContent = "Guardar imagen";
  if (cancelGalleryEditBtn) cancelGalleryEditBtn.style.display = "none";
  const defaultCat = categoriesCache[0] || "Bodas";
  if (categoriaId) categoriaId.value = defaultCat;
  if (categoryPills) {
    renderCategoryPills(categoryPills, defaultCat, (cat) => {
      if (categoriaId) categoriaId.value = cat;
      if (!userUploadedImage) updatePreview();
    });
  }
  updatePreview();
}

if (cancelGalleryEditBtn) {
  cancelGalleryEditBtn.addEventListener("click", () => {
    resetGalleryForm();
  });
}

/**
 * Modal de Edición Directa (sin saltos de pantalla)
 */
function abrirModalEdicion(id) {
  const itemIndex = galleryCache.findIndex(g => String(g.id) === String(id));
  if (itemIndex === -1) return;
  const item = galleryCache[itemIndex];

  if (modalItemId) modalItemId.value = item.id;
  if (modalTitulo) modalTitulo.value = item.titulo || "";
  if (modalDescripcion) modalDescripcion.value = item.descripcion || "";
  modalOriginalImage = item.imagen || "";
  modalUploadedImage = null;
  modalSelectedFileName = "";
  if (modalImageInput) modalImageInput.value = "";
  if (modalImagePreview) {
    modalImagePreview.src = modalOriginalImage;
    modalImagePreview.style.display = "block";
  }
  if (modalFrameEditor) {
    modalFrameEditor.reset();
  }
  if (modalPreviewBadge) {
    modalPreviewBadge.className = "preview-badge";
    modalPreviewBadge.textContent = "Foto actual en galería";
    modalPreviewBadge.style.display = "block";
  }
  if (modalDropzonePill) {
    modalDropzonePill.style.display = "none";
    modalDropzonePill.innerHTML = "";
  }

  // Poblar categorías interactivas (Píldoras de categoría de 1-clic) en el modal
  const activeModalCat = item.categoria || (categoriesCache[0] || "Bodas");
  if (modalCategoria) modalCategoria.value = activeModalCat;
  if (modalCategoryPills) {
    renderCategoryPills(modalCategoryPills, activeModalCat, (selectedCat) => {
      if (modalCategoria) modalCategoria.value = selectedCat;
    });
  }

  // Lógica de reordenación visual con tira interactiva (Filmstrip Preview)
  let modalTargetIndex = itemIndex;

  function updateModalOrderView(newIndex) {
    if (!galleryCache.length) return;
    modalTargetIndex = Math.max(0, Math.min(galleryCache.length - 1, newIndex));

    // Construir lista simulada de previsualización
    const previewList = [...galleryCache];
    const currentItemPreview = {
      ...item,
      titulo: modalTitulo?.value.trim() || item.titulo,
      imagen: modalUploadedImage || item.imagen
    };
    previewList[itemIndex] = currentItemPreview;

    if (modalTargetIndex !== itemIndex) {
      const [moved] = previewList.splice(itemIndex, 1);
      previewList.splice(modalTargetIndex, 0, moved);
    }

    // Renderizar la tira interactiva de miniaturas
    if (modalOrderFilmstrip) {
      modalOrderFilmstrip.innerHTML = previewList.map((pi, idx) => {
        const isCurrentItem = (String(pi.id) === String(item.id));
        return `
          <div class="filmstrip-item ${isCurrentItem ? 'current-target' : ''}" data-index="${idx}" title="${isCurrentItem ? 'Posición elegida para tu foto' : 'Toca para mover tu foto aquí (Posición #' + (idx + 1) + ')'}">
            <span class="filmstrip-badge">#${idx + 1}</span>
            <img src="${pi.imagen}" alt="${pi.titulo}" class="filmstrip-thumb" />
            <span class="filmstrip-title">${pi.titulo || 'Sin título'}</span>
            ${isCurrentItem ? '<span class="filmstrip-status">★ Tu foto</span>' : ''}
          </div>
        `;
      }).join("");

      modalOrderFilmstrip.querySelectorAll(".filmstrip-item").forEach(card => {
        card.addEventListener("click", () => {
          const clickedIdx = parseInt(card.dataset.index, 10);
          if (!isNaN(clickedIdx)) {
            updateModalOrderView(clickedIdx);
          }
        });
      });

      // Centrar suavemente la tarjeta activa en la tira horizontal sin mover la página ni el modal
      const activeCard = modalOrderFilmstrip.querySelector(".filmstrip-item.current-target");
      if (activeCard && modalOrderFilmstrip) {
        const cardLeft = activeCard.offsetLeft;
        const cardWidth = activeCard.offsetWidth;
        const stripWidth = modalOrderFilmstrip.clientWidth;
        modalOrderFilmstrip.scrollTo({
          left: cardLeft - (stripWidth / 2) + (cardWidth / 2),
          behavior: "smooth"
        });
      }
    }

    // Explicación textual enriquecida y clara
    if (modalOrderFeedback) {
      if (galleryCache.length <= 1) {
        modalOrderFeedback.innerHTML = `<span>✨ Esta es la única fotografía en la galería.</span>`;
      } else if (modalTargetIndex === 0) {
        modalOrderFeedback.innerHTML = `<span>👑 <strong>Posición #1</strong>: Foto principal de portada (será la primera que verán los clientes en la web).</span>`;
      } else if (modalTargetIndex === previewList.length - 1) {
        modalOrderFeedback.innerHTML = `<span>🏁 <strong>Posición #${modalTargetIndex + 1} de ${previewList.length}</strong>: Quedará al final de la galería.</span>`;
      } else {
        const prevItem = previewList[modalTargetIndex - 1];
        const nextItem = previewList[modalTargetIndex + 1];
        const prevName = prevItem?.titulo ? `"${prevItem.titulo}"` : 'la foto anterior';
        const nextName = nextItem?.titulo ? `"${nextItem.titulo}"` : 'la foto siguiente';
        modalOrderFeedback.innerHTML = `<span>📍 <strong>Posición #${modalTargetIndex + 1} de ${previewList.length}</strong>: Quedará ubicada entre ${prevName} y ${nextName}.</span>`;
      }
    }

    // Sincronizar select numérico
    if (modalPosicionSelect) {
      modalPosicionSelect.innerHTML = galleryCache.map((_, idx) => `
        <option value="${idx}" ${idx === modalTargetIndex ? "selected" : ""}>Posición ${idx + 1} de ${galleryCache.length}</option>
      `).join("");
      modalPosicionSelect.value = String(modalTargetIndex);
    }

    // Estados de botones de navegación rápida
    if (modalMoveFirstBtn) modalMoveFirstBtn.disabled = (modalTargetIndex === 0);
    if (modalMovePrevBtn) modalMovePrevBtn.disabled = (modalTargetIndex === 0);
    if (modalMoveNextBtn) modalMoveNextBtn.disabled = (modalTargetIndex === galleryCache.length - 1);
    if (modalMoveLastBtn) modalMoveLastBtn.disabled = (modalTargetIndex === galleryCache.length - 1);
  }

  // Conectar botones de navegación de posición
  if (modalMoveFirstBtn) {
    modalMoveFirstBtn.onclick = () => updateModalOrderView(0);
  }
  if (modalMovePrevBtn) {
    modalMovePrevBtn.onclick = () => updateModalOrderView(modalTargetIndex - 1);
  }
  if (modalMoveNextBtn) {
    modalMoveNextBtn.onclick = () => updateModalOrderView(modalTargetIndex + 1);
  }
  if (modalMoveLastBtn) {
    modalMoveLastBtn.onclick = () => updateModalOrderView(galleryCache.length - 1);
  }
  if (modalPosicionSelect) {
    modalPosicionSelect.onchange = () => {
      const idx = parseInt(modalPosicionSelect.value, 10);
      if (!isNaN(idx)) updateModalOrderView(idx);
    };
  }

  modalActiveUpdateOrderFn = () => updateModalOrderView(modalTargetIndex);

  // Si cambia el título dentro del modal, actualizar miniatura en la tira
  if (modalTitulo) {
    modalTitulo.oninput = () => {
      updateModalOrderView(modalTargetIndex);
    };
  }

  // Render inicial de la tira de orden
  updateModalOrderView(itemIndex);

  if (editGalleryModal) {
    editGalleryModal.style.display = "flex";
    requestAnimationFrame(() => {
      if (modalFrameEditor) {
        modalFrameEditor.reset();
      }
    });
  }
}

function cerrarModalEdicion() {
  if (editGalleryModal) editGalleryModal.style.display = "none";
  modalUploadedImage = null;
  modalSelectedFileName = "";
  modalOriginalImage = "";
  modalActiveUpdateOrderFn = null;
}

if (closeEditModalBtn) closeEditModalBtn.onclick = cerrarModalEdicion;
if (cancelModalBtn) cancelModalBtn.onclick = cerrarModalEdicion;
if (editGalleryModal) {
  editGalleryModal.onclick = (e) => {
    if (e.target === editGalleryModal) cerrarModalEdicion();
  };
}

// Guardar cambios del modal
if (editModalForm) {
  editModalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = modalItemId.value;
    const oldIndex = galleryCache.findIndex(g => String(g.id) === String(id));
    if (oldIndex === -1) return;

    const item = galleryCache[oldIndex];
    const newTitulo = modalTitulo.value.trim();
    const newCategoria = modalCategoria.value;
    const newDescripcion = modalDescripcion.value.trim();
    let newImagen = modalUploadedImage || item.imagen;

    // Si el usuario ajustó encuadre o subió nueva foto en el modal, exportar canvas HD
    if (modalFrameEditor && (modalUploadedImage || modalFrameEditor.hasCustomFraming)) {
      try {
        const framed = modalFrameEditor.exportFramedImage(1200, 900);
        if (framed && framed.startsWith("data:image/")) {
          newImagen = framed;
        }
      } catch (err) {
        console.warn("Could not export framed modal image:", err);
      }
    }

    const targetIndex = parseInt(modalPosicionSelect.value, 10);

    const updatedItem = {
      ...item,
      titulo: newTitulo,
      categoria: newCategoria,
      descripcion: newDescripcion,
      imagen: newImagen
    };

    // Reacomodar en el array si cambió de posición
    galleryCache[oldIndex] = updatedItem;
    if (!isNaN(targetIndex) && targetIndex !== oldIndex && targetIndex >= 0 && targetIndex < galleryCache.length) {
      const [moved] = galleryCache.splice(oldIndex, 1);
      galleryCache.splice(targetIndex, 0, moved);
    }

    try {
      await dbService.updateGalleryItem(id, updatedItem);
      await dbService.saveGalleryOrder(galleryCache);

      cerrarModalEdicion();
      aplicarFiltros();
      renderCategoriesList();

      Swal.fire({
        icon: "success",
        title: "Fotografía actualizada",
        text: "Los cambios y su nueva posición fueron guardados.",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error al actualizar:", err);
      Swal.fire("Error", "No se pudo actualizar la imagen.", "error");
    }
  });
}

/**
 * Mover una foto de posición (Reacomodar hacia adelante o hacia atrás)
 */
async function moverItem(id, direccion) {
  const index = galleryCache.findIndex(g => String(g.id) === String(id));
  if (index === -1) return;
  const targetIndex = index + direccion;
  if (targetIndex < 0 || targetIndex >= galleryCache.length) return;

  // Intercambiar posiciones
  const temp = galleryCache[index];
  galleryCache[index] = galleryCache[targetIndex];
  galleryCache[targetIndex] = temp;

  await dbService.saveGalleryOrder(galleryCache);
  aplicarFiltros();

  const Toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 1400
  });
  Toast.fire({
    icon: "success",
    title: `Foto reacomodada a la posición #${targetIndex + 1}`
  });
}

/**
 * Configurar arrastrar y soltar (Drag & Drop) en cada tarjeta
 */
function setupDragAndDrop(card) {
  card.addEventListener("dragstart", (e) => {
    draggedItemId = card.dataset.id;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    galleryGrid.querySelectorAll(".gallery-card-pro").forEach(c => c.classList.remove("dragover-target"));
  });

  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (card.dataset.id !== draggedItemId) {
      card.classList.add("dragover-target");
    }
  });

  card.addEventListener("dragleave", () => {
    card.classList.remove("dragover-target");
  });

  card.addEventListener("drop", async (e) => {
    e.preventDefault();
    card.classList.remove("dragover-target");
    const targetId = card.dataset.id;
    if (!draggedItemId || draggedItemId === targetId) return;

    const fromIndex = galleryCache.findIndex(g => String(g.id) === String(draggedItemId));
    const toIndex = galleryCache.findIndex(g => String(g.id) === String(targetId));

    if (fromIndex !== -1 && toIndex !== -1) {
      const [dragged] = galleryCache.splice(fromIndex, 1);
      galleryCache.splice(toIndex, 0, dragged);

      await dbService.saveGalleryOrder(galleryCache);
      aplicarFiltros();

      const Toast = Swal.mixin({
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 1500
      });
      Toast.fire({
        icon: "success",
        title: `Reacomodada a la posición #${toIndex + 1}`
      });
    }
  });
}

/**
 * Render gallery grid cards
 */
function renderGaleria(items) {
  if (!galleryGrid) return;

  if (!items.length) {
    galleryGrid.innerHTML = `
      <div style="padding: 3rem 1.5rem; text-align: center; color: var(--text-soft); grid-column: 1 / -1; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(212,175,55,0.2);">
        <h3 style="color: #fff; margin-bottom: 0.5rem; font-size: 1.2rem;">No se encontraron fotografías</h3>
        <p style="font-size: 0.9rem;">Prueba cambiando el filtro o sube nuevas fotos de tus eventos.</p>
      </div>
    `;
    return;
  }

  galleryGrid.innerHTML = items.map((item, idx) => `
    <article class="gallery-card-pro" data-id="${item.id}" draggable="true" title="Arrastra para reacomodar de posición">
      <div class="gallery-card-image-wrap">
        <img src="${item.imagen}" alt="${item.titulo}" class="gallery-card-image" loading="lazy" />
        <span class="gallery-card-pos-badge" title="Posición en la galería">#${idx + 1}</span>
        <span class="gallery-card-badge">${item.categoria || "Banquetes Almar"}</span>
      </div>
      <div class="gallery-card-content">
        <h3>${item.titulo}</h3>
        <p>${item.descripcion || "Sin descripción adicional."}</p>

        <!-- Barra rápida para reacomodar orden -->
        <div class="gallery-reorder-bar">
          <span class="reorder-label">Reacomodar:</span>
          <div class="reorder-buttons">
            <button type="button" class="reorder-btn move-left-btn" data-id="${item.id}" ${idx === 0 ? 'disabled' : ''} title="Mover antes">
              ◀
            </button>
            <span class="reorder-pos">#${idx + 1}</span>
            <button type="button" class="reorder-btn move-right-btn" data-id="${item.id}" ${idx === items.length - 1 ? 'disabled' : ''} title="Mover después">
              ▶
            </button>
          </div>
        </div>

        <div class="gallery-card-actions">
          <button type="button" class="btn btn-secondary btn-sm edit-gallery-btn" data-id="${item.id}" style="font-size: 0.8rem; padding: 0.5rem 0.8rem;">
            ✏️ Editar
          </button>
          <button type="button" class="btn btn-secondary btn-sm delete-gallery-btn" data-id="${item.id}" style="color: #ff6b6b; border-color: rgba(255,107,107,0.3); font-size: 0.8rem; padding: 0.5rem 0.8rem;">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </article>
  `).join("");

  // Conectar Drag & Drop en cada tarjeta
  galleryGrid.querySelectorAll(".gallery-card-pro").forEach(card => {
    setupDragAndDrop(card);
  });

  // Botón Mover Izquierda (Reacomodar antes)
  galleryGrid.querySelectorAll(".move-left-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      moverItem(btn.dataset.id, -1);
    });
  });

  // Botón Mover Derecha (Reacomodar después)
  galleryGrid.querySelectorAll(".move-right-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      moverItem(btn.dataset.id, 1);
    });
  });

  // Acción Editar: Abre el Modal Directo (Sin saltar a la parte superior)
  galleryGrid.querySelectorAll(".edit-gallery-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      abrirModalEdicion(btn.dataset.id);
    });
  });

  // Acción Eliminar con confirmación
  galleryGrid.querySelectorAll(".delete-gallery-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const item = galleryCache.find(g => String(g.id) === String(id));

      const confirm = await Swal.fire({
        title: "¿Eliminar fotografía?",
        text: item ? `¿Deseas retirar "${item.titulo}" de la galería?` : "Esta acción retirará la imagen de la web.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e74c3c",
        cancelButtonColor: "#333",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (confirm.isConfirmed) {
        await dbService.deleteGalleryItem(id);
        await cargarGaleria();
        renderCategoriesList();
        Swal.fire({
          icon: "success",
          title: "Eliminada",
          text: "La fotografía ha sido retirada de la galería.",
          timer: 1800,
          showConfirmButton: false
        });
      }
    });
  });
}

/**
 * Filter toolbar logic
 */
function aplicarFiltros() {
  const selectedCat = filterCategory?.value.trim().toLowerCase() || "";
  const query = searchGallery?.value.trim().toLowerCase() || "";

  let filtrados = galleryCache;

  if (selectedCat) {
    filtrados = filtrados.filter(item => (item.categoria || "").toLowerCase() === selectedCat);
  }

  if (query) {
    filtrados = filtrados.filter(item => {
      const t = (item.titulo || "").toLowerCase();
      const d = (item.descripcion || "").toLowerCase();
      const c = (item.categoria || "").toLowerCase();
      return t.includes(query) || d.includes(query) || c.includes(query);
    });
  }

  renderGaleria(filtrados);
}

if (filterCategory) filterCategory.addEventListener("change", aplicarFiltros);
if (searchGallery) searchGallery.addEventListener("input", aplicarFiltros);

/**
 * Load gallery items
 */
async function cargarGaleria() {
  try {
    galleryCache = await dbService.getGallery();
    aplicarFiltros();
  } catch (error) {
    console.error("Error cargando galería:", error);
  }
}

/**
 * Initialize
 */
async function init() {
  await cargarCategorias();
  await cargarGaleria();
}

init();