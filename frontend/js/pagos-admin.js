/**
 * Gestión Ejecutiva de Pagos, Abonos y Finanzas - Banquetes Almar (Marinilla, Antioquia)
 * Conectado a dbService (Firestore / Firebase + Fallback Offline).
 */

import { authService } from "./firebase/auth.js";
import { dbService } from "./firebase/db.js";

authService.requireAuth("./login.html");

// Elementos del DOM
const form = document.getElementById("paymentForm");
const paymentsGrid = document.getElementById("paymentsGrid");
const eventSummary = document.getElementById("eventSummary");
const logoutBtn = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const savePaymentBtn = document.getElementById("savePaymentBtn");
const formActionTitle = document.getElementById("formActionTitle");

// Selector y Búsqueda de Eventos
const eventoSelect = document.getElementById("eventoSelect");
const eventoIdManual = document.getElementById("eventoIdManual");
const loadEventBtn = document.getElementById("loadEventBtn");
const clearSelectionBtn = document.getElementById("clearSelectionBtn");

// Campos del formulario
const paymentIdInput = document.getElementById("paymentId");
const selectedEventoIdInput = document.getElementById("selectedEventoId");
const selectedClientNameInput = document.getElementById("selectedClientName");
const montoInput = document.getElementById("monto");
const metodoInput = document.getElementById("metodo");
const fechaPagoInput = document.getElementById("fechaPago");
const comprobanteInput = document.getElementById("comprobante");
const notaInput = document.getElementById("nota");
const pillPagarSaldo = document.getElementById("pillPagarSaldo");

// KPIs
const kpiTotalRecaudado = document.getElementById("kpiTotalRecaudado");
const kpiCarteraPendiente = document.getElementById("kpiCarteraPendiente");
const kpiCantidadPagos = document.getElementById("kpiCantidadPagos");

// Filtros
const filterAllBtn = document.getElementById("filterAllBtn");
const filterEventBtn = document.getElementById("filterEventBtn");

// Modal de Recibo
const receiptModal = document.getElementById("receiptModal");
const cerrarReciboBtn = document.getElementById("cerrarReciboBtn");
const imprimirReciboBtn = document.getElementById("imprimirReciboBtn");
const whatsappReciboBtn = document.getElementById("whatsappReciboBtn");

// Estado local
let eventosCache = [];
let pagosCache = [];
let selectedEvento = null;
let filtroSoloEvento = false;
let currentReceiptData = null;

// Inicializar fecha de pago por defecto (hoy)
if (fechaPagoInput) {
  fechaPagoInput.value = new Date().toISOString().slice(0, 10);
}

// Cerrar sesión
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    authService.logout();
    window.location.href = "./login.html";
  });
}

// ----------------- FORMATEADORES -----------------
function formatoMoneda(valor) {
  return "$" + Number(valor || 0).toLocaleString("es-CO");
}

function limpiarFormulario() {
  if (paymentIdInput) paymentIdInput.value = "";
  if (montoInput) montoInput.value = "";
  if (metodoInput) metodoInput.value = "Transferencia Bancolombia";
  if (fechaPagoInput) fechaPagoInput.value = new Date().toISOString().slice(0, 10);
  if (comprobanteInput) comprobanteInput.value = "";
  if (notaInput) notaInput.value = "";
  
  if (savePaymentBtn) savePaymentBtn.innerHTML = "💰 Registrar Abono";
  if (formActionTitle) formActionTitle.textContent = "2. Registrar Nuevo Abono";
  if (cancelEditBtn) cancelEditBtn.style.display = "none";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", limpiarFormulario);
}

// ----------------- CARGA DE DATOS & KPIS -----------------
async function inicializar() {
  await cargarEventos();
  await cargarPagos();
  evaluarParametrosURL();
}

async function cargarEventos() {
  try {
    eventosCache = await dbService.getReservations();
    poblarSelectorEventos(eventosCache);
    calcularKPIs();
  } catch (error) {
    console.error("Error cargando agenda de eventos:", error);
  }
}

async function cargarPagos() {
  try {
    pagosCache = await dbService.getPayments();
    renderPagos();
    calcularKPIs();
  } catch (error) {
    console.error("Error cargando pagos:", error);
  }
}

