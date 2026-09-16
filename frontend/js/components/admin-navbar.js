/**
 * Reusable Admin Top Navbar Component - Banquetes Almar
 * Modern, executive top navigation with session status, Cloudinary config trigger,
 * active route highlighting, and mobile responsiveness.
 */

import { authService } from "../firebase/auth.js";
import { openCloudinaryConfigModal } from "../services/cloudinary-service.js";

const NAV_ITEMS = [
  { path: "dashboard.html", label: "Dashboard", icon: "📊" },
  { path: "cotizaciones.html", label: "Cotizaciones", icon: "💬" },
  { path: "reservas.html", label: "Eventos & Agenda", icon: "📅" },
  { path: "pagos.html", label: "Pagos & Finanzas", icon: "💵" },
  { path: "inventario.html", label: "Inventario", icon: "📦" },
  { path: "galeria.html", label: "Catálogo Web", icon: "✨" },
  { path: "anuncio.html", label: "Anuncio Superior", icon: "📢" },
  { path: "clientes.html", label: "Clientes", icon: "👥" }
];

export function renderAdminNavbar() {
  const currentPath = window.location.pathname.split("/").pop() || "dashboard.html";
  const user = authService.getCurrentUser() || { nombre: "Administrador", email: "admin@almar.com" };

  const navLinksHtml = NAV_ITEMS.map((item) => {
    const isActive = currentPath.includes(item.path.replace(".html", "")) ||
      (currentPath === "" && item.path === "dashboard.html") ||
      (currentPath.includes("calendario") && item.path === "reservas.html") ||
      (currentPath.includes("eventos") && item.path === "reservas.html");

    return `
      <a href="./${item.path}" class="admin-nav-link ${isActive ? "active" : ""}">
        <span class="admin-nav-icon">${item.icon}</span>
        <span class="admin-nav-text">${item.label}</span>
      </a>
    `;
  }).join("");

  const navbarHtml = `
    <header class="admin-top-navbar" id="adminTopNavbar">
      <div class="admin-nav-container">
        <!-- MARCA Y SUITE -->
        <div class="admin-nav-brand-wrap">
          <a href="./dashboard.html" class="admin-nav-brand">
            <div class="admin-brand-emblem">👑</div>
            <div class="admin-brand-info">
              <span class="admin-brand-title">Banquetes Almar</span>
              <span class="admin-brand-badge">Suite Ejecutiva</span>
            </div>
          </a>
        </div>

        <!-- BOTÓN MÓVIL TOGGLE -->
        <button class="admin-nav-mobile-toggle" id="adminNavMobileToggle" type="button" aria-label="Abrir Menú">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>

        <!-- ENLACES DE NAVEGACIÓN -->
        <nav class="admin-nav-menu" id="adminNavMenu">
          <div class="admin-nav-links">
            ${navLinksHtml}
          </div>

          <!-- ACCIONES Y USUARIO -->
          <div class="admin-nav-actions">
            <!-- BOTÓN CONFIG CLOUDINARY -->
            <button id="adminCloudinaryBtn" class="admin-tool-btn" type="button" title="Configurar almacenamiento Cloudinary">
              ☁️ Cloudinary
            </button>

            <!-- ENLACE A SITIO PÚBLICO -->
            <a href="../index.html" target="_blank" class="admin-tool-btn" title="Ver sitio público de cara al cliente">
              🌐 Ver Sitio
            </a>

            <!-- PERFIL DE USUARIO -->
            <div class="admin-user-pill">
              <div class="admin-user-avatar">
                ${(user.nombre || user.email || "A").charAt(0).toUpperCase()}
              </div>
              <div class="admin-user-details">
                <span class="admin-user-name">${user.nombre || "Administrador"}</span>
                <span class="admin-user-role">Admin Firebase</span>
              </div>
            </div>

            <!-- BOTÓN CERRAR SESIÓN -->
            <button id="adminNavLogoutBtn" class="admin-logout-btn" type="button" title="Cerrar sesión de forma segura">
              🚪 Salir
            </button>
          </div>
        </nav>
      </div>
    </header>
  `;

  // Insert or replace navbar container
  let targetContainer = document.getElementById("adminNavbar");
  if (!targetContainer) {
    targetContainer = document.createElement("div");
    targetContainer.id = "adminNavbar";
    document.body.insertBefore(targetContainer, document.body.firstChild);
  }

  targetContainer.innerHTML = navbarHtml;

  // Event Listeners
  const logoutBtn = document.getElementById("adminNavLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (typeof Swal !== "undefined") {
        const result = await Swal.fire({
          title: "¿Cerrar Sesión?",
          text: "¿Deseas salir del panel administrativo?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Sí, salir",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#d4af37",
          background: "#121214",
          color: "#fff"
        });
        if (result.isConfirmed) {
          authService.logout();
        }
      } else {
        if (confirm("¿Cerrar sesión?")) {
          authService.logout();
        }
      }
    });
  }

  const cloudinaryBtn = document.getElementById("adminCloudinaryBtn");
  if (cloudinaryBtn) {
    cloudinaryBtn.addEventListener("click", () => {
      openCloudinaryConfigModal();
    });
  }

  const mobileToggle = document.getElementById("adminNavMobileToggle");
  const navMenu = document.getElementById("adminNavMenu");
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("open");
      mobileToggle.classList.toggle("open");
    });
  }
}

// Auto render when DOM is loaded if imported in admin pages
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAdminNavbar);
  } else {
    renderAdminNavbar();
  }
}
