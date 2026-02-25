-- ============================================================
-- POS-iaDoS v2.1.0: Datos iniciales completos
-- Incluye: tenant, empresa, tienda, usuarios, categorias,
--          productos, ticket_config, menu_digital_config
-- Ejecutar DESPUES de que TypeORM haya creado todas las tablas
-- ============================================================

USE pos_iados;

-- ============================================================
-- TENANT
-- ============================================================
INSERT INTO tenants (id, nombre, slug, razon_social, email, activo) VALUES
(1, 'iaDoS Principal', 'iados', 'iaDoS - Inteligencia Artificial DevOps Solutions', 'admin@iados.mx', 1);

-- ============================================================
-- EMPRESA
-- ============================================================
INSERT INTO empresas (id, tenant_id, nombre, razon_social, activo) VALUES
(1, 1, 'Restaurante Demo iaDoS', 'Restaurante Demo SA de CV', 1);

-- ============================================================
-- TIENDA
-- ============================================================
INSERT INTO tiendas (id, tenant_id, empresa_id, nombre, direccion, zona_horaria, config_pos, activo) VALUES
(1, 1, 1, 'Sucursal Centro', 'Av. Principal #123, Centro, CDMX', 'America/Mexico_City',
 '{"modo_servicio":"mesa","tipo_cobro_mesa":"post_pago","num_mesas":20,"iva_enabled":false,"iva_porcentaje":16,"iva_incluido":true}', 1);

-- ============================================================
-- USUARIOS
-- Hashes verificados con bcryptjs.compare() = true
-- install.ps1 regenera hashes frescos con el Node.js instalado
-- ============================================================
-- superadmin (password: admin123, PIN: 0000)
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo) VALUES
(1, NULL, NULL, NULL, 'Super Admin', 'admin@iados.mx',
 '$2a$10$vDqSmFIFDlTHlsKEmX7m.OR4rhwWiKGSdrzR0OwFTIWP4EUO.HR..', 'superadmin', '0000', 1);

-- admin (password: admin123, PIN: 1111)
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo) VALUES
(2, 1, 1, 1, 'Administrador', 'admin2@iados.mx',
 '$2a$10$vDqSmFIFDlTHlsKEmX7m.OR4rhwWiKGSdrzR0OwFTIWP4EUO.HR..', 'admin', '1111', 1);

-- cajero (password: cajero123, PIN: 1234)
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo) VALUES
(3, 1, 1, 1, 'Cajero Demo', 'cajero@iados.mx',
 '$2a$10$PRr34LXQQASoyqkGOT9RB.XhKvpLe.4RQuAY0JgEf6rGw4s4k9HN6', 'cajero', '1234', 1);

-- mesero (password: cajero123, PIN: 5678)
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo) VALUES
(4, 1, 1, 1, 'Mesero Demo', 'mesero@iados.mx',
 '$2a$10$PRr34LXQQASoyqkGOT9RB.XhKvpLe.4RQuAY0JgEf6rGw4s4k9HN6', 'mesero', '5678', 1);

-- ============================================================
-- LICENCIA trial 30 dias
-- ============================================================
INSERT INTO licencias (tenant_id, codigo_instalacion, plan, max_tiendas, max_usuarios, estado, fecha_inicio, fecha_fin) VALUES
(1, 'TRIAL-IADOS-001', 'basico', 3, 10, 'trial', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY));

-- ============================================================
-- TICKET CONFIG
-- ============================================================
INSERT INTO ticket_configs (id, tenant_id, empresa_id, tienda_id, encabezado_linea1, encabezado_linea2, pie_linea1, pie_linea2, ancho_papel, columnas, mostrar_logo, mostrar_fecha, mostrar_cajero, mostrar_folio, mostrar_marca_iados) VALUES
(1, 1, 1, 1, 'Restaurante Demo iaDoS', 'Av. Principal #123, Centro, CDMX', 'Gracias por su preferencia!', 'Desarrollado por iaDoS - iados.mx', 80, 42, 1, 1, 1, 1, 1);

-- ============================================================
-- CATEGORIAS (7 categorias del demo)
-- ============================================================
INSERT INTO categorias (id, tenant_id, empresa_id, nombre, color, icono, orden, activo) VALUES
(1, 1, 1, 'Hamburguesas',  '#FF6B35', 'burger', 1, 1),
(2, 1, 1, 'Pizzas',        '#E8272C', 'pizza',  2, 1),
(3, 1, 1, 'Tacos',         '#FFA500', 'taco',   3, 1),
(4, 1, 1, 'Ensaladas',     '#4CAF50', 'salad',  4, 1),
(5, 1, 1, 'Bebidas',       '#2196F3', 'drink',  5, 1),
(6, 1, 1, 'Postres',       '#E91E63', 'cake',   6, 1),
(7, 1, 1, 'Extras',        '#9C27B0', 'plus',   7, 1);

