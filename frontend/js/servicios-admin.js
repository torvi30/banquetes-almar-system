const API_URL = "http://localhost:3001/api/services";
const token = localStorage.getItem("token");

const form = document.getElementById("serviceForm");
const grid = document.getElementById("servicesGrid");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveServiceBtn = document.getElementById("saveServiceBtn");

const serviceIdInput = document.getElementById("serviceId");
const tituloInput = document.getElementById("titulo");
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
  serviceIdInput.value = "";
  tituloInput.value = "";
  descripcionInput.value = "";
  imagenInput.value = "";
  saveServiceBtn.textContent = "Guardar servicio";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    limpiarFormulario();
  });
}

async function cargarServiciosAdmin() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    grid.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay servicios</h3>
          <p>Crea el primer servicio.</p>
        </div>
      `;
      return;
    }

    data.forEach((servicio) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      card.innerHTML = `
        <img
          src="http://localhost:3001/uploads/${servicio.imagen}"
          alt="${servicio.titulo}"
          style="width:100%; height:220px; object-fit:cover; border-radius:16px; margin-bottom:1rem;"
        >
        <h3>${servicio.titulo}</h3>
        <p>${servicio.descripcion || ""}</p>

        <div class="quote-card-actions">
          <button class="btn btn-success edit-btn" data-id="${servicio.id}">Editar</button>
          <button class="btn btn-danger delete-btn" data-id="${servicio.id}">Eliminar</button>
        </div>
      `;

      grid.appendChild(card);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const servicio = data.find((s) => String(s.id) === String(btn.dataset.id));
        if (!servicio) return;

        serviceIdInput.value = servicio.id;
        tituloInput.value = servicio.titulo || "";
        descripcionInput.value = servicio.descripcion || "";
        saveServiceBtn.textContent = "Actualizar servicio";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const confirmar = confirm("¿Eliminar servicio?");
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

          await cargarServiciosAdmin();
        } catch (error) {
          console.error("ERROR ELIMINANDO SERVICIO:", error);
          alert(error.message);
        }
      });
    });
  } catch (error) {
    console.error("ERROR CARGANDO SERVICIOS ADMIN:", error);
    grid.innerHTML = `<p>Error cargando servicios.</p>`;
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = serviceIdInput.value;
  const formData = new FormData();

  formData.append("titulo", tituloInput.value);
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
      throw new Error(result.message || "Error guardando servicio");
    }

    alert(id ? "Servicio actualizado correctamente" : "Servicio creado correctamente");
    limpiarFormulario();
    await cargarServiciosAdmin();
  } catch (error) {
    console.error("ERROR GUARDANDO SERVICIO:", error);
    alert(error.message);
  }
});

cargarServiciosAdmin();