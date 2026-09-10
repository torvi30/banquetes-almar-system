/**
 * Controlador de Administración para la Franja de Anuncio Superior
 * Permite personalizar texto, badges, estado e icono con vista previa en vivo.
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

// Proteger ruta con autenticación
authService.requireAuth("./login.html");

document.addEventListener("DOMContentLoaded", async () => {
  initLogout();
  await loadAnnouncementData();
  setupLivePreviewListeners();
  setupPresets();
  setupEmojiPills();
  setupFormSubmit();
  setupReset();
});

function initLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      authService.logout();
      window.location.href = "./login.html";
    });
  }
}

// Elementos del formulario
const form = document.getElementById("announcementForm");
const activeInput = document.getElementById("announcementActive");
const iconInput = document.getElementById("announcementIconInput");
const titleInput = document.getElementById("announcementTitleInput");
const msgInput = document.getElementById("announcementMessageInput");
const badgeInput = document.getElementById("announcementBadgeInput");
const subtextInput = document.getElementById("announcementSubtextInput");
const resetBtn = document.getElementById("resetAnnouncementBtn");

// Elementos de la vista previa en vivo
const previewBox = document.getElementById("livePreviewBanner");
const pvIcon = document.getElementById("pvIcon");
const pvTitle = document.getElementById("pvTitle");
const pvMessage = document.getElementById("pvMessage");
const pvBadge = document.getElementById("pvBadge");
const pvDot = document.getElementById("pvDot");
const pvSubtext = document.getElementById("pvSubtext");
const pvRightGroup = document.getElementById("pvRightGroup");
const previewStatusPill = document.getElementById("previewStatusPill");
const pausedNotice = document.getElementById("pausedNotice");

// Cargar datos actuales
async function loadAnnouncementData() {
  try {
    const data = await dbService.getAnnouncement();
    if (data) {
      populateForm(data);
      updateLivePreview();
    }
  } catch (err) {
    console.error("Error cargando anuncio:", err);
  }
}

function populateForm(data) {
  if (activeInput) activeInput.checked = data.activo !== false;
  if (iconInput) iconInput.value = data.icono || "✨";
  if (titleInput) titleInput.value = data.titulo || "";
  if (msgInput) msgInput.value = data.mensaje || "";
  if (badgeInput) badgeInput.value = data.badge || "";
  if (subtextInput) subtextInput.value = data.subtexto || "";
}

// Actualizar la vista previa en tiempo real
function updateLivePreview() {
  const isActive = activeInput ? activeInput.checked : true;
  const icon = iconInput ? iconInput.value.trim() : "✨";
  const title = titleInput ? titleInput.value.trim() : "";
  const msg = msgInput ? msgInput.value.trim() : "";
  const badge = badgeInput ? badgeInput.value.trim() : "";
  const subtext = subtextInput ? subtextInput.value.trim() : "";

  if (pvIcon) pvIcon.textContent = icon || "✨";
  if (pvTitle) pvTitle.textContent = title;
  if (pvMessage) pvMessage.textContent = msg;

  if (pvBadge) {
    pvBadge.textContent = badge;
    pvBadge.style.display = badge ? "inline-block" : "none";
  }

  if (pvSubtext) {
    pvSubtext.textContent = subtext;
    pvSubtext.style.display = subtext ? "inline-block" : "none";
  }

  if (pvDot) {
    pvDot.style.display = (badge && subtext) ? "inline" : "none";
  }

  if (pvRightGroup) {
    pvRightGroup.style.display = (!badge && !subtext) ? "none" : "flex";
  }

  // Estado activo / inactivo en el pill y banner
  if (previewStatusPill) {
    if (isActive) {
      previewStatusPill.className = "preview-status-pill active";
      previewStatusPill.textContent = "🟢 Visible en la Web";
    } else {
      previewStatusPill.className = "preview-status-pill inactive";
      previewStatusPill.textContent = "⚪ En Pausa (Oculto)";
    }
  }

  if (previewBox) {
    if (isActive) {
      previewBox.style.opacity = "1";
      previewBox.style.filter = "none";
    } else {
      previewBox.style.opacity = "0.45";
      previewBox.style.filter = "grayscale(60%)";
    }
  }

  if (pausedNotice) {
    pausedNotice.style.display = isActive ? "none" : "block";
  }
}

// Listeners en vivo (WYSIWYG)
function setupLivePreviewListeners() {
  const inputs = [activeInput, iconInput, titleInput, msgInput, badgeInput, subtextInput];
  inputs.forEach(input => {
    if (input) {
      input.addEventListener("input", updateLivePreview);
      input.addEventListener("change", updateLivePreview);
    }
  });
}

// Botones de emoji rápido
function setupEmojiPills() {
  document.querySelectorAll(".emoji-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const emoji = btn.dataset.emoji;
      if (iconInput && emoji) {
        iconInput.value = emoji;
        updateLivePreview();
        // Feedback visual
        document.querySelectorAll(".emoji-pill-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      }
    });
  });
}

// Plantillas preconfiguradas de 1 clic
function setupPresets() {
  const presetsData = {
    temporada: {
      icono: "✨",
      titulo: "Temporada de Eventos 2026-2027:",
      mensaje: "Salón de Gala en Marinilla & Finca Campestre en El Peñol",
      badge: "Oriente Antioqueño",
      subtexto: "Degustación Previa de Menú Incluida"
    },
    bodas: {
      icono: "💍",
      titulo: "Especial Bodas de Ensueño:",
      mensaje: "Reserva tu fecha este mes y recibe degustación VIP + 10% en mobiliario",
      badge: "Cupos Limitados",
      subtexto: "Ceremonias en Salón & Finca"
    },
    quince: {
      icono: "👑",
      titulo: "Quince Años de Gala:",
      mensaje: "Producción integral con pista LED, backing floral y banquete de autor",
      badge: "Fiesta Inolvidable",
      subtexto: "Degustación para 3 personas de regalo"
    },
    ultimas_fechas: {
      icono: "⏳",
      titulo: "Últimas Fechas Disponibles:",
      mensaje: "Agenda de fines de semana para fin de año y principios de 2027",
      badge: "Alta Demanda",
      subtexto: "Separa hoy con el 30%"
    },
    degustacion: {
      icono: "🥂",
      titulo: "Degustación Gastronómica de Gala:",
      mensaje: "Prueba nuestro menú de 3 tiempos antes de firmar contrato",
      badge: "100% Incluida",
      subtexto: "Marinilla • Cita previa"
    },
    campestre: {
      icono: "🌄",
      titulo: "Finca Campestre El Peñol:",
      mensaje: "Atardeceres frente a la represa, quiosco iluminado y fogata nocturna",
      badge: "Nueva Sede",
      subtexto: "Capacidad hasta 250 personas"
    }
  };

  document.querySelectorAll(".preset-card").forEach(card => {
    card.addEventListener("click", () => {
      const pKey = card.dataset.preset;
      const preset = presetsData[pKey];
      if (preset) {
        populateForm({ ...preset, activo: true });
        updateLivePreview();

        if (window.Swal) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: `Plantilla cargada en la vista previa`,
            text: `Haz clic en "Guardar y Publicar" para confirmarla en la web`,
            showConfirmButton: false,
            timer: 2500,
            background: "#18181b",
            color: "#ffffff"
          });
        }
      }
    });
  });
}

// Guardar cambios en Firestore y LocalStorage
function setupFormSubmit() {
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      activo: activeInput ? activeInput.checked : true,
      icono: iconInput ? iconInput.value.trim() : "✨",
      titulo: titleInput ? titleInput.value.trim() : "",
      mensaje: msgInput ? msgInput.value.trim() : "",
      badge: badgeInput ? badgeInput.value.trim() : "",
      subtexto: subtextInput ? subtextInput.value.trim() : ""
    };

    try {
      await dbService.saveAnnouncement(data);

      if (window.Swal) {
        Swal.fire({
          icon: "success",
          title: "¡Anuncio Publicado con Éxito!",
          html: `<p style="color: #ccc;">Los cambios ya están en vivo en la cabecera de la página web.</p>`,
          background: "#18181b",
          color: "#ffffff",
          confirmButtonColor: "#d4af37",
          confirmButtonText: "Entendido"
        });
      } else {
        alert("¡Anuncio publicado con éxito!");
      }
    } catch (err) {
      console.error("Error al guardar anuncio:", err);
      if (window.Swal) {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          text: err.message,
          background: "#18181b",
          color: "#ffffff"
        });
      } else {
        alert("Error al guardar: " + err.message);
      }
    }
  });
}

// Restablecer valores predeterminados
function setupReset() {
  if (!resetBtn) return;

  resetBtn.addEventListener("click", async () => {
    const confirmResult = window.Swal 
      ? await Swal.fire({
          title: "¿Restablecer al anuncio original?",
          text: "Volverá al anuncio institucional de la Temporada 2026-2027.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, restablecer",
          cancelButtonText: "Cancelar",
          background: "#18181b",
          color: "#ffffff",
          confirmButtonColor: "#d4af37"
        })
      : { isConfirmed: confirm("¿Restablecer al anuncio original?") };

    if (confirmResult.isConfirmed) {
      try {
        const clean = await dbService.resetAnnouncement();
        populateForm(clean);
        updateLivePreview();

        if (window.Swal) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Anuncio restablecido con éxito",
            showConfirmButton: false,
            timer: 2000,
            background: "#18181b",
            color: "#ffffff"
          });
        }
      } catch (err) {
        console.error("Error restableciendo anuncio:", err);
      }
    }
  });
}
