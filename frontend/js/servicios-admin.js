const token = localStorage.getItem("token");
const form = document.getElementById("serviceForm");
const grid = document.getElementById("servicesGrid");

async function cargarServicios() {

  const res = await fetch("http://localhost:3001/api/services");
  const data = await res.json();

  grid.innerHTML = "";

  if(!data.length){
    grid.innerHTML = `<div class="empty-state-card">
    <h3>No hay servicios aún</h3>
    </div>`;
    return;
  }

  data.forEach(service => {

    const card = document.createElement("article");
    card.className = "quote-card";

    card.innerHTML = `
    <img src="http://localhost:3001/uploads/${service.imagen}" style="width:100%;height:220px;object-fit:cover;border-radius:16px;margin-bottom:1rem;">
    <h3>${service.titulo}</h3>
    <p>${service.descripcion}</p>
    <div class="quote-card-actions">
    <button class="btn btn-danger" onclick="eliminarServicio(${service.id})">Eliminar</button>
    </div>
    `;

    grid.appendChild(card);

  });

}

async function eliminarServicio(id){

const confirmar = confirm("Eliminar servicio?");
if(!confirmar) return;

await fetch(`http://localhost:3001/api/services/${id}`,{
method:"DELETE",
headers:{ Authorization:`Bearer ${token}` }
});

cargarServicios();

}

form.addEventListener("submit", async e => {

e.preventDefault();

const data = new FormData();

data.append("titulo",document.getElementById("titulo").value);
data.append("descripcion",document.getElementById("descripcion").value);
data.append("imagen",document.getElementById("imagen").files[0]);

await fetch("http://localhost:3001/api/services",{
method:"POST",
headers:{ Authorization:`Bearer ${token}` },
body:data
});

form.reset();

cargarServicios();

});

cargarServicios();