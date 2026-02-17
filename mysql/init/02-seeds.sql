-- ============================================
-- POS-iaDoS - Seeds (Datos iniciales)
-- iaDoS - iados.mx
-- ============================================
-- Password hashes generados con bcryptjs (10 rounds) - VERIFICADOS:
--   admin123  = $2a$10$myYBWxZtPsxEK7UypGTglOp3Dl/ba2PQWPilmkOpslKZSP5H8UsXS
--   cajero123 = $2a$10$ybGoi3K9MIB/IU46OMnGDeUA2p2xQABNvTGbqKDb.mJ8sg9xBWZfy

USE pos_iados;

-- 1. Tenant demo
INSERT INTO tenants (id, nombre, slug, razon_social, email, telefono)
VALUES (1, 'iaDoS Corp', 'iados-corp', 'iaDoS - Inteligencia Artificial DevOps Solutions', 'info@iados.mx', '555-IADOS')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 2. Empresa demo
INSERT INTO empresas (id, tenant_id, nombre, razon_social)
VALUES (1, 1, 'Restaurante Demo iaDoS', 'Restaurante Demo SA de CV')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 3. Tienda demo
INSERT INTO tiendas (id, tenant_id, empresa_id, nombre, direccion)
VALUES (1, 1, 1, 'Sucursal Centro', 'Av. Principal #123, Centro, CDMX')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 4. Usuarios
-- SuperAdmin: admin@iados.mx / admin123
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin)
VALUES (1, 1, 1, 1, 'Super Admin', 'admin@iados.mx',
  '$2a$10$myYBWxZtPsxEK7UypGTglOp3Dl/ba2PQWPilmkOpslKZSP5H8UsXS',
  'superadmin', '0000')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Admin: admin2@iados.mx / admin123
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin)
VALUES (2, 1, 1, 1, 'Administrador', 'admin2@iados.mx',
  '$2a$10$myYBWxZtPsxEK7UypGTglOp3Dl/ba2PQWPilmkOpslKZSP5H8UsXS',
  'admin', '1111')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Cajero: cajero@iados.mx / cajero123
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin)
VALUES (3, 1, 1, 1, 'Cajero Demo', 'cajero@iados.mx',
  '$2a$10$ybGoi3K9MIB/IU46OMnGDeUA2p2xQABNvTGbqKDb.mJ8sg9xBWZfy',
  'cajero', '1234')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Mesero: mesero@iados.mx / cajero123
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin)
VALUES (4, 1, 1, 1, 'Mesero Demo', 'mesero@iados.mx',
  '$2a$10$ybGoi3K9MIB/IU46OMnGDeUA2p2xQABNvTGbqKDb.mJ8sg9xBWZfy',
  'mesero', '5678')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 5. Categorias
