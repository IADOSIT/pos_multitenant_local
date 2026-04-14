USE pos_iados;

-- Tabla: perfiles_negocio
-- Define qué perfiles están disponibles en el sistema
CREATE TABLE IF NOT EXISTS perfiles_negocio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  config JSON NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tenant_perfiles
-- Qué perfiles tiene activados cada tenant
CREATE TABLE IF NOT EXISTS tenant_perfiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  perfil_clave VARCHAR(50) NOT NULL,
  config_override JSON NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tp_tenant (tenant_id),
  UNIQUE KEY uq_tenant_perfil (tenant_id, perfil_clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Columna modulo en users (nullable, no rompe nada existente)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS modulo VARCHAR(50) NULL DEFAULT NULL COMMENT 'Módulo del perfil asignado al usuario (carbon, hielo, null=todos)';

-- Columna modulo en categorias (nullable)
ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS modulo VARCHAR(50) NULL DEFAULT NULL COMMENT 'Módulo del perfil al que pertenece esta categoría';

-- Columna modulo en productos (nullable)
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS modulo VARCHAR(50) NULL DEFAULT NULL COMMENT 'Módulo del perfil al que pertenece este producto';

-- Seed: perfil carbon_hielo
INSERT IGNORE INTO perfiles_negocio (clave, nombre, descripcion, config) VALUES (
  'carbon_hielo',
  'Carbón + Hielo',
  'Perfil para negocios de venta de carbón y hielo con inventario dual por módulo',
  JSON_OBJECT(
    'modulos', JSON_ARRAY('carbon', 'hielo'),
    'modulos_config', JSON_OBJECT(
      'carbon', JSON_OBJECT('label', 'Carbón', 'color', '#374151', 'icono', 'Flame'),
      'hielo',  JSON_OBJECT('label', 'Hielo',  'color', '#0ea5e9', 'icono', 'Snowflake')
    ),
    'inventario_critico', true,
    'alertas_stock', true,
    'productos_base', JSON_ARRAY(
      JSON_OBJECT('modulo','carbon','sku','CARB-3KG', 'nombre','Carbón Bolsa 3kg',  'unidad','bolsa','precio',0,'costo',0,'controla_stock',true,'stock_minimo',20),
      JSON_OBJECT('modulo','carbon','sku','CARB-2.5KG','nombre','Carbón Bolsa 2.5kg','unidad','bolsa','precio',0,'costo',0,'controla_stock',true,'stock_minimo',20),
      JSON_OBJECT('modulo','carbon','sku','CARB-GRAN','nombre','Carbón Granel kg',  'unidad','kg',   'precio',0,'costo',0,'controla_stock',true,'stock_minimo',50),
      JSON_OBJECT('modulo','hielo', 'sku','HIEL-5KG', 'nombre','Hielo Bolsa 5kg',   'unidad','bolsa','precio',0,'costo',0,'controla_stock',true,'stock_minimo',30),
      JSON_OBJECT('modulo','hielo', 'sku','HIEL-20KG','nombre','Hielo Bolsa 20kg',  'unidad','bolsa','precio',0,'costo',0,'controla_stock',true,'stock_minimo',10),
      JSON_OBJECT('modulo','hielo', 'sku','HIEL-BARR','nombre','Hielo Barra',       'unidad','pieza','precio',0,'costo',0,'controla_stock',true,'stock_minimo',5)
    )
  )
);
