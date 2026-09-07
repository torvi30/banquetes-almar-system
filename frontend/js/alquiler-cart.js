/**
 * Módulo de E-commerce y Carrito de Alquiler de Mobiliario y Menaje
 * Banquetes Almar (Marinilla, Antioquia).
 */

import { dbService } from "./firebase/db.js";
import { BUSINESS_INFO } from "./firebase/seed-data.js";

const CART_STORAGE_KEY = "almar_rental_cart";

export const rentalCart = {
  items: [],

  init() {
    try {
      this.items = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch (e) {
      this.items = [];
    }
    this.updateCartBadge();
  },

  save() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    this.updateCartBadge();
  },

  addItem(product, qty = 1) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      this.items.push({
        id: product.id,
        nombre: product.nombre,
        precio: product.precio,
        unidad: product.unidad,
        imagen: product.imagen,
        quantity: qty
      });
    }
    this.save();
    this.renderDrawer();
    this.openDrawer();
  },

  removeItem(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
    this.renderDrawer();
  },

  updateQuantity(productId, qty) {
    const item = this.items.find(i => i.id === productId);
    if (item) {
      item.quantity = Math.max(1, qty);
      this.save();
      this.renderDrawer();
    }
  },

  getTotal() {
    return this.items.reduce((acc, item) => acc + item.precio * item.quantity, 0);
  },

  getItemCount() {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  },

  updateCartBadge() {
    const badges = document.querySelectorAll(".cart-count-badge");
    const count = this.getItemCount();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? "inline-flex" : "none";
    });
  },

  openDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");
    if (drawer) drawer.classList.add("open");
    if (overlay) overlay.classList.add("open");
  },

  closeDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");
    if (drawer) drawer.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
  },

  renderDrawer() {
    const container = document.getElementById("cartItemsList");
    const subtotalEl = document.getElementById("cartSubtotal");
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="empty-cart-message">
          <p>Tu carrito de alquiler está vacío.</p>
          <span style="font-size: 0.9rem; color: var(--text-soft);">Agrega sillas, mesas, carpas o menaje para tu evento.</span>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = "$0";
      return;
    }

    container.innerHTML = this.items.map(item => `
      <div class="cart-item-row" data-id="${item.id}">
        <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-thumb" />
        <div class="cart-item-info">
          <h4>${item.nombre}</h4>
          <span class="cart-item-price">$${item.precio.toLocaleString("es-CO")} / ${item.unidad}</span>
          <div class="cart-item-controls">
            <button class="cart-qty-btn decrease-qty" data-id="${item.id}">-</button>
            <span class="cart-qty-val">${item.quantity}</span>
            <button class="cart-qty-btn increase-qty" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="cart-item-remove remove-item-btn" data-id="${item.id}" title="Quitar item">✕</button>
      </div>
    `).join("");

    if (subtotalEl) {
      subtotalEl.textContent = `$${this.getTotal().toLocaleString("es-CO")}`;
    }

    // Event listeners en botones de control
    container.querySelectorAll(".decrease-qty").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const current = this.items.find(i => i.id === id);
        if (current && current.quantity > 1) {
          this.updateQuantity(id, current.quantity - 1);
        } else {
          this.removeItem(id);
        }
      });
    });

    container.querySelectorAll(".increase-qty").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const current = this.items.find(i => i.id === id);
        if (current) this.updateQuantity(id, current.quantity + 1);
      });
    });

    container.querySelectorAll(".remove-item-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.removeItem(btn.dataset.id);
      });
    });
  }
};

export function initRentalStore() {
  rentalCart.init();

  // Botón abrir/cerrar carrito
  const openCartButtons = document.querySelectorAll(".open-cart-btn");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const cartOverlay = document.getElementById("cartOverlay");

  openCartButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      rentalCart.renderDrawer();
      rentalCart.openDrawer();
    });
  });

  if (closeCartBtn) {
    closeCartBtn.addEventListener("click", () => rentalCart.closeDrawer());
  }

  if (cartOverlay) {
    cartOverlay.addEventListener("click", () => rentalCart.closeDrawer());
  }

  // Cargar productos en la cuadrícula de alquiler
  cargarProductosAlquiler();

  // Finalizar alquiler por WhatsApp
  const checkoutBtn = document.getElementById("cartCheckoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (rentalCart.items.length === 0) {
        alert("El carrito está vacío. Elige artículos para tu evento.");
        return;
      }

      const fecha = prompt("¿Para qué fecha necesitas el mobiliario? (Ej: Sábado 14 de Noviembre):");
      if (!fecha) return;

      const municipio = prompt("¿En qué municipio o lugar será el evento? (Ej: Marinilla, Rionegro, El Retiro):") || "Marinilla";
      const nombre = prompt("¿A nombre de quién registramos la solicitud de alquiler?:") || "Cliente";

      const total = rentalCart.getTotal();
      const itemsListText = rentalCart.items.map(i => `• ${i.quantity}x ${i.nombre} ($${(i.precio * i.quantity).toLocaleString("es-CO")})`).join("\n");

      // Guardar también en cotizaciones de Firestore
      dbService.createQuote({
        nombre,
        telefono: "Alquiler Online",
        evento: `Alquiler de Mobiliario (${municipio})`,
        personas: rentalCart.getItemCount(),
        mensaje: `Items solicitados:\n${itemsListText}`,
        totalEstimado: total,
        fechaEvento: fecha,
        origen: "carrito_alquiler"
      });

      const mensaje = 
`🪑 *SOLICITUD DE ALQUILER DE MOBILIARIO - BANQUETES ALMAR* 🪑
────────────────────────
👤 *Cliente:* ${nombre}
📅 *Fecha del evento:* ${fecha}
📍 *Lugar/Municipio:* ${municipio}

📦 *Artículos a Alquilar:*
${itemsListText}

💰 *TOTAL MOBILIARIO:* $${total.toLocaleString("es-CO")} COP
────────────────────────
Solicito confirmación de disponibilidad para esta fecha en Banquetes Almar (Calle 29 # 28-25, Marinilla).`;

      const url = `https://wa.me/${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");

      rentalCart.items = [];
      rentalCart.save();
      rentalCart.renderDrawer();
      rentalCart.closeDrawer();
      alert("¡Tu pedido de alquiler ha sido enviado a WhatsApp! Te responderemos con la confirmación de disponibilidad y logística de flete.");
    });
  }
}

async function cargarProductosAlquiler() {
  const grid = document.getElementById("rentalProductsGrid");
  const filterButtons = document.querySelectorAll(".rental-cat-btn");
  if (!grid) return;

  const items = await dbService.getRentalItems();

  function render(lista) {
    grid.innerHTML = lista.map(item => `
      <article class="service-card rental-card">
        <div class="service-image-wrap">
          <img src="${item.imagen}" alt="${item.nombre}" class="service-image" loading="lazy" />
          <span class="rental-badge">$${item.precio.toLocaleString("es-CO")} / ${item.unidad}</span>
        </div>
        <div class="service-content">
          <h3>${item.nombre}</h3>
          <p>${item.descripcion}</p>
          <div class="rental-action-bar">
            <span class="stock-tag">Stock: ${item.stock} disp.</span>
            <button class="btn btn-primary btn-sm add-rental-item-btn" data-id="${item.id}">
              + Agregar al alquiler
            </button>
          </div>
        </div>
      </article>
    `).join("");

    grid.querySelectorAll(".add-rental-item-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const prodId = btn.dataset.id;
        const prod = items.find(p => p.id === prodId);
        if (prod) {
          rentalCart.addItem(prod, 1);
        }
      });
    });
  }

  render(items);

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.category;
      if (cat === "todos") {
        render(items);
      } else {
        render(items.filter(i => i.categoria.toLowerCase() === cat.toLowerCase()));
      }
    });
  });
}
