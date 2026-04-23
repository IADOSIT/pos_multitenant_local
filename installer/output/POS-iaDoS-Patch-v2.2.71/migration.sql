-- POS-iaDoS Migración v2.2.71
-- SEGURA: solo agrega columnas/tablas nuevas, no borra ni modifica datos existentes
-- Fecha: 2026-04-23

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Agregar worker_url a menu_digital_config (Menú Digital + Self Order via Cloudflare)
-- ─────────────────────────────────────────────────────────────────────────────
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'menu_digital_config'
    AND COLUMN_NAME  = 'worker_url'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE menu_digital_config ADD COLUMN worker_url VARCHAR(500) NULL AFTER plantilla',
  'SELECT ''worker_url ya existe, omitiendo'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Crear tabla devoluciones (si no existe)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `devoluciones` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `tenant_id`      INT          NOT NULL,
  `empresa_id`     INT          NOT NULL,
  `tienda_id`      INT          NOT NULL,
  `venta_id`       INT          NOT NULL,
  `folio`          VARCHAR(50)  NOT NULL,
  `venta_folio`    VARCHAR(50)  NOT NULL,
  `usuario_id`     INT          NOT NULL,
  `usuario_nombre` VARCHAR(200) NOT NULL,
  `motivo`         VARCHAR(500) NULL,
  `items`          JSON         NOT NULL,
  `monto_total`    DECIMAL(10,2) NOT NULL,
  `created_at`     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `IDX_dev_tenant` (`tenant_id`, `empresa_id`, `tienda_id`),
  INDEX `IDX_dev_venta`  (`venta_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migración v2.2.71 completada OK' AS resultado;
