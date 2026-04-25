-- Migración v2.2.74: Asignar worker_url por defecto en menu_digital_config
-- Para instalaciones existentes que actualizan desde v2.2.73 o anterior

UPDATE menu_digital_config
SET worker_url = 'https://menu.iados.mx'
WHERE worker_url IS NULL OR worker_url = '';
