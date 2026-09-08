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
  GALLERY: "almar_galeria",
  GALLERY_CATEGORIES: "almar_galeria_categorias",
  SERVICES: "almar_servicios"
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
        cliente: "Valentina Muñoz & Juan Esteban",
        monto: 4000000,
        concepto: "Anticipo 30% separación de fecha",
        metodo: "Transferencia Bancolombia",
        fecha: "2026-08-15"
      }
    ];
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(initialPayments));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GALLERY_CATEGORIES)) {
    const initialCategories = [
      "Bodas",
      "15 Años",
      "Salón Marinilla",
      "Finca El Peñol",
      "Mobiliario",
      "Catering",
      "Eventos Corporativos"
    ];
    localStorage.setItem(STORAGE_KEYS.GALLERY_CATEGORIES, JSON.stringify(initialCategories));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GALLERY)) {
    const initialGallery = [
      {
        id: "gal-1",
        titulo: "Boda Romántica en Salón Almar",
        categoria: "Bodas",
        imagen: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Montaje de gala con centros florales altos e iluminación cálida."
      },
      {
        id: "gal-2",
        titulo: "Ceremonia Campestre en El Peñol",
        categoria: "Finca El Peñol",
        imagen: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Jardines campestres frente a la represa y quiosco iluminado."
      },
      {
        id: "gal-3",
        titulo: "Quince Años de Ensueño",
        categoria: "15 Años",
        imagen: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Efectos especiales, pista LED y backing floral."
      },
      {
        id: "gal-4",
        titulo: "Cena de Gala y Alta Cocina",
        categoria: "Catering",
        imagen: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Servicio gourmet a 3 tiempos con emplatado de autor."
      },
      {
        id: "gal-5",
        titulo: "Montaje Tiffany y Salas Lounge",
        categoria: "Mobiliario",
        imagen: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Silletería dorada y mobiliario de alquiler de alta gama."
      },
      {
        id: "gal-6",
        titulo: "Gran Salón de Gala Marinilla",
        categoria: "Salón Marinilla",
        imagen: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Capacidad para 200 personas con acústica profesional y chandeliers."
      }
    ];
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(initialGallery));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    const initialClients = [
      {
        id: "cli-101",
        nombre: "Mariana Gómez",
        telefono: "3145678901",
        email: "mariana.gomez@gmail.com",
        documento: "1038412991",
        direccion: "Calle 30 # 29-15, Marinilla",
        tipo_cliente: "Cliente",
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: "cli-102",
        nombre: "Carlos Andrés Restrepo",
        telefono: "3104523311",
        email: "carlos.restrepo@outlook.com",
        documento: "1038554210",
        direccion: "Sector La Dalia, El Peñol",
        tipo_cliente: "VIP",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "cli-103",
        nombre: "Valentina Muñoz",
        telefono: "3117892233",
        email: "valen.munoz@yahoo.es",
        documento: "1040112845",
        direccion: "Carrera 31 # 27-10, Rionegro",
        tipo_cliente: "Empresarial",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(initialClients));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    const initialServices = [
      {
        id: "srv-1",
        titulo: "Banquetería y Catering de Gala",
        categoria: "Catering",
        imagen: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Menús gourmet a 3 tiempos, pasabocas de bienvenida, repostería fina, vajilla de lujo y personal de protocolo para bodas y 15 años.",
        destacado: true
      },
      {
        id: "srv-2",
        titulo: "Decoración y Ambientación Floral de Autor",
        categoria: "Decoración",
        imagen: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Centros de mesa altos con flores naturales, arcos ceremoniales, backing de neón para fotos y ambientación de velas.",
        destacado: true
      },
      {
        id: "srv-3",
        titulo: "Alquiler de Mobiliario y Menaje de Gala",
        categoria: "Mobiliario",
        imagen: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Sillas Tiffany doradas, Phoenix, Crossback de madera, salas lounge, mantelería de alta costura y cristalería fina.",
        destacado: true
      },
      {
        id: "srv-4",
        titulo: "Salón de Gala en Marinilla",
        categoria: "Locación",
        imagen: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Espacio climatizado para hasta 200 personas con acústica profesional, suite para anfitriones y ubicación estratégica en Marinilla.",
        destacado: true
      },
      {
        id: "srv-5",
        titulo: "Finca Campestre El Peñol",
        categoria: "Locación",
        imagen: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Exclusivo entorno campestre con vista a la represa, amplias zonas verdes, quiosco para ceremonias y parqueadero privado.",
        destacado: true
      },
      {
        id: "srv-6",
        titulo: "Producción Audiovisual, Luces & DJ",
        categoria: "Producción",
        imagen: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
        descripcion: "Estructuras truss, cabezas móviles, pista de baile LED, chisperos fríos sin pólvora y DJ animador profesional.",
        destacado: true
      }
    ];
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(initialServices));
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

  // GALERÍA Y CATEGORÍAS
  async getGalleryCategories() {
    let cats = getLocal(STORAGE_KEYS.GALLERY_CATEGORIES);
    if (!Array.isArray(cats) || cats.length === 0) {
      cats = [
        "Bodas",
        "15 Años",
        "Salón Marinilla",
        "Finca El Peñol",
        "Mobiliario",
        "Catering",
        "Eventos Corporativos"
      ];
      setLocal(STORAGE_KEYS.GALLERY_CATEGORIES, cats);
    }
    return cats;
  },

  async addGalleryCategory(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return false;
    const cats = await this.getGalleryCategories();
    if (!cats.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      cats.push(trimmed);
      setLocal(STORAGE_KEYS.GALLERY_CATEGORIES, cats);
    }
    return cats;
  },

  async deleteGalleryCategory(name) {
    let cats = await this.getGalleryCategories();
    cats = cats.filter(c => c.toLowerCase() !== name.toLowerCase());
    setLocal(STORAGE_KEYS.GALLERY_CATEGORIES, cats);
    return cats;
  },

  async getGallery() {
    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const snapshot = await ops.getDocs(ops.collection(db, "galeria"));
        if (!snapshot.empty) {
          const remoteItems = [];
          snapshot.forEach(doc => remoteItems.push({ id: doc.id, ...doc.data() }));
          setLocal(STORAGE_KEYS.GALLERY, remoteItems);
          return remoteItems;
        }
      } catch (err) {
        console.warn("Firestore getGallery:", err.message);
      }
    }
    let localItems = getLocal(STORAGE_KEYS.GALLERY);
    if (!Array.isArray(localItems) || localItems.length === 0) {
      initDB();
      localItems = getLocal(STORAGE_KEYS.GALLERY);
    }
    return localItems;
  },

  async addGalleryItem(item) {
    const newItem = {
      ...item,
      createdAt: new Date().toISOString()
    };

    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const docRef = await ops.addDoc(ops.collection(db, "galeria"), newItem);
        newItem.id = docRef.id;
      } catch (err) {
        console.warn("Firestore addGalleryItem:", err.message);
        newItem.id = "gal-" + Date.now();
      }
    } else {
      newItem.id = "gal-" + Date.now();
    }

    const gallery = getLocal(STORAGE_KEYS.GALLERY);
    gallery.unshift(newItem);
    setLocal(STORAGE_KEYS.GALLERY, gallery);
    return newItem;
  },

  async updateGalleryItem(id, itemData) {
    const live = await initFirestoreLive();
    if (live && !String(id).startsWith("gal-")) {
      try {
        const { db, ops } = live;
        await ops.updateDoc(ops.doc(db, "galeria", String(id)), itemData);
      } catch (err) {
        console.warn("Firestore updateGalleryItem:", err.message);
      }
    }

    const gallery = getLocal(STORAGE_KEYS.GALLERY);
    const idx = gallery.findIndex(g => String(g.id) === String(id));
    if (idx !== -1) {
      gallery[idx] = { ...gallery[idx], ...itemData, id };
      setLocal(STORAGE_KEYS.GALLERY, gallery);
      return gallery[idx];
    }
    return { id, ...itemData };
  },

  async deleteGalleryItem(id) {
    const live = await initFirestoreLive();
    if (live && !String(id).startsWith("gal-")) {
      try {
        const { db, ops } = live;
        await ops.deleteDoc(ops.doc(db, "galeria", String(id)));
      } catch (err) {
        console.warn("Firestore deleteGalleryItem:", err.message);
      }
    }

    let gallery = getLocal(STORAGE_KEYS.GALLERY);
    gallery = gallery.filter(g => String(g.id) !== String(id));
    setLocal(STORAGE_KEYS.GALLERY, gallery);
    return true;
  },

  async saveGalleryOrder(orderedItems) {
    if (Array.isArray(orderedItems)) {
      setLocal(STORAGE_KEYS.GALLERY, orderedItems);
    }
    return orderedItems;
  },

  // CLIENTES
  async getClients() {
    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const snapshot = await ops.getDocs(ops.collection(db, "clientes"));
        if (!snapshot.empty) {
          const remoteClients = [];
          snapshot.forEach(doc => remoteClients.push({ id: doc.id, ...doc.data() }));
          setLocal(STORAGE_KEYS.CLIENTS, remoteClients);
          return remoteClients;
        }
      } catch (err) {
        console.warn("Firestore getClients:", err.message);
      }
    }
    return getLocal(STORAGE_KEYS.CLIENTS).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  async getClientById(id) {
    const clients = await this.getClients();
    return clients.find(c => String(c.id) === String(id)) || null;
  },

  async createClient(clientData) {
    const newClient = {
      ...clientData,
      createdAt: new Date().toISOString()
    };

    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const docRef = await ops.addDoc(ops.collection(db, "clientes"), newClient);
        newClient.id = docRef.id;
      } catch (err) {
        console.warn("Firestore createClient:", err.message);
        newClient.id = "cli-" + Date.now();
      }
    } else {
      newClient.id = "cli-" + Date.now();
    }

    const clients = getLocal(STORAGE_KEYS.CLIENTS);
    clients.unshift(newClient);
    setLocal(STORAGE_KEYS.CLIENTS, clients);
    return newClient;
  },

  async updateClient(id, clientData) {
    const live = await initFirestoreLive();
    if (live && !String(id).startsWith("cli-")) {
      try {
        const { db, ops } = live;
        await ops.updateDoc(ops.doc(db, "clientes", String(id)), clientData);
      } catch (err) {
        console.warn("Firestore updateClient:", err.message);
      }
    }

    const clients = getLocal(STORAGE_KEYS.CLIENTS);
    const idx = clients.findIndex(c => String(c.id) === String(id));
    if (idx !== -1) {
      clients[idx] = { ...clients[idx], ...clientData, id };
      setLocal(STORAGE_KEYS.CLIENTS, clients);
      return clients[idx];
    }
    return { id, ...clientData };
  },

  async deleteClient(id) {
    const live = await initFirestoreLive();
    if (live && !String(id).startsWith("cli-")) {
      try {
        const { db, ops } = live;
        await ops.deleteDoc(ops.doc(db, "clientes", String(id)));
      } catch (err) {
        console.warn("Firestore deleteClient:", err.message);
      }
    }

    let clients = getLocal(STORAGE_KEYS.CLIENTS);
    clients = clients.filter(c => String(c.id) !== String(id));
    setLocal(STORAGE_KEYS.CLIENTS, clients);
    return true;
  },

  async searchClients(query) {
    const clients = await this.getClients();
    if (!query || !query.trim()) return clients;
    const q = query.toLowerCase().trim();
    return clients.filter(c => 
      String(c.nombre || "").toLowerCase().includes(q) ||
      String(c.telefono || "").toLowerCase().includes(q) ||
      String(c.documento || "").toLowerCase().includes(q) ||
      String(c.email || "").toLowerCase().includes(q) ||
      String(c.id || "").toLowerCase().includes(q)
    );
  },

  // GESTIÓN DE SERVICIOS
  async getServices() {
    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const snapshot = await ops.getDocs(ops.collection(db, "servicios"));
        if (!snapshot.empty) {
          const remoteItems = [];
          snapshot.forEach(doc => remoteItems.push({ id: doc.id, ...doc.data() }));
          setLocal(STORAGE_KEYS.SERVICES, remoteItems);
          return remoteItems;
        }
      } catch (err) {
        console.warn("Firestore getServices:", err.message);
      }
    }
    let localItems = getLocal(STORAGE_KEYS.SERVICES);
    if (!Array.isArray(localItems) || localItems.length === 0) {
      initLocalStore();
      localItems = getLocal(STORAGE_KEYS.SERVICES);
    }
    return localItems || [];
  },

  async addService(service) {
    const newService = {
      ...service,
      createdAt: new Date().toISOString()
    };
    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const docRef = await ops.addDoc(ops.collection(db, "servicios"), newService);
        newService.id = docRef.id;
      } catch (err) {
        console.warn("Firestore addService error:", err.message);
        newService.id = "srv-" + Date.now();
      }
    } else {
      newService.id = "srv-" + Date.now();
    }
    const list = getLocal(STORAGE_KEYS.SERVICES) || [];
    list.unshift(newService);
    setLocal(STORAGE_KEYS.SERVICES, list);
    return newService;
  },

  async updateService(id, serviceData) {
    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        const docRef = ops.doc(db, "servicios", id);
        await ops.updateDoc(docRef, { ...serviceData, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.warn("Firestore updateService error:", err.message);
      }
    }
    const list = getLocal(STORAGE_KEYS.SERVICES) || [];
    const idx = list.findIndex(s => String(s.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...serviceData, updatedAt: new Date().toISOString() };
      setLocal(STORAGE_KEYS.SERVICES, list);
    }
    return true;
  },

  async deleteService(id) {
    const live = await initFirestoreLive();
    if (live) {
      try {
        const { db, ops } = live;
        await ops.deleteDoc(ops.doc(db, "servicios", id));
      } catch (err) {
        console.warn("Firestore deleteService error:", err.message);
      }
    }
    let list = getLocal(STORAGE_KEYS.SERVICES) || [];
    list = list.filter(s => String(s.id) !== String(id));
    setLocal(STORAGE_KEYS.SERVICES, list);
    return true;
  },

  // ESTADÍSTICAS DEL DASHBOARD
  async getStats() {
    const quotes = getLocal(STORAGE_KEYS.QUOTES);
    const reservas = getLocal(STORAGE_KEYS.RESERVATIONS);
    const payments = getLocal(STORAGE_KEYS.PAYMENTS);
    const clients = getLocal(STORAGE_KEYS.CLIENTS);

    const totalIngresos = payments.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
    const totalPendiente = reservas.reduce((acc, r) => acc + (Number(r.saldo) || 0), 0);
    const confirmados = reservas.filter(r => r.estado === "Confirmada" || r.estado === "Finalizado").length;

    return {
      totalQuotes: quotes.length,
      totalEventos: reservas.length,
      totalClientes: clients.length,
      confirmados: confirmados,
      ingresos: totalIngresos,
      pendiente: totalPendiente
    };
  }
};
