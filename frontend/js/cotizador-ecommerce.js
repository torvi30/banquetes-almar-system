/**
 * Cotizador Interactivo E-commerce para Banquetes Almar (Marinilla, Antioquia).
 * 
 * Permite a los clientes armar su paquete de evento a la medida con cálculo
 * de precios en tiempo real, desglose por invitado y envío directo a Firebase
 * y WhatsApp oficial de Banquetes Almar (+57 314 8849011).
 */

import { dbService } from "./firebase/db.js";
import { BUSINESS_INFO } from "./firebase/seed-data.js";

// Opciones de configuración y precios base (en COP)
const PRICING = {
  // Precio base de producción por tipo de evento
  eventoBase: {
    boda: 35000,
    quince: 32000,
    grado: 25000,
    social: 22000,
    corporativo: 28000
  },
  // Locación
  locacion: {
    salon_marinilla: 0, // Salón propio incluido o valor preferencial
    finca_oriente: 450000 // Logística de transporte y montaje en fincas
  },
  // Menú y Catering por persona
  menu: {
    tradicional: 38000,
    gala_2t: 52000,
    gourmet_3t: 68000,
    coctel_pasabocas: 32000
  },
  // Mobiliario por persona
  mobiliario: {
    estandar: 8000,
    tiffany: 16000,
    crossback: 22000
  },
  // Decoración fija
  decoracion: {
    sencilla: 600000,
    elegante: 1400000,
    premium: 2600000
  },
  // Sonido y Luces fija
  audiovisual: {
    ninguno: 0,
    basico: 450000,
    dj_luces: 1100000,
    show_completo_pista_led: 2100000
  }
};

export function initCotizadorEcommerce() {
  const form = document.getElementById("interactiveQuoteForm");
  if (!form) return;

  const personasInput = document.getElementById("cotPersonas");
  const personasValDisplay = document.getElementById("personasValDisplay");
  const eventTypeSelect = document.getElementById("cotTipoEvento");
  const locacionSelect = document.getElementById("cotLocacion");
  const menuSelect = document.getElementById("cotMenu");
  const mobSelect = document.getElementById("cotMobiliario");
  const decorSelect = document.getElementById("cotDecoracion");
  const avSelect = document.getElementById("cotAudiovisual");

  // Elementos del resumen de precios
  const displayTotal = document.getElementById("calcTotalEstimado");
  const displayPorPersona = document.getElementById("calcPorPersona");
  const displayAnticipo = document.getElementById("calcAnticipoSugerido");

  function calcularPresupuesto() {
    const personas = parseInt(personasInput?.value || "50", 10);
    if (personasValDisplay) {
      personasValDisplay.textContent = `${personas} personas`;
    }

    const tipo = eventTypeSelect?.value || "boda";
    const loc = locacionSelect?.value || "salon_marinilla";
    const menu = menuSelect?.value || "gala_2t";
    const mob = mobSelect?.value || "tiffany";
    const decor = decorSelect?.value || "elegante";
    const av = avSelect?.value || "dj_luces";

    // Costo variable por invitado
    const costoBasePersona = PRICING.eventoBase[tipo] || 30000;
    const costoMenuPersona = PRICING.menu[menu] || 45000;
    const costoMobPersona = PRICING.mobiliario[mob] || 15000;

    const subtotalPorPersona = costoBasePersona + costoMenuPersona + costoMobPersona;
    const subtotalPersonas = subtotalPorPersona * personas;

    // Costos fijos del evento
    const costoLocacion = PRICING.locacion[loc] || 0;
    const costoDecor = PRICING.decoracion[decor] || 1200000;
    const costoAV = PRICING.audiovisual[av] || 900000;

    const totalFijos = costoLocacion + costoDecor + costoAV;
    const totalGeneral = subtotalPersonas + totalFijos;
    const valorPorPersonaFinal = Math.round(totalGeneral / personas);
    const anticipoSugerido = Math.round(totalGeneral * 0.3); // 30% anticipo

    if (displayTotal) displayTotal.textContent = `$${totalGeneral.toLocaleString("es-CO")}`;
    if (displayPorPersona) displayPorPersona.textContent = `$${valorPorPersonaFinal.toLocaleString("es-CO")}`;
    if (displayAnticipo) displayAnticipo.textContent = `$${anticipoSugerido.toLocaleString("es-CO")}`;

    return {
      personas,
      tipo,
      loc,
      menu,
      mob,
      decor,
      av,
      totalGeneral,
      valorPorPersonaFinal,
      anticipoSugerido
    };
  }

  // Escuchar cambios en cualquier campo
  [
    personasInput,
    eventTypeSelect,
    locacionSelect,
    menuSelect,
    mobSelect,
    decorSelect,
    avSelect
  ].forEach(elem => {
    if (elem) {
      elem.addEventListener("input", calcularPresupuesto);
      elem.addEventListener("change", calcularPresupuesto);
    }
  });

  // Cálculo inicial
  calcularPresupuesto();

  // Enviar cotización
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("cotNombre")?.value.trim();
    const telefono = document.getElementById("cotTelefono")?.value.trim();
    const email = document.getElementById("cotEmail")?.value.trim() || "";
    const fechaEvento = document.getElementById("cotFecha")?.value || "";
    const notas = document.getElementById("cotNotas")?.value.trim() || "";

    if (!nombre || !telefono) {
      alert("Por favor ingresa al menos tu nombre y número de teléfono.");
      return;
    }

    const calc = calcularPresupuesto();

    const tipoTexto = eventTypeSelect?.options[eventTypeSelect.selectedIndex]?.text || calc.tipo;
    const locacionTexto = locacionSelect?.options[locacionSelect.selectedIndex]?.text || calc.loc;
    const menuTexto = menuSelect?.options[menuSelect.selectedIndex]?.text || calc.menu;
    const mobTexto = mobSelect?.options[mobSelect.selectedIndex]?.text || calc.mob;
    const decorTexto = decorSelect?.options[decorSelect.selectedIndex]?.text || calc.decor;
    const avTexto = avSelect?.options[avSelect.selectedIndex]?.text || calc.av;

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Procesando cotización...";
    }

    try {
      // 1. Guardar en Firestore / Base de datos
      const nuevaCotizacion = await dbService.createQuote({
        nombre,
        telefono,
        email,
        evento: tipoTexto,
        personas: calc.personas,
        locacion: locacionTexto,
        menu: menuTexto,
        mobiliario: mobTexto,
        decoracion: decorTexto,
        audiovisual: avTexto,
        totalEstimado: calc.totalGeneral,
        anticipoSugerido: calc.anticipoSugerido,
        valorPorPersona: calc.valorPorPersonaFinal,
        fechaEvento,
        mensaje: notas,
        origen: "simulador_ecommerce"
      });

      // 2. Armar mensaje estructurado para WhatsApp
      const mensajeWhatsApp = 
`🎉 *NUEVA COTIZACIÓN ONLINE - BANQUETES ALMAR* 🎉
────────────────────────
👤 *Cliente:* ${nombre}
📱 *Teléfono:* ${telefono}
📅 *Fecha estimada:* ${fechaEvento || "Por definir"}
👥 *Invitados:* ${calc.personas} personas
🏛️ *Evento:* ${tipoTexto}
📍 *Locación:* ${locacionTexto}

🍽️ *Menú:* ${menuTexto}
🪑 *Mobiliario:* ${mobTexto}
💐 *Decoración:* ${decorTexto}
🎵 *Sonido & Luces:* ${avTexto}

💰 *TOTAL ESTIMADO:* $${calc.totalGeneral.toLocaleString("es-CO")} COP
🏷️ *Valor por persona:* $${calc.valorPorPersonaFinal.toLocaleString("es-CO")} COP
💵 *Anticipo para reserva (30%):* $${calc.anticipoSugerido.toLocaleString("es-CO")} COP
${notas ? `\n📝 *Notas adicionales:* ${notas}` : ""}
────────────────────────
📌 *ID Cotización:* ${nuevaCotizacion.id}
Enviado desde la plataforma web Banquetes Almar (Marinilla, Antioquia).`;

      const urlWhatsApp = `https://wa.me/${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent(mensajeWhatsApp)}`;

      // Redirigir a WhatsApp en nueva pestaña
      window.open(urlWhatsApp, "_blank");

      // Feedback al usuario
      alert(`¡Excelente ${nombre}! Tu cotización por $${calc.totalGeneral.toLocaleString("es-CO")} ha sido registrada y enviada al WhatsApp oficial de Banquetes Almar. Un asesor te responderá enseguida.`);

      form.reset();
      calcularPresupuesto();
    } catch (err) {
      console.error("Error al guardar cotización:", err);
      alert("Hubo un detalle al registrar la cotización, pero puedes escribirnos directamente al WhatsApp: " + BUSINESS_INFO.telefonoPrincipal);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Solicitar Cotización y Enviar a WhatsApp";
      }
    }
  });
}

