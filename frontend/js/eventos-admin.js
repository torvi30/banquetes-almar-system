const token = localStorage.getItem("token");

const form = document.getElementById("eventForm");
const grid = document.getElementById("eventsGrid");

async function cargarEventos(){

const res = await fetch("http://localhost:3001/api/events");

const data = await res.json();

grid.innerHTML="";

if(!data.length){

grid.innerHTML="<p>No hay eventos registrados</p>";

return;

}

data.forEach(evento => {

const card = document.createElement("article");

card.className="quote-card";

card.innerHTML=`

<h3>${evento.cliente}</h3>

<p>Evento: ${evento.tipo_evento}</p>

<p>Fecha: ${evento.fecha_evento}</p>

<p>Lugar: ${evento.lugar}</p>

<p>Personas: ${evento.personas}</p>

<p>Estado: ${evento.estado}</p>

<p>Total: $${evento.valor_total}</p>

<p>Abono: $${evento.abono}</p>

<p>Saldo: $${evento.saldo}</p>

<button onclick="eliminarEvento(${evento.id})" class="btn btn-danger">

Eliminar

</button>

`;

grid.appendChild(card);

});

}

async function eliminarEvento(id){

const confirmar = confirm("Eliminar evento?");

if(!confirmar) return;

await fetch(`http://localhost:3001/api/events/${id}`,{

method:"DELETE",

headers:{

Authorization:`Bearer ${token}`

}

});

cargarEventos();

}

form.addEventListener("submit", async e => {

e.preventDefault();

const data = {

cliente:document.getElementById("cliente").value,

telefono:document.getElementById("telefono").value,

tipo_evento:document.getElementById("tipo_evento").value,

fecha_evento:document.getElementById("fecha_evento").value,

lugar:document.getElementById("lugar").value,

personas:document.getElementById("personas").value,

valor_total:document.getElementById("valor_total").value,

abono:document.getElementById("abono").value,

estado:document.getElementById("estado").value,

observaciones:document.getElementById("observaciones").value

};

await fetch("http://localhost:3001/api/events",{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:`Bearer ${token}`

},

body:JSON.stringify(data)

});

form.reset();

cargarEventos();

});

cargarEventos();