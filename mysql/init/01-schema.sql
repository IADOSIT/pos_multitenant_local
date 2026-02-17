-- ============================================
-- POS-iaDoS - Schema Completo
-- iaDoS - iados.mx
-- ============================================

CREATE DATABASE IF NOT EXISTS pos_iados
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pos_iados;

-- Tenants (Corporativos)
CREATE TABLE IF NOT EXISTS tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  razon_social VARCHAR(200),
  rfc VARCHAR(20),
  direccion VARCHAR(200),
  telefono VARCHAR(20),
  email VARCHAR(100),
  logo_url VARCHAR(500),
  activo TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Empresas
CREATE TABLE IF NOT EXISTS empresas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  razon_social VARCHAR(200),
  rfc VARCHAR(20),
  direccion VARCHAR(200),
  telefono VARCHAR(20),
  email VARCHAR(100),
  logo_url VARCHAR(500),
  activo TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  CONSTRAINT fk_empresas_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tiendas
CREATE TABLE IF NOT EXISTS tiendas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(200),
  telefono VARCHAR(20),
  email VARCHAR(100),
  zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',
  config_ticket JSON,
  config_impresora JSON,
  activo TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_empresa (tenant_id, empresa_id),
  CONSTRAINT fk_tiendas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT,
  empresa_id INT,
  tienda_id INT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('superadmin','admin','manager','cajero','mesero') DEFAULT 'cajero',
  pin VARCHAR(20),
  activo TINYINT(1) DEFAULT 1,
  ultimo_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_empresa (tenant_id, empresa_id),
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Categorias
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(500),
  imagen_url VARCHAR(500),
  color VARCHAR(20) DEFAULT '#3b82f6',
  icono VARCHAR(50),
  orden INT DEFAULT 0,
  activo TINYINT(1) DEFAULT 1,
  es_seccion_especial TINYINT(1) DEFAULT 0,
  tipo_seccion VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_empresa (tenant_id, empresa_id)
) ENGINE=InnoDB;

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  sku VARCHAR(50) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion VARCHAR(500),
  precio DECIMAL(10,2) NOT NULL,
  costo DECIMAL(10,2),
  categoria_id INT,
  imagen_url VARCHAR(500),
  codigo_barras VARCHAR(50),
  unidad VARCHAR(20) DEFAULT 'pza',
  impuesto_pct DECIMAL(5,2) DEFAULT 0.00,
  disponible TINYINT(1) DEFAULT 1,
  activo TINYINT(1) DEFAULT 1,
  controla_stock TINYINT(1) DEFAULT 0,
  stock_actual DECIMAL(10,2) DEFAULT 0.00,
  stock_minimo DECIMAL(10,2),
  orden INT DEFAULT 0,
  modificadores JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_empresa (tenant_id, empresa_id),
  INDEX idx_sku_tenant (sku, tenant_id, empresa_id),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Producto por tienda (precio/stock local)
CREATE TABLE IF NOT EXISTS producto_tienda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  tienda_id INT NOT NULL,
  producto_id INT NOT NULL,
  precio_local DECIMAL(10,2),
  disponible TINYINT(1) DEFAULT 1,
  stock DECIMAL(10,2) DEFAULT 0.00,
  INDEX idx_scope (tenant_id, tienda_id, producto_id),
  CONSTRAINT fk_pt_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Cajas
CREATE TABLE IF NOT EXISTS cajas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  tienda_id INT NOT NULL,
  usuario_id INT NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  estado ENUM('abierta','cerrada') DEFAULT 'cerrada',
  fondo_apertura DECIMAL(10,2) DEFAULT 0.00,
  total_ventas DECIMAL(10,2) DEFAULT 0.00,
  total_entradas DECIMAL(10,2) DEFAULT 0.00,
  total_salidas DECIMAL(10,2) DEFAULT 0.00,
  total_esperado DECIMAL(10,2),
  total_real DECIMAL(10,2),
  diferencia DECIMAL(10,2),
  fecha_apertura DATETIME,
  fecha_cierre DATETIME,
  notas_cierre VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_tienda (tenant_id, tienda_id)
) ENGINE=InnoDB;

-- Movimientos de caja
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id INT AUTO_INCREMENT PRIMARY KEY,
  caja_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo ENUM('entrada','salida') NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  concepto VARCHAR(200) NOT NULL,
  notas VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_caja (caja_id),
  CONSTRAINT fk_mov_caja FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Ventas
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  tienda_id INT NOT NULL,
  caja_id INT NOT NULL,
  usuario_id INT NOT NULL,
  folio VARCHAR(50) NOT NULL,
  folio_offline VARCHAR(50),
  subtotal DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0.00,
  impuestos DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  metodo_pago ENUM('efectivo','tarjeta','transferencia','mixto') DEFAULT 'efectivo',
  pago_efectivo DECIMAL(10,2),
  pago_tarjeta DECIMAL(10,2),
  pago_transferencia DECIMAL(10,2),
  cambio DECIMAL(10,2) DEFAULT 0.00,
  estado ENUM('completada','cancelada','pendiente') DEFAULT 'completada',
  notas VARCHAR(500),
  cliente_nombre VARCHAR(200),
  sincronizado TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_scope (tenant_id, empresa_id, tienda_id),
  INDEX idx_tenant_fecha (tenant_id, created_at),
  INDEX idx_folio (folio, tenant_id)
) ENGINE=InnoDB;

-- Detalle de ventas
CREATE TABLE IF NOT EXISTS venta_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  producto_nombre VARCHAR(200) NOT NULL,
  producto_sku VARCHAR(50) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0.00,
  impuesto DECIMAL(10,2) DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL,
  modificadores JSON,
  notas VARCHAR(500),
  INDEX idx_venta (venta_id),
  CONSTRAINT fk_detalle_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Pagos de venta
CREATE TABLE IF NOT EXISTS venta_pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  metodo ENUM('efectivo','tarjeta','transferencia','mixto') NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  referencia VARCHAR(100),
  INDEX idx_venta (venta_id),
  CONSTRAINT fk_pago_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Config de tickets
CREATE TABLE IF NOT EXISTS ticket_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT,
  tienda_id INT,
  logo_url VARCHAR(500),
  encabezado_linea1 VARCHAR(200),
  encabezado_linea2 VARCHAR(200),
  encabezado_linea3 VARCHAR(200),
  pie_linea1 VARCHAR(500),
  pie_linea2 VARCHAR(500),
  ancho_papel INT DEFAULT 80,
  columnas INT DEFAULT 42,
  mostrar_logo TINYINT(1) DEFAULT 1,
  mostrar_fecha TINYINT(1) DEFAULT 1,
  mostrar_cajero TINYINT(1) DEFAULT 1,
  mostrar_folio TINYINT(1) DEFAULT 1,
  mostrar_marca_iados TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_scope (tenant_id, empresa_id, tienda_id)
) ENGINE=InnoDB;

-- Auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT,
  tienda_id INT,
  usuario_id INT NOT NULL,
  usuario_nombre VARCHAR(100) NOT NULL,
  accion VARCHAR(50) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id INT,
  datos_anteriores JSON,
  datos_nuevos JSON,
  ip VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_fecha (tenant_id, created_at),
  INDEX idx_entidad (entidad, entidad_id)
) ENGINE=InnoDB;