function calcularKPIs() {
  const totalRecaudado = pagosCache.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
  const carteraPendiente = eventosCache
    .filter(ev => ev.estado !== "Cancelada")
    .reduce((sum, ev) => sum + (Number(ev.saldo) || 0), 0);

  if (kpiTotalRecaudado) kpiTotalRecaudado.textContent = formatoMoneda(totalRecaudado);
  if (kpiCarteraPendiente) kpiCarteraPendiente.textContent = formatoMoneda(carteraPendiente);
  if (kpiCantidadPagos) kpiCantidadPagos.textContent = `${pagosCache.length} recibos`;
}

// ----------------- SELECTOR DE EVENTOS -----------------
function poblarSelectorEventos(eventos) {
  if (!eventoSelect) return;
  
  const valorActual = eventoSelect.value;
  eventoSelect.innerHTML = `<option value="">-- Selecciona un evento para ver saldo y abonar --</option>`;

  eventos.forEach(ev => {
    const saldoTxt = Number(ev.saldo || 0) <= 0 ? "🟢 Totalmente Pagado" : `Saldo: ${formatoMoneda(ev.saldo)}`;
    const opt = document.createElement("option");
    opt.value = ev.id;
    opt.textContent = `[${ev.fecha_evento || "Sin fecha"}] ${ev.cliente || "Cliente"} — ${ev.tipo_evento || "Evento"} (${saldoTxt})`;
    eventoSelect.appendChild(opt);
  });

  if (valorActual) {
    eventoSelect.value = valorActual;
  }
}

// Cambio en el selector
if (eventoSelect) {
  eventoSelect.addEventListener("change", (e) => {
    const id = e.target.value;
    if (id) {
      seleccionarEventoPorId(id);
    } else {
      deseleccionarEvento();
    }
  });
}

// Búsqueda manual por ID o texto
function buscarEventoManual() {
  const query = (eventoIdManual?.value || "").trim().toLowerCase();
  if (!query) {
    Swal.fire("Ingresa un término", "Escribe el ID, nombre del cliente o teléfono.", "info");
    return;
  }

  const match = eventosCache.find(ev => {
    const idMatch = String(ev.id || "").toLowerCase() === query;
    const clientMatch = String(ev.cliente || "").toLowerCase().includes(query);
    const telMatch = String(ev.telefono || "").includes(query);
    const docMatch = String(ev.documento || "").includes(query);
    return idMatch || clientMatch || telMatch || docMatch;
  });

  if (match) {
    seleccionarEvento(match);
    Swal.fire({
      icon: "success",
      title: "Evento cargado",
      text: `Se cargó el evento de ${match.cliente}`,
      timer: 1600,
      showConfirmButton: false
    });
  } else {
    Swal.fire({
      icon: "warning",
      title: "Evento no encontrado",
      text: `No se encontró ningún evento con el término "${query}". Revisa en el selector o en la lista de eventos.`
    });
  }
}

if (loadEventBtn) {
  loadEventBtn.addEventListener("click", buscarEventoManual);
}

if (eventoIdManual) {
  eventoIdManual.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarEventoManual();
    }
  });
}

if (clearSelectionBtn) {
  clearSelectionBtn.addEventListener("click", deseleccionarEvento);
}

function seleccionarEventoPorId(id) {
  const ev = eventosCache.find(e => String(e.id) === String(id));
  if (ev) {
    seleccionarEvento(ev);
  }
}

function seleccionarEvento(evento) {
  selectedEvento = evento;
  
  if (eventoSelect) eventoSelect.value = evento.id;
  if (eventoIdManual) eventoIdManual.value = evento.id;
  if (selectedEventoIdInput) selectedEventoIdInput.value = evento.id;
  if (selectedClientNameInput) selectedClientNameInput.value = evento.cliente || "Cliente";

  // Mostrar botón de filtro por evento
  if (filterEventBtn) {
    filterEventBtn.style.display = "inline-block";
    filterEventBtn.textContent = `Solo ${evento.cliente.split(" ")[0]}`;
  }

  // Píldora de pagar saldo total
  const saldoNum = Number(evento.saldo || 0);
  if (pillPagarSaldo) {
    if (saldoNum > 0) {
      pillPagarSaldo.style.display = "inline-block";
      pillPagarSaldo.textContent = `⚡ Saldo Total (${formatoMoneda(saldoNum)})`;
      pillPagarSaldo.dataset.amount = saldoNum;
    } else {
      pillPagarSaldo.style.display = "none";
    }
  }

  renderResumenEvento(evento);
}