// Función para seleccionar un paquete prediseñado y auto-cargar el cotizador
export function aplicarPaqueteAlCotizador(paqueteId) {
  const eventTypeSelect = document.getElementById("cotTipoEvento");
  const menuSelect = document.getElementById("cotMenu");
  const mobSelect = document.getElementById("cotMobiliario");
  const decorSelect = document.getElementById("cotDecoracion");
  const avSelect = document.getElementById("cotAudiovisual");

  // Si EventStudio está activo en la página (experiencia Apple)
  if (window.EventStudio) {
    if (paqueteId === "boda-almar-imperial") {
      window.EventStudio.state.celebration = "boda";
      window.EventStudio.state.catering = "gourmet_3t";
      window.EventStudio.state.staging = "tiffany_oro";
      window.EventStudio.state.addons = new Set(["arco_floral", "dj_robotica", "brindis_champagne"]);
    } else if (paqueteId === "quinceanera-encanto") {
      window.EventStudio.state.celebration = "quince";
      window.EventStudio.state.catering = "gala_2t";
      window.EventStudio.state.staging = "tiffany_oro";
      window.EventStudio.state.addons = new Set(["arco_floral", "pista_led", "dj_robotica", "cabina_360"]);
    } else if (paqueteId === "grados-prom") {
      window.EventStudio.state.celebration = "grado";
      window.EventStudio.state.catering = "gala_2t";
      window.EventStudio.state.staging = "tiffany_blanca";
      window.EventStudio.state.addons = new Set(["dj_robotica", "brindis_champagne"]);
    } else if (paqueteId === "comunion-bautizo") {
      window.EventStudio.state.celebration = "social";
      window.EventStudio.state.catering = "tradicional";
      window.EventStudio.state.staging = "tiffany_blanca";
      window.EventStudio.state.addons = new Set(["arco_floral"]);
    } else if (paqueteId === "corporativo-almar") {
      window.EventStudio.state.celebration = "corporativo";
      window.EventStudio.state.catering = "gala_2t";
      window.EventStudio.state.staging = "tiffany_oro";
      window.EventStudio.state.addons = new Set(["dj_robotica"]);
    }
    window.EventStudio.render();
  }

  // Scrollear al cotizador
  const cotSection = document.getElementById("cotizador");
  if (cotSection) {
    cotSection.scrollIntoView({ behavior: "smooth" });
  }

  // Disparar evento change si existe formulario tradicional
  if (eventTypeSelect) {
    eventTypeSelect.dispatchEvent(new Event("change"));
  }
}
