#!/bin/bash
set -e

echo "============================================"
echo " POS-iaDoS Backend"
echo " iaDoS - iados.mx"
echo "============================================"

# Esperar a que MySQL esté disponible
echo "[*] Esperando MySQL en $DB_HOST:$DB_PORT ..."
MAX_RETRIES=30
RETRY=0
until curl -sf "http://$DB_HOST:$DB_PORT" > /dev/null 2>&1 || [ $RETRY -ge $MAX_RETRIES ]; do
  RETRY=$((RETRY+1))
  echo "    Intento $RETRY/$MAX_RETRIES - MySQL no disponible, esperando 2s..."
  sleep 2
done

# Verificar conexión real con un query simple
echo "[*] Verificando conexion MySQL..."
RETRY=0
until node -e "
  const mysql = require('mysql2/promise');
  (async () => {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'mysql',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USERNAME || 'pos_iados',
      password: process.env.DB_PASSWORD || 'pos_iados_2024',
      database: process.env.DB_DATABASE || 'pos_iados',
      connectTimeout: 5000
    });
    const [rows] = await conn.query('SELECT COUNT(*) as c FROM tenants');
    console.log('    MySQL OK - Tenants: ' + rows[0].c);
    await conn.end();
  })().catch(e => { console.error('    ' + e.message); process.exit(1); });
" 2>/dev/null || [ $RETRY -ge $MAX_RETRIES ]; do
  RETRY=$((RETRY+1))
  echo "    Intento $RETRY/$MAX_RETRIES - Esperando BD lista..."
  sleep 3
done

echo "[OK] MySQL listo"
echo "[*] Iniciando backend..."

exec "$@"
