-- HOTFIX: Agregar tienda_id=1 y caja para tenant demo
-- Ejecutar en máquina con EXE instalado via Mantenimiento → Restaurar BD → Importar archivo
SET FOREIGN_KEY_CHECKS=0;

-- Tienda demo (tenant 1 / empresa 1)
INSERT IGNORE INTO `tiendas` VALUES (
  1, 1, 1, 'Demo iaDoS', NULL, NULL, NULL,
  'America/Mexico_City', NULL, NULL, 1,
  '2026-02-17 07:49:37.000000', '2026-02-17 07:49:37.000000',
  '{"iva_enabled":false,"iva_incluido":true,"iva_porcentaje":16,"modo_servicio":"mostrador","num_mesas":0,"self_order_enabled":false}',
  'demo-iados-1', 0, 0
);

-- Tienda 2 (también tenant 1, por si usuarios tienen tienda_id=2)
INSERT IGNORE INTO `tiendas` VALUES (
  2, 1, 1, 'Sucursal 2 Demo', NULL, NULL, NULL,
  'America/Mexico_City', NULL, NULL, 1,
  '2026-02-17 07:49:37.000000', '2026-02-17 07:49:37.000000',
  '{"iva_enabled":false,"iva_incluido":true,"iva_porcentaje":16,"modo_servicio":"mostrador","num_mesas":0,"self_order_enabled":false}',
  'demo-iados-2', 0, 0
);

-- Caja principal para tienda 1
INSERT IGNORE INTO `cajas` VALUES (
  1, 1, 1, 1, 1, 'Caja Principal', 'cerrada',
  0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '2026-02-17 07:49:37.000000', '2026-02-17 07:49:37.000000'
);

-- Licencia para tenant 1
INSERT IGNORE INTO `licencias` VALUES (1,1,'INS-E7B5A92B',NULL,'pro','["pos","caja","pedidos","reportes","dashboard"]',10,50,'2026-02-18','2027-12-31',30,1,'activa',NULL,NULL,NULL,'2026-02-18 00:17:57.000000','2026-03-11 19:28:08.226256');

SET FOREIGN_KEY_CHECKS=1;
