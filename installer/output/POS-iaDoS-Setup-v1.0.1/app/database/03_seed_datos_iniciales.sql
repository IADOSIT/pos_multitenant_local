-- ============================================================
-- POS-iaDoS: Datos iniciales (seed)
-- Ejecutar despues de 02_crear_tablas.sql
-- Passwords hasheados con bcryptjs (10 rounds)
-- ============================================================

USE pos_iados;

-- ============================================================
-- TENANT
-- ============================================================
INSERT INTO tenants (id, nombre, slug, email, activo) VALUES
(1, 'iaDoS Principal', 'iados', 'admin@iados.mx', 1);

-- ============================================================
-- EMPRESA
-- ============================================================
INSERT INTO empresas (id, tenant_id, nombre, razon_social, activo) VALUES
(1, 1, 'Mi Negocio', 'Mi Negocio SA de CV', 1);

-- ============================================================
-- TIENDA
-- ============================================================
INSERT INTO tiendas (id, tenant_id, empresa_id, nombre, direccion, zona_horaria, config_pos, activo) VALUES
(1, 1, 1, 'Sucursal Centro', 'Calle Principal #123', 'America/Mexico_City',
 '{"modo_servicio":"autoservicio","tipo_cobro_mesa":"post_pago","num_mesas":20,"iva_enabled":false,"iva_porcentaje":16,"iva_incluido":true}', 1);

-- ============================================================
-- USUARIOS
-- Passwords:
--   admin123  -> $2a$10$8K1p/a3WnV6sGFxGn3dGqOYBqzCY3p5dQJGqHvN7HGpVqJqYz1Wm6
--   cajero123 -> $2a$10$LxGz0GV8k4DLOV5FP3Y2JuO7tFNjJxKqYa0V8fGqb0JqYz1Wm6abc
-- (Estos hashes son de referencia - TypeORM synchronize + el backend
--  generara los hashes reales al crear usuarios via API)
-- ============================================================

-- superadmin (password: admin123)
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo) VALUES
(1, NULL, NULL, NULL, 'Super Admin', 'admin@iados.mx',
 '$2a$10$kuJXxDekvxd1jA4Wo3A/9.7BAanJPL//gHhGZnVajhLUw8MXbfz2e', 'superadmin', '0000', 1);

-- admin (password: admin123)
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo) VALUES
(2, 1, 1, 1, 'Administrador', 'admin2@iados.mx',
 '$2a$10$kuJXxDekvxd1jA4Wo3A/9.7BAanJPL//gHhGZnVajhLUw8MXbfz2e', 'admin', '1111', 1);

-- cajero (password: cajero123)
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo) VALUES
(3, 1, 1, 1, 'Cajero Demo', 'cajero@iados.mx',
 '$2a$10$zMdwooeIFykt8F5Q.2olmO.gefFcJ9fgSaRFOtvwbfx7EDACdZ/5W', 'cajero', '1234', 1);

-- mesero (password: cajero123)
INSERT INTO users (id, tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin, activo) VALUES
(4, 1, 1, 1, 'Mesero Demo', 'mesero@iados.mx',
 '$2a$10$zMdwooeIFykt8F5Q.2olmO.gefFcJ9fgSaRFOtvwbfx7EDACdZ/5W', 'mesero', '5678', 1);

-- ============================================================
-- LICENCIA trial
-- ============================================================
INSERT INTO licencias (tenant_id, codigo_instalacion, plan, max_tiendas, max_usuarios, estado, fecha_inicio, fecha_fin) VALUES
(1, 'TRIAL-IADOS-001', 'basico', 3, 10, 'trial', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY));

-- ============================================================
-- CATEGORIAS de ejemplo
-- ============================================================
INSERT INTO categorias (tenant_id, empresa_id, nombre, color, orden) VALUES
(1, 1, 'Comida', '#ef4444', 1),
(1, 1, 'Bebidas', '#3b82f6', 2),
(1, 1, 'Postres', '#f59e0b', 3);

-- ============================================================
-- TICKET CONFIG default
-- ============================================================
INSERT INTO ticket_configs (tenant_id, empresa_id, tienda_id, encabezado_linea1, pie_linea1, pie_linea2, mostrar_marca_iados) VALUES
(1, 1, 1, 'Mi Negocio', 'Gracias por su compra', 'Desarrollado por iaDoS - iados.mx', 1);
