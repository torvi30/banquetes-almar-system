/**
 * Reusable Executive Admin Top Navbar Component - Banquetes Almar (Marinilla, Antioquia)
 * Ultra-professional, organized hierarchical navigation suite featuring:
 * - Direct operational links (Dashboard, Cotizaciones CRM, Eventos & Agenda)
 * - Organized dropdown menus (Catálogo & Montajes, Gestión & Finanzas)
 * - Active route intelligence (parent dropdown highlights when child is active)
 * - Executive user profile card with direct quick actions & session control
 * - Responsive off-canvas mobile drawer with category headers
 */

import { authService } from "../firebase/auth.js";
import { openCloudinaryConfigModal } from "../services/cloudinary-service.js";

const NAV_STRUCTURE = [
  {
    type: "link",
    path: "dashboard.html",
    label: "Dashboard",
    icon: "📊"
  },
  {
    type: "link",
    path: "cotizaciones.html",
    label: "Cotizaciones",
    icon: "💬"
  },
  {
    type: "link",
    path: "reservas.html",
    label: "Eventos & Agenda",
    icon: "📅",
    aliases: ["calendario.html", "eventos.html"]
  },
  {
    type: "dropdown",
    id: "navDropdownCatalogo",
    label: "Catálogo & Montajes",
    icon: "💎",
    items: [
      {
        path: "paquetes.html",
        label: "Paquetes de Gala",
        desc: "Bodas, XV Años y Graduaciones",
        icon: "💍"
      },
      {
        path: "servicios.html",
        label: "Servicios & Catering",
        desc: "Banquete, Sonido, Luces y DJ",
        icon: "🍽️"
      },
      {
        path: "inventario.html",
        label: "Inventario & Mobiliario",
        desc: "Silletería, Mantelería y Menaje",
        icon: "📦"
      },
      {
        path: "galeria.html",
        label: "Galería Multimedia",
        desc: "Fotos reales y catálogo Cloudinary",
        icon: "✨"
      }
    ]
  },
  {
    type: "dropdown",
    id: "navDropdownGestion",
    label: "Gestión & Finanzas",
    icon: "💼",
    items: [
      {
        path: "clientes.html",
        label: "Directorio de Clientes",
        desc: "Historial de contratos y contactos",
        icon: "👥",
        aliases: ["cliente.html"]
      },
      {
        path: "pagos.html",
        label: "Pagos & Abonos",
        desc: "Libro financiero y comprobantes",
        icon: "💵"
      },
      {
        path: "contrato.html",
        label: "Generador de Contratos",
        desc: "Minutas legales imprimibles",
        icon: "📜"
      },
      {
        path: "anuncio.html",
        label: "Barra de Anuncios",
        desc: "Franja de promociones en portada",
        icon: "📢"
      }
    ]
  }
];

function isPathActive(currentPath, targetPath, aliases = []) {
  const normCurrent = (currentPath || "dashboard.html").toLowerCase();
  const normTarget = targetPath.toLowerCase();

  if (normCurrent === normTarget) return true;
  if (normCurrent === "" && normTarget === "dashboard.html") return true;
  if (normCurrent.includes(normTarget.replace(".html", ""))) return true;

  if (Array.isArray(aliases)) {
    for (const alias of aliases) {
      if (normCurrent.includes(alias.replace(".html", ""))) return true;
    }
  }

  return false;
}

