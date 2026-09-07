/**
 * Gestión de Inventario y Mobiliario - Banquetes Almar (Marinilla, Antioquia)
 * Conectado a dbService (Firestore / Firebase).
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

const form = document.getElementById("inventoryForm");
const grid = document.getElementById("inventoryGrid");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveInventoryBtn = document.getElementById("saveInventoryBtn");

const inventoryIdInput = document.getElementById("inventoryId");
const nombreInput = document.getElementById("nombre");
const categoriaInput = document.getElementById("categoria_id");
const cantidadTotalInput = document.getElementById("cantidad_total");
const cantidadDisponibleInput = document.getElementById("cantidad_disponible");
const descripcionInput = document.getElementById("descripcion");
const imagenInput = document.getElementById("imagen");

let inventarioCache = [];

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

function limpiarFormulario() {
  if (inventoryIdInput) inventoryIdInput.value = "";
  if (nombreInput) nombreInput.value = "";
  if (categoriaInput) categoriaInput.value = "sillas";
  if (cantidadTotalInput) cantidadTotalInput.value = "";
  if (cantidadDisponibleInput) cantidadDisponibleInput.value = "";
  if (descripcionInput) descripcionInput.value = "";
  if (imagenInput) imagenInput.value = "";
  if (saveInventoryBtn) saveInventoryBtn.textContent = "Guardar item";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", limpiarFormulario);
}

function renderInventario(items) {
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-soft); grid-column: 1 / -1;">
        <h3>No hay artículos en el inventario</h3>
        <p>Agrega sillas, mesas, carpas o menaje desde el formulario.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => `
    <article class="service-card" style="background: rgba(22, 22, 22, 0.9); border: 1px solid var(--border-glass); border-radius: var(--radius-md); overflow: hidden;">
      <div class="service-image-wrap" style="height: 180px; position: relative;">
        <img src="${item.imagen || 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80'}" alt="${item.nombre}" style="width: 100%; height: 100%; object-fit: cover;" />
        <span style="position: absolute; top: 0.6rem; right: 0.6rem; background: var(--gold-gradient); color: #000; font-weight: 700; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 999px; text-transform: uppercase;">
          ${item.categoria || "Mobiliario"}
        </span>
      </div>
      <div style="padding: 1.2rem;">
        <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 0.4rem;">${item.nombre}</h3>
        <p style="color: var(--text-soft); font-size: 0.85rem; margin-bottom: 0.8rem;">${item.descripcion || ""}</p>
        
        <div style="background: rgba(255, 255, 255, 0.04); padding: 0.6rem; border-radius: 6px; font-size: 0.82rem; margin-bottom: 0.8rem;">
          <div>💰 Precio alquiler: <strong style="color: var(--gold-light);">$${Number(item.precio || 0).toLocaleString("es-CO")}</strong> / ${item.unidad || "día"}</div>
          <div>📦 Stock total: <strong>${item.stock || item.cantidad_total || 0} unidades</strong></div>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm edit-inv-btn" data-id="${item.id}" style="flex: 1;">
            Editar
          </button>
          <button class="btn btn-secondary btn-sm delete-inv-btn" data-id="${item.id}" style="color: #e74c3c;">
            ✕
          </button>
        </div>
      </div>
    </article>
  `).join("");

  // Conectar acciones
  grid.querySelectorAll(".edit-inv-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const item = inventarioCache.find(i => i.id === id);
      if (item) {
        if (inventoryIdInput) inventoryIdInput.value = item.id;
        if (nombreInput) nombreInput.value = item.nombre || "";
        if (categoriaInput) categoriaInput.value = item.categoria || "sillas";
        if (cantidadTotalInput) cantidadTotalInput.value = item.stock || item.cantidad_total || 0;
        if (cantidadDisponibleInput) cantidadDisponibleInput.value = item.stock || item.cantidad_disponible || 0;
        if (descripcionInput) descripcionInput.value = item.descripcion || "";
        if (saveInventoryBtn) saveInventoryBtn.textContent = "Actualizar item";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  grid.querySelectorAll(".delete-inv-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const confirm = await Swal.fire({
        title: "¿Eliminar artículo?",
        text: "Se retirará del inventario y del catálogo de alquiler.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (confirm.isConfirmed) {
        let items = await dbService.getRentalItems();
        items = items.filter(i => i.id !== id);
        localStorage.setItem("almar_mobiliario", JSON.stringify(items));
        await cargarInventario();
        Swal.fire("Eliminado", "El artículo ha sido retirado.", "success");
      }
    });
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = inventoryIdInput?.value;
    const items = await dbService.getRentalItems();

    const datos = {
      id: id || "mob-" + Date.now(),
      nombre: nombreInput?.value.trim(),
      categoria: categoriaInput?.value || "sillas",
      precio: 10000, // Precio base por defecto si no se especifica
      unidad: "día/evento",
      stock: parseInt(cantidadTotalInput?.value || "10", 10),
      descripcion: descripcionInput?.value.trim() || "",
      imagen: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80"
    };

    if (id) {
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...datos };
      }
    } else {
      items.push(datos);
    }

    localStorage.setItem("almar_mobiliario", JSON.stringify(items));
    Swal.fire("Guardado", "El inventario ha sido actualizado.", "success");
    limpiarFormulario();
    await cargarInventario();
  });
}

async function cargarInventario() {
  try {
    const items = await dbService.getRentalItems();
    inventarioCache = items;
    renderInventario(items);
  } catch (error) {
    console.error("Error cargando inventario:", error);
  }
}

cargarInventario();