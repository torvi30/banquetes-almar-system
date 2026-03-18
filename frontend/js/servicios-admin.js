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

if (!token) {
  alert("Debes iniciar sesión primero.");
  window.location.href = "./login.html";
}

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
  saveServiceBtn.textContent = "Crear servicio";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    limpiarFormulario();
  });
}

async function cargarServicios() {
  try {
    const res = await fetch("http://localhost:3001/api/services");
    const data = await res.json();

    grid.innerHTML = "";

    if (!Array.isArray(data) || !data.length) {
      grid.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay servicios aún</h3>
          <p>Crea el primer servicio para mostrarlo en la página principal.</p>
        </div>
      `;
      return;
    }

    data.forEach((service) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      card.innerHTML = `
        <img 
          src="http://localhost:3001/uploads/${service.imagen}" 
          alt="${service.titulo}"
          style="width:100%; height:220px; object-fit:cover; border-radius:16px; margin-bottom:1rem;"
        >
        <h3>${service.titulo}</h3>
        <p>${service.descripcion}</p>

        <div class="quote-card-actions">
          <button class="btn btn-success edit-service-btn" data-id="${service.id}">
            Editar
          </button>
          <button class="btn btn-danger delete-service-btn" data-id="${service.id}">
            Eliminar
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    document.querySelectorAll(".delete-service-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        await eliminarServicio(button.dataset.id);
      });
    });

    document.querySelectorAll(".edit-service-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const servicio = data.find(s => String(s.id) === String(button.dataset.id));
        if (servicio) {
          cargarServicioEnFormulario(servicio);
        }
      });
    });

  } catch (error) {
    console.error("ERROR CARGAR SERVICIOS:", error);
    alert("No se pudieron cargar los servicios.");
  }
}

function cargarServicioEnFormulario(servicio) {
  serviceIdInput.value = servicio.id;
  tituloInput.value = servicio.titulo || "";
  descripcionInput.value = servicio.descripcion || "";
  saveServiceBtn.textContent = "Actualizar servicio";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function eliminarServicio(id) {
  const confirmar = confirm("¿Eliminar servicio?");
  if (!confirmar) return;

  try {
    const res = await fetch(`http://localhost:3001/api/services/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al eliminar servicio");
    }

    alert("Servicio eliminado correctamente.");
    await cargarServicios();
  } catch (error) {
    console.error("ERROR ELIMINAR SERVICIO:", error);
    alert(error.message);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = serviceIdInput.value;
  const imagenFile = imagenInput.files[0];

  const formData = new FormData();
  formData.append("titulo", tituloInput.value);
  formData.append("descripcion", descripcionInput.value);

  if (imagenFile) {
    formData.append("imagen", imagenFile);
  }

  try {
    let res;

    if (id) {
      res = await fetch(`http://localhost:3001/api/services/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
    } else {
      if (!imagenFile) {
        alert("Debes seleccionar una imagen.");
        return;
      }

      res = await fetch("http://localhost:3001/api/services", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al guardar servicio");
    }

    alert(id ? "Servicio actualizado correctamente." : "Servicio creado correctamente.");
    limpiarFormulario();
    await cargarServicios();
  } catch (error) {
    console.error("ERROR GUARDAR SERVICIO:", error);
    alert(error.message);
  }
});

cargarServicios();