function deseleccionarEvento() {
  selectedEvento = null;
  if (eventoSelect) eventoSelect.value = "";
  if (eventoIdManual) eventoIdManual.value = "";
  if (selectedEventoIdInput) selectedEventoIdInput.value = "";
  if (selectedClientNameInput) selectedClientNameInput.value = "";

  if (filterEventBtn) {
    filterEventBtn.style.display = "none";
  }
  if (pillPagarSaldo) {
    pillPagarSaldo.style.display = "none";
  }

  filtroSoloEvento = false;
  actualizarEstiloBotonesFiltro();

  if (eventSummary) {
    eventSummary.innerHTML = `
      <div style="background: rgba(255,255,255,0.03); border: 1px dashed rgba(212,175,55,0.25); border-radius: var(--radius-md); padding: 1.8rem; text-align: center; color: var(--text-soft); margin-bottom: 1.8rem;">
        <p style="margin: 0; font-size: 0.95rem;">
          💡 Selecciona un evento arriba para ver el estado de su contrato, su barra de abonos y registrar pagos con 1 solo clic.
        </p>
      </div>
    `;
  }

  renderPagos();
}

function renderResumenEvento(ev) {
  if (!eventSummary) return;

  const total = Number(ev.total || 0);
  const abonado = Number(ev.anticipo || 0);
  const saldo = Number(ev.saldo || 0);
  const porcentaje = total > 0 ? Math.min(100, Math.round((abonado / total) * 100)) : 0;
  const isPaid = saldo <= 0;

  eventSummary.innerHTML = `
    <div class="event-financial-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <span style="background: rgba(212,175,55,0.15); color: var(--gold-light); font-size: 0.78rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
            ${ev.tipo_evento || "Evento de Gala"}
          </span>
          <h3 style="color: #fff; font-size: 1.4rem; margin: 0.4rem 0 0.2rem 0; font-family: var(--font-heading);">
            ${ev.cliente || "Cliente"}
          </h3>
          <p style="margin: 0; font-size: 0.88rem; color: var(--text-soft);">
            📅 <strong>${ev.fecha_evento || "Por definir"}</strong> ${ev.hora_evento ? `a las ${ev.hora_evento}` : ""} • 📍 ${ev.locacion || "Marinilla"}
            ${ev.personas ? ` • 👥 ${ev.personas} invitados` : ""}
          </p>
        </div>

        <div style="display: flex; gap: 0.6rem; align-items: center;">
          ${ev.telefono ? `
            <a href="https://api.whatsapp.com/send?phone=57${ev.telefono.replace(/\D/g, '')}" target="_blank" class="btn btn-secondary btn-sm" style="background: rgba(37,211,102,0.15); border-color: rgba(37,211,102,0.4); color: #25d366;">
              💬 WhatsApp
            </a>
          ` : ""}
          <a href="./contrato.html?id=${ev.id}" target="_blank" class="btn btn-secondary btn-sm" style="color: var(--gold-light);">
            📄 Ver Contrato
          </a>
        </div>
      </div>

      <!-- Barra de Progreso Financiero -->
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-soft); margin-bottom: 0.3rem;">
        <span>Progreso de Pagos: <strong>${porcentaje}% abonado</strong></span>
        <span>${isPaid ? "🟢 ¡Contrato Pagado en su totalidad!" : `Falta por recaudar: ${formatoMoneda(saldo)}`}</span>
      </div>
      <div class="finance-progress-bar">
        <div class="finance-progress-fill" style="width: ${porcentaje}%;"></div>
      </div>

      <!-- Métricas del Contrato -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-top: 1.2rem; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1rem;">
        <div>
          <span style="font-size: 0.78rem; color: var(--text-soft); text-transform: uppercase;">Total Contratado</span>
          <strong style="display: block; font-size: 1.25rem; color: #fff;">${formatoMoneda(total)}</strong>
        </div>
        <div>
          <span style="font-size: 0.78rem; color: #a8d5ba; text-transform: uppercase;">Abonado Hasta Hoy</span>
          <strong style="display: block; font-size: 1.25rem; color: #a8d5ba;">${formatoMoneda(abonado)}</strong>
        </div>
        <div>
          <span style="font-size: 0.78rem; color: #e74c3c; text-transform: uppercase;">Saldo Pendiente</span>
          <strong style="display: block; font-size: 1.25rem; color: ${saldo > 0 ? '#e74c3c' : '#2ecc71'};">
            ${formatoMoneda(saldo)}
          </strong>
        </div>
      </div>

      ${saldo > 0 ? `
        <div style="margin-top: 1rem; text-align: right;">
          <button type="button" class="btn btn-secondary btn-sm" id="btnAutofillSaldo" style="background: rgba(46,204,113,0.15); border-color: rgba(46,204,113,0.4); color: #a8d5ba;">
            ⚡ Abonar Saldo Completo (${formatoMoneda(saldo)})
          </button>
        </div>
      ` : ""}
    </div>
  `;

  // Listener para el botón de abonar saldo completo
  const btnAutofill = document.getElementById("btnAutofillSaldo");
  if (btnAutofill) {
    btnAutofill.addEventListener("click", () => {
      if (montoInput) {
        montoInput.value = saldo;
        montoInput.focus();
      }
      if (notaInput && !notaInput.value) {
        notaInput.value = "Cancelación total del saldo pendiente del evento";
      }
    });
  }
}

