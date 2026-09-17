/**
 * Executive WhatsApp Concierge Modal for Banquetes Almar CRM & Reservations
 * 
 * Provides quick-action access to 6 high-conversion, professional communication templates.
 * Language Policy: Code identifiers in English, user-facing UI and templates in Colombian Spanish.
 */

// Helper: Format COP currency
function formatCurrency(amount) {
  const numeric = Number(amount || 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(numeric);
}

// Helper: Format Colombian friendly date
function formatFriendlyDate(dateString) {
  if (!dateString) return "Fecha por definir";
  const cleanStr = String(dateString).slice(0, 10);
  const parts = cleanStr.split("-");
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const monthIndex = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const dateObj = new Date(year, monthIndex, day);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
  }
  return dateString;
}

// Helper: Normalize Colombian phone number (adding 57 country code if missing)
function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return "";
  let digits = String(rawPhone).replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) {
    digits = "57" + digits;
  }
  return digits;
}

/**
 * Registry of the 6 official executive templates for Banquetes Almar
 */
export const WHATSAPP_TEMPLATES = [
  {
    id: "quote_proposal",
    title: "Propuesta & Cotización",
    icon: "💎",
    badge: "CRM Comercial",
    generateText: (data) => {
      const clientName = data.clientName || "Estimado(a) Cliente";
      const eventType = data.eventType || "su celebración especial";
      const guestCount = data.guestCount ? `${data.guestCount} invitados` : "un aforo exclusivo";
      const locationText = data.location ? ` en ${data.location}` : "";
      const dateText = data.eventDate ? ` para el ${formatFriendlyDate(data.eventDate)}` : "";
      const formattedTotal = data.totalAmount > 0 ? formatCurrency(data.totalAmount) : "A convenir según minuta";
      const contractUrl = data.contractUrl || window.location.origin + `/admin/contrato.html?id=${data.id || ""}`;

      return `¡Hola, *${clientName}*! ✨

Te saluda el equipo directivo de *Banquetes Almar* en Marinilla. Esperamos que te encuentres muy bien.

Hemos estructurado con la mayor dedicación la propuesta gastronómica y logística para tu *${eventType}* (${guestCount})${locationText}${dateText}.

📋 *Resumen de la Propuesta:*
• Presupuesto Estimado: *${formattedTotal}*
• Servicios incluidos: Gastronomía de autor de 3 tiempos, menaje de gala imperial, mobiliario y coordinación ejecutiva.

Puedes consultar el desglose completo y la minuta oficial en este enlace directo:
🔗 ${contractUrl}

¿Te gustaría que agendemos una llamada o una visita privada para conocer nuestras sedes y afinar detalles? Quedamos a tu entera disposición. 🥂`;
    }
  },
  {
    id: "tasting_invitation",
    title: "Visita & Degustación",
    icon: "🥂",
    badge: "Experiencia Gourmet",
    generateText: (data) => {
      const clientName = data.clientName || "Estimado(a) Cliente";
      const eventType = data.eventType || "tu evento";

      return `Estimado/a *${clientName}*, ¡un cordial y distinguido saludo de *Banquetes Almar*! 🍷

Queremos invitarte formalmente a ti y a tus acompañantes a vivir una experiencia gastronómica personalizada en nuestras instalaciones en Marinilla, Antioquia.

En esta sesión privada podrán:
✨ Recorrer nuestras locaciones y apreciar montajes de gala reales.
🍽️ Degustar la propuesta de menú de 3 tiempos preparada por nuestro Chef ejecutivo.
💐 Conversar de primera mano con nuestro equipo de coordinación para personalizar cada detalle de tu *${eventType}*.

¿Qué día de esta semana o fin de semana te resultaría más cómodo para recibirte con una copa de bienvenida? 🍾`;
    }
  },
  {
    id: "date_hold_urgency",
    title: "Bloqueo de Fecha",
    icon: "🔒",
    badge: "Exclusividad",
    generateText: (data) => {
      const clientName = data.clientName || "Estimado(a) Cliente";
      const eventType = data.eventType || "tu evento";
      const dateText = data.eventDate ? `el ${formatFriendlyDate(data.eventDate)}` : "la fecha proyectada";

      return `Hola *${clientName}*, un afectuoso saludo de *Banquetes Almar*. Esperamos que estés teniendo un excelente día. ✨

Nos comunicamos contigo con relación a la celebración de tu *${eventType}*, programada para ${dateText}.

Debido a que hemos recibido nuevas solicitudes de cotización para ese mismo fin de semana y mantenemos una política de cupos limitados por fecha para garantizar un servicio 100% impecable y exclusivo, queremos brindarte la prioridad.

¿Deseas que coordinemos hoy el *bloqueo oficial de tu fecha* para asegurar que el salón y nuestro equipo de gala queden reservados a tu nombre? 📅✨`;
    }
  },
  {
    id: "contract_banking",
    title: "Contrato & Datos Bancarios",
    icon: "📜",
    badge: "Formalización",
    generateText: (data) => {
      const clientName = data.clientName || "Estimado(a) Cliente";
      const eventType = data.eventType || "tu evento";
      const dateText = data.eventDate ? ` el *${formatFriendlyDate(data.eventDate)}*` : "";
      const formattedTotal = data.totalAmount > 0 ? formatCurrency(data.totalAmount) : "Valor convenido";
      const downPaymentCalc = data.downPayment > 0 
        ? data.downPayment 
        : (data.totalAmount > 0 ? Math.round(data.totalAmount * 0.3) : 0);
      const formattedDownPayment = downPaymentCalc > 0 ? formatCurrency(downPaymentCalc) : "30% del valor total";
      const contractUrl = data.contractUrl || window.location.origin + `/admin/contrato.html?id=${data.id || ""}`;

      return `¡Estimado/a *${clientName}*! 🥂

Es un verdadero placer para todo el equipo de *Banquetes Almar* acompañarte en la realización de tu *${eventType}*${dateText}.

Para legalizar y blindar la reserva de tu fecha, adjuntamos la información formal:

📑 *Contrato Oficial & Minuta en Línea:*
🔗 ${contractUrl}

💰 *Condiciones de Reserva:*
• Presupuesto Total: *${formattedTotal}*
• Anticipo de Confirmación Requerido: *${formattedDownPayment}*

🏦 *Cuentas Oficiales Banquetes Almar S.A.S.:*
• *Bancolombia Cuenta de Ahorros:* 108-923847-12
  NIT: 901.458.231-8 (Banquetes Almar S.A.S.)
• *Nequi Corporativo Autorizado:* 310 445 8892

Una vez efectuada la transferencia, por favor envíanos el comprobante por aquí para generar tu recibo de caja formal y activar la orden de producción. ¡Bienvenidos a la familia Almar! 🏛️✨`;
    }
  },
  {
    id: "official_payment_receipt",
    title: "Recibo de Abono",
    icon: "🧾",
    badge: "Comprobante Oficial",
    generateText: (data) => {
      const clientName = data.clientName || "Estimado(a) Cliente";
      const eventType = data.eventType || "tu celebración especial";
      const receiptNumber = data.paymentReceiptNumber || `REC-${String(data.id || "").replace(/\D/g, '').slice(-5) || "001"}`;
      const formattedPaymentAmount = formatCurrency(data.paymentAmount || data.downPayment || 0);
      const paymentDate = data.paymentDate ? formatFriendlyDate(data.paymentDate) : "la fecha de hoy";
      const paymentMethod = data.paymentMethod || "Transferencia Bancolombia";
      const refText = data.paymentReference ? ` (N° Aprobación: *${data.paymentReference}*)` : "";
      const paymentConcept = data.paymentConcept || "Abono general a servicios de eventos y banquetes";
      const formattedTotal = formatCurrency(data.totalAmount);
      const formattedPaid = formatCurrency(data.downPayment);
      const formattedBalance = formatCurrency(data.remainingBalance);
      const contractUrl = data.contractUrl || (window.location.origin + `/admin/contrato.html?id=${data.id || ""}`);

      return `¡Hola, *${clientName}*! ✨

Te saluda el área de Contabilidad y Tesorería de *Banquetes Almar* en Marinilla.

Confirmamos la recepción exitosa y validación formal de tu abono para la realización de tu *${eventType}*:

🧾 *COMPROBANTE OFICIAL DE CAJA (N° ${receiptNumber})*
• *Valor Recibido:* *${formattedPaymentAmount}*
• *Fecha:* ${paymentDate}
• *Medio de Pago:* ${paymentMethod}${refText}
• *Concepto:* ${paymentConcept}

📊 *Estado de Cuenta Actualizado:*
• Total Contratado: *${formattedTotal}*
• Total Abonado a la fecha: *${formattedPaid}*
• *Saldo Pendiente por Liquidar:* *${formattedBalance}*

Puedes consultar el historial de abonos y tu contrato oficial en el siguiente enlace:
🔗 ${contractUrl}

¡Agradecemos mucho tu puntualidad y confianza! Seguimos coordinando cada detalle para que tu evento sea inolvidable. 🥂✨`;
    }
  },
  {
    id: "balance_reminder",
    title: "Recordatorio de Saldo",
    icon: "⏳",
    badge: "Cobranza & Agenda",
    generateText: (data) => {
      const clientName = data.clientName || "Estimado(a) Cliente";
      const eventType = data.eventType || "tu celebración";
      const dateText = data.eventDate ? `el próximo *${formatFriendlyDate(data.eventDate)}*` : "la fecha acordada";
      const formattedTotal = formatCurrency(data.totalAmount);
      const formattedPaid = formatCurrency(data.downPayment);
      const calculatedBalance = data.remainingBalance !== undefined 
        ? data.remainingBalance 
        : Math.max(0, (data.totalAmount || 0) - (data.downPayment || 0));
      const formattedBalance = formatCurrency(calculatedBalance);

      return `Apreciado/a *${clientName}*, ¡un saludo muy especial de *Banquetes Almar*! ✨

Nos encontramos en la fase final de alistamiento logístico y gastronómico para la celebración de tu *${eventType}* ${dateText}.

Para coordinar la confirmación definitiva de insumos de cocina de gala y montajes de iluminación, te recordamos el estado de cuenta correspondiente:

📊 *Estado de Cuenta Actualizado:*
• Valor Total Contratado: *${formattedTotal}*
• Valor Abonado: *${formattedPaid}*
• *Saldo Pendiente por Liquidar:* *${formattedBalance}*

Te agradecemos realizar la liquidación de este saldo a nuestras cuentas de Bancolombia o Nequi (310 445 8892) durante estos días.

Quedamos muy atentos a cualquier inquietud sobre la logística. ¡Todo está preparado para que sea un día memorable! 💫`;
    }
  },
  {
    id: "post_event_gratitude",
    title: "Agradecimiento Post-Evento",
    icon: "🎊",
    badge: "Fidelización",
    generateText: (data) => {
      const clientName = data.clientName || "Estimado(a) Anfitrión";
      const eventType = data.eventType || "tu evento";

      return `¡Querido/a *${clientName}*! 💐🎉

De parte de la gerencia y de cada miembro del equipo de *Banquetes Almar*, te extendemos nuestras más cálidas felicitaciones por la celebración de tu *${eventType}*.

Para nosotros fue un inmenso honor y un privilegio haber sido partícipes de una ocasión tan significativa y especial para ti y tu familia.

Esperamos con todo el cariño que la gastronomía, la atención de nuestros meseros y cada ambientación hayan superado todas tus expectativas.

Si tienes un momento libre, nos encantaría que nos compartas una breve opinión o reseña sobre tu experiencia con Banquetes Almar. ¡Te deseamos siempre los mayores éxitos y bendiciones! 🥂✨`;
    }
  },
  {
    id: "package_brochure",
    title: "Brochure de Paquete",
    icon: "💎",
    badge: "Catálogo de Gala",
    generateText: (data) => {
      const clientName = data.clientName && data.clientName !== "Estimado(a) Cliente" ? `*${data.clientName}*` : "estimado(a) anfitrión(a)";
      const pkgTitle = data.pkgTitle || "Paquete Todo Incluido Banquetes Almar";
      const pricePerPerson = data.pricePerPerson ? formatCurrency(data.pricePerPerson) : "";
      const minGuests = data.minGuests || 40;
      const inclusions = Array.isArray(data.inclusions) && data.inclusions.length > 0
        ? data.inclusions
        : [
            "Menú de gala de 3 tiempos preparado por Chef Ejecutivo",
            "Menaje y cubertería imperial de alta gama",
            "Mobiliario de lujo (Sillas Tiffany / Phoenix)",
            "Montaje y decoración floral de autor",
            "Personal de protocolo, meseros y capitán de servicio",
            "Sonido profesional, iluminación ambiental y cabina DJ"
          ];
      const inclusionsText = inclusions.slice(0, 6).map(inc => `• ✨ ${inc}`).join("\n");
      const webUrl = (typeof window !== "undefined" && window.location.origin) 
        ? (window.location.origin + "/#paquetes") 
        : "https://banquetes-almar.web.app/#paquetes";

      return `¡Hola, ${clientName}! ✨

Te saluda el equipo directivo de *Banquetes Almar* en Marinilla. Esperamos que tengas un excelente día.

Te compartimos la propuesta integral de nuestro exclusivo paquete de gala:

💎 *${pkgTitle.toUpperCase()}*
💰 Inversión desde: *${pricePerPerson} COP* por invitado (Aforo sugerido: ${minGuests} personas).

📋 *Lo que incluye esta experiencia de gala:*
${inclusionsText}
${inclusions.length > 6 ? `• ... ¡y más de ${inclusions.length - 6} servicios y cortesías adicionales!` : ""}

🌐 Puedes explorar la galería de fotos y detalles de este y otros paquetes en nuestra plataforma oficial:
🔗 ${webUrl}

¿Te gustaría que personalicemos esta propuesta para el número exacto de tus invitados o que coordinemos una degustación privada en nuestras sedes? 🥂✨`;
    }
  }
];

