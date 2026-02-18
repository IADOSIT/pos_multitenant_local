-- ============================================================
-- POS-iaDoS: Crear base de datos y usuario
-- Ejecutar como root o usuario con privilegios de administrador
-- ============================================================

CREATE DATABASE IF NOT EXISTS pos_iados
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Crear usuario (cambiar password en produccion)
CREATE USER IF NOT EXISTS 'pos_iados'@'%' IDENTIFIED BY 'pos_iados_2024';

-- Otorgar permisos completos sobre la BD
GRANT ALL PRIVILEGES ON pos_iados.* TO 'pos_iados'@'%';
FLUSH PRIVILEGES;