// ----------------- PÍLDORAS DE MONTO RÁPIDO -----------------
document.querySelectorAll(".amount-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    const amt = Number(pill.dataset.amount || 0);
    if (amt > 0 && montoInput) {
      montoInput.value = amt;
      montoInput.focus();
    }
  });
});

// ----------------- URL PARAMS EVALUATION -----------------
function evaluarParametrosURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const evId = urlParams.get("evento_id") || urlParams.get("reserva_id") || urlParams.get("id");
  if (evId) {
    seleccionarEventoPorId(evId);
  }
}

// ----------------- REGISTRO / EDICIÓN DE PAGO -----------------
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const monto = parseFloat(montoInput?.value || "0");
    const metodo = metodoInput?.value || "Transferencia Bancolombia";
    const fecha = fechaPagoInput?.value || new Date().toISOString().slice(0, 10);
    const comprobante = comprobanteInput?.value.trim() || "";
    const nota = notaInput?.value.trim() || "Abono al evento";
    const editId = paymentIdInput?.value.trim();
    const resId = selectedEventoIdInput?.value.trim() || (selectedEvento ? selectedEvento.id : "");
    const cliente = selectedClientNameInput?.value.trim() || (selectedEvento ? selectedEvento.cliente : "Cliente General");

    if (monto <= 0 || isNaN(monto)) {
      Swal.fire("Monto inválido", "Ingresa un monto positivo mayor a cero.", "warning");
      return;
    }

    try {
      if (editId) {
        // ACTUALIZAR PAGO EXISTENTE
        await dbService.updatePayment(editId, {
          monto,
          metodo,
          fecha,
          comprobante,
          concepto: nota,
          reservaId: resId,
          cliente
        });

        Swal.fire({
          icon: "success",
          title: "Abono Actualizado",
          text: "Los cambios se guardaron y el saldo del evento fue recalculado.",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // CREAR NUEVO ABONO
        const nuevoPago = await dbService.createPayment({
          monto,
          metodo,
          fecha,
          comprobante,
          concepto: nota,
          reservaId: resId,
          cliente
        });

        // Diálogo con opción de ver recibo de inmediato
        Swal.fire({
          icon: "success",
          title: "¡Abono Registrado!",
          html: `
            <p>Se registraron <strong>${formatoMoneda(monto)}</strong> a nombre de <strong>${cliente}</strong>.</p>
            <p style="font-size: 0.85rem; color: #888;">El saldo del evento se actualizó automáticamente.</p>
          `,
          showCancelButton: true,
          confirmButtonText: "🧾 Ver Recibo Oficial",
          cancelButtonText: "Continuar",
          confirmButtonColor: "#d4af37",
          cancelButtonColor: "#444"
        }).then((result) => {
          if (result.isConfirmed) {
            abrirModalRecibo(nuevoPago.id);
          }
        });
      }

      limpiarFormulario();
      await cargarEventos();
      await cargarPagos();

      // Si había un evento seleccionado, refrescar su tarjeta
      if (selectedEvento) {
        seleccionarEventoPorId(selectedEvento.id);
      }
    } catch (err) {
      console.error("Error registrando pago:", err);
      Swal.fire("Error", "No se pudo registrar el pago. Inténtalo de nuevo.", "error");
    }
  });
}

