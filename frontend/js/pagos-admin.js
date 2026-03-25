const API_URL = "http://localhost:3001/api/payments";
const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);

const form = document.getElementById("paymentForm");
const paymentsGrid = document.getElementById("paymentsGrid");
const eventSummary = document.getElementById("eventSummary");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const savePaymentBtn = document.getElementById("savePaymentBtn");
const loadEventBtn = document.getElementById("loadEventBtn");
const eventoIdManual = document.getElementById("eventoIdManual");

const paymentIdInput = document.getElementById("paymentId");
const montoInput = document.getElementById("monto");
const metodoInput = document.getElementById("metodo");
const notaInput = document.getElementById("nota");

let pagosCache = [];
let eventoId = "";

function obtenerEventoIdInicial() {
  return (
    params.get("evento_id") ||
    params.get("id") ||
    localStorage.getItem("eventoIdPago") ||
    ""
  );
}

function setEventoId(id) {
  eventoId = String(id || "").trim();
  if (eventoIdManual) eventoIdManual.value = eventoId;
  if (eventoId) localStorage.setItem("eventoIdPago", eventoId);
}

function limpiarFormulario() {
  paymentIdInput.value = "";
  montoInput.value = "";
  metodoInput.value = "Efectivo";
  notaInput.value = "";
  savePaymentBtn.textContent = "Registrar pago";
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminNombre");
    window.location.href = "./login.html";
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", limpiarFormulario);
}

async function cargarResumenEvento() {
  if (!eventoId) {
    eventSummary.innerHTML = `<p>Escribe un ID de evento y pulsa "Cargar evento".</p>`;
    return false;
  }

  try {
    const res = await fetch(`${API_URL}/event/${eventoId}/summary`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "No se pudo cargar el evento");
    }

    eventSummary.innerHTML = `
      <div style="display:grid; gap:10px;">
        <h2 style="margin:0;">${data.cliente || "Sin cliente"}</h2>

        <div style="display:flex; gap:20px; flex-wrap:wrap;">
          <span><strong>ID Evento:</strong> ${data.id}</span>
          <span><strong>Evento:</strong> ${data.tipo_evento || "-"}</span>
          <span><strong>Fecha:</strong> ${String(data.fecha_evento || "").slice(0, 10)}</span>
          <span><strong>Personas:</strong> ${data.personas || 0}</span>
        </div>

        <div style="display:flex; gap:20px; flex-wrap:wrap; margin-top:10px;">
          <div style="background:#111; padding:10px 15px; border-radius:10px; color:#fff;">
            💰 Total: <strong>$${Number(data.valor_total || 0).toLocaleString("es-CO")}</strong>
          </div>

          <div style="background:#1d6f42; padding:10px 15px; border-radius:10px; color:#fff;">
            ✅ Pagado: <strong>$${Number(data.abono || 0).toLocaleString("es-CO")}</strong>
          </div>

          <div style="background:#8b2e2e; padding:10px 15px; border-radius:10px; color:#fff;">
            ⚠ Saldo: <strong>$${Number(data.saldo || 0).toLocaleString("es-CO")}</strong>
          </div>
        </div>

        <div style="margin-top:8px;">
          <strong>Estado:</strong> ${data.estado || "Pendiente"}
        </div>
      </div>
    `;

    return true;
  } catch (error) {
    console.error("ERROR RESUMEN EVENTO:", error);
    eventSummary.innerHTML = `<p style="color:red;">⚠ No se pudo cargar el evento. Revisa el ID.</p>`;
    return false;
  }
}

