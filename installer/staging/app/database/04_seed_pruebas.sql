-- ============================================================
-- POS-iaDoS v2.0.1: Seeds de PRUEBA (datos demo)
-- Restaurante: Mariscos La Flota
-- Ejecutar DESPUES de que el backend haya arrancado al menos 1 vez
-- (para que TypeORM haya creado todas las tablas)
--
-- En equipo aislado (C:\POS-iaDoS):
--   mariadb\bin\mysql.exe -u pos_iados -ppos_iados_2024 pos_iados < 04_seed_pruebas.sql
-- ============================================================

USE pos_iados;

-- ============================================================
-- EMPRESA: nombre del negocio demo
-- ============================================================
UPDATE empresas SET
  nombre        = 'Mariscos La Flota',
  razon_social  = 'Mariscos La Flota SA de CV'
WHERE id = 1 AND tenant_id = 1;

-- ============================================================
-- TIENDA: escenario restaurante de mariscos
-- ============================================================
UPDATE tiendas SET
  nombre     = 'Mariscos La Flota',
  direccion  = 'Av. del Mar #456, Col. Centro',
  config_pos = '{"modo_servicio":"mesas","tipo_cobro_mesa":"post_pago","num_mesas":12,"iva_enabled":false,"iva_porcentaje":16,"iva_incluido":true}'
WHERE id = 1 AND tenant_id = 1;

-- ============================================================
-- CATEGORIAS (INSERT IGNORE = seguro si ya existen)
-- ============================================================
-- Desactivar categorias genericas del seed base
UPDATE categorias SET activo = 0 WHERE id IN (1, 2, 3) AND tenant_id = 1;

INSERT IGNORE INTO categorias (id, tenant_id, empresa_id, nombre, color, orden) VALUES
(10, 1, 1, 'Entradas',            '#10b981', 1),
(11, 1, 1, 'Mariscos',            '#0ea5e9', 2),
(12, 1, 1, 'Carnes y Aves',       '#ef4444', 3),
(13, 1, 1, 'Bebidas Sin Alcohol', '#8b5cf6', 4),
(14, 1, 1, 'Bebidas Con Alcohol', '#f59e0b', 5),
(15, 1, 1, 'Postres',             '#ec4899', 6);

-- ============================================================
-- PRODUCTOS (INSERT IGNORE = seguro si ya existen)
-- ============================================================
INSERT IGNORE INTO productos (id, tenant_id, empresa_id, tienda_id, categoria_id, nombre, descripcion, precio, activo, disponible, orden) VALUES
-- Entradas
(100, 1, 1, 1, 10, 'Ceviche de Camarón',  'Camarón fresco marinado en limón con chile y cebolla', 95.00,  1, 1, 1),
(101, 1, 1, 1, 10, 'Aguachile Verde',      'Camarón crudo en salsa de chile serrano y limón',       110.00, 1, 1, 2),
(102, 1, 1, 1, 10, 'Tostadas de Atún',    '3 tostadas con atún fresco, aguacate y sriracha',        85.00,  1, 1, 3),
(103, 1, 1, 1, 10, 'Sopa de Lima',         'Sopa tradicional yucateca con pollo y tortilla',         75.00,  1, 1, 4),

-- Mariscos
(110, 1, 1, 1, 11, 'Camarones al Mojo',   'Camarones jumbo salteados con ajo, mantequilla y limón', 185.00, 1, 1, 1),
(111, 1, 1, 1, 11, 'Filete de Pescado',   'Filete al gusto: empanizado, asado o a la veracruzana',  160.00, 1, 1, 2),
(112, 1, 1, 1, 11, 'Pulpo a la Gallega',  'Pulpo cocido con paprika, aceite de oliva y sal de mar',  220.00, 1, 1, 3),
(113, 1, 1, 1, 11, 'Camarones Diabla',    'Camarones en salsa roja picante estilo Sinaloa',          195.00, 1, 1, 4),
(114, 1, 1, 1, 11, 'Coctel de Mariscos',  'Mix de camarón, pulpo y pepino en salsa coctel',          145.00, 1, 1, 5),
(115, 1, 1, 1, 11, 'Ostiones al Gratín', '6 ostiones con queso fundido y pimientos',                165.00, 1, 1, 6),

