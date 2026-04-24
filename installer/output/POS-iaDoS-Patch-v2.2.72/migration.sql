-- POS-iaDoS Migración v2.2.72
-- SEGURA: solo agrega columnas/tablas nuevas, no borra ni modifica datos existentes
-- Fecha: 2026-04-24

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Asegurar tabla devoluciones (viene de v2.2.71; re-declarar con IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `devoluciones` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `tenant_id`      INT           NOT NULL,
  `empresa_id`     INT           NOT NULL,
  `tienda_id`      INT           NOT NULL,
  `venta_id`       INT           NOT NULL,
  `folio`          VARCHAR(50)   NOT NULL,
  `venta_folio`    VARCHAR(50)   NOT NULL,
  `usuario_id`     INT           NOT NULL,
  `usuario_nombre` VARCHAR(200)  NOT NULL,
  `motivo`         VARCHAR(500)  NULL,
  `items`          JSON          NOT NULL,
  `monto_total`    DECIMAL(10,2) NOT NULL,
  `created_at`     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `IDX_dev_tenant` (`tenant_id`, `empresa_id`, `tienda_id`),
  INDEX `IDX_dev_venta`  (`venta_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Asegurar worker_url en menu_digital_config (viene de v2.2.71)
-- ─────────────────────────────────────────────────────────────────────────────
SET @col1 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_digital_config' AND COLUMN_NAME = 'worker_url'
);
SET @sql1 = IF(@col1 = 0,
  'ALTER TABLE menu_digital_config ADD COLUMN worker_url VARCHAR(500) NULL AFTER plantilla',
  'SELECT ''worker_url ya existe'' AS info'
);
PREPARE s1 FROM @sql1; EXECUTE s1; DEALLOCATE PREPARE s1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Asegurar cloud_url en menu_digital_config (necesario para Worker push v2.2.72)
-- ─────────────────────────────────────────────────────────────────────────────
SET @col2 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_digital_config' AND COLUMN_NAME = 'cloud_url'
);
SET @sql2 = IF(@col2 = 0,
  'ALTER TABLE menu_digital_config ADD COLUMN cloud_url VARCHAR(500) NULL AFTER worker_url',
  'SELECT ''cloud_url ya existe'' AS info'
);
PREPARE s2 FROM @sql2; EXECUTE s2; DEALLOCATE PREPARE s2;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Asegurar self_order en pedidos (para badge QR Mesa)
-- ─────────────────────────────────────────────────────────────────────────────
SET @col3 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'self_order'
);
SET @sql3 = IF(@col3 = 0,
  'ALTER TABLE pedidos ADD COLUMN self_order TINYINT(1) NOT NULL DEFAULT 0 AFTER confirmado_cliente',
  'SELECT ''self_order ya existe'' AS info'
);
PREPARE s3 FROM @sql3; EXECUTE s3; DEALLOCATE PREPARE s3;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Asegurar notas en pedido_detalles (notas por ítem v2.2.56)
-- ─────────────────────────────────────────────────────────────────────────────
SET @col4 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedido_detalles' AND COLUMN_NAME = 'notas'
);
SET @sql4 = IF(@col4 = 0,
  'ALTER TABLE pedido_detalles ADD COLUMN notas VARCHAR(300) NULL',
  'SELECT ''notas ya existe'' AS info'
);
PREPARE s4 FROM @sql4; EXECUTE s4; DEALLOCATE PREPARE s4;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Asegurar notas en venta_detalles
-- ─────────────────────────────────────────────────────────────────────────────
SET @col5 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venta_detalles' AND COLUMN_NAME = 'notas'
);
SET @sql5 = IF(@col5 = 0,
  'ALTER TABLE venta_detalles ADD COLUMN notas VARCHAR(300) NULL',
  'SELECT ''notas venta_detalles ya existe'' AS info'
);
PREPARE s5 FROM @sql5; EXECUTE s5; DEALLOCATE PREPARE s5;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migración v2.2.72 completada OK' AS resultado;
