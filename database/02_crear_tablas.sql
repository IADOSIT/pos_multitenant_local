-- ============================================================
-- POS-iaDoS: Crear todas las tablas
-- Ejecutar despues de 01_crear_bd_y_usuario.sql
-- IMPORTANTE: orden de columnas sincronizado con VPS mysqldump
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
-- NOTA: config_apariencia al final (TypeORM lo agregó via ALTER TABLE)
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
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  config_apariencia JSON NULL,
  INDEX idx_empresas_tenant (tenant_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TIENDAS
-- NOTA: config_pos, slug, folio_*_counter al final (TypeORM los agregó via ALTER TABLE)
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
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  config_pos JSON NULL,
  slug VARCHAR(100) NULL,
  folio_pedido_counter INT NOT NULL DEFAULT 0,
  folio_venta_counter INT NOT NULL DEFAULT 0,
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
-- NOTA: imagen_url al final (TypeORM lo agregó via ALTER TABLE)
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(500) NULL,
  color VARCHAR(20) NULL,
  icono VARCHAR(50) NULL,
  orden INT NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  es_seccion_especial TINYINT(1) NOT NULL DEFAULT 0,
  tipo_seccion VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  imagen_url TEXT NULL,
  INDEX idx_categorias_tenant_empresa (tenant_id, empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. PRODUCTOS
-- NOTA: imagen_url al final; codigo_barras antes de unidad (orden VPS)
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
  imagen_url TEXT NULL,
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
-- NOTA: orden exacto del VPS (logo_url y cols comanda al final via ALTER TABLE)
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NULL,
  tienda_id INT NULL,
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
  logo_url TEXT NULL,
  fuente_familia VARCHAR(50) NULL DEFAULT 'Consolas',
  fuente_tamano INT NOT NULL DEFAULT 11,
  logo_posicion VARCHAR(20) NULL DEFAULT 'centro',
  copias INT NOT NULL DEFAULT 1,
  comanda_enabled TINYINT(1) NOT NULL DEFAULT 0,
  comanda_header VARCHAR(100) NULL DEFAULT 'ORDEN',
  comanda_ancho INT NOT NULL DEFAULT 80,
  comanda_auto_print TINYINT(1) NOT NULL DEFAULT 0,
  comanda_mostrar_precio TINYINT(1) NOT NULL DEFAULT 1,
  comanda_copias INT NOT NULL DEFAULT 1,
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
-- 19. MESAS
-- ============================================================
CREATE TABLE IF NOT EXISTS mesas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  tienda_id INT NOT NULL,
  numero INT NOT NULL,
  nombre VARCHAR(100) NULL,
  zona VARCHAR(100) NULL,
  capacidad INT NOT NULL DEFAULT 4,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_mesas_tienda (tienda_id, tenant_id),
  UNIQUE KEY uq_mesas_tienda_numero (tienda_id, numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. LICENCIAS
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

-- ============================================================
-- 21. GATEWAY_CONFIGS (TypeORM — pasarelas de pago)
-- ============================================================
CREATE TABLE IF NOT EXISTS gateway_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tienda_id INT NOT NULL,
  mp_access_token VARCHAR(500) NULL,
  mp_public_key VARCHAR(500) NULL,
  mp_user_id VARCHAR(100) NULL,
  mp_point_device_id VARCHAR(200) NULL,
  stripe_secret_key VARCHAR(500) NULL,
  stripe_publishable_key VARCHAR(500) NULL,
  stripe_webhook_secret VARCHAR(200) NULL,
  opciones JSON NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY IDX_gateway_tienda (tienda_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. BACKUP_CONFIGS (TypeORM — configuracion de backups)
-- ============================================================
CREATE TABLE IF NOT EXISTS backup_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auto_backup_enabled TINYINT(1) NOT NULL DEFAULT 1,
  auto_backup_hora VARCHAR(5) NOT NULL DEFAULT '02:00',
  retencion_dias INT NOT NULL DEFAULT 7,
  incluir_db TINYINT(1) NOT NULL DEFAULT 1,
  incluir_excel TINYINT(1) NOT NULL DEFAULT 1,
  onedrive_enabled TINYINT(1) NOT NULL DEFAULT 0,
  onedrive_carpeta VARCHAR(500) NULL,
  ultimo_backup_at DATETIME NULL,
  ultimo_backup_estado VARCHAR(20) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. MENU_DIGITAL_CONFIG (TypeORM)
-- NOTA: plantilla al final (TypeORM la agregó via ALTER TABLE)
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_digital_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  tienda_id INT NOT NULL,
  slug VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  modo_menu VARCHAR(20) NOT NULL DEFAULT 'consulta',
  sync_mode VARCHAR(20) NOT NULL DEFAULT 'manual',
  sync_interval INT NOT NULL DEFAULT 30,
  cloud_url VARCHAR(500) NULL,
  api_key VARCHAR(100) NULL,
  last_published_at DATETIME NULL,
  last_publish_status VARCHAR(20) NULL,
  last_publish_error TEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  plantilla VARCHAR(20) NOT NULL DEFAULT 'oscuro',
  worker_url VARCHAR(500) NULL,
  INDEX IDX_mdc_tenant_empresa (tenant_id, empresa_id),
  UNIQUE KEY UQ_mdc_tienda (tienda_id),
  UNIQUE KEY UQ_mdc_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 24. MENU_DIGITAL_SNAPSHOT (TypeORM)
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_digital_snapshot (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  tienda_id INT NOT NULL,
  modo_menu VARCHAR(20) NOT NULL DEFAULT 'consulta',
  plantilla VARCHAR(20) NOT NULL DEFAULT 'oscuro',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  tienda_json LONGTEXT NULL,
  categorias_json LONGTEXT NULL,
  productos_json LONGTEXT NULL,
  published_at DATETIME NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY UQ_mds_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 25. MENU_DIGITAL_LOG (TypeORM)
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_digital_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tienda_id INT NOT NULL,
  tenant_id INT NOT NULL,
  productos_count INT NOT NULL DEFAULT 0,
  images_uploaded INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  error_message TEXT NULL,
  duration_ms INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_mdl_tienda (tienda_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 26. MESA_ASIGNACIONES (TypeORM)
-- ============================================================
CREATE TABLE IF NOT EXISTS mesa_asignaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mesa_id INT NOT NULL,
  tienda_id INT NOT NULL,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  user_id INT NOT NULL,
  user_nombre VARCHAR(200) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_masa_tienda (tienda_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 27. MESAS_JUNTAS (TypeORM)
-- ============================================================
CREATE TABLE IF NOT EXISTS mesas_juntas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mesa_principal_id INT NOT NULL,
  mesa_secundaria_id INT NOT NULL,
  tienda_id INT NOT NULL,
  tenant_id INT NOT NULL,
  empresa_id INT NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_mj_tienda (tienda_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
