/**
 * Servicio de Base de Datos para Banquetes Almar (Marinilla, Antioquia).
 * 
 * Conexión en vivo con Firebase Cloud Firestore (Proyecto: banquetes-almar).
 * Con arquitectura híbrida: escribe en Firestore y mantiene sincronización
 * local para velocidad instantánea y soporte offline.
 */

import { firebaseConfig, isFirebaseConfigured } from "./config.js";
import { DEFAULT_PACKAGES, DEFAULT_RENTAL_ITEMS } from "./seed-data.js";

// Claves de almacenamiento local para fallback/caché
const STORAGE_KEYS = {
  PACKAGES: "almar_paquetes",
  RENTAL: "almar_mobiliario",
  QUOTES: "almar_cotizaciones",
  RESERVATIONS: "almar_reservas",
  EVENTS: "almar_eventos",
  PAYMENTS: "almar_pagos",
  CLIENTS: "almar_clientes",
  GALLERY: "almar_galeria"
};

// Inicialización de datos semilla si el almacenamiento local está vacío
function initLocalStore() {
  if (typeof localStorage === "undefined") return;

  if (!localStorage.getItem(STORAGE_KEYS.PACKAGES)) {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(DEFAULT_PACKAGES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RENTAL)) {
    localStorage.setItem(STORAGE_KEYS.RENTAL, JSON.stringify(DEFAULT_RENTAL_ITEMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUOTES)) {
    const initialQuotes = [
      {
        id: "cot-101",
        nombre: "Mariana Gómez",
        telefono: "3145678901",
        evento: "Boda Campestre",
        locacion: "Finca Campestre Almar (El Peñol)",
        personas: 120,
        paqueteId: "boda-almar-imperial",
        totalEstimado: 14100000,
        anticipoSugerido: 4230000,
        mensaje: "Boda campestre al atardecer frente a la represa.",
        estado: "Pendiente",
        fechaEvento: "2026-11-21",
        createdAt: new Date().toISOString()
      },
      {
        id: "cot-102",
        nombre: "Carlos Andrés Restrepo",
        telefono: "3104523311",
        evento: "15 Años",
        locacion: "Salón de Gala Almar (Marinilla)",
        personas: 80,
        paqueteId: "quinceanera-encanto",
        totalEstimado: 7600000,
        anticipoSugerido: 2280000,
        mensaje: "Quinceaños en salón cerrado con pista de baile LED.",
        estado: "Contactado",
        fechaEvento: "2026-10-15",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(initialQuotes));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
    const initialReservas = [
      {
        id: "res-201",
        cliente: "Valentina Muñoz & Juan Esteban",
        telefono: "3117892233",
        tipo_evento: "Boda Imperial",
        personas: 100,
        fecha_evento: "2026-12-05",
        hora_evento: "17:00",
        locacion: "Finca Campestre Almar (El Peñol)",
        total: 11800000,
        anticipo: 4000000,
        saldo: 7800000,
        estado: "Confirmada",
        observaciones: "Ceremonia al atardecer en jardín con quiosco iluminado",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(initialReservas));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    const initialPayments = [
      {
        id: "pay-301",
        reservaId: "res-201",
        cliente: "Valentina Muñoz",
        monto: 4000000,
        metodo: "Transferencia Bancolombia",
        concepto: "Anticipo de separación de fecha",
        fecha: "2026-09-01",
        estado: "Aprobado"
      }
    ];
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(initialPayments));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GALLERY)) {
    const initialGallery = [
      {
        id: "gal-1",
        titulo: "Boda Romántica en Salón Almar",
        categoria: "Bodas",
        imagen: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
        descripcion: "Montaje de gala con centros florales altos e iluminación cálida."
      },
      {
        id: "gal-2",
        titulo: "Ceremonia Campestre en El Peñol",
        categoria: "Bodas",
        imagen: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80",
        descripcion: "Jardines campestres frente a la represa y quiosco iluminado."
      },
      {
        id: "gal-3",
        titulo: "Quince Años de Ensueño",
        categoria: "15 Años",
        imagen: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
        descripcion: "Efectos especiales, pista LED y backing floral."
      },
      {
        id: "gal-4",
        titulo: "Mesa de Gala y Menaje Fino",
        categoria: "Catering",
        imagen: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
        descripcion: "Vajilla de alta gama y cristalería para cena de gala."
      }
    ];
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(initialGallery));
  }
}

