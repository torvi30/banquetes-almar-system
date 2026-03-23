const API_URL = "http://localhost:3001/api/inventory";
const token = localStorage.getItem("token");

const categoryForm = document.getElementById("categoryForm");
const newCategoryName = document.getElementById("newCategoryName");

const form = document.getElementById("inventoryForm");
const grid = document.getElementById("inventoryGrid");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveInventoryBtn = document.getElementById("saveInventoryBtn");

const inventoryIdInput = document.getElementById("inventoryId");
const nombreInput = document.getElementById("nombre");
const categoriaIdInput = document.getElementById("categoria_id");
const cantidadTotalInput = document.getElementById("cantidad_total");
const cantidadDisponibleInput = document.getElementById("cantidad_disponible");
const descripcionInput = document.getElementById("descripcion");
const imagenInput = document.getElementById("imagen");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

function limpiarFormulario() {
  inventoryIdInput.value = "";
  nombreInput.value = "";
  categoriaIdInput.value = "";
  cantidadTotalInput.value = "";
  cantidadDisponibleInput.value = "";
  descripcionInput.value = "";
  imagenInput.value = "";
  saveInventoryBtn.textContent = "Guardar item";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    limpiarFormulario();
  });
}

async function cargarCategorias() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    const data = await res.json();

    categoriaIdInput.innerHTML = `<option value="">Selecciona una categoría</option>`;

    if (Array.isArray(data)) {
      data.forEach((cat) => {
        categoriaIdInput.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
      });
    }
  } catch (error) {
    console.error("ERROR CARGANDO CATEGORIAS INVENTARIO:", error);
    categoriaIdInput.innerHTML = `<option value="">Error cargando categorías</option>`;
  }
}

async function cargarInventario() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    grid.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay inventario</h3>
          <p>Crea el primer item.</p>
        </div>
      `;
      return;
    }

    data.forEach((item) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      card.innerHTML = `
        ${item.imagen ? `
          <img
            src="http://localhost:3001/uploads/${item.imagen}"
            alt="${item.nombre}"
            style="width:100%; height:220px; object-fit:cover; border-radius:16px; margin-bottom:1rem;"
          >
        ` : ""}

        <h3>${item.nombre}</h3>
        <p><strong>Categoría:</strong> ${item.categoria || "Sin categoría"}</p>
        <p><strong>Total:</strong> ${item.cantidad_total}</p>
        <p><strong>Disponible:</strong> ${item.cantidad_disponible}</p>
        <p><strong>Alquilado:</strong> ${item.cantidad_alquilada}</p>
        <p>${item.descripcion || ""}</p>

        <div class="quote-card-actions">
          <button class="btn btn-success edit-btn" data-id="${item.id}">Editar</button>
          <button class="btn btn-danger delete-btn" data-id="${item.id}">Eliminar</button>
        </div>
      `;

      grid.appendChild(card);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = data.find((x) => String(x.id) === String(btn.dataset.id));
        if (!item) return;

        inventoryIdInput.value = item.id;
        nombreInput.value = item.nombre || "";
        categoriaIdInput.value = item.categoria_id || "";
        cantidadTotalInput.value = item.cantidad_total ?? "";
        cantidadDisponibleInput.value = item.cantidad_disponible ?? "";
        descripcionInput.value = item.descripcion || "";
        saveInventoryBtn.textContent = "Actualizar item";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const confirmar = confirm("¿Eliminar item?");
        if (!confirmar) return;

        try {
          const res = await fetch(`${API_URL}/${btn.dataset.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.message || "No se pudo eliminar");
          }

          await cargarInventario();
        } catch (error) {
          console.error("ERROR ELIMINANDO ITEM:", error);
          alert(error.message);
        }
      });
    });
  } catch (error) {
    console.error("ERROR CARGANDO INVENTARIO:", error);
    grid.innerHTML = `<p>Error cargando inventario.</p>`;
  }
}

categoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const res = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: newCategoryName.value
      })
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Error creando categoría");
    }

    alert("Categoría creada correctamente");
    newCategoryName.value = "";
    await cargarCategorias();
  } catch (error) {
    console.error("ERROR CREANDO CATEGORIA:", error);
    alert(error.message);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = inventoryIdInput.value;
  const total = Number(cantidadTotalInput.value || 0);
  const disponible = Number(cantidadDisponibleInput.value || 0);

  if (disponible > total) {
    alert("La cantidad disponible no puede ser mayor que la total.");
    return;
  }

  const formData = new FormData();
  formData.append("nombre", nombreInput.value);
  formData.append("categoria_id", categoriaIdInput.value);
  formData.append("cantidad_total", total);
  formData.append("cantidad_disponible", disponible);
  formData.append("descripcion", descripcionInput.value);

  if (imagenInput.files[0]) {
    formData.append("imagen", imagenInput.files[0]);
  }

  try {
    let res;

    if (id) {
      res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
    } else {
      res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
    }

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Error guardando item");
    }

    alert(id ? "Item actualizado correctamente" : "Item creado correctamente");
    limpiarFormulario();
    await cargarInventario();
  } catch (error) {
    console.error("ERROR GUARDANDO ITEM:", error);
    alert(error.message);
  }
});

(async function init() {
  await cargarCategorias();
  await cargarInventario();
})();