-- ============================================================
-- PRODUCTOS (25 productos del demo)
-- ============================================================
INSERT INTO productos (id, tenant_id, empresa_id, sku, categoria_id, nombre, descripcion, precio, activo, disponible, orden) VALUES
-- Hamburguesas
(1,  1, 1, 'HAM001', 1, 'Hamburguesa Clasica', 'Carne 150g, lechuga, tomate, cebolla',          89.00,  1, 1, 1),
(2,  1, 1, 'HAM002', 1, 'Hamburguesa Doble',   'Doble carne 300g, queso, tocino',               129.00, 1, 1, 2),
(3,  1, 1, 'HAM003', 1, 'Hamburguesa BBQ',     'Carne 150g, salsa BBQ, aros de cebolla',         99.00, 1, 1, 3),
(4,  1, 1, 'HAM004', 1, 'Hamburguesa Pollo',   'Pechuga empanizada, mayo, lechuga',               85.00, 1, 1, 4),
-- Pizzas
(5,  1, 1, 'PIZ001', 2, 'Pizza Pepperoni Med', 'Pizza mediana de pepperoni',                    149.00, 1, 1, 1),
(6,  1, 1, 'PIZ002', 2, 'Pizza Hawaiana Med',  'Pizza mediana hawaiana',                        139.00, 1, 1, 2),
(7,  1, 1, 'PIZ003', 2, 'Pizza 4 Quesos Med',  'Pizza mediana 4 quesos',                        159.00, 1, 1, 3),
-- Tacos
(8,  1, 1, 'TAC001', 3, 'Orden Tacos Pastor (3)',  '3 tacos al pastor con pina y cilantro',      65.00, 1, 1, 1),
(9,  1, 1, 'TAC002', 3, 'Orden Tacos Bistec (3)',  '3 tacos de bistec con cebolla',               75.00, 1, 1, 2),
(10, 1, 1, 'TAC003', 3, 'Orden Tacos Suadero (3)', '3 tacos de suadero',                         70.00, 1, 1, 3),
-- Ensaladas
(11, 1, 1, 'ENS001', 4, 'Ensalada Cesar',   'Lechuga, crutones, parmesano, aderezo cesar',       79.00, 1, 1, 1),
(12, 1, 1, 'ENS002', 4, 'Ensalada Mixta',   'Mix de lechugas, tomate, pepino, zanahoria',        69.00, 1, 1, 2),
-- Bebidas
(13, 1, 1, 'BEB001', 5, 'Refresco 600ml',   'Cola, naranja, limon o toronja',                    25.00, 1, 1, 1),
(14, 1, 1, 'BEB002', 5, 'Agua Natural 600ml','Agua purificada',                                  15.00, 1, 1, 2),
(15, 1, 1, 'BEB003', 5, 'Jugo Natural',      'Naranja, zanahoria o verde',                       35.00, 1, 1, 3),
(16, 1, 1, 'BEB004', 5, 'Limonada',          'Limonada natural preparada',                       28.00, 1, 1, 4),
(17, 1, 1, 'BEB005', 5, 'Cafe Americano',    'Cafe de grano recien preparado',                   30.00, 1, 1, 5),
-- Postres
(18, 1, 1, 'POS001', 6, 'Pastel Chocolate',  'Rebanada de pastel de chocolate',                  55.00, 1, 1, 1),
(19, 1, 1, 'POS002', 6, 'Helado 2 Bolas',    'Helado artesanal, elige 2 sabores',                45.00, 1, 1, 2),
(20, 1, 1, 'POS003', 6, 'Flan Napolitano',   'Flan casero con caramelo',                         40.00, 1, 1, 3),
-- Extras
(21, 1, 1, 'EXT001', 7, 'Extra Queso',       'Porcion extra de queso',                           15.00, 1, 1, 1),
(22, 1, 1, 'EXT002', 7, 'Extra Tocino',      'Porcion extra de tocino crujiente',                20.00, 1, 1, 2),
(23, 1, 1, 'EXT003', 7, 'Papas Fritas',      'Porcion de papas fritas crujientes',               35.00, 1, 1, 3),
(24, 1, 1, 'EXT004', 7, 'Guacamole',         'Porcion de guacamole fresco',                      25.00, 1, 1, 4),
(25, 1, 1, 'EXT005', 7, 'Aros de Cebolla',   'Porcion de aros de cebolla',                       30.00, 1, 1, 5);

-- ============================================================
-- PRODUCTO_TIENDA: vincular todos los productos a tienda 1
-- ============================================================
INSERT INTO producto_tienda (tenant_id, tienda_id, producto_id, disponible) VALUES
(1,1,1,1),(1,1,2,1),(1,1,3,1),(1,1,4,1),(1,1,5,1),
(1,1,6,1),(1,1,7,1),(1,1,8,1),(1,1,9,1),(1,1,10,1),
(1,1,11,1),(1,1,12,1),(1,1,13,1),(1,1,14,1),(1,1,15,1),
(1,1,16,1),(1,1,17,1),(1,1,18,1),(1,1,19,1),(1,1,20,1),
(1,1,21,1),(1,1,22,1),(1,1,23,1),(1,1,24,1),(1,1,25,1);

-- ============================================================
-- MENU DIGITAL CONFIG
-- ============================================================
INSERT INTO menu_digital_config
  (tenant_id, empresa_id, tienda_id, slug, is_active, modo_menu, sync_mode, sync_interval, cloud_url, api_key, plantilla)
VALUES
  (1, 1, 1, 'restaurante-demo', 0, 'consulta', 'manual', 30, 'http://localhost:3000',
   LOWER(HEX(RANDOM_BYTES(32))), 'oscuro');

-- ============================================================
-- Verificacion rapida
-- ============================================================
SELECT 'Tenants:'            AS info, COUNT(*) AS total FROM tenants
UNION ALL SELECT 'Usuarios:',    COUNT(*) FROM users
UNION ALL SELECT 'Categorias:',  COUNT(*) FROM categorias WHERE activo=1
UNION ALL SELECT 'Productos:',   COUNT(*) FROM productos WHERE activo=1
UNION ALL SELECT 'Prod-Tienda:', COUNT(*) FROM producto_tienda
UNION ALL SELECT 'Menu config:', COUNT(*) FROM menu_digital_config;