/**
 * Main Controller: Opens the WhatsApp Concierge Modal
 * 
 * @param {Object} options Configuration & Event Data
 * @param {string} options.id Event or Quote ID
 * @param {string} options.clientName Host/Client full name
 * @param {string} options.phone Client contact phone number
 * @param {string} options.eventType Type of event (Boda, Grado, 15 Años, etc.)
 * @param {string} options.eventDate Event date ISO string
 * @param {number|string} options.guestCount Number of guests
 * @param {string} options.location Location name or address
 * @param {number} options.totalAmount Total event quotation or agreed price
 * @param {number} options.downPayment Down payment already made
 * @param {number} options.remainingBalance Pending balance
 * @param {string} options.origin "cotizacion" | "reserva" | "cliente" | "pago" | "paquete"
 * @param {string} [options.contractUrl] Absolute or relative URL to the contract
 */
export function openWhatsAppModal(options = {}) {
  // Check if SweetAlert2 is loaded
  if (typeof Swal === "undefined") {
    console.error("SweetAlert2 (Swal) is not loaded in the window.");
    alert("No se pudo cargar el modal de WhatsApp. Recarga la página por favor.");
    return;
  }

  // Pre-process and normalize data
  const data = {
    id: options.id || "",
    clientName: options.clientName || options.nombre || options.cliente || "Estimado(a) Cliente",
    phone: options.phone || options.telefono || "",
    eventType: options.eventType || options.evento || options.tipo_evento || "Celebración de Gala",
    eventDate: options.eventDate || options.fechaEvento || options.fecha_evento || options.fecha || "",
    guestCount: options.guestCount || options.personas || 0,
    location: options.location || options.locacion || options.lugar || "",
    totalAmount: Number(options.totalAmount || options.totalEstimado || options.total || options.valor_total || 0),
    downPayment: Number(options.downPayment || options.anticipo || options.abono || 0),
    remainingBalance: options.remainingBalance !== undefined 
      ? Number(options.remainingBalance) 
      : Number(options.saldo !== undefined ? options.saldo : Math.max(0, Number(options.totalAmount || options.totalEstimado || options.total || 0) - Number(options.downPayment || options.anticipo || 0))),
    origin: options.origin || "cotizacion",
    contractUrl: options.contractUrl || (window.location.origin + `/admin/contrato.html?id=${options.id || ""}`),
    paymentAmount: Number(options.paymentAmount || 0),
    paymentMethod: options.paymentMethod || "",
    paymentReceiptNumber: options.paymentReceiptNumber || "",
    paymentReference: options.paymentReference || "",
    paymentConcept: options.paymentConcept || "",
    paymentDate: options.paymentDate || "",
    pkgTitle: options.pkgTitle || options.titulo || "",
    pricePerPerson: Number(options.pricePerPerson || options.precioPorPersona || 0),
    minGuests: options.minGuests || options.minimoPersonas || 40,
    inclusions: options.inclusions || options.inclusiones || []
  };

  // Select default template based on origin and balance
  let defaultTemplateId = "quote_proposal";
  if (data.origin === "paquete") {
    defaultTemplateId = "package_brochure";
  } else if (data.origin === "pago") {
    defaultTemplateId = "official_payment_receipt";
  } else if (data.origin === "reserva") {
    defaultTemplateId = (data.remainingBalance > 0) ? "balance_reminder" : "contract_banking";
  }

  // Render modal HTML
  const modalHtml = `
    <div class="almar-wa-modal-wrapper" style="text-align: left; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #f1f5f9;">
      <!-- Subtitle and Client Card -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #d4af37; font-weight: 700; letter-spacing: 0.05em;">
            ${data.origin === "paquete" ? "💎 PAQUETE DE GALA SELECCIONADO" : "DESTINATARIO OFICIAL"}
          </div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #ffffff;">
            ${data.origin === "paquete" ? (data.pkgTitle || "Experiencia de Gala") : data.clientName}
          </div>
          <div style="font-size: 0.85rem; color: #94a3b8;">
            ${data.origin === "paquete" 
              ? `💰 ${formatCurrency(data.pricePerPerson)} COP / invitado • 👥 Mín. ${data.minGuests} personas`
              : `🎉 ${data.eventType} ${data.guestCount ? `• 👥 ${data.guestCount} pers.` : ""} ${data.eventDate ? `• 🗓️ ${formatFriendlyDate(data.eventDate)}` : ""}`}
          </div>
        </div>

        <div style="min-width: 170px;">
          <label style="font-size: 0.75rem; color: #cbd5e1; display: block; margin-bottom: 4px; font-weight: 600;">
            📱 Teléfono / WhatsApp:
          </label>
          <input 
            type="text" 
            id="waRecipientPhone" 
            value="${data.phone}" 
            placeholder="Ej: 3101234567" 
            style="width: 100%; background: #0b0c10; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 0.85rem;"
          />
        </div>
      </div>

      <!-- Template Selector Tabs -->
      <label style="font-size: 0.78rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 8px;">
        1. Selecciona la Plantilla de Comunicación:
      </label>

      <div id="waTemplateTabs" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-bottom: 16px;">
        ${WHATSAPP_TEMPLATES.map(tmpl => {
          const isSelected = tmpl.id === defaultTemplateId;
          return `
            <button 
              type="button" 
              class="wa-template-tab-btn ${isSelected ? 'active' : ''}" 
              data-template-id="${tmpl.id}"
              style="
                background: ${isSelected ? 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))' : 'rgba(255,255,255,0.04)'};
                border: 1px solid ${isSelected ? '#d4af37' : 'rgba(255,255,255,0.1)'};
                color: ${isSelected ? '#ffffff' : '#cbd5e1'};
                padding: 8px 10px;
                border-radius: 8px;
                cursor: pointer;
                text-align: left;
                display: flex;
                flex-direction: column;
                gap: 2px;
                transition: all 0.2s ease;
              "
            >
              <div style="font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 5px;">
                <span>${tmpl.icon}</span> <span>${tmpl.title}</span>
              </div>
              <span style="font-size: 0.7rem; color: ${isSelected ? '#f3e8b1' : '#64748b'};">
                ${tmpl.badge}
              </span>
            </button>
          `;
        }).join("")}
      </div>

      <!-- Editable Message Area -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <label for="waMessageContent" style="font-size: 0.78rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em;">
          2. Mensaje Personalizable (Vista Previa & Edición):
        </label>
        <span id="waCharCount" style="font-size: 0.75rem; color: #64748b;">
          0 caracteres
        </span>
      </div>

      <textarea 
        id="waMessageContent" 
        rows="10" 
        style="
          width: 100%;
          background: #090a0f;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: #e2e8f0;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 0.88rem;
          line-height: 1.5;
          padding: 12px;
          resize: vertical;
          box-sizing: border-box;
          outline: none;
        "
      ></textarea>

      <!-- Action Footer Buttons -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px; flex-wrap: wrap; gap: 10px;">
        <button 
          type="button" 
          id="btnCopyWaText" 
          style="
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffffff;
            font-weight: 600;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9rem;
            transition: all 0.2s ease;
          "
        >
          📋 <span>Copiar Mensaje</span>
        </button>

        <div style="display: inline-flex; gap: 10px;">
          <button 
            type="button" 
            id="btnCloseWaModal" 
            style="
              background: transparent;
              border: 1px solid rgba(255, 255, 255, 0.15);
              color: #94a3b8;
              font-weight: 600;
              padding: 10px 14px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 0.9rem;
            "
          >
            Cerrar
          </button>

          <button 
            type="button" 
            id="btnLaunchWhatsApp" 
            style="
              background: #25d366;
              color: #0b2212;
              border: none;
              font-weight: 800;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              font-size: 0.95rem;
              box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
              transition: all 0.2s ease;
            "
          >
            <svg style="width: 18px; height: 18px; fill: currentColor;" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>Enviar por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: `<span style="font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #d4af37; letter-spacing: 0.02em;">Centro de Mensajería WhatsApp</span>`,
    html: modalHtml,
    width: "720px",
    background: "#101217",
    showConfirmButton: false,
    showCloseButton: true,
    focusConfirm: false,
    customClass: {
      popup: "almar-wa-popup-luxury",
      closeButton: "almar-swal-close"
    },
    didOpen: (modalElement) => {
      const textarea = modalElement.querySelector("#waMessageContent");
      const phoneInput = modalElement.querySelector("#waRecipientPhone");
      const charCountSpan = modalElement.querySelector("#waCharCount");
      const tabButtons = modalElement.querySelectorAll(".wa-template-tab-btn");
      const btnCopy = modalElement.querySelector("#btnCopyWaText");
      const btnClose = modalElement.querySelector("#btnCloseWaModal");
      const btnLaunch = modalElement.querySelector("#btnLaunchWhatsApp");

      // Update text helper
      const updateMessageForTemplate = (templateId) => {
        const found = WHATSAPP_TEMPLATES.find(t => t.id === templateId) || WHATSAPP_TEMPLATES[0];
        const generated = found.generateText(data);
        if (textarea) {
          textarea.value = generated;
          if (charCountSpan) charCountSpan.textContent = `${generated.length} caracteres`;
        }
      };

      // Set initial message
      updateMessageForTemplate(defaultTemplateId);

      // Listen for text edits to update char count
      if (textarea && charCountSpan) {
        textarea.addEventListener("input", () => {
          charCountSpan.textContent = `${textarea.value.length} caracteres`;
        });
      }

      // Tab switching listener
      tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          tabButtons.forEach(b => {
            b.classList.remove("active");
            b.style.background = "rgba(255,255,255,0.04)";
            b.style.borderColor = "rgba(255,255,255,0.1)";
            b.style.color = "#cbd5e1";
            const sub = b.querySelector("span:last-child");
            if (sub) sub.style.color = "#64748b";
          });

          btn.classList.add("active");
          btn.style.background = "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))";
          btn.style.borderColor = "#d4af37";
          btn.style.color = "#ffffff";
          const subActive = btn.querySelector("span:last-child");
          if (subActive) subActive.style.color = "#f3e8b1";

          const templateId = btn.dataset.templateId;
          updateMessageForTemplate(templateId);
        });
      });

      // Copy text button listener
      if (btnCopy && textarea) {
        btnCopy.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(textarea.value);
            const originalHtml = btnCopy.innerHTML;
            btnCopy.innerHTML = `✅ <span>¡Copiado al Portapapeles!</span>`;
            btnCopy.style.background = "rgba(46, 204, 113, 0.2)";
            btnCopy.style.borderColor = "#2ecc71";
            btnCopy.style.color = "#a8f0c6";

            setTimeout(() => {
              btnCopy.innerHTML = originalHtml;
              btnCopy.style.background = "rgba(255, 255, 255, 0.08)";
              btnCopy.style.borderColor = "rgba(255, 255, 255, 0.2)";
              btnCopy.style.color = "#ffffff";
            }, 2500);
          } catch (err) {
            console.warn("Failed to copy using clipboard API, fallbacking:", err);
            textarea.select();
            document.execCommand("copy");
            alert("Mensaje copiado con éxito.");
          }
        });
      }

      // Close button listener
      if (btnClose) {
        btnClose.addEventListener("click", () => {
          Swal.close();
        });
      }

      // Launch WhatsApp listener
      if (btnLaunch && textarea) {
        btnLaunch.addEventListener("click", () => {
          const rawPhone = phoneInput ? phoneInput.value.trim() : data.phone;
          const cleanPhone = normalizePhoneNumber(rawPhone);

          if (!cleanPhone) {
            alert("Por favor ingresa un número de teléfono válido antes de abrir WhatsApp.");
            if (phoneInput) phoneInput.focus();
            return;
          }

          const encodedMessage = encodeURIComponent(textarea.value);
          const finalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;

          window.open(finalUrl, "_blank", "noopener,noreferrer");
        });
      }
    }
  });
}

// Expose globally to window for direct non-module / inline access if needed
if (typeof window !== "undefined") {
  window.openWhatsAppModal = openWhatsAppModal;
  window.WHATSAPP_TEMPLATES = WHATSAPP_TEMPLATES;
}