// ----------------- RENDERIZADO DEL HISTORIAL DE PAGOS -----------------
function renderPagos() {
  if (!paymentsGrid) return;

  let lista = [...pagosCache];

  // Si está activo el filtro por evento seleccionado
  if (filtroSoloEvento && selectedEvento) {
    lista = lista.filter(p => String(p.reservaId) === String(selectedEvento.id));
  }

  if (!lista.length) {
    paymentsGrid.innerHTML = `
      <div style="padding: 3rem; text-align: center; color: var(--text-soft); grid-column: 1 / -1; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px dashed var(--border-glass);">
        <h3 style="color: #fff; margin-bottom: 0.5rem;">No hay pagos para mostrar</h3>
        <p style="margin: 0;">${filtroSoloEvento ? "Este evento aún no tiene abonos registrados." : "Registra un anticipo o abono usando el formulario superior."}</p>
      </div>
    `;
    return;
  }

  paymentsGrid.innerHTML = lista.map(p => {
    // Buscar datos del evento si está vinculado
    const eventoVinculado = eventosCache.find(e => String(e.id) === String(p.reservaId));
    const eventoTxt = eventoVinculado ? `${eventoVinculado.tipo_evento} (${eventoVinculado.fecha_evento})` : "Abono Directo";

    return `
      <article class="payment-card" style="background: linear-gradient(145deg, rgba(24, 24, 28, 0.95), rgba(16, 16, 20, 0.98)); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 1.4rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 8px 20px rgba(0,0,0,0.3); transition: transform 0.2s ease, border-color 0.2s ease;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.6rem; gap: 0.8rem;">
            <div>
              <span style="font-size: 0.75rem; color: var(--gold-light); background: rgba(212,175,55,0.12); padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                ${p.id}
              </span>
              <h4 style="color: #fff; font-size: 1.15rem; margin: 0.3rem 0 0.1rem 0; font-family: var(--font-heading);">
                ${p.cliente || "Cliente Almar"}
              </h4>
              <small style="color: var(--text-soft); font-size: 0.8rem; display: block;">
                🎪 ${eventoTxt}
              </small>
            </div>
            <strong style="color: #a8d5ba; font-size: 1.35rem; font-family: var(--font-heading); white-space: nowrap;">
              +${formatoMoneda(p.monto)}
            </strong>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-soft); margin-top: 0.8rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.8rem; line-height: 1.5;">
            <p style="margin: 0 0 0.3rem 0;">💳 <strong>Método:</strong> <span style="color: #fff;">${p.metodo || "Transferencia"}</span></p>
            <p style="margin: 0 0 0.3rem 0;">📅 <strong>Fecha:</strong> ${p.fecha || "Sin fecha"}</p>
            ${p.comprobante ? `<p style="margin: 0 0 0.3rem 0;">🔖 <strong>Comprobante:</strong> <span style="color: var(--gold-light);">${p.comprobante}</span></p>` : ""}
            <p style="margin: 0;">📝 <strong>Concepto:</strong> ${p.concepto || p.nota || "Abono general"}</p>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.8rem;">
          <button type="button" class="btn btn-secondary btn-sm btn-recibo" data-id="${p.id}" style="color: var(--gold-light); border-color: rgba(212,175,55,0.3); font-size: 0.8rem; padding: 4px 10px;">
            🧾 Recibo
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-editar-pago" data-id="${p.id}" style="font-size: 0.8rem; padding: 4px 10px;">
            ✏️ Editar
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-eliminar-pago" data-id="${p.id}" style="color: #e74c3c; border-color: rgba(231,76,60,0.3); font-size: 0.8rem; padding: 4px 10px;">
            🗑️
          </button>
        </div>
      </article>
    `;
  }).join("");

  // Listeners de botones de cada tarjeta
  document.querySelectorAll(".btn-recibo").forEach(btn => {
    btn.addEventListener("click", () => abrirModalRecibo(btn.dataset.id));
  });

  document.querySelectorAll(".btn-editar-pago").forEach(btn => {
    btn.addEventListener("click", () => cargarPagoParaEditar(btn.dataset.id));
  });

  document.querySelectorAll(".btn-eliminar-pago").forEach(btn => {
    btn.addEventListener("click", () => confirmarEliminarPago(btn.dataset.id));
  });
}

