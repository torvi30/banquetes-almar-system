const API_URL = "http://localhost:3001/api/client-detail";
const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);
const clienteId = params.get("id");

const clienteInfo = document.getElementById("clienteInfo");
const resumenCards = document.getElementById("resumenCards");
const eventosCliente = document.getElementById("eventosCliente");
const pagosCliente = document.getElementById("pagosCliente");
const logoutBtn = document.getElementById("logoutBtn");

if (!token) {
  alert("Tu sesión expiró. Inicia sesión nuevamente.");
  window.location.href = "./login.html";
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

function formatearDinero(valor) {
  return `$${Number(valor || 0).toLocaleString("es-CO")}`;
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) {
    return String(fecha).slice(0, 10);
  }

  return d.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function renderCliente(cliente) {
  clienteInfo.innerHTML = `
    <h2>${cliente.nombre || "Sin nombre"}</h2>
    <p><strong>ID:</strong> ${cliente.id}</p>
    <p><strong>Teléfono:</strong> ${cliente.telefono || "No definido"}</p>
    <p><strong>Correo:</strong> ${cliente.email || "No definido"}</p>
    <p><strong>Documento:</strong> ${cliente.documento || "No definido"}</p>
    <p><strong>Dirección:</strong> ${cliente.direccion || "No definida"}</p>
    <p><strong>Tipo:</strong> ${cliente.tipo_cliente || "Cliente"}</p>
  `;
}

function renderResumen(resumen, totalEventosCount, totalPagosCount) {
  resumenCards.innerHTML = `
    <div class="summary-card">
      <span class="summary-title">Eventos</span>
      <strong>${totalEventosCount}</strong>
    </div>

    <div class="summary-card">
      <span class="summary-title">Pagos registrados</span>
      <strong>${totalPagosCount}</strong>
    </div>

    <div class="summary-card">
      <span class="summary-title">Total eventos</span>
      <strong>${formatearDinero(resumen.totalEventos)}</strong>
    </div>

    <div class="summary-card">
      <span class="summary-title">Total pagado</span>
      <strong>${formatearDinero(resumen.totalPagado)}</strong>
    </div>

    <div class="summary-card">
      <span class="summary-title">Saldo pendiente</span>
      <strong>${formatearDinero(resumen.saldo)}</strong>
    </div>
  `;
}

function renderEventos(eventos) {
  if (!eventos.length) {
    eventosCliente.innerHTML = `
      <div class="empty-state-card">
        <h3>Sin eventos</h3>
        <p>Este cliente aún no tiene eventos registrados.</p>
      </div>
    `;
    return;
  }

  eventosCliente.innerHTML = eventos.map(evento => `
    <article class="quote-card">
      <h3>${evento.tipo_evento || "Evento"}</h3>
      <p><strong>ID evento:</strong> ${evento.id}</p>
      <p><strong>Fecha:</strong> ${evento.fecha_evento ? String(evento.fecha_evento).slice(0, 10) : "Sin fecha"}</p>
      <p><strong>Lugar:</strong> ${evento.lugar || "Por definir"}</p>
      <p><strong>Personas:</strong> ${evento.personas || 0}</p>
      <p><strong>Total:</strong> ${formatearDinero(evento.valor_total)}</p>
      <p><strong>Abono:</strong> ${formatearDinero(evento.abono)}</p>
      <p><strong>Saldo:</strong> ${formatearDinero(evento.saldo)}</p>
      <p><strong>Estado:</strong> ${evento.estado || "Pendiente"}</p>
      <p><strong>Observaciones:</strong> ${evento.observaciones || "Sin observaciones"}</p>

      <div class="quote-card-actions">
        <a href="./pagos.html?evento_id=${evento.id}" class="btn btn-secondary">Pagos</a>
        <a href="./eventos.html" class="btn btn-success">Ir a eventos</a>
      </div>
    </article>
  `).join("");
}

function renderPagos(pagos) {
  if (!pagos.length) {
    pagosCliente.innerHTML = `
      <div class="empty-state-card">
        <h3>Sin pagos</h3>
        <p>Este cliente aún no tiene pagos registrados.</p>
      </div>
    `;
    return;
  }

  pagosCliente.innerHTML = pagos.map(pago => `
    <article class="quote-card">
      <h3>${formatearDinero(pago.monto)}</h3>
      <p><strong>ID pago:</strong> ${pago.id}</p>
      <p><strong>Evento:</strong> ${pago.tipo_evento || "No definido"}</p>
      <p><strong>ID evento:</strong> ${pago.evento_id}</p>
      <p><strong>Fecha evento:</strong> ${pago.fecha_evento ? String(pago.fecha_evento).slice(0, 10) : "Sin fecha"}</p>
      <p><strong>Método:</strong> ${pago.metodo || "No definido"}</p>
      <p><strong>Fecha pago:</strong> ${formatearFecha(pago.created_at)}</p>
      <p><strong>Nota:</strong> ${pago.nota || "Sin nota"}</p>

      <div class="quote-card-actions">
        <a href="./pagos.html?evento_id=${pago.evento_id}" class="btn btn-secondary">Ver pagos</a>
      </div>
    </article>
  `).join("");
}

async function cargarCliente() {
  if (!clienteId) {
    clienteInfo.innerHTML = `<p>No se encontró el ID del cliente.</p>`;
    resumenCards.innerHTML = "";
    eventosCliente.innerHTML = "";
    pagosCliente.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${clienteId}`, {
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo cargar el cliente");
    }

    renderCliente(data.cliente);
    renderResumen(data.resumen, data.eventos.length, data.pagos.length);
    renderEventos(data.eventos);
    renderPagos(data.pagos);
  } catch (error) {
    console.error("ERROR CARGANDO CLIENTE:", error);

    clienteInfo.innerHTML = `<p>Error cargando cliente.</p>`;
    resumenCards.innerHTML = "";
    eventosCliente.innerHTML = "";
    pagosCliente.innerHTML = "";
  }
}

cargarCliente();