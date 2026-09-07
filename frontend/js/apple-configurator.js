/**
 * Apple-Grade Event Studio Configurator for Banquetes Almar (Marinilla, Antioquia)
 * Engineered with reactive state, smooth number interpolation, and zero-friction UX.
 */

import { dbService } from "./firebase/db.js";
import { BUSINESS_INFO } from "./firebase/seed-data.js";

export const EventStudio = {
  // Estado Reactivo Central
  state: {
    celebration: "boda",
    location: "salon_almar",
    guests: 80,
    catering: "gala_2t",
    staging: "tiffany_oro",
    addons: new Set(["arco_floral", "dj_robotica"]),
    customer: {
      name: "",
      phone: "",
      email: "",
      date: "",
      notes: ""
    }
  },

  // Matriz de Tarifas Oficiales (en COP)
  pricingMatrix: {
    celebrations: {
      boda: { basePerPerson: 36000, label: "Boda Nupcial", icon: "💍" },
      quince: { basePerPerson: 32000, label: "Quince Años de Gala", icon: "👑" },
      grado: { basePerPerson: 26000, label: "Grado & Promoción", icon: "🎓" },
      social: { basePerPerson: 24000, label: "Primera Comunión / Bautizo", icon: "🕊️" },
      corporativo: { basePerPerson: 29000, label: "Evento Corporativo", icon: "👔" }
    },
    locations: {
      salon_almar: { fixedFee: 0, label: "Salón de Gala Almar (Marinilla)", icon: "🏛️" },
      finca_penol: { fixedFee: 300000, label: "Finca Campestre Almar (El Peñol)", icon: "🌄" },
      finca_oriente: { fixedFee: 450000, label: "A Domicilio en Tu Finca (Oriente Antioqueño)", icon: "🚚" }
    },
    caterings: {
      tradicional: { pricePerPerson: 38000, label: "Menú Tradicional", desc: "Plato fuerte balanceado con guarnición y bebida natural." },
      gala_2t: { pricePerPerson: 52000, label: "Menú de Gala (2 Tiempos)", desc: "Entrada gourmet, plato principal selecto y postre artesanal." },
      gourmet_3t: { pricePerPerson: 69000, label: "Menú Imperial (3 Tiempos)", desc: "Degustación previa para novios/anfitriones, 3 tiempos y cristalería de gala." },
      coctel: { pricePerPerson: 34000, label: "Estación de Pasabocas Gourmet", desc: "Mesa interactiva de bocados calientes y fríos, postres y bebidas." }
    },
    stagings: {
      tiffany_oro: { pricePerPerson: 16000, label: "Sillas Tiffany Doradas", desc: "Cojinería de lujo y manteles en damasco o terciopelo." },
      tiffany_blanca: { pricePerPerson: 15000, label: "Sillas Tiffany Blancas", desc: "Estilo limpio y luminoso con vajilla formal completa." },
      crossback: { pricePerPerson: 22000, label: "Sillas Crossback Madera Rústica", desc: "Madera natural vintage, ideal para ambiente campestre y bohemio." }
    },
    addons: {
      arco_floral: { price: 650000, label: "Arco Floral Natural & Backing", icon: "🌸" },
      dj_robotica: { price: 950000, label: "DJ en Vivo + Cabezas Robóticas", icon: "🎧" },
      pista_led: { price: 600000, label: "Pista de Baile LED Iluminada", icon: "✨" },
      hora_loca: { price: 380000, label: "Show de Carnaval & Hora Loca", icon: "🎭" },
      cabina_360: { price: 420000, label: "Cabina de Video 360° (2 Horas)", icon: "📹" },
      brindis_champagne: { price: 280000, label: "Brindis Protocolario con Champaña", icon: "🥂" }
    }
  },

  // Inicialización
  init() {
    this.bindEvents();
    this.render();
  },

  // Cálculo Matemático de Precisión
  calculate() {
    const guests = this.state.guests;
    const cel = this.pricingMatrix.celebrations[this.state.celebration] || this.pricingMatrix.celebrations.boda;
    const loc = this.pricingMatrix.locations[this.state.location] || this.pricingMatrix.locations.salon_almar;
    const cat = this.pricingMatrix.caterings[this.state.catering] || this.pricingMatrix.caterings.gala_2t;
    const stg = this.pricingMatrix.stagings[this.state.staging] || this.pricingMatrix.stagings.tiffany_oro;

    // Componentes por invitado
    const perPersonUnit = cel.basePerPerson + cat.pricePerPerson + stg.pricePerPerson;
    const guestsSubtotal = perPersonUnit * guests;

    // Componentes fijos
    let fixedTotal = loc.fixedFee;
    this.state.addons.forEach(addonId => {
      const addon = this.pricingMatrix.addons[addonId];
      if (addon) fixedTotal += addon.price;
    });

    const total = guestsSubtotal + fixedTotal;
    const perPersonFinal = Math.round(total / guests);
    const depositSuggested = Math.round(total * 0.3); // 30% de anticipo

    return {
      guests,
      perPersonFinal,
      total,
      depositSuggested,
      guestsSubtotal,
      fixedTotal
    };
  },

  // Animación suave de números (Apple Counter)
  currentTotalDisplay: 0,
  animateNumber(targetVal, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startVal = this.currentTotalDisplay || targetVal;
    const diff = targetVal - startVal;
    const duration = 400; // ms
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease Out Quad
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(startVal + diff * easedProgress);

      element.textContent = `$${current.toLocaleString("es-CO")}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.currentTotalDisplay = targetVal;
      }
    };

    requestAnimationFrame(step);
  },

  // Actualización de la Interfaz
  render() {
    const calc = this.calculate();

    // Actualizar números con animación
    this.animateNumber(calc.total, "appleTotalLive");

    const perPersonEl = document.getElementById("applePerPersonLive");
    if (perPersonEl) perPersonEl.textContent = `$${calc.perPersonFinal.toLocaleString("es-CO")}`;

    const depositEl = document.getElementById("appleDepositLive");
    if (depositEl) depositEl.textContent = `$${calc.depositSuggested.toLocaleString("es-CO")}`;

    // Actualizar visualización de invitados
    const guestCountEl = document.getElementById("guestCountDisplay");
    if (guestCountEl) guestCountEl.textContent = this.state.guests;

    const guestSlider = document.getElementById("guestRangeSlider");
    if (guestSlider && parseInt(guestSlider.value, 10) !== this.state.guests) {
      guestSlider.value = this.state.guests;
    }

    // Actualizar badges de preset de invitados
    document.querySelectorAll(".preset-chip").forEach(chip => {
      const val = parseInt(chip.dataset.guests, 10);
      chip.classList.toggle("active", val === this.state.guests);
    });

    // Indicador inteligente de capacidad según la sede seleccionada
    const capacityNote = document.getElementById("capacityNote");
    if (capacityNote) {
      if (this.state.location === "finca_penol") {
        capacityNote.innerHTML = `🌄 <strong>Finca Campestre El Peñol:</strong> Rodeada de naturaleza, jardines y quiosco campestre. Capacidad de hasta 250 invitados con vista panorámica.`;
      } else if (this.state.location === "salon_almar") {
        if (this.state.guests > 180) {
          capacityNote.innerHTML = `🌟 <strong>Salón Marinilla:</strong> Para ${this.state.guests} personas habilitamos distribución especial de pista y montaje optimizado.`;
        } else {
          capacityNote.innerHTML = `✨ <strong>Salón Marinilla:</strong> Aforo perfecto y confort climatizado en Calle 29 # 28-25 (hasta 200 personas).`;
        }
      } else {
        capacityNote.innerHTML = `🚚 <strong>Montaje a Domicilio:</strong> Llevamos menaje, cocina y carpas a cualquier finca del Oriente Antioqueño.`;
      }
    }

    // Actualizar botones de celebración
    document.querySelectorAll(".segment-celebration").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.type === this.state.celebration);
    });

    // Actualizar locación
    document.querySelectorAll(".tile-location").forEach(tile => {
      tile.classList.toggle("active", tile.dataset.location === this.state.location);
    });

    // Actualizar catering
    document.querySelectorAll(".tile-catering").forEach(tile => {
      tile.classList.toggle("active", tile.dataset.catering === this.state.catering);
    });

    // Actualizar staging / mobiliario
    document.querySelectorAll(".tile-staging").forEach(tile => {
      tile.classList.toggle("active", tile.dataset.staging === this.state.staging);
    });

    // Actualizar add-ons
    document.querySelectorAll(".addon-chip").forEach(chip => {
      const id = chip.dataset.addon;
      const isActive = this.state.addons.has(id);
      chip.classList.toggle("active", isActive);
      const icon = chip.querySelector(".addon-checkbox-circle");
      if (icon) icon.textContent = isActive ? "✓" : "";
    });
  },

  // Enlace de Eventos y Touch
  bindEvents() {
    // 1. Selector de Celebración (Segmented Switch)
    document.querySelectorAll(".segment-celebration").forEach(btn => {
      btn.addEventListener("click", () => {
        this.state.celebration = btn.dataset.type;
        this.render();
      });
    });

    // 2. Control de Invitados (Slider + Stepper)
    const slider = document.getElementById("guestRangeSlider");
    if (slider) {
      slider.addEventListener("input", (e) => {
        this.state.guests = parseInt(e.target.value, 10);
        this.render();
      });
    }

    document.querySelectorAll(".preset-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        this.state.guests = parseInt(chip.dataset.guests, 10);
        this.render();
      });
    });

    // 3. Selector de Locación
    document.querySelectorAll(".tile-location").forEach(tile => {
      tile.addEventListener("click", () => {
        this.state.location = tile.dataset.location;
        this.render();
      });
    });

    // 4. Selector de Catering
    document.querySelectorAll(".tile-catering").forEach(tile => {
      tile.addEventListener("click", () => {
        this.state.catering = tile.dataset.catering;
        this.render();
      });
    });

    // 5. Selector de Mobiliario / Staging
    document.querySelectorAll(".tile-staging").forEach(tile => {
      tile.addEventListener("click", () => {
        this.state.staging = tile.dataset.staging;
        this.render();
      });
    });

    // 6. Add-ons Toggles
    document.querySelectorAll(".addon-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const id = chip.dataset.addon;
        if (this.state.addons.has(id)) {
          this.state.addons.delete(id);
        } else {
          this.state.addons.add(id);
        }
        this.render();
      });
    });

    // 7. Botón Principal: Solicitar por WhatsApp & Firestore
    const bookBtn = document.getElementById("appleBookBtn");
    if (bookBtn) {
      bookBtn.addEventListener("click", () => this.handleBooking());
    }

    // 8. Botón Secundario: Modal de Cotización Formal Imprimible (PDF View)
    const previewBtn = document.getElementById("applePreviewBtn");
    if (previewBtn) {
      previewBtn.addEventListener("click", () => this.openFormalProposalModal());
    }
  },

  // Flujo de Registro y WhatsApp con Modal de Lujo
  handleBooking() {
    const calc = this.calculate();
    const cel = this.pricingMatrix.celebrations[this.state.celebration];
    const loc = this.pricingMatrix.locations[this.state.location];
    const cat = this.pricingMatrix.caterings[this.state.catering];
    const stg = this.pricingMatrix.stagings[this.state.staging];

    const addonsText = Array.from(this.state.addons)
      .map(id => `• ${this.pricingMatrix.addons[id]?.label || id}`)
      .join("\n");

    let modal = document.getElementById("bookingLeadModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "bookingLeadModal";
      modal.className = "apple-modal-overlay";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="apple-modal-content">
        <button class="apple-modal-close" onclick="document.getElementById('bookingLeadModal').classList.remove('open')">&times;</button>
        
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--apple-gold-light); font-weight: 700;">Experiencia Personalizada</span>
          <h2 style="font-family: 'Playfair Display', serif; color: #fff; font-size: 1.8rem; margin-top: 0.3rem;">
            Confirmar Cotización
          </h2>
          <p style="font-size: 0.85rem; color: var(--apple-text-secondary); max-width: 420px; margin: 0.5rem auto 0;">
            ${cel.label} para ${calc.guests} personas en ${loc.label}.
          </p>
        </div>

        <div style="background: rgba(212, 175, 55, 0.08); border: 1px dashed var(--apple-gold); border-radius: 12px; padding: 1rem 1.2rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <span style="font-size: 0.75rem; color: var(--apple-text-secondary); text-transform: uppercase;">Inversión Total Estimada</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: #fff; font-family: 'Playfair Display', serif;">
              $${calc.total.toLocaleString("es-CO")} COP
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.75rem; color: var(--apple-gold-light); text-transform: uppercase;">Anticipo Sugerido (30%)</span>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--apple-gold-light);">
              $${calc.depositSuggested.toLocaleString("es-CO")} COP
            </div>
          </div>
        </div>

        <form id="appleLeadForm" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.8rem; color: #ccc; margin-bottom: 0.3rem;">Nombre y Apellidos del Anfitrión *</label>
            <input type="text" id="leadNombre" required placeholder="Ej: Valentina Gómez Restrepo" style="width: 100%; padding: 0.85rem 1rem; background: #121214; border: 1px solid var(--apple-border); border-radius: 10px; color: #fff; font-size: 0.95rem;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
            <div>
              <label style="display: block; font-size: 0.8rem; color: #ccc; margin-bottom: 0.3rem;">WhatsApp / Teléfono *</label>
              <input type="tel" id="leadTelefono" required placeholder="Ej: 314 884 9011" style="width: 100%; padding: 0.85rem 1rem; background: #121214; border: 1px solid var(--apple-border); border-radius: 10px; color: #fff; font-size: 0.95rem;" />
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; color: #ccc; margin-bottom: 0.3rem;">Fecha Tentativa *</label>
              <input type="date" id="leadFecha" required style="width: 100%; padding: 0.85rem 1rem; background: #121214; border: 1px solid var(--apple-border); border-radius: 10px; color: #fff; font-size: 0.95rem; color-scheme: dark;" />
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 0.8rem; color: #ccc; margin-bottom: 0.3rem;">Notas o Requerimientos Especiales (Opcional)</label>
            <textarea id="leadNotas" rows="2" placeholder="Ej: Preferencia por menú vegetariano para 10 personas, llegada a las 4:00 PM..." style="width: 100%; padding: 0.75rem 1rem; background: #121214; border: 1px solid var(--apple-border); border-radius: 10px; color: #fff; font-size: 0.85rem; resize: none;"></textarea>
          </div>

          <div style="display: flex; gap: 0.8rem; margin-top: 0.5rem; flex-wrap: wrap;">
            <button type="submit" class="btn-apple-primary" style="flex: 1; min-width: 200px; padding: 0.9rem; justify-content: center;">
              💬 Enviar Cotización por WhatsApp
            </button>
            <button type="button" id="leadPreviewBtn" class="btn-apple-secondary" style="padding: 0.9rem 1.2rem; justify-content: center;">
              📄 Ver PDF
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add("open");

    const fechaInput = document.getElementById("leadFecha");
    if (fechaInput) {
      fechaInput.min = new Date().toISOString().split("T")[0];
    }

    const previewBtn = document.getElementById("leadPreviewBtn");
    if (previewBtn) {
      previewBtn.onclick = () => {
        modal.classList.remove("open");
        this.openFormalProposalModal();
      };
    }

    const form = document.getElementById("appleLeadForm");
    form.onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("leadNombre").value.trim();
      const telefono = document.getElementById("leadTelefono").value.trim();
      const fecha = document.getElementById("leadFecha").value || "Por definir";
      const notas = document.getElementById("leadNotas").value.trim();

      // Guardar en Firestore
      try {
        await dbService.createQuote({
          nombre,
          telefono,
          evento: cel.label,
          locacion: loc.label,
          personas: calc.guests,
          menu: cat.label,
          mobiliario: stg.label,
          totalEstimado: calc.total,
          anticipoSugerido: calc.depositSuggested,
          valorPorPersona: calc.perPersonFinal,
          fechaEvento: fecha,
          mensaje: `Adicionales:\n${addonsText}${notas ? `\nNotas: ${notas}` : ""}`,
          origen: "apple_studio_configurator"
        });
      } catch (err) {
        console.warn("Offline fallback", err);
      }

      modal.classList.remove("open");

      // Mensaje de WhatsApp elegante
      const mensaje = 
`💎 *COTIZACIÓN EXCLUSIVA - BANQUETES ALMAR* 💎
──────────────────────────────
👤 *Anfitrión:* ${nombre}
📱 *Contacto:* ${telefono}
📅 *Fecha Tentativa:* ${fecha}
👥 *Invitados:* ${calc.guests} personas
✨ *Tipo de Evento:* ${cel.label}
🏛️ *Locación:* ${loc.label}

🍽️ *Gastronomía:* ${cat.label}
🪑 *Mobiliario & Estilo:* ${stg.label}
${this.state.addons.size > 0 ? `\n🌟 *Servicios y Producción Especial:*\n${addonsText}\n` : ""}${notas ? `\n📝 *Notas:* ${notas}\n` : ""}
──────────────────────────────
💰 *INVERSIÓN TOTAL ESTIMADA:* $${calc.total.toLocaleString("es-CO")} COP
🏷️ *Inversión por Invitado:* $${calc.perPersonFinal.toLocaleString("es-CO")} COP
💵 *Anticipo Sugerido para Reserva (30%):* $${calc.depositSuggested.toLocaleString("es-CO")} COP
──────────────────────────────
Solicito verificar disponibilidad de fecha en el salón de Marinilla (Calle 29 # 28-25) o Finca Campestre Almar.`;

      const url = `https://wa.me/${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");
    };
  },

  // Modal con Propuesta Formal Lista para Impresión / PDF
  openFormalProposalModal() {
    const calc = this.calculate();
    const cel = this.pricingMatrix.celebrations[this.state.celebration];
    const loc = this.pricingMatrix.locations[this.state.location];
    const cat = this.pricingMatrix.caterings[this.state.catering];
    const stg = this.pricingMatrix.stagings[this.state.staging];

    let modal = document.getElementById("proposalModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "proposalModal";
      modal.className = "apple-modal-overlay";
      document.body.appendChild(modal);
    }

    const addonsListHtml = Array.from(this.state.addons)
      .map(id => `<li>${this.pricingMatrix.addons[id]?.label || id}</li>`)
      .join("");

    modal.innerHTML = `
      <div class="apple-modal-content" id="printableProposal">
        <button class="apple-modal-close" onclick="document.getElementById('proposalModal').classList.remove('open')">&times;</button>
        
        <div style="text-align: center; border-bottom: 1px solid var(--apple-border); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
          <h2 style="font-family: 'Playfair Display', serif; color: var(--apple-gold-light); font-size: 1.8rem;">Banquetes Almar</h2>
          <p style="font-size: 0.85rem; color: var(--apple-text-secondary);">${BUSINESS_INFO.slogan}</p>
          <p style="font-size: 0.8rem; color: var(--apple-text-tertiary);">📍 ${BUSINESS_INFO.direccion} • 📞 ${BUSINESS_INFO.telefonoPrincipal}</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 0.8rem;">Resumen de la Propuesta:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; color: #ddd;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 0.5rem 0;">Celebración:</td>
              <td style="text-align: right; font-weight: 600; color: #fff;">${cel.label}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 0.5rem 0;">Número de Invitados:</td>
              <td style="text-align: right; font-weight: 600; color: #fff;">${calc.guests} personas</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 0.5rem 0;">Locación:</td>
              <td style="text-align: right; font-weight: 600; color: #fff;">${loc.label}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 0.5rem 0;">Experiencia Gastronómica:</td>
              <td style="text-align: right; font-weight: 600; color: #fff;">${cat.label}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 0.5rem 0;">Mobiliario y Ambientación:</td>
              <td style="text-align: right; font-weight: 600; color: #fff;">${stg.label}</td>
            </tr>
          </table>
        </div>

        ${addonsListHtml ? `
          <div style="margin-bottom: 1.5rem; background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px;">
            <h4 style="font-size: 0.85rem; color: var(--apple-gold-light); margin-bottom: 0.5rem; text-transform: uppercase;">Servicios Especiales Incluidos:</h4>
            <ul style="font-size: 0.85rem; color: #ccc; margin-left: 1.2rem;">
              ${addonsListHtml}
            </ul>
          </div>
        ` : ""}

        <div style="background: rgba(212, 175, 55, 0.12); border: 1px solid var(--apple-gold); padding: 1.4rem; border-radius: 12px; text-align: center; margin-bottom: 1.5rem;">
          <span style="font-size: 0.8rem; color: var(--apple-gold-light); text-transform: uppercase; letter-spacing: 1px;">Inversión Total Estimada</span>
          <div style="font-size: 2.2rem; font-weight: 800; color: #fff; font-family: 'Playfair Display', serif;">
            $${calc.total.toLocaleString("es-CO")} COP
          </div>
          <span style="font-size: 0.85rem; color: #ccc;">Valor por persona: $${calc.perPersonFinal.toLocaleString("es-CO")} COP</span>
        </div>

        <div style="display: flex; gap: 0.8rem; justify-content: center;">
          <button class="btn-apple-primary" onclick="window.print()" style="flex: 1;">
            🖨️ Imprimir / Guardar como PDF
          </button>
        </div>
      </div>
    `;

    modal.classList.add("open");
  }
};

// Auto-inicializar cuando el DOM esté listo
if (typeof window !== "undefined") {
  window.EventStudio = EventStudio;
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    EventStudio.init();
  });
}