// ----------------- FILTROS DE HISTORIAL -----------------
if (filterAllBtn) {
  filterAllBtn.addEventListener("click", () => {
    filtroSoloEvento = false;
    actualizarEstiloBotonesFiltro();
    renderPagos();
  });
}

if (filterEventBtn) {
  filterEventBtn.addEventListener("click", () => {
    filtroSoloEvento = true;
    actualizarEstiloBotonesFiltro();
    renderPagos();
  });
}

function actualizarEstiloBotonesFiltro() {
  if (filterAllBtn && filterEventBtn) {
    if (filtroSoloEvento) {
      filterAllBtn.style.background = "transparent";
      filterAllBtn.style.borderColor = "var(--border-glass)";
      filterEventBtn.style.background = "rgba(212,175,55,0.2)";
      filterEventBtn.style.borderColor = "var(--gold)";
    } else {
      filterAllBtn.style.background = "rgba(212,175,55,0.2)";
      filterAllBtn.style.borderColor = "var(--gold)";
      filterEventBtn.style.background = "transparent";
      filterEventBtn.style.borderColor = "var(--border-glass)";
    }
  }
}

// ----------------- EDICIÓN Y ELIMINACIÓN -----------------
function cargarPagoParaEditar(id) {
  const pago = pagosCache.find(p => String(p.id) === String(id));
  if (!pago) return;

  if (paymentIdInput) paymentIdInput.value = pago.id;
  if (montoInput) montoInput.value = pago.monto;
  if (metodoInput) metodoInput.value = pago.metodo || "Transferencia Bancolombia";
  if (fechaPagoInput) fechaPagoInput.value = pago.fecha || new Date().toISOString().slice(0, 10);
  if (comprobanteInput) comprobanteInput.value = pago.comprobante || "";
  if (notaInput) notaInput.value = pago.concepto || pago.nota || "";

  if (pago.reservaId) {
    seleccionarEventoPorId(pago.reservaId);
  }

  if (savePaymentBtn) savePaymentBtn.innerHTML = "💾 Guardar Cambios del Abono";
  if (formActionTitle) formActionTitle.textContent = `2. Modificar Abono (${pago.id})`;
  if (cancelEditBtn) cancelEditBtn.style.display = "inline-block";

  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function confirmarEliminarPago(id) {
  const result = await Swal.fire({
    title: "¿Eliminar este abono?",
    text: "El monto se restará del total abonado y el saldo del evento se recalculará automáticamente.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e74c3c",
    cancelButtonColor: "#444",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (result.isConfirmed) {
    try {
      await dbService.deletePayment(id);
      Swal.fire({
        icon: "success",
        title: "Abono eliminado",
        text: "El registro fue borrado y los saldos han sido actualizados.",
        timer: 1800,
        showConfirmButton: false
      });
      await cargarEventos();
      await cargarPagos();
      if (selectedEvento) {
        seleccionarEventoPorId(selectedEvento.id);
      }
    } catch (error) {
      console.error("Error eliminando pago:", error);
      Swal.fire("Error", "No se pudo eliminar el abono.", "error");
    }
  }
}

// ----------------- MODAL DE RECIBO DE CAJA OFICIAL -----------------
function abrirModalRecibo(pagoId) {
  const pago = pagosCache.find(p => String(p.id) === String(pagoId));
  if (!pago) return;

  const evento = eventosCache.find(e => String(e.id) === String(pago.reservaId));
  currentReceiptData = { pago, evento };

  const reciboNumero = document.getElementById("reciboNumero");
  const reciboFechaHora = document.getElementById("reciboFechaHora");
  const reciboCliente = document.getElementById("reciboCliente");
  const reciboEvento = document.getElementById("reciboEvento");
  const reciboMetodo = document.getElementById("reciboMetodo");
  const reciboComprobante = document.getElementById("reciboComprobante");
  const reciboMonto = document.getElementById("reciboMonto");
  const reciboConcepto = document.getElementById("reciboConcepto");
  const reciboTotalEvento = document.getElementById("reciboTotalEvento");
  const reciboAbonadoEvento = document.getElementById("reciboAbonadoEvento");
  const reciboSaldoEvento = document.getElementById("reciboSaldoEvento");

  if (reciboNumero) reciboNumero.textContent = `REC-${String(pago.id).replace(/\D/g, '').slice(-5) || "001"}`;
  if (reciboFechaHora) reciboFechaHora.textContent = `${pago.fecha || new Date().toISOString().slice(0, 10)} • Marinilla`;
  if (reciboCliente) reciboCliente.textContent = pago.cliente || (evento ? evento.cliente : "Cliente Almar");
  if (reciboEvento) reciboEvento.textContent = evento ? `${evento.tipo_evento} (${evento.fecha_evento || "Fecha por definir"})` : "Servicios de Banquetes";
  if (reciboMetodo) reciboMetodo.textContent = pago.metodo || "Transferencia Bancolombia";
  if (reciboComprobante) reciboComprobante.textContent = pago.comprobante || "N/A";
  if (reciboMonto) reciboMonto.textContent = formatoMoneda(pago.monto);
  if (reciboConcepto) reciboConcepto.textContent = pago.concepto || pago.nota || "Abono general a evento";

  if (evento) {
    if (reciboTotalEvento) reciboTotalEvento.textContent = formatoMoneda(evento.total);
    if (reciboAbonadoEvento) reciboAbonadoEvento.textContent = formatoMoneda(evento.anticipo);
    if (reciboSaldoEvento) reciboSaldoEvento.textContent = formatoMoneda(evento.saldo);
  } else {
    if (reciboTotalEvento) reciboTotalEvento.textContent = "-";
    if (reciboAbonadoEvento) reciboAbonadoEvento.textContent = formatoMoneda(pago.monto);
    if (reciboSaldoEvento) reciboSaldoEvento.textContent = "$0";
  }

  if (receiptModal) {
    receiptModal.classList.add("active");
  }
}

if (cerrarReciboBtn) {
  cerrarReciboBtn.addEventListener("click", () => {
    if (receiptModal) receiptModal.classList.remove("active");
  });
}

if (imprimirReciboBtn) {
  imprimirReciboBtn.addEventListener("click", () => {
    window.print();
  });
}

if (whatsappReciboBtn) {
  whatsappReciboBtn.addEventListener("click", () => {
    if (!currentReceiptData) return;
    const { pago, evento } = currentReceiptData;
    const tel = evento?.telefono ? evento.telefono.replace(/\D/g, "") : "";
    const cliente = pago.cliente || evento?.cliente || "Estimado(a) Cliente";
    const saldoTxt = evento ? formatoMoneda(evento.saldo) : "$0";

    const mensaje = 
`*BANQUETES ALMAR - COMPROBANTE DE PAGO OFICIAL* 🧾%0A` +
`Estimado(a) *${encodeURIComponent(cliente)}*, confirmamos la recepción exitosa de su abono:%0A%0A` +
`💰 *Monto recibido:* ${encodeURIComponent(formatoMoneda(pago.monto))}%0A` +
`📅 *Fecha:* ${encodeURIComponent(pago.fecha || "")}%0A` +
`💳 *Método de pago:* ${encodeURIComponent(pago.metodo || "")}%0A` +
(pago.comprobante ? `🔖 *Nro. Aprobación:* ${encodeURIComponent(pago.comprobante)}%0A` : "") +
`📝 *Concepto:* ${encodeURIComponent(pago.concepto || pago.nota || "Abono a evento")}%0A%0A` +
(evento ? `🎪 *Evento:* ${encodeURIComponent(evento.tipo_evento)} (${encodeURIComponent(evento.fecha_evento || "")})%0A` : "") +
`📊 *Saldo pendiente:* ${encodeURIComponent(saldoTxt)}%0A%0A` +
`¡Muchas gracias por confiar en Banquetes Almar para su gran celebración! ✨🥂`;

    const url = tel ? `https://api.whatsapp.com/send?phone=57${tel}&text=${mensaje}` : `https://api.whatsapp.com/send?text=${mensaje}`;
    window.open(url, "_blank");
  });
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", inicializar);
if (document.readyState === "complete" || document.readyState === "interactive") {
  inicializar();
}