export function renderAdminNavbar() {
  const currentPath = window.location.pathname.split("/").pop() || "dashboard.html";
  const user = authService.getCurrentUser() || { nombre: "Alejandro Almar", email: "admin@almar.com" };

  const navHtml = NAV_STRUCTURE.map((group) => {
    if (group.type === "link") {
      const active = isPathActive(currentPath, group.path, group.aliases);
      return `
        <a href="./${group.path}" class="admin-nav-link ${active ? "active" : ""}">
          <span class="admin-nav-icon">${group.icon}</span>
          <span class="admin-nav-text">${group.label}</span>
        </a>
      `;
    }

    if (group.type === "dropdown") {
      const hasActiveChild = group.items.some((item) =>
        isPathActive(currentPath, item.path, item.aliases)
      );

      const itemsHtml = group.items.map((item) => {
        const itemActive = isPathActive(currentPath, item.path, item.aliases);
        return `
          <a href="./${item.path}" class="admin-dropdown-item ${itemActive ? "active" : ""}">
            <div class="admin-dropdown-icon-box">${item.icon}</div>
            <div class="admin-dropdown-info">
              <span class="admin-dropdown-title">${item.label}</span>
              <span class="admin-dropdown-desc">${item.desc}</span>
            </div>
          </a>
        `;
      }).join("");

      return `
        <div class="admin-nav-dropdown" id="${group.id}">
          <button type="button" class="admin-dropdown-btn ${hasActiveChild ? "active" : ""}" aria-expanded="false">
            <span class="admin-nav-icon">${group.icon}</span>
            <span class="admin-nav-text">${group.label}</span>
            <span class="admin-dropdown-chevron">▼</span>
          </button>
          <div class="admin-dropdown-menu">
            ${itemsHtml}
          </div>
        </div>
      `;
    }

    return "";
  }).join("");

  const userInitial = ((user.nombre || user.email || "A").charAt(0) || "A").toUpperCase();

  const navbarMarkup = `
    <header class="admin-top-navbar" id="adminTopNavbar">
      <div class="admin-nav-container">
        <!-- MARCA & LOGO EJECUTIVO -->
        <div class="admin-nav-brand-wrap">
          <a href="./dashboard.html" class="admin-nav-brand" title="Ir al Dashboard Principal">
            <div class="admin-brand-emblem">👑</div>
            <div class="admin-brand-info">
              <span class="admin-brand-title">Banquetes Almar</span>
              <span class="admin-brand-badge">Suite Ejecutiva</span>
            </div>
          </a>
        </div>

        <!-- BOTÓN MÓVIL TOGGLE (HAMBURGUESA) -->
        <button class="admin-nav-mobile-toggle" id="adminNavMobileToggle" type="button" aria-label="Abrir Menú de Navegación">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>

        <!-- MENÚ DE NAVEGACIÓN PRINCIPAL -->
        <nav class="admin-nav-menu" id="adminNavMenu">
          <div class="admin-nav-links">
            ${navHtml}
          </div>

          <!-- ACCIONES RÁPIDAS & PERFIL -->
          <div class="admin-nav-actions">
            <!-- BOTÓN DIRECTO: VER SITIO PÚBLICO -->
            <a href="../index.html" target="_blank" rel="noopener" class="admin-tool-btn" title="Ver portal web de cara a clientes">
              <span>🌐</span>
              <span>Ver Web</span>
            </a>

            <!-- MENÚ DESPLEGABLE DE PERFIL DE USUARIO -->
            <div class="admin-user-menu-wrap" id="adminUserMenuWrap">
              <button type="button" class="admin-user-pill-btn" id="adminUserMenuBtn" aria-label="Opciones de cuenta">
                <div class="admin-user-avatar-wrap">
                  <div class="admin-user-avatar">${userInitial}</div>
                  <span class="admin-user-status-dot" title="Sesión activa"></span>
                </div>
                <div class="admin-user-details">
                  <span class="admin-user-name">${user.nombre || "Alejandro Almar"}</span>
                  <span class="admin-user-role">Admin General</span>
                </div>
                <span class="admin-dropdown-chevron" style="margin-left: 4px;">▼</span>
              </button>

              <div class="admin-user-dropdown-card" id="adminUserDropdownCard">
                <div class="admin-user-card-header">
                  <span class="admin-user-card-title">${user.nombre || "Alejandro Almar"}</span>
                  <span class="admin-user-card-sub">${user.email || "admin@almar.com"}</span>
                </div>

                <button type="button" id="adminCloudinaryBtn" class="admin-user-action-item" title="Configuración de Cloudinary">
                  <span>☁️</span>
                  <span>Configurar Cloudinary</span>
                </button>

                <a href="../portal-cliente.html" target="_blank" class="admin-user-action-item">
                  <span>📱</span>
                  <span>Portal del Cliente</span>
                </a>

                <a href="./anuncio.html" class="admin-user-action-item">
                  <span>📢</span>
                  <span>Barra Promocional</span>
                </a>

                <button type="button" id="adminNavLogoutBtn" class="admin-user-action-item danger" title="Cerrar sesión de forma segura">
                  <span>🚪</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  `;

  // Mount container
  let targetContainer = document.getElementById("adminNavbar");
  if (!targetContainer) {
    targetContainer = document.createElement("div");
    targetContainer.id = "adminNavbar";
    document.body.insertBefore(targetContainer, document.body.firstChild);
  }
  targetContainer.innerHTML = navbarMarkup;

  setupNavbarInteractions();
}

function setupNavbarInteractions() {
  // 1. Dropdowns de Catálogo y Gestión
  const dropdownWrappers = document.querySelectorAll(".admin-nav-dropdown");
  dropdownWrappers.forEach((dropdown) => {
    const trigger = dropdown.querySelector(".admin-dropdown-btn");
    if (!trigger) return;

    // Toggle on click
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains("is-open");

      // Close other dropdowns
      closeAllNavbarDropdowns();

      if (!isOpen) {
        dropdown.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    // Hover support on desktop
    dropdown.addEventListener("mouseenter", () => {
      if (window.innerWidth > 1200) {
        closeAllNavbarDropdowns();
        dropdown.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    dropdown.addEventListener("mouseleave", () => {
      if (window.innerWidth > 1200) {
        dropdown.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  });

  // 2. User Menu Dropdown
  const userMenuWrap = document.getElementById("adminUserMenuWrap");
  const userMenuBtn = document.getElementById("adminUserMenuBtn");
  if (userMenuWrap && userMenuBtn) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = userMenuWrap.classList.contains("is-open");
      closeAllNavbarDropdowns();
      if (!isOpen) {
        userMenuWrap.classList.add("is-open");
      }
    });
  }

  // 3. Click outside closes all
  document.addEventListener("click", () => {
    closeAllNavbarDropdowns();
  });

  // 4. Escape key closes all
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllNavbarDropdowns();
    }
  });

  // 5. Cloudinary trigger
  const cloudinaryBtn = document.getElementById("adminCloudinaryBtn");
  if (cloudinaryBtn) {
    cloudinaryBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllNavbarDropdowns();
      openCloudinaryConfigModal();
    });
  }

  // 6. Logout trigger
  const logoutBtn = document.getElementById("adminNavLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      closeAllNavbarDropdowns();

      if (typeof Swal !== "undefined") {
        const result = await Swal.fire({
          title: "¿Cerrar Sesión?",
          text: "¿Deseas salir del panel administrativo?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Sí, salir",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#d4af37",
          cancelButtonColor: "#27272a",
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

  // 7. Mobile hamburger toggle
  const mobileToggle = document.getElementById("adminNavMobileToggle");
  const navMenu = document.getElementById("adminNavMenu");
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navMenu.classList.toggle("open");
      mobileToggle.classList.toggle("open");
    });
  }
}

function closeAllNavbarDropdowns() {
  document.querySelectorAll(".admin-nav-dropdown.is-open").forEach((el) => {
    el.classList.remove("is-open");
    const btn = el.querySelector(".admin-dropdown-btn");
    if (btn) btn.setAttribute("aria-expanded", "false");
  });

  const userMenuWrap = document.getElementById("adminUserMenuWrap");
  if (userMenuWrap) {
    userMenuWrap.classList.remove("is-open");
  }
}

// Auto render when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAdminNavbar);
  } else {
    renderAdminNavbar();
  }
}