INSERT INTO categorias (id, tenant_id, empresa_id, nombre, color, icono, orden, es_seccion_especial, tipo_seccion) VALUES
(1, 1, 1, 'Hamburguesas', '#FF6B35', 'burger',  1, 0, NULL),
(2, 1, 1, 'Pizzas',       '#E8272C', 'pizza',   2, 0, NULL),
(3, 1, 1, 'Tacos',        '#FFA500', 'taco',    3, 0, NULL),
(4, 1, 1, 'Ensaladas',    '#4CAF50', 'salad',   4, 0, NULL),
(5, 1, 1, 'Bebidas',      '#2196F3', 'drink',   5, 1, 'bebidas'),
(6, 1, 1, 'Postres',      '#E91E63', 'cake',    6, 1, 'postres'),
(7, 1, 1, 'Extras',       '#9C27B0', 'plus',    7, 1, 'adicionales')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 6. Productos
INSERT INTO productos (tenant_id, empresa_id, sku, nombre, descripcion, precio, costo, categoria_id, unidad, impuesto_pct) VALUES
(1, 1, 'HAM001', 'Hamburguesa Clasica',     'Carne 150g, lechuga, tomate, cebolla',       89.00,  35.00, 1, 'pza', 16.00),
(1, 1, 'HAM002', 'Hamburguesa Doble',       'Doble carne 300g, queso, tocino',            129.00,  55.00, 1, 'pza', 16.00),
(1, 1, 'HAM003', 'Hamburguesa BBQ',         'Carne 150g, salsa BBQ, aros de cebolla',      99.00,  40.00, 1, 'pza', 16.00),
(1, 1, 'HAM004', 'Hamburguesa Pollo',       'Pechuga empanizada, mayo, lechuga',            85.00,  30.00, 1, 'pza', 16.00),
(1, 1, 'PIZ001', 'Pizza Pepperoni Med',     'Pizza mediana de pepperoni',                  149.00,  50.00, 2, 'pza', 16.00),
(1, 1, 'PIZ002', 'Pizza Hawaiana Med',      'Pizza mediana hawaiana',                      139.00,  45.00, 2, 'pza', 16.00),
(1, 1, 'PIZ003', 'Pizza 4 Quesos Med',      'Pizza mediana 4 quesos',                      159.00,  55.00, 2, 'pza', 16.00),
(1, 1, 'TAC001', 'Orden Tacos Pastor (3)',   '3 tacos al pastor con pina y cilantro',       65.00,  25.00, 3, 'pza', 16.00),
(1, 1, 'TAC002', 'Orden Tacos Bistec (3)',   '3 tacos de bistec con cebolla',               75.00,  30.00, 3, 'pza', 16.00),
(1, 1, 'TAC003', 'Orden Tacos Suadero (3)',  '3 tacos de suadero',                          70.00,  28.00, 3, 'pza', 16.00),
(1, 1, 'ENS001', 'Ensalada Cesar',          'Lechuga, crutones, parmesano, aderezo cesar',  79.00,  25.00, 4, 'pza', 16.00),
(1, 1, 'ENS002', 'Ensalada Mixta',          'Mix de lechugas, tomate, pepino, zanahoria',   69.00,  20.00, 4, 'pza', 16.00),
(1, 1, 'BEB001', 'Refresco 600ml',          'Cola, naranja, limon o toronja',               25.00,  12.00, 5, 'pza', 16.00),
(1, 1, 'BEB002', 'Agua Natural 600ml',      'Agua purificada',                              15.00,   5.00, 5, 'pza', 16.00),
(1, 1, 'BEB003', 'Jugo Natural',            'Naranja, zanahoria o verde',                   35.00,  15.00, 5, 'pza', 16.00),
(1, 1, 'BEB004', 'Limonada',                'Limonada natural preparada',                   28.00,   8.00, 5, 'pza', 16.00),
(1, 1, 'BEB005', 'Cafe Americano',          'Cafe de grano recien preparado',               30.00,   8.00, 5, 'pza', 16.00),
(1, 1, 'POS001', 'Pastel Chocolate',        'Rebanada de pastel de chocolate',               55.00,  20.00, 6, 'pza', 16.00),
(1, 1, 'POS002', 'Helado 2 Bolas',          'Helado artesanal, elige 2 sabores',             45.00,  15.00, 6, 'pza', 16.00),
(1, 1, 'POS003', 'Flan Napolitano',         'Flan casero con caramelo',                      40.00,  12.00, 6, 'pza', 16.00),
(1, 1, 'EXT001', 'Extra Queso',             'Porcion extra de queso',                        15.00,   5.00, 7, 'pza', 16.00),
(1, 1, 'EXT002', 'Extra Tocino',            'Porcion extra de tocino crujiente',             20.00,   8.00, 7, 'pza', 16.00),
(1, 1, 'EXT003', 'Papas Fritas',            'Porcion de papas fritas crujientes',            35.00,  12.00, 7, 'pza', 16.00),
(1, 1, 'EXT004', 'Guacamole',               'Porcion de guacamole fresco',                   25.00,  10.00, 7, 'pza', 16.00),
(1, 1, 'EXT005', 'Aros de Cebolla',         'Porcion de aros de cebolla',                    30.00,  10.00, 7, 'pza', 16.00)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), precio=VALUES(precio);

-- 7. Config ticket default
INSERT INTO ticket_configs (id, tenant_id, encabezado_linea1, encabezado_linea2, encabezado_linea3, pie_linea1, pie_linea2, mostrar_marca_iados)
VALUES (1, 1, 'Restaurante Demo iaDoS', 'Av. Principal #123, Centro', 'Tel: 555-IADOS', 'Gracias por su preferencia!', 'Desarrollado por iaDoS - iados.mx', 1)
ON DUPLICATE KEY UPDATE tenant_id=VALUES(tenant_id);

-- 8. Verificacion final
SELECT '✅ Schema + Seeds completados' AS status;
SELECT COUNT(*) AS total_tenants FROM tenants;
SELECT COUNT(*) AS total_empresas FROM empresas;
SELECT COUNT(*) AS total_tiendas FROM tiendas;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_categorias FROM categorias;
SELECT COUNT(*) AS total_productos FROM productos;