initLocalStore();

function getLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}

function setLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

// ----------------- CLIENTE CLOUD FIRESTORE EN TIEMPO REAL -----------------
let firestoreDb = null;
let firestoreOps = null;

async function initFirestoreLive() {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
  if (firestoreDb) return { db: firestoreDb, ops: firestoreOps };

  try {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const ops = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    firestoreDb = ops.getFirestore(app);
    firestoreOps = ops;
    console.log("🔥 Firebase Cloud Firestore Conectado en Vivo (Proyecto: banquetes-almar)");
    return { db: firestoreDb, ops: firestoreOps };
  } catch (error) {
    console.warn("⚠️ Firebase Live inicialización (usando fallback local):", error.message);
    return null;
  }
}

// Inicializar en segundo plano sin bloquear
if (typeof window !== "undefined") {
  initFirestoreLive();
}

// ----------------- API DEL SERVICIO DE BASE DE DATOS -----------------

export const dbService = {
  // PAQUETES
  async getPackages() {
    return getLocal(STORAGE_KEYS.PACKAGES);
  },

  async getPackageById(id) {
    const list = getLocal(STORAGE_KEYS.PACKAGES);
    return list.find(p => p.id === id) || null;
  },

  // MOBILIARIO / ALQUILER
  async getRentalItems(category = "todos") {
    const list = getLocal(STORAGE_KEYS.RENTAL);
    if (!category || category === "todos") return list;
    return list.filter(item => item.categoria.toLowerCase() === category.toLowerCase());
  },

  async getRentalItemById(id) {
    const list = getLocal(STORAGE_KEYS.RENTAL);
    return list.find(item => item.id === id) || null;
  },

  // COTIZACIONES
  async getQuotes() {
    // 1. Intentar cargar desde Firestore en la nube si está activo
    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const q = ops.query(ops.collection(db, "cotizaciones"), ops.orderBy("createdAt", "desc"));
        const snapshot = await ops.getDocs(q);
        if (!snapshot.empty) {
          const remoteQuotes = [];
          snapshot.forEach(doc => {
            remoteQuotes.push({ id: doc.id, ...doc.data() });
          });
          // Actualizar caché local
          setLocal(STORAGE_KEYS.QUOTES, remoteQuotes);
          return remoteQuotes;
        }
      } catch (err) {
        console.warn("Firestore getQuotes lectura:", err.message);
      }
    }
    return getLocal(STORAGE_KEYS.QUOTES).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async createQuote(quoteData) {
    const newQuote = {
      ...quoteData,
      estado: quoteData.estado || "Pendiente",
      createdAt: new Date().toISOString()
    };

    // 1. Guardar en Firestore en la nube
    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const docRef = await ops.addDoc(ops.collection(db, "cotizaciones"), newQuote);
        newQuote.id = docRef.id;
      } catch (err) {
        console.warn("Firestore createQuote escritura:", err.message);
        newQuote.id = "cot-" + Date.now();
      }
    } else {
      newQuote.id = "cot-" + Date.now();
    }

    // 2. Guardar en local para inmediatez
    const quotes = getLocal(STORAGE_KEYS.QUOTES);
    quotes.unshift(newQuote);
    setLocal(STORAGE_KEYS.QUOTES, quotes);

    return newQuote;
  },

  async updateQuoteStatus(id, estado) {
    const live = await initFirestoreLive();
    if (live && !id.startsWith("cot-")) {
      try {
        const { db, ops } = live;
        await ops.updateDoc(ops.doc(db, "cotizaciones", id), { estado });
      } catch (e) {}
    }

    const quotes = getLocal(STORAGE_KEYS.QUOTES);
    const idx = quotes.findIndex(q => q.id === id);
    if (idx !== -1) {
      quotes[idx].estado = estado;
      setLocal(STORAGE_KEYS.QUOTES, quotes);
      return quotes[idx];
    }
    return { id, estado };
  },

  async deleteQuote(id) {
    const live = await initFirestoreLive();
    if (live && !id.startsWith("cot-")) {
      try {
        const { db, ops } = live;
        await ops.deleteDoc(ops.doc(db, "cotizaciones", id));
      } catch (e) {}
    }

    let quotes = getLocal(STORAGE_KEYS.QUOTES);
    quotes = quotes.filter(q => q.id !== id);
    setLocal(STORAGE_KEYS.QUOTES, quotes);
    return true;
  },

  // RESERVAS
  async getReservations() {
    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const snapshot = await ops.getDocs(ops.collection(db, "reservas"));
        if (!snapshot.empty) {
          const remoteReservas = [];
          snapshot.forEach(doc => remoteReservas.push({ id: doc.id, ...doc.data() }));
          setLocal(STORAGE_KEYS.RESERVATIONS, remoteReservas);
          return remoteReservas;
        }
      } catch (e) {}
    }
    return getLocal(STORAGE_KEYS.RESERVATIONS).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async createReservation(reservaData) {
    const newReserva = {
      ...reservaData,
      estado: reservaData.estado || "Confirmada",
      createdAt: new Date().toISOString()
    };

    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const docRef = await ops.addDoc(ops.collection(db, "reservas"), newReserva);
        newReserva.id = docRef.id;
      } catch (e) {
        newReserva.id = "res-" + Date.now();
      }
    } else {
      newReserva.id = "res-" + Date.now();
    }

    const reservas = getLocal(STORAGE_KEYS.RESERVATIONS);
    reservas.unshift(newReserva);
    setLocal(STORAGE_KEYS.RESERVATIONS, reservas);
    return newReserva;
  },

  async updateReservation(id, updatedData) {
    const reservas = getLocal(STORAGE_KEYS.RESERVATIONS);
    const idx = reservas.findIndex(r => r.id === id);
    if (idx !== -1) {
      reservas[idx] = { ...reservas[idx], ...updatedData };
      setLocal(STORAGE_KEYS.RESERVATIONS, reservas);
      return reservas[idx];
    }
    return { id, ...updatedData };
  },

  async deleteReservation(id) {
    let reservas = getLocal(STORAGE_KEYS.RESERVATIONS);
    reservas = reservas.filter(r => r.id !== id);
    setLocal(STORAGE_KEYS.RESERVATIONS, reservas);
    return true;
  },

  // PAGOS Y ABONOS
  async getPayments() {
    return getLocal(STORAGE_KEYS.PAYMENTS);
  },

  async createPayment(paymentData) {
    const payments = getLocal(STORAGE_KEYS.PAYMENTS);
    const newPayment = {
      id: "pay-" + Date.now(),
      ...paymentData,
      fecha: paymentData.fecha || new Date().toISOString().slice(0, 10)
    };
    payments.unshift(newPayment);
    setLocal(STORAGE_KEYS.PAYMENTS, payments);

    if (paymentData.reservaId) {
      const reservas = getLocal(STORAGE_KEYS.RESERVATIONS);
      const resIdx = reservas.findIndex(r => r.id === paymentData.reservaId);
      if (resIdx !== -1) {
        reservas[resIdx].anticipo = (Number(reservas[resIdx].anticipo) || 0) + Number(paymentData.monto);
        reservas[resIdx].saldo = Math.max(0, (Number(reservas[resIdx].total) || 0) - reservas[resIdx].anticipo);
        setLocal(STORAGE_KEYS.RESERVATIONS, reservas);
      }
    }

    return newPayment;
  },

  // GALERÍA
  async getGallery() {
    return getLocal(STORAGE_KEYS.GALLERY);
  },

  async addGalleryItem(item) {
    const gallery = getLocal(STORAGE_KEYS.GALLERY);
    const newItem = {
      id: "gal-" + Date.now(),
      ...item
    };
    gallery.unshift(newItem);
    setLocal(STORAGE_KEYS.GALLERY, gallery);
    return newItem;
  },

  // ESTADÍSTICAS DEL DASHBOARD
  async getStats() {
    const quotes = getLocal(STORAGE_KEYS.QUOTES);
    const reservas = getLocal(STORAGE_KEYS.RESERVATIONS);
    const payments = getLocal(STORAGE_KEYS.PAYMENTS);

    const totalIngresos = payments.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
    const totalPendiente = reservas.reduce((acc, r) => acc + (Number(r.saldo) || 0), 0);
    const confirmados = reservas.filter(r => r.estado === "Confirmada" || r.estado === "Finalizado").length;

    return {
      totalQuotes: quotes.length,
      totalEventos: reservas.length,
      confirmados: confirmados,
      ingresos: totalIngresos,
      pendiente: totalPendiente
    };
  }
};
