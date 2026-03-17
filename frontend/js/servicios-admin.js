const form = document.getElementById("formServicio");
const listaServicios = document.getElementById("listaServicios");

const token = localStorage.getItem("token");

if (!token) {
  alert("Debes iniciar sesión");
  window.location.href = "./login.html";
}

// 🔥 Crear servicio
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("titulo", document.getElementById("titulo").value);
  formData.append("descripcion", document.getElementById("descripcion").value);
  formData.append("imagen", document.getElementById("imagen").files[0]);

  try {
    const res = await fetch("http://localhost:3001/api/services", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al crear servicio");
    }

    alert("Servicio creado correctamente");
    form.reset();
    cargarServicios();

  } catch (error) {
    console.error("ERROR SERVICIO:", error);
    alert(error.message);
  }
});

// 🔥 Cargar servicios
async function cargarServicios() {
  try {
    const res = await fetch("http://localhost:3001/api/services");
    const data = await res.json();

    listaServicios.innerHTML = "";

    data.forEach(servicio => {
      const div = document.createElement("div");

      div.innerHTML = `
        <h3>${servicio.titulo}</h3>
        <p>${servicio.descripcion}</p>
        <img src="http://localhost:3001/uploads/${servicio.imagen}" width="200"/>
        <br><br>
        <button onclick="eliminarServicio(${servicio.id})">Eliminar</button>
        <hr>
      `;

      listaServicios.appendChild(div);
    });

  } catch (error) {
    console.error(error);
  }
}

// 🔥 Eliminar servicio
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
      throw new Error(data.message || "Error al eliminar");
    }

    cargarServicios();

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

// 🔥 LOGOUT (IMPORTANTE)
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

cargarServicios();