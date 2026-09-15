-- ==============================================================================
-- BASE DE DATOS OFICIAL: BANQUETES ALMAR
-- Sistema de Gestión de Eventos, Cotizaciones, Menaje, Pagos y Clientes
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS banquetes_almar
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE banquetes_almar;

-- ------------------------------------------------------------------------------
-- 1. TABLA: admins (Usuarios Administradores del Sistema)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Usuario administrador inicial por defecto (clave por defecto: Admin123)
INSERT INTO admins (nombre, email, password, rol)
VALUES ('Administrador Almar', 'admin@almar.com', '$2b$10$89J/BqZ92E7bWpQj5vYt6.wZc7oMvI1M0p0d2h8nF0E9g3r1x2z3a', 'admin')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ------------------------------------------------------------------------------
-- 2. TABLA: clientes (Directorio de Clientes y Anfitriones)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(50) DEFAULT '',
  email VARCHAR(100) DEFAULT '',
  direccion VARCHAR(255) DEFAULT '',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 3. TABLA: eventos (Gestión de Eventos y Calendario)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NULL,
  cliente VARCHAR(150) NOT NULL,
  telefono VARCHAR(50) DEFAULT '',
  tipo_evento VARCHAR(100) NOT NULL,
  fecha_evento DATE NULL,
  lugar VARCHAR(255) DEFAULT '',
  personas INT DEFAULT 0,
  valor_total DECIMAL(12,2) DEFAULT 0.00,
  abono DECIMAL(12,2) DEFAULT 0.00,
  saldo DECIMAL(12,2) DEFAULT 0.00,
  estado VARCHAR(50) DEFAULT 'Pendiente',
  observaciones TEXT,
  imagen VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fecha (fecha_evento),
  INDEX idx_cliente (cliente_id),
  CONSTRAINT fk_eventos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 4. TABLA: pagos (Historial de Abonos y Transacciones Financieras)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NULL,
  reserva_id VARCHAR(100) NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha_pago DATE NULL,
  metodo_pago VARCHAR(50) DEFAULT 'Transferencia',
  concepto VARCHAR(255) DEFAULT 'Abono a evento',
  comprobante VARCHAR(255) NULL,
  notas TEXT,
  estado VARCHAR(50) DEFAULT 'Aprobado',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_evento_pago (evento_id),
  CONSTRAINT fk_pagos_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 5. TABLA: categorias_inventario (Categorías de Mobiliario y Menaje)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias_inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 6. TABLA: inventario (Artículos, Silletería Tiffany, Carpas, Mantelería)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  cantidad_total INT NOT NULL DEFAULT 0,
  cantidad_disponible INT NOT NULL DEFAULT 0,
  precio_unitario DECIMAL(12,2) DEFAULT 0.00,
  descripcion TEXT,
  imagen VARCHAR(255) NULL,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_categoria (categoria_id),
  CONSTRAINT fk_inventario_cat FOREIGN KEY (categoria_id) REFERENCES categorias_inventario(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 7. TABLA: reservas (Reservaciones y Cotizaciones en Firme)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NULL,
  cliente VARCHAR(150) NOT NULL,
  telefono VARCHAR(50) DEFAULT '',
  tipo_evento VARCHAR(100) NOT NULL,
  fecha_evento DATE NULL,
  locacion VARCHAR(255) DEFAULT '',
  personas INT DEFAULT 0,
  valor_total DECIMAL(12,2) DEFAULT 0.00,
  anticipo DECIMAL(12,2) DEFAULT 0.00,
  saldo DECIMAL(12,2) DEFAULT 0.00,
  estado VARCHAR(50) DEFAULT 'Pendiente',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reserva_fecha (fecha_evento),
  CONSTRAINT fk_reservas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 8. TABLA: reserva_detalle (Mobiliario asignado por reserva)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reserva_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reserva_id INT NOT NULL,
  inventario_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reserva (reserva_id),
  INDEX idx_inventario (inventario_id),
  CONSTRAINT fk_detalle_reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_inventario FOREIGN KEY (inventario_id) REFERENCES inventario(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 9. TABLA: cotizaciones (Leads y Solicitudes Entrantes del Cotizador Web)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cotizaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(50) DEFAULT '',
  email VARCHAR(100) DEFAULT '',
  tipo_evento VARCHAR(100) NOT NULL,
  fecha_evento DATE NULL,
  locacion VARCHAR(255) DEFAULT '',
  personas INT DEFAULT 0,
  paquete VARCHAR(100) DEFAULT '',
  total_estimado DECIMAL(12,2) DEFAULT 0.00,
  anticipo_sugerido DECIMAL(12,2) DEFAULT 0.00,
  mensaje TEXT,
  estado VARCHAR(50) DEFAULT 'Nuevo',
  origen VARCHAR(50) DEFAULT 'Web',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cot_fecha (fecha_evento),
  INDEX idx_cot_estado (estado)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 10. TABLA: gallery_categories (Secciones de Portafolio / Catálogo)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 11. TABLA: gallery_items (Fotografías y Montajes de la Galería)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  imagen VARCHAR(255) NOT NULL,
  es_portada TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gallery_cat (categoria_id),
  CONSTRAINT fk_gallery_cat FOREIGN KEY (categoria_id) REFERENCES gallery_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- DATOS SEMILLA BÁSICOS DE INVENTARIO
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO categorias_inventario (nombre) VALUES
  ('Silletería'),
  ('Mesas y Tableros'),
  ('Mantelería y Textiles'),
  ('Carpas y Estructuras'),
  ('Menaje y Vajilla');