async function cargarPagos() {
  if (!eventoId) {
    paymentsGrid.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/event/${eventoId}`);
    const data = await res.json();

    pagosCache = Array.isArray(data) ? data : [];
    paymentsGrid.innerHTML = "";

    if (!pagosCache.length) {
      paymentsGrid.innerHTML = `
        <div class="empty-state-card">
          <h3>No hay pagos</h3>
          <p>Registra el primer pago de este evento.</p>
        </div>
      `;
      return;
    }

    pagosCache.forEach((pago) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      card.innerHTML = `
        <h3 style="color:#4CAF50;">
          +$${Number(pago.monto || 0).toLocaleString("es-CO")}
        </h3>
        <p><strong>Método:</strong> ${pago.metodo || "Sin método"}</p>
        <p><strong>Fecha:</strong> ${String(pago.created_at || "").slice(0, 19).replace("T", " ")}</p>
        <p><strong>Nota:</strong> ${pago.nota || "Sin nota"}</p>

        <div class="quote-card-actions">
          <button class="btn btn-success edit-btn" data-id="${pago.id}" type="button">Editar</button>
          <button class="btn btn-danger delete-btn" data-id="${pago.id}" type="button">Eliminar</button>
        </div>
      `;

      paymentsGrid.appendChild(card);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pago = pagosCache.find((p) => String(p.id) === String(btn.dataset.id));
        if (!pago) return;

        paymentIdInput.value = pago.id;
        montoInput.value = pago.monto || "";
        metodoInput.value = pago.metodo || "Efectivo";
        notaInput.value = pago.nota || "";
        savePaymentBtn.textContent = "Actualizar pago";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const confirmar = confirm("¿Eliminar pago?");
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

          await cargarResumenEvento();
          await cargarPagos();
        } catch (error) {
          console.error("ERROR ELIMINANDO PAGO:", error);
          alert(error.message);
        }
      });
    });
  } catch (error) {
    console.error("ERROR CARGANDO PAGOS:", error);
    paymentsGrid.innerHTML = `<p>Error cargando pagos.</p>`;
  }
}

if (loadEventBtn) {
  loadEventBtn.addEventListener("click", async () => {
    const id = String(eventoIdManual.value || "").trim();

    if (!id) {
      eventSummary.innerHTML = `<p style="color:red;">⚠ Debes ingresar un evento válido</p>`;
      return;
    }

    setEventoId(id);
    const ok = await cargarResumenEvento();
    if (ok) {
      await cargarPagos();
    }
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = paymentIdInput.value;
    const idEventoFinal = String(eventoIdManual.value || eventoId || "").trim();
    const monto = Number(montoInput.value || 0);

    if (!idEventoFinal) {
      eventSummary.innerHTML = `<p style="color:red;">⚠ Debes ingresar un evento válido</p>`;
      return;
    }

    const ok = await cargarResumenEvento();
    if (!ok) {
      alert("Primero carga un evento válido.");
      return;
    }

    if (monto <= 0) {
      alert("⚠ Ingresa un monto válido");
      return;
    }

    try {
      let res;

      if (id) {
        res = await fetch(`${API_URL}/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            monto,
            metodo: metodoInput.value,
            nota: notaInput.value
          })
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            evento_id: Number(idEventoFinal),
            monto,
            metodo: metodoInput.value,
            nota: notaInput.value
          })
        });
      }

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Error guardando pago");
      }

      const nombreCliente =
        eventSummary.querySelector("h2")?.innerText || "Cliente";

      alert(
        id
          ? "✅ Pago actualizado correctamente"
          : `✅ Pago registrado

Cliente: ${nombreCliente}
Monto: $${monto.toLocaleString("es-CO")}`
      );

      limpiarFormulario();
      await cargarResumenEvento();
      await cargarPagos();
    } catch (error) {
      console.error("ERROR GUARDANDO PAGO:", error);
      alert(error.message);
    }
  });
}

(function init() {
  const inicial = obtenerEventoIdInicial();
  if (inicial) {
    setEventoId(inicial);
    cargarResumenEvento().then((ok) => {
      if (ok) cargarPagos();
    });
  } else {
    eventSummary.innerHTML = `<p>Escribe un ID de evento y pulsa "Cargar evento".</p>`;
  }
})();