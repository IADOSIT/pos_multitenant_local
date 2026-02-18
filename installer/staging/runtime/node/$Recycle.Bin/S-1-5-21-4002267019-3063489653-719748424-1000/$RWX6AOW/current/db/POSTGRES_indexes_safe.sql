-- Run AFTER migrations
DO $$
BEGIN
  IF to_regclass('public.ordenes') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_ordenes_empresa_created_status') THEN
      EXECUTE 'CREATE INDEX idx_ordenes_empresa_created_status ON ordenes (empresa_id, created_at, status)';
    END IF;
  END IF;

  IF to_regclass('public.orden_pagos') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_orden_pagos_empresa_created') THEN
      EXECUTE 'CREATE INDEX idx_orden_pagos_empresa_created ON orden_pagos (empresa_id, created_at)';
    END IF;
  END IF;

  IF to_regclass('public.caja_movimientos') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_caja_movimientos_empresa_created') THEN
      EXECUTE 'CREATE INDEX idx_caja_movimientos_empresa_created ON caja_movimientos (empresa_id, created_at)';
    END IF;
  END IF;

  IF to_regclass('public.whatsapp_logs') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_whatsapp_logs_empresa_created') THEN
      EXECUTE 'CREATE INDEX idx_whatsapp_logs_empresa_created ON whatsapp_logs (empresa_id, created_at)';
    END IF;
  END IF;

  IF to_regclass('public.inventario_movimientos') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_inventario_mov_empresa_prod_created') THEN
      EXECUTE 'CREATE INDEX idx_inventario_mov_empresa_prod_created ON inventario_movimientos (empresa_id, producto_id, created_at)';
    END IF;
  END IF;
END $$;
