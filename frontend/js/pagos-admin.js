/**
 * Gestión de Pagos y Abonos - Banquetes Almar (Marinilla, Antioquia)
 * Conectado a dbService (Firestore / Firebase).
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

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

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

function limpiarFormulario() {
  if (paymentIdInput) paymentIdInput.value = "";
  if (montoInput) montoInput.value = "";
  if (metodoInput) metodoInput.value = "Transferencia Bancolombia";
  if (notaInput) notaInput.value = "";
  if (savePaymentBtn) savePaymentBtn.textContent = "Registrar abono";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", limpiarFormulario);
}

function renderPagos(lista) {
  if (!paymentsGrid) return;

  if (!lista.length) {
    paymentsGrid.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-soft); grid-column: 1 / -1;">
        <h3>No hay pagos registrados</h3>
        <p>Registra un anticipo o abono usando el formulario superior.</p>
      </div>
    `;
    return;
  }

  paymentsGrid.innerHTML = lista.map(p => `
    <article class="payment-card" style="background: rgba(22, 22, 22, 0.9); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 1.2rem; margin-bottom: 0.8rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
        <div>
          <h4 style="color: #fff; font-size: 1.05rem;">${p.cliente || "Cliente"}</h4>
          <span style="color: var(--gold-light); font-size: 0.85rem;">💳 ${p.metodo || "Transferencia"}</span>
        </div>
        <strong style="color: #a8d5ba; font-size: 1.2rem;">
          +$${Number(p.monto || 0).toLocaleString("es-CO")}
        </strong>
      </div>

      <div style="font-size: 0.85rem; color: var(--text-soft); margin-top: 0.5rem;">
        <p>📅 <strong>Fecha:</strong> ${p.fecha || new Date().toISOString().slice(0, 10)}</p>
        <p>📝 <strong>Concepto:</strong> ${p.concepto || p.nota || "Abono a evento"}</p>
      </div>
    </article>
  `).join("");
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const monto = parseFloat(montoInput?.value || "0");
    const metodo = metodoInput?.value || "Transferencia Bancolombia";
    const nota = notaInput?.value.trim() || "Abono";
    const resId = eventoIdManual?.value.trim() || "";

    if (monto <= 0) {
      Swal.fire("Monto inválido", "Ingresa un valor positivo.", "warning");
      return;
    }

    try {
      await dbService.createPayment({
        monto,
        metodo,
        concepto: nota,
        reservaId: resId,
        cliente: "Cliente Almar"
      });

      Swal.fire("Pago registrado", "El abono fue ingresado exitosamente.", "success");
      limpiarFormulario();
      await cargarPagos();
    } catch (err) {
      console.error("Error registrando pago:", err);
      Swal.fire("Error", "No se pudo registrar el pago.", "error");
    }
  });
}

async function cargarPagos() {
  try {
    const list = await dbService.getPayments();
    pagosCache = list;
    renderPagos(list);
  } catch (error) {
    console.error("Error cargando pagos:", error);
  }
}

cargarPagos();