-- iados-EMC PostgreSQL scripts (manual)
-- Ejecuta en la BD (psql o herramienta) con el usuario apropiado.

-- 1) Índices recomendados (si no existen)
DO $$
BEGIN
  -- ordenes(empresa_id, created_at, status)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ordenes_empresa_created_status'
  ) THEN
    EXECUTE 'CREATE INDEX idx_ordenes_empresa_created_status ON ordenes (empresa_id, created_at, status)';
  END IF;

  -- orden_pagos(empresa_id, created_at)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orden_pagos_empresa_created'
  ) THEN
    EXECUTE 'CREATE INDEX idx_orden_pagos_empresa_created ON orden_pagos (empresa_id, created_at)';
  END IF;

  -- caja_movimientos(empresa_id, created_at)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_caja_movimientos_empresa_created'
  ) THEN
    EXECUTE 'CREATE INDEX idx_caja_movimientos_empresa_created ON caja_movimientos (empresa_id, created_at)';
  END IF;

  -- whatsapp_logs(empresa_id, created_at)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whatsapp_logs_empresa_created'
  ) THEN
    EXECUTE 'CREATE INDEX idx_whatsapp_logs_empresa_created ON whatsapp_logs (empresa_id, created_at)';
  END IF;

  -- inventario_movimientos(empresa_id, producto_id, created_at)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='inventario_movimientos') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inventario_mov_empresa_prod_created'
    ) THEN
      EXECUTE 'CREATE INDEX idx_inventario_mov_empresa_prod_created ON inventario_movimientos (empresa_id, producto_id, created_at)';
    END IF;
  END IF;
END $$;

-- 2) Verificaciones útiles
-- (a) ¿Existe columna usuarios.whatsapp?
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='usuarios' AND column_name='whatsapp'
) AS usuarios_tiene_whatsapp;

-- (b) ¿empresa_usuario requiere rol_id?
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='empresa_usuario' AND column_name='rol_id'
) AS pivote_tiene_rol_id;

-- (c) ¿whatsapp_logs tiene skipped_reason?
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='whatsapp_logs' AND column_name='skipped_reason'
) AS whatsapp_logs_tiene_skipped_reason;
