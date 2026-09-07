/**
 * Datos iniciales y catálogo oficial para Banquetes Almar (Marinilla, Antioquia).
 * Basado en la oferta real de la empresa en eventos sociales, catering,
 * producción y alquiler de mobiliario en el Oriente Antioqueño.
 */

export const DEFAULT_PACKAGES = [
  {
    id: "boda-almar-imperial",
    titulo: "Boda Almar Imperial (Todo Incluido)",
    categoria: "bodas",
    badge: "Más Solicitado",
    descripcion: "La experiencia nupcial definitiva. Salón o montaje en finca, banquete a 3 tiempos, decoración floral de alta gama y producción técnica completa.",
    precioPorPersona: 115000,
    minimoPersonas: 50,
    imagen: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    inclusiones: [
      "Salón privado Almar o montaje en finca del Oriente Antioqueño",
      "Menú de gala a 3 tiempos con degustación previa para novios",
      "Sillas Tiffany (doradas o blancas) con cojinería de lujo y mesas vestidas",
      "Decoración floral integral: arco nupcial, centros de mesa y camino de flores",
      "Sonido profesional, cabezas móviles, luces vintage y DJ en vivo por 6 horas",
      "Brindis con champaña y cristalería de lujo para todos los invitados",
      "Meseros uniformados, barman, chef y coordinador general del evento"
    ]
  },
  {
    id: "quinceanera-encanto",
    titulo: "Quinceañera Mágica & Glam",
    categoria: "quince",
    badge: "Juvenil & Elegante",
    descripcion: "Una celebración inolvidable pensada para destacar a la quinceañera con efectos especiales, pista LED para el vals y ambientación temática.",
    precioPorPersona: 95000,
    minimoPersonas: 40,
    imagen: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
    inclusiones: [
      "Decoración temática de impacto: backing fotográfico y letras luminosas XV",
      "Banquete gourmet a 2 tiempos + estación de mesa de postres",
      "Pista de baile LED para el protocolo del vals y fiesta",
      "Show de luces robóticas, máquina de humo y animación DJ",
      "Mobiliario de lujo, vajilla formal y cristalería",
      "Cócteles de bienvenida (con y sin licor) y brindis protocolario",
      "Personal completo de servicio y atención personalizada"
    ]
  },
  {
    id: "grados-prom",
    titulo: "Grados & Promociones Soñadas",
    categoria: "grados",
    badge: "Celebración Exclusiva",
    descripcion: "El cierre de ciclo perfecto para colegios y universidades con protocolo de toga, cena de gala, brindis y fiesta inolvidable.",
    precioPorPersona: 78000,
    minimoPersonas: 35,
    imagen: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80",
    inclusiones: [
      "Salón acondicionado con tarima protocolaria para entrega de diplomas",
      "Cena formal a la mesa con bebida y postre",
      "Copa de vino o champaña para el brindis de honor",
      "Sonido envolvente para discursos y DJ para la hora de fiesta",
      "Mobiliario formal y mantelería elegante",
      "Personal de protocolo y servicio a la mesa"
    ]
  },
  {
    id: "comunion-bautizo",
    titulo: "Primera Comunión & Bautizo Celestial",
    categoria: "sociales",
    badge: "Familiar & Acogedor",
    descripcion: "Ambiente cálido, decoración en blanco y dorado o tonos pastel, mesa de dulces angelical y menú delicioso para toda la familia.",
    precioPorPersona: 68000,
    minimoPersonas: 30,
    imagen: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
    inclusiones: [
      "Montaje angelical con detalles en dorado, follaje natural y flores frescas",
      "Almuerzo o cena campestre balanceada para adultos y niños",
      "Mesa de dulces decorada con figuras temáticas",
      "Mobiliario cómodo con mantelería y centros de mesa florales",
      "Atención de meseros y ambientación musical suave"
    ]
  },
  {
    id: "corporativo-almar",
    titulo: "Eventos Corporativos & Fin de Año",
    categoria: "corporativo",
    badge: "Empresarial",
    descripcion: "Asambleas, integraciones, conferencias y fiestas de fin de año con tecnología audiovisual, estación de café y banquete ejecutivo.",
    precioPorPersona: 82000,
    minimoPersonas: 30,
    imagen: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    inclusiones: [
      "Equipos audiovisuales: pantalla, videoproyector y micrófonos inalámbricos",
      "Estación permanente de café gourmet, aromáticas y pasabocas",
      "Almuerzo corporativo o cena de gala buffet",
      "Disposición en auditorio, herradura o mesas redondas",
      "Espacio amplio con accesibilidad universal en Marinilla"
    ]
  }
];

export const DEFAULT_RENTAL_ITEMS = [
  {
    id: "silla-tiffany-dorada",
    nombre: "Silla Tiffany Dorada de Lujo",
    categoria: "sillas",
    precio: 7000,
    unidad: "día/evento",
    stock: 250,
    imagen: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80",
    descripcion: "Elegante silla Tiffany metálica dorada con cojín blanco acolchado. Ideal para bodas y quinceaños."
  },
  {
    id: "silla-crossback-madera",
    nombre: "Silla Crossback Madera Rústica",
    categoria: "sillas",
    precio: 11000,
    unidad: "día/evento",
    stock: 160,
    imagen: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    descripcion: "Diseño vintage en madera natural con cruceta en el espaldar. La favorita para bodas campestres."
  },
  {
    id: "mesa-redonda-10p",
    nombre: "Mesa Redonda para 10 Personas",
    categoria: "mesas",
    precio: 28000,
    unidad: "día/evento",
    stock: 35,
    imagen: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80",
    descripcion: "Mesa plegable reforzada de 1.80m de diámetro, capacidad para 10 puestos cómodos."
  },
  {
    id: "tablon-madera-rectangular",
    nombre: "Tablón Rectangular Madera Rústica",
    categoria: "mesas",
    precio: 36000,
    unidad: "día/evento",
    stock: 20,
    imagen: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    descripcion: "Tablón de madera maciza para 8 a 10 personas. Perfecto para montajes al aire libre."
  },
  {
    id: "carpa-estructural-6x6",
    nombre: "Carpa Estructural Impermeable 6x6 m",
    categoria: "carpas",
    precio: 350000,
    unidad: "evento",
    stock: 8,
    imagen: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80",
    descripcion: "Estructura metálica resistente con lona blanca impermeable de alta resistencia. Incluye montaje profesional."
  },
  {
    id: "carpa-estructural-10x10",
    nombre: "Carpa Gigante de Eventos 10x10 m",
    categoria: "carpas",
    precio: 750000,
    unidad: "evento",
    stock: 4,
    imagen: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    descripcion: "Gran carpa estructural con capacidad para 120-150 personas sentadas. Ideal para jardines y fincas."
  },
  {
    id: "set-vajilla-cristaleria",
    nombre: "Set de Menaje & Cristalería de Lujo",
    categoria: "menaje",
    precio: 5500,
    unidad: "puesto/evento",
    stock: 300,
    imagen: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
    descripcion: "Plato base dorado/plata, plato principal de porcelana, cubiertos de lujo, copa de vino y copa de agua."
  },
  {
    id: "letras-gigantes-xv-love",
    nombre: "Letras Gigantes Iluminadas 'MIS 15' o 'LOVE'",
    categoria: "decoracion",
    precio: 220000,
    unidad: "evento",
    stock: 4,
    imagen: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
    descripcion: "Letras gigantes de 1.20m de altura con focos cálidos tipo feria vintage. Punto fotográfico obligado."
  },
  {
    id: "pista-baile-led",
    nombre: "Pista de Baile LED Iluminada",
    categoria: "sonido_luces",
    precio: 600000,
    unidad: "evento",
    stock: 2,
    imagen: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    descripcion: "Módulos de piso de cristal templado con efectos interactivos y colores personalizables para el vals y fiesta."
  }
];

export const VENUES_INFO = [
  {
    id: "sede-marinilla",
    nombre: "Salón de Gala Banquetes Almar (Marinilla)",
    tipo: "Salón Urbano & Recepciones",
    ubicacion: "Calle 29 n° 28-25, Marinilla, Antioquia",
    capacidad: "Hasta 200 personas",
    caracteristicas: [
      "Espacio climatizado y acústica profesional",
      "Acceso universal y baños adaptados",
      "Cocina industrial de alta capacidad",
      "Zona de bar y tarima para orquesta / DJ",
      "Céntrico y de fácil llegada para invitados"
    ],
    imagen: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: "sede-el-penol",
    nombre: "Finca Campestre Almar (El Peñol)",
    tipo: "Finca de Eventos & Paisaje Natural",
    ubicacion: "Sector Campestre, El Peñol, Antioquia (Cerca a la Represa)",
    capacidad: "Hasta 250 personas en áreas verdes",
    caracteristicas: [
      "Jardines para ceremonias al aire libre y atardeceres",
      "Quiosco campestre estructural con iluminación cálida",
      "Zona lounge con fogata (Fire pit) nocturna",
      "Espacio para carpas estructurales y pista de baile",
      "Entorno natural privado ideal para bodas campestres"
    ],
    imagen: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=80"
  }
];

export const BUSINESS_INFO = {
  nombre: "Banquetes Almar",
  slogan: "Salón de Gala en Marinilla & Finca Campestre en El Peñol",
  direccionPrincipal: "Calle 29 n° 28-25, Marinilla, Antioquia",
  sedeCampestre: "El Peñol, Antioquia (Sector Represa)",
  telefonoPrincipal: "+57 314 8849011",
  telefonoFijo: "(604) 548 5352",
  whatsapp: "573148849011",
  email: "banquetes-almar@hotmail.com",
  cobertura: ["Marinilla", "El Peñol", "Guatapé", "Rionegro", "Guarne", "El Carmen de Viboral", "El Retiro", "La Ceja", "El Santuario"],
  sedes: ["Salón Marinilla", "Finca Campestre El Peñol"]
};
