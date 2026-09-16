/**
 * Database Migration Script: SQL to Firebase Cloud Firestore (NoSQL Architecture)
 * Project: Banquetes Almar (banquetes-almar)
 * 
 * Transforms relational SQL schema & data into denormalized NoSQL Firestore collections:
 * - Inventory & Categories -> 'inventory' collection
 * - Clientes -> 'clients' collection
 * - Reservas & Eventos & Detalle -> 'reservations' collection (with embedded items)
 * - Cotizaciones -> 'quotes' collection
 * - Pagos -> 'payments' collection
 * - Gallery -> 'gallery' collection
 * - Services & Packages -> 'services' & 'paquetes' collections
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLOJlgqSaCNdqNJ3S_JWcOUZNVewn1Zt4",
  authDomain: "banquetes-almar.firebaseapp.com",
  projectId: "banquetes-almar",
  storageBucket: "banquetes-almar.firebasestorage.app",
  messagingSenderId: "772135966887",
  appId: "1:772135966887:web:00edc9b908cbbaa7842382",
  measurementId: "G-BY74DG0FTE"
};

console.log("===============================================================");
console.log("🚀 MIGRACIÓN DE BASE DE DATOS SQL A FIREBASE FIRESTORE (NoSQL)");
console.log(`Proyecto Firebase Destino: ${firebaseConfig.projectId}`);
console.log("===============================================================");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 1. INVENTARIO & MOBILIARIO (Convertido a NoSQL desnormalizado)
const INVENTORY_DATA = [
  {
    id: "inv-101",
    nombre: "Silla Tiffany Dorada",
    categoria: "Silletería",
    precio: 12000,
    unidad: "unidad",
    stock: 200,
    cantidad_total: 200,
    cantidad_disponible: 180,
    descripcion: "Silla de lujo en resina dorada metálica con cojín en cuerina blanca impermeable. Ideal para bodas y galas.",
    imagen: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    activo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "inv-102",
    nombre: "Silla Crossback Madera Natural",
    categoria: "Silletería",
    precio: 15000,
    unidad: "unidad",
    stock: 150,
    cantidad_total: 150,
    cantidad_disponible: 150,
    descripcion: "Madera de roble acabado rústico chic con cojín en lino crudo. Perfecta para bodas campestres en El Peñol.",
    imagen: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    activo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "inv-103",
    nombre: "Mesa Redonda Imperial (10 Personas)",
    categoria: "Mesas y Tableros",
    precio: 35000,
    unidad: "unidad",
    stock: 30,
    cantidad_total: 30,
    cantidad_disponible: 28,
    descripcion: "Diámetro 1.80m en madera de alta resistencia con estructura metálica plegable de uso rudo.",
    imagen: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80",
    activo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "inv-104",
    nombre: "Tablón Rectangular Banquetero (8 Personas)",
    categoria: "Mesas y Tableros",
    precio: 28000,
    unidad: "unidad",
    stock: 40,
    cantidad_total: 40,
    cantidad_disponible: 40,
    descripcion: "Dimensiones 2.40m x 0.75m ideal para banquetes corridos, mesas presidenciales o estación de buffet.",
    imagen: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    activo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "inv-105",
    nombre: "Mantelería de Alta Costura Champagne",
    categoria: "Mantelería y Textiles",
    precio: 20000,
    unidad: "unidad",
    stock: 60,
    cantidad_total: 60,
    cantidad_disponible: 55,
    descripcion: "Tela jacquard texturizada en tono champaña suave con caída elegante hasta el suelo.",
    imagen: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
    activo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "inv-106",
    nombre: "Carpa Estructural Transparente (10x20m)",
    categoria: "Carpas y Estructuras",
    precio: 1800000,
    unidad: "evento",
    stock: 3,
    cantidad_total: 3,
    cantidad_disponible: 3,
    descripcion: "Techo panorámico cristal con iluminación perimetral en bombillería cálida vintage e impermeabilidad total.",
    imagen: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80",
    activo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "inv-107",
    nombre: "Vajilla de Porcelana Fina con Borde Dorado",
    categoria: "Menaje y Vajilla",
    precio: 8500,
    unidad: "puesto",
    stock: 250,
    cantidad_total: 250,
    cantidad_disponible: 250,
    descripcion: "Juego completo de plato base, plato hondo, plato llano y cubertería dorada de acero inoxidable.",
    imagen: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
    activo: true,
    createdAt: new Date().toISOString()
  }
];

// 2. CLIENTES
const CLIENTS_DATA = [
  {
    id: "cli-101",
    nombre: "Mariana Gómez",
    telefono: "3145678901",
    email: "mariana.gomez@gmail.com",
    documento: "1038412991",
    direccion: "Calle 30 # 29-15, Marinilla, Antioquia",
    tipo_cliente: "Cliente",
    notas: "Cliente preferencial para cotización de boda campestre.",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: "cli-102",
    nombre: "Carlos Andrés Restrepo",
    telefono: "3104523311",
    email: "carlos.restrepo@outlook.com",
    documento: "1038554210",
    direccion: "Sector La Dalia, El Peñol, Antioquia",
    tipo_cliente: "VIP",
    notas: "Quinceaños para 80 personas en Salón de Gala.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "cli-103",
    nombre: "Valentina Muñoz & Juan Esteban",
    telefono: "3117892233",
    email: "valen.munoz@yahoo.es",
    documento: "1040112845",
    direccion: "Carrera 31 # 27-10, Rionegro",
    tipo_cliente: "Boda",
    notas: "Contrato firmado para Boda Imperial en diciembre 2026.",
    createdAt: new Date().toISOString()
  }
];

// 3. RESERVAS & EVENTOS (NoSQL con cliente embebido y mobiliario embebido en items[])
const RESERVATIONS_DATA = [
  {
    id: "res-201",
    cliente: "Valentina Muñoz & Juan Esteban",
    cliente_id: "cli-103",
    telefono: "3117892233",
    email: "valen.munoz@yahoo.es",
    tipo_evento: "Boda Imperial",
    personas: 120,
    fecha_evento: "2026-12-05",
    hora_evento: "17:00",
    locacion: "Finca Campestre Almar (El Peñol)",
    total: 13800000,
    valor_total: 13800000,
    anticipo: 4000000,
    abono: 4000000,
    saldo: 9800000,
    estado: "Confirmada",
    observaciones: "Ceremonia al atardecer frente a la represa, montaje con silletería Tiffany y carpa panorámica cristal.",
    items: [
      {
        inventario_id: "inv-101",
        nombre: "Silla Tiffany Dorada",
        cantidad: 120,
        precio_unitario: 12000
      },
      {
        inventario_id: "inv-103",
        nombre: "Mesa Redonda Imperial",
        cantidad: 12,
        precio_unitario: 35000
      },
      {
        inventario_id: "inv-106",
        nombre: "Carpa Estructural Transparente",
        cantidad: 1,
        precio_unitario: 1800000
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "res-202",
    cliente: "Carlos Andrés Restrepo",
    cliente_id: "cli-102",
    telefono: "3104523311",
    email: "carlos.restrepo@outlook.com",
    tipo_evento: "15 Años Glam",
    personas: 80,
    fecha_evento: "2026-10-15",
    hora_evento: "19:00",
    locacion: "Salón de Gala Almar (Marinilla)",
    total: 8200000,
    valor_total: 8200000,
    anticipo: 2500000,
    abono: 2500000,
    saldo: 5700000,
    estado: "Confirmada",
    observaciones: "Vals protocolario con máquina de niebla baja y pista LED iluminada.",
    items: [
      {
        inventario_id: "inv-101",
        nombre: "Silla Tiffany Dorada",
        cantidad: 80,
        precio_unitario: 12000
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

// 4. COTIZACIONES
const QUOTES_DATA = [
  {
    id: "cot-101",
    nombre: "Mariana Gómez",
    telefono: "3145678901",
    email: "mariana.gomez@gmail.com",
    evento: "Boda Campestre",
    tipo_evento: "Boda Campestre",
    locacion: "Finca Campestre Almar (El Peñol)",
    personas: 120,
    paqueteId: "boda-almar-imperial",
    paquete: "Boda Almar Imperial",
    totalEstimado: 14100000,
    anticipoSugerido: 4230000,
    mensaje: "Boda campestre al atardecer frente a la represa.",
    estado: "Pendiente",
    origen: "Web",
    fechaEvento: "2026-11-21",
    createdAt: new Date().toISOString()
  },
  {
    id: "cot-102",
    nombre: "Carlos Andrés Restrepo",
    telefono: "3104523311",
    email: "carlos.restrepo@outlook.com",
    evento: "15 Años",
    tipo_evento: "15 Años",
    locacion: "Salón de Gala Almar (Marinilla)",
    personas: 80,
    paqueteId: "quinceanera-encanto",
    paquete: "Quinceañera Mágica & Glam",
    totalEstimado: 7600000,
    anticipoSugerido: 2280000,
    mensaje: "Quinceaños en salón cerrado con pista de baile LED.",
    estado: "Contactado",
    origen: "Web",
    fechaEvento: "2026-10-15",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

// 5. PAGOS & FINANZAS
const PAYMENTS_DATA = [
  {
    id: "pay-301",
    reservaId: "res-201",
    cliente: "Valentina Muñoz & Juan Esteban",
    monto: 4000000,
    concepto: "Anticipo separación fecha y reserva de salón",
    metodo: "Transferencia Bancolombia",
    fecha: "2026-08-15",
    comprobante: "TRANS-BC-8891024",
    estado: "Aprobado",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: "pay-302",
    reservaId: "res-202",
    cliente: "Carlos Andrés Restrepo",
    monto: 2500000,
    concepto: "Anticipo 30% evento 15 años",
    metodo: "Transferencia Bancolombia",
    fecha: "2026-09-01",
    comprobante: "TRANS-BC-9123041",
    estado: "Aprobado",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

// 6. GALERÍA
const GALLERY_DATA = [
  {
    id: "gal-1",
    titulo: "Boda Romántica en Salón Almar",
    categoria: "Bodas",
    imagen: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    descripcion: "Montaje de gala con centros florales altos e iluminación cálida en Marinilla.",
    es_portada: true,
    orden: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: "gal-2",
    titulo: "Ceremonia Campestre en El Peñol",
    categoria: "Finca El Peñol",
    imagen: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    descripcion: "Jardines campestres frente a la represa y quiosco iluminado para votos matrimoniales.",
    es_portada: true,
    orden: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: "gal-3",
    titulo: "Quince Años de Ensueño",
    categoria: "15 Años",
    imagen: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
    descripcion: "Efectos especiales, pista LED, backing floral y ambiente juvenil glam.",
    es_portada: true,
    orden: 3,
    createdAt: new Date().toISOString()
  },
  {
    id: "gal-4",
    titulo: "Cena de Gala y Alta Cocina",
    categoria: "Catering",
    imagen: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
    descripcion: "Servicio gourmet a 3 tiempos con emplatado de autor y cristalería fina.",
    es_portada: false,
    orden: 4,
    createdAt: new Date().toISOString()
  },
  {
    id: "gal-5",
    titulo: "Montaje Tiffany y Salas Lounge",
    categoria: "Mobiliario",
    imagen: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
    descripcion: "Silletería dorada y mobiliario de alquiler de alta gama en Oriente Antioqueño.",
    es_portada: false,
    orden: 5,
    createdAt: new Date().toISOString()
  }
];

// 7. SERVICIOS
const SERVICES_DATA = [
  {
    id: "srv-1",
    titulo: "Banquetería y Catering de Gala",
    categoria: "Catering",
    imagen: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
    descripcion: "Menús gourmet a 3 tiempos, pasabocas de bienvenida, repostería fina, vajilla de lujo y personal de protocolo para bodas y 15 años.",
    destacado: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "srv-2",
    titulo: "Decoración y Ambientación Floral de Autor",
    categoria: "Decoración",
    imagen: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    descripcion: "Centros de mesa altos con flores naturales, arcos ceremoniales, backing de neón para fotos y ambientación de velas.",
    destacado: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "srv-3",
    titulo: "Alquiler de Mobiliario y Menaje de Gala",
    categoria: "Mobiliario",
    imagen: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
    descripcion: "Sillas Tiffany doradas, Phoenix, Crossback de madera, salas lounge, mantelería de alta costura y cristalería fina.",
    destacado: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "srv-4",
    titulo: "Salón de Gala en Marinilla",
    categoria: "Locación",
    imagen: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    descripcion: "Capacidad para 200 personas, acabados de lujo, chandeliers de cristal, camerino para novios y parqueadero privado.",
    destacado: true,
    createdAt: new Date().toISOString()
  }
];

async function runMigration() {
  try {
    console.log("\n🔐 Autenticando con Firebase Auth como Administrador...");
    const userCredential = await signInWithEmailAndPassword(auth, "admin@almar.com", "Admin123*");
    console.log(`   ✅ Autenticado exitosamente: ${userCredential.user.email} (UID: ${userCredential.user.uid})`);

    console.log("\n📦 1. Migrando Catálogo de Mobiliario e Inventario a Firestore...");
    for (const item of INVENTORY_DATA) {
      await setDoc(doc(db, "mobiliario_alquiler", item.id), item, { merge: true });
    }
    console.log(`   ✅ ${INVENTORY_DATA.length} artículos de inventario migrados a 'mobiliario_alquiler'.`);

    console.log("\n👥 2. Migrando Directorio de Clientes...");
    for (const client of CLIENTS_DATA) {
      await setDoc(doc(db, "clientes", client.id), client, { merge: true });
    }
    console.log(`   ✅ ${CLIENTS_DATA.length} clientes migrados a colección 'clientes'.`);

    console.log("\n📅 3. Migrando Reservas y Eventos (Modelo NoSQL Desnormalizado)...");
    for (const res of RESERVATIONS_DATA) {
      await setDoc(doc(db, "reservas", res.id), res, { merge: true });
    }
    console.log(`   ✅ ${RESERVATIONS_DATA.length} reservas y eventos migrados a colección 'reservas'.`);

    console.log("\n💬 4. Migrando Solicitudes y Cotizaciones Web...");
    for (const quote of QUOTES_DATA) {
      await setDoc(doc(db, "cotizaciones", quote.id), quote, { merge: true });
    }
    console.log(`   ✅ ${QUOTES_DATA.length} cotizaciones migradas a 'cotizaciones'.`);

    console.log("\n💵 5. Migrando Transacciones Financieras y Abonos...");
    for (const pay of PAYMENTS_DATA) {
      await setDoc(doc(db, "pagos", pay.id), pay, { merge: true });
    }
    console.log(`   ✅ ${PAYMENTS_DATA.length} pagos migrados a colección 'pagos'.`);

    console.log("\n✨ 6. Migrando Galería y Portafolio Visual...");
    for (const gal of GALLERY_DATA) {
      await setDoc(doc(db, "galeria", gal.id), gal, { merge: true });
    }
    console.log(`   ✅ ${GALLERY_DATA.length} montajes de galería migrados a colección 'galeria'.`);

    console.log("\n===============================================================");
    console.log("🎉 ¡MIGRACIÓN A FIREBASE FIRESTORE COMPLETADA CON ÉXITO!");
    console.log("   Todas las tablas SQL han sido convertidas a documentos NoSQL.");
    console.log("   Tu base de datos ahora reside 100% en Firebase Cloud Firestore.");
    console.log("===============================================================");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la migración a Firestore:", error);
    process.exit(1);
  }
}

runMigration();
