const token = localStorage.getItem("token");
const galleryForm = document.getElementById("galleryForm");
const galleryAdminGrid = document.getElementById("galleryAdminGrid");

if (!token) {
  alert("Debes iniciar sesión primero.");
  window.location.href = "./login.html";
}

async function cargarGaleriaAdmin() {
  try {
    const res = await fetch("http://localhost:3001/api/gallery");
    const data = await res.json();

    galleryAdminGrid.innerHTML = "";

    if (!data.length) {
      galleryAdminGrid.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay imágenes aún</h3>
          <p>Sube la primera imagen de la galería.</p>
        </div>
      `;
      return;
    }

    data.forEach((item) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      card.innerHTML = `
        <img src="http://localhost:3001/uploads/${item.imagen}" alt="${item.titulo}" style="width:100%; height:240px; object-fit:cover; border-radius:16px; margin-bottom:1rem;">
        <h3>${item.titulo}</h3>
        <div class="quote-card-actions">
          <button class="btn btn-danger" data-id="${item.id}">Eliminar</button>
        </div>
      `;

      galleryAdminGrid.appendChild(card);
    });

    document.querySelectorAll(".btn-danger").forEach((button) => {
      button.addEventListener("click", async () => {
        await eliminarImagen(button.dataset.id);
      });
    });
  } catch (error) {
    console.error("ERROR GALERIA ADMIN:", error);
    alert("No se pudo cargar la galería.");
  }
}

async function eliminarImagen(id) {
  const confirmar = confirm("¿Deseas eliminar esta imagen?");
  if (!confirmar) return;

  try {
    const res = await fetch(`http://localhost:3001/api/gallery/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo eliminar la imagen.");
    }

    cargarGaleriaAdmin();
  } catch (error) {
    console.error("ERROR DELETE GALERIA:", error);
    alert(error.message);
  }
}

galleryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("titulo", document.getElementById("titulo").value);
  formData.append("imagen", document.getElementById("imagen").files[0]);

  try {
    const res = await fetch("http://localhost:3001/api/gallery", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo subir la imagen.");
    }

    alert("Imagen subida correctamente.");
    galleryForm.reset();
    cargarGaleriaAdmin();
  } catch (error) {
    console.error("ERROR SUBIR GALERIA:", error);
    alert(error.message);
  }
});
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

cargarGaleriaAdmin();