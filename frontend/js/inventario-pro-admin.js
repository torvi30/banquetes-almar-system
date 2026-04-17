const API_URL = "http://localhost:3001/api/inventory-pro";
const token = localStorage.getItem("token");

const categoryForm = document.getElementById("categoryForm");
const itemForm = document.getElementById("itemForm");
const categoryName = document.getElementById("categoryName");
const categoriesList = document.getElementById("categoriesList");

const itemId = document.getElementById("itemId");
const categoriaId = document.getElementById("categoriaId");
const itemNombre = document.getElementById("itemNombre");
const itemCantidad = document.getElementById("itemCantidad");
const itemActivo = document.getElementById("itemActivo");
const itemDescripcion = document.getElementById("itemDescripcion");
const saveItemBtn = document.getElementById("saveItemBtn");
const cancelItemEditBtn = document.getElementById("cancelItemEditBtn");
const itemsGrid = document.getElementById("itemsGrid");
const logoutBtn = document.getElementById("logoutBtn");

let categoriesCache = [];
let itemsCache = [];

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

function limpiarItemForm() {
  itemId.value = "";
  categoriaId.value = "";
  itemNombre.value = "";
  itemCantidad.value = "";
  itemActivo.value = "1";
  itemDescripcion.value = "";
  saveItemBtn.textContent = "Guardar item";
}

cancelItemEditBtn.addEventListener("click", limpiarItemForm);

async function cargarCategorias() {
  const res = await fetch(`${API_URL}/categories`, {
    headers: authHeaders()
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "No se pudieron cargar categorías");

  categoriesCache = Array.isArray(data) ? data : [];

  categoriaId.innerHTML = `<option value="">Sin categoría</option>`;
  categoriesCache.forEach(cat => {
    categoriaId.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
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
    : `<div class="dashboard-empty"><h4>Sin categorías</h4><p>No hay categorías registradas.</p></div>`;
}

async function cargarItems() {
  const res = await fetch(`${API_URL}/items`, {
    headers: authHeaders()
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "No se pudo cargar inventario");

  itemsCache = Array.isArray(data) ? data : [];

  itemsGrid.innerHTML = itemsCache.length
    ? itemsCache.map(item => `
        <article class="quote-card">
          <h3>${item.nombre}</h3>
          <p><strong>Categoría:</strong> ${item.categoria_nombre || "Sin categoría"}</p>
          <p><strong>Cantidad total:</strong> ${item.cantidad_total}</p>
          <p><strong>Activo:</strong> ${Number(item.activo) === 1 ? "Sí" : "No"}</p>
          <p><strong>Descripción:</strong> ${item.descripcion || "Sin descripción"}</p>

          <div class="quote-card-actions">
            <button class="btn btn-success edit-item-btn" data-id="${item.id}">Editar</button>
            <button class="btn btn-danger delete-item-btn" data-id="${item.id}">Eliminar</button>
          </div>
        </article>
      `).join("")
    : `<div class="empty-state-card"><h3>Sin inventario</h3><p>No hay items registrados.</p></div>`;

  document.querySelectorAll(".edit-item-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = itemsCache.find(i => String(i.id) === String(btn.dataset.id));
      if (!item) return;

      itemId.value = item.id;
      categoriaId.value = item.categoria_id || "";
      itemNombre.value = item.nombre || "";
      itemCantidad.value = item.cantidad_total || 0;
      itemActivo.value = Number(item.activo) === 1 ? "1" : "0";
      itemDescripcion.value = item.descripcion || "";
      saveItemBtn.textContent = "Actualizar item";

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll(".delete-item-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar item?",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });

      if (!confirm.isConfirmed) return;

      const res = await fetch(`${API_URL}/items/${btn.dataset.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire("Error", data.message || "No se pudo eliminar", "error");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Eliminado",
        timer: 1000,
        showConfirmButton: false
      });

      await cargarItems();
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

    if (!res.ok) throw new Error(data.message || "No se pudo guardar");

    Swal.fire({
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

itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    categoria_id: categoriaId.value || null,
    nombre: itemNombre.value,
    descripcion: itemDescripcion.value,
    cantidad_total: itemCantidad.value,
    activo: Number(itemActivo.value)
  };

  try {
    let res;

    if (itemId.value) {
      res = await fetch(`${API_URL}/items/${itemId.value}`, {
        method: "PUT",
        headers: authHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: authHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "No se pudo guardar");

    Swal.fire({
      icon: "success",
      title: itemId.value ? "Item actualizado" : "Item creado",
      timer: 1000,
      showConfirmButton: false
    });

    limpiarItemForm();
    await cargarItems();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
});

(async function init() {
  try {
    await cargarCategorias();
    await cargarItems();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
})();