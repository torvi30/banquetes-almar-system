const API = "http://localhost:3001/api/events";

const form = document.getElementById("eventForm");
const lista = document.getElementById("eventsList");
const logoutBtn = document.getElementById("logoutBtn");

let editandoId = null;

function calcularEstado(total, abono) {
  total = Number(total || 0);
  abono = Number(abono || 0);

  if (abono <= 0) return "Pendiente";
  if (abono < total) return "Parcial";
  return "Pagado";
}

function formatearDinero(valor) {
  return "$" + Number(valor || 0).toLocaleString("es-CO");
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

async function cargarEventos() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    lista.innerHTML = "";

    if (!data.length) {
      lista.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay eventos registrados</h3>
          <p>Cuando guardes eventos aparecerán aquí.</p>
        </div>
      `;
      return;
    }

    data.forEach((ev) => {
      const saldo = Number(ev.valorTotal || 0) - Number(ev.abono || 0);
      const estadoPago = calcularEstado(ev.valorTotal, ev.abono);

      lista.innerHTML += `
        <article class="quote-card">
          <h3>${ev.cliente}</h3>
          <p><strong>Teléfono:</strong> ${ev.telefono || "No definido"}</p>
          <p><strong>Evento:</strong> ${ev.tipo || "No definido"}</p>
          <p><strong>Fecha:</strong> ${ev.fecha || "No definida"}</p>
          <p><strong>Lugar:</strong> ${ev.lugar || "No definido"}</p>
          <p><strong>Personas:</strong> ${ev.personas || 0}</p>
          <p><strong>Total:</strong> ${formatearDinero(ev.valorTotal)}</p>
          <p><strong>Abono:</strong> ${formatearDinero(ev.abono)}</p>
          <p><strong>Saldo:</strong> ${formatearDinero(saldo)}</p>
          <p><strong>Estado pago:</strong> ${estadoPago}</p>

          <div class="quote-card-actions">
            <button class="btn btn-success" onclick="editar(${ev.id})">Editar</button>
            <button class="btn btn-danger" onclick="eliminarEvento(${ev.id})">Eliminar</button>
          </div>
        </article>
      `;
    });
  } catch (error) {
    console.error("ERROR CARGAR EVENTOS:", error);
    alert("Error al cargar eventos");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  alert("Formulario enviado"); // 👈 prueba

  console.log("CLICK DETECTADO");

  const evento = {
    cliente: form.cliente.value,
    telefono: form.telefono.value,
    tipo: form.tipo.value,
    fecha: form.fecha.value,
    lugar: form.lugar.value,
    personas: form.personas.value,
    valorTotal: Number(form.valorTotal.value || 0),
    abono: Number(form.abono.value || 0)
  };

  console.log("DATOS:", evento);

  try {
    const res = await fetch("http://localhost:3001/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(evento)
    });

    console.log("RESPUESTA:", res);

    const data = await res.json();
    console.log("DATA:", data);

    alert("Evento guardado");

    form.reset();
    cargarEventos();

  } catch (error) {
    console.error("ERROR:", error);
    alert("Error al guardar");
  }
});

window.editar = async (id) => {
  try {
    const res = await fetch(API);
    const data = await res.json();

    const ev = data.find((e) => String(e.id) === String(id));
    if (!ev) return;

    form.cliente.value = ev.cliente || "";
    form.telefono.value = ev.telefono || "";
    form.tipo.value = ev.tipo || "";
    form.fecha.value = ev.fecha || "";
    form.lugar.value = ev.lugar || "";
    form.personas.value = ev.personas || "";
    form.valorTotal.value = ev.valorTotal || "";
    form.abono.value = ev.abono || "";

    editandoId = id;

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  } catch (error) {
    console.error("ERROR EDITAR:", error);
  }
};

window.eliminarEvento = async (id) => {
  const confirmar = confirm("¿Eliminar evento?");
  if (!confirmar) return;

  try {
    await fetch(`${API}/${id}`, {
      method: "DELETE"
    });

    cargarEventos();
  } catch (error) {
    console.error("ERROR ELIMINAR:", error);
    alert("Error al eliminar evento");
  }
};

cargarEventos();