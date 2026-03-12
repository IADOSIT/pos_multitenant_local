-- ============================================================
-- POS-iaDoS: Crear todas las tablas
-- Ejecutar despues de 01_crear_bd_y_usuario.sql
-- ============================================================

USE pos_iados;

-- ============================================================
-- 1. TENANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  razon_social VARCHAR(200) NULL,
  rfc VARCHAR(20) NULL,
  direccion VARCHAR(200) NULL,
  telefono VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  logo_url VARCHAR(500) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. EMPRESAS
-- ============================================================
CREATE TABLE IF NOT EXISTS empresas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  razon_social VARCHAR(200) NULL,
  rfc VARCHAR(20) NULL,
  direccion VARCHAR(200) NULL,
  telefono VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  logo_url VARCHAR(500) NULL,
  config_apariencia JSON NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_empresas_tenant (tenant_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TIENDAS
-- ============================================================
CREATE TABLE IF NOT EXISTS tiendas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(200) NULL,
  telefono VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  zona_horaria VARCHAR(50) NULL,
  config_ticket JSON NULL,
  config_impresora JSON NULL,
  config_pos JSON NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tiendas_tenant_empresa (tenant_id, empresa_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NULL,
  empresa_id INT NULL,
  tienda_id INT NULL,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('superadmin','admin','manager','cajero','mesero') NOT NULL DEFAULT 'cajero',
  pin VARCHAR(20) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_tenant_empresa (tenant_id, empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. CATEGORIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(500) NULL,
  imagen_url TEXT NULL,
  color VARCHAR(20) NULL,
  icono VARCHAR(50) NULL,
  orden INT NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  es_seccion_especial TINYINT(1) NOT NULL DEFAULT 0,
  tipo_seccion VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categorias_tenant_empresa (tenant_id, empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  sku VARCHAR(50) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion VARCHAR(500) NULL,
  precio DECIMAL(10,2) NOT NULL,
  costo DECIMAL(10,2) NULL,
  categoria_id INT NULL,
  imagen_url TEXT NULL,
  codigo_barras VARCHAR(50) NULL,
  unidad VARCHAR(20) NULL,
  impuesto_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  disponible TINYINT(1) NOT NULL DEFAULT 1,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  controla_stock TINYINT(1) NOT NULL DEFAULT 0,
  stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_minimo DECIMAL(10,2) NULL,
  orden INT NOT NULL DEFAULT 0,
  modificadores JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_productos_tenant_empresa (tenant_id, empresa_id),
  INDEX idx_productos_sku (sku, tenant_id, empresa_id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. PRODUCTO_TIENDA
-- ============================================================
CREATE TABLE IF NOT EXISTS producto_tienda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  tienda_id INT NOT NULL,
  producto_id INT NOT NULL,
  precio_local DECIMAL(10,2) NULL,
  disponible TINYINT(1) NOT NULL DEFAULT 1,
  stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  INDEX idx_pt_tenant_tienda_prod (tenant_id, tienda_id, producto_id),
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. MOVIMIENTOS_INVENTARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  tienda_id INT NOT NULL,
  producto_id INT NOT NULL,
  producto_nombre VARCHAR(200) NOT NULL,
  producto_sku VARCHAR(50) NOT NULL,
  tipo ENUM('entrada','salida','ajuste','devolucion') NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  stock_anterior DECIMAL(10,2) NOT NULL,
  stock_nuevo DECIMAL(10,2) NOT NULL,
  concepto VARCHAR(500) NULL,
  usuario_id INT NOT NULL,
  usuario_nombre VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mov_inv_tenant (tenant_id, empresa_id, tienda_id),
  INDEX idx_mov_inv_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. MATERIA_PRIMA
-- ============================================================
CREATE TABLE IF NOT EXISTS materia_prima (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  tienda_id INT NULL,
  sku VARCHAR(50) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion VARCHAR(500) NULL,
  categoria VARCHAR(100) NULL,
  unidad VARCHAR(20) NOT NULL DEFAULT 'pza',
  costo DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
  proveedor VARCHAR(200) NULL,
  notas VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mp_tenant_empresa (tenant_id, empresa_id),
  INDEX idx_mp_sku (sku, tenant_id, empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. CAJAS
-- ============================================================
CREATE TABLE IF NOT EXISTS cajas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  tienda_id INT NOT NULL,
  usuario_id INT NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  estado ENUM('abierta','cerrada') NOT NULL DEFAULT 'cerrada',
  fondo_apertura DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_ventas DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_entradas DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_salidas DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_esperado DECIMAL(10,2) NULL,
  total_real DECIMAL(10,2) NULL,
  diferencia DECIMAL(10,2) NULL,
  fecha_apertura DATETIME NULL,
  fecha_cierre DATETIME NULL,
  notas_cierre VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cajas_tenant_tienda (tenant_id, tienda_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. MOVIMIENTOS_CAJA
-- ============================================================
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id INT AUTO_INCREMENT PRIMARY KEY,
  caja_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo ENUM('entrada','salida') NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  concepto VARCHAR(200) NOT NULL,
  notas VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mov_caja (caja_id),
  FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. VENTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  tienda_id INT NOT NULL,
  caja_id INT NOT NULL,
  usuario_id INT NOT NULL,
  pedido_id INT NULL,
  folio VARCHAR(50) NOT NULL,
  folio_offline VARCHAR(50) NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  impuestos DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  metodo_pago ENUM('efectivo','tarjeta','transferencia','mixto') NOT NULL DEFAULT 'efectivo',
  pago_efectivo DECIMAL(10,2) NULL,
  pago_tarjeta DECIMAL(10,2) NULL,
  pago_transferencia DECIMAL(10,2) NULL,
  cambio DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado ENUM('completada','cancelada','pendiente') NOT NULL DEFAULT 'completada',
  notas VARCHAR(500) NULL,
  cliente_nombre VARCHAR(200) NULL,
  sincronizado TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ventas_tenant (tenant_id, empresa_id, tienda_id),
  INDEX idx_ventas_fecha (tenant_id, created_at),
  INDEX idx_ventas_folio (folio, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. VENTA_DETALLES
-- ============================================================
CREATE TABLE IF NOT EXISTS venta_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  producto_nombre VARCHAR(200) NOT NULL,
  producto_sku VARCHAR(50) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  impuesto DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  modificadores JSON NULL,
  notas VARCHAR(500) NULL,
  INDEX idx_vd_venta (venta_id),
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. VENTA_PAGOS
-- ============================================================
CREATE TABLE IF NOT EXISTS venta_pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  metodo ENUM('efectivo','tarjeta','transferencia','mixto') NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  referencia VARCHAR(100) NULL,
  INDEX idx_vp_venta (venta_id),
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. PEDIDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  tienda_id INT NOT NULL,
  usuario_id INT NOT NULL,
  folio VARCHAR(50) NOT NULL,
  mesa INT NOT NULL,
  estado ENUM('recibido','en_elaboracion','listo_para_entrega','entregado','cancelado') NOT NULL DEFAULT 'recibido',
  subtotal DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  impuestos DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  notas VARCHAR(500) NULL,
  cliente_nombre VARCHAR(200) NULL,
  venta_id INT NULL,
  usuario_nombre VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pedidos_tenant (tenant_id, empresa_id, tienda_id),
  INDEX idx_pedidos_estado (tienda_id, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. PEDIDO_DETALLES
-- ============================================================
CREATE TABLE IF NOT EXISTS pedido_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  producto_nombre VARCHAR(200) NOT NULL,
  producto_sku VARCHAR(50) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  impuesto DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  modificadores JSON NULL,
  notas VARCHAR(500) NULL,
  INDEX idx_pd_pedido (pedido_id),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. TICKET_CONFIGS
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NULL,
  tienda_id INT NULL,
  logo_url TEXT NULL,
  encabezado_linea1 VARCHAR(200) NULL,
  encabezado_linea2 VARCHAR(200) NULL,
  encabezado_linea3 VARCHAR(200) NULL,
  pie_linea1 VARCHAR(500) NULL,
  pie_linea2 VARCHAR(500) NULL,
  ancho_papel INT NOT NULL DEFAULT 80,
  columnas INT NOT NULL DEFAULT 42,
  mostrar_logo TINYINT(1) NOT NULL DEFAULT 1,
  mostrar_fecha TINYINT(1) NOT NULL DEFAULT 1,
  mostrar_cajero TINYINT(1) NOT NULL DEFAULT 1,
  mostrar_folio TINYINT(1) NOT NULL DEFAULT 1,
  mostrar_marca_iados TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tc_tenant (tenant_id, empresa_id, tienda_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NULL,
  tienda_id INT NULL,
  usuario_id INT NOT NULL,
  usuario_nombre VARCHAR(100) NOT NULL,
  accion VARCHAR(50) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id INT NULL,
  datos_anteriores JSON NULL,
  datos_nuevos JSON NULL,
  ip VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_tenant (tenant_id, created_at),
  INDEX idx_audit_entidad (entidad, entidad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. LICENCIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS licencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  codigo_instalacion VARCHAR(255) NOT NULL UNIQUE,
  codigo_activacion TEXT NULL,
  plan VARCHAR(255) NOT NULL DEFAULT 'basico',
  features JSON NULL,
  max_tiendas INT NOT NULL DEFAULT 1,
  max_usuarios INT NOT NULL DEFAULT 3,
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  grace_days INT NOT NULL DEFAULT 15,
  offline_allowed TINYINT(1) NOT NULL DEFAULT 1,
  estado VARCHAR(255) NOT NULL DEFAULT 'trial',
  activated_at TIMESTAMP NULL,
  last_heartbeat TIMESTAMP NULL,
  notas TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