-- Carnes y Aves
(120, 1, 1, 1, 12, 'Arrachera 300g',      'Arrachera marinada a las brasas con guacamole',           210.00, 1, 1, 1),
(121, 1, 1, 1, 12, 'Pollo a la Plancha',  'Pechuga de pollo con hierbas y verduras al vapor',        140.00, 1, 1, 2),
(122, 1, 1, 1, 12, 'Costillas BBQ',       'Costillas de cerdo con salsa barbecue ahumada',            225.00, 1, 1, 3),

-- Bebidas Sin Alcohol
(130, 1, 1, 1, 13, 'Agua Fresca',         'Del día: jamaica, horchata o tamarindo',                   35.00, 1, 1, 1),
(131, 1, 1, 1, 13, 'Refresco',            'Coca-Cola, Sprite o Fanta',                                30.00, 1, 1, 2),
(132, 1, 1, 1, 13, 'Limonada Natural',    'Limonada fresca con o sin chile',                          45.00, 1, 1, 3),
(133, 1, 1, 1, 13, 'Jugo de Naranja',     'Jugo natural exprimido al momento',                        50.00, 1, 1, 4),
(134, 1, 1, 1, 13, 'Agua Mineral',        'Agua mineral 600ml',                                       25.00, 1, 1, 5),

-- Bebidas Con Alcohol
(140, 1, 1, 1, 14, 'Chelada',             'Cerveza con limón, sal y chamoy',                          65.00, 1, 1, 1),
(141, 1, 1, 1, 14, 'Michelada',           'Cerveza con clamato, limón y salsas',                      75.00, 1, 1, 2),
(142, 1, 1, 1, 14, 'Margarita',           'Tequila, triple sec y limón. Sal o sin sal',               95.00, 1, 1, 3),
(143, 1, 1, 1, 14, 'Piña Colada',         'Ron, crema de coco y piña',                                90.00, 1, 1, 4),
(144, 1, 1, 1, 14, 'Cerveza Importada',   'Corona, Modelo Especial o XX Lager',                       60.00, 1, 1, 5),

-- Postres
(150, 1, 1, 1, 15, 'Flan Napolitano',     'Flan casero de vainilla con cajeta',                       65.00, 1, 1, 1),
(151, 1, 1, 1, 15, 'Helado 2 Bolas',      'Helado artesanal: vainilla, chocolate o fresa',            55.00, 1, 1, 2),
(152, 1, 1, 1, 15, 'Pay de Queso',        'Pay de queso crema con frutos rojos',                      70.00, 1, 1, 3);

-- ============================================================
-- MENU DIGITAL CONFIG (tabla: menu_digital_config sin 's')
-- Columnas segun entidad v2.0.1
-- ============================================================
INSERT IGNORE INTO menu_digital_config
  (tenant_id, empresa_id, tienda_id, slug, is_active, modo_menu, sync_mode, sync_interval, cloud_url, api_key, plantilla)
VALUES
  (1, 1, 1, 'mariscos-la-flota',
   0, 'consulta', 'manual', 30,
   'http://localhost:3000',
   LOWER(HEX(RANDOM_BYTES(32))),
   'mar');

-- ============================================================
-- TICKET CONFIG: actualizar encabezado al negocio demo
-- ============================================================
UPDATE ticket_configs SET
  encabezado_linea1 = 'Mariscos La Flota',
  encabezado_linea2 = 'Av. del Mar #456, Col. Centro',
  pie_linea1        = 'Gracias por su preferencia',
  pie_linea2        = 'Desarrollado por iaDoS - iados.mx'
WHERE tienda_id = 1 AND tenant_id = 1;

-- ============================================================
-- Verificacion rapida
-- ============================================================
SELECT 'Categorias activas:' AS info, COUNT(*) AS total FROM categorias WHERE activo = 1 AND tenant_id = 1
UNION ALL
SELECT 'Productos activos:', COUNT(*) FROM productos WHERE activo = 1 AND tenant_id = 1
UNION ALL
SELECT 'Menu digital config:', COUNT(*) FROM menu_digital_config WHERE tenant_id = 1;
