-- POS-iaDoS Seed -- exportado VPS 2026-03-23 01:00:40
USE pos_iados;
SET SESSION check_constraint_checks=OFF;
SET FOREIGN_KEY_CHECKS=0;
SET NAMES utf8mb4;

-- Limpiar (hijos primero)
TRUNCATE TABLE tenants;
TRUNCATE TABLE empresas;
TRUNCATE TABLE tiendas;
TRUNCATE TABLE licencias;
TRUNCATE TABLE users;
TRUNCATE TABLE categorias;
TRUNCATE TABLE productos;
TRUNCATE TABLE producto_tienda;
TRUNCATE TABLE ticket_configs;
TRUNCATE TABLE cajas;
TRUNCATE TABLE gateway_configs;
TRUNCATE TABLE menu_digital_config;
TRUNCATE TABLE backup_configs;
TRUNCATE TABLE mesas;
TRUNCATE TABLE mesa_asignaciones;
TRUNCATE TABLE mesas_juntas;

