#!/bin/bash
set -e

echo "============================================"
echo " POS-iaDoS Backend"
echo " iaDoS - iados.mx"
echo "============================================"

# Verificar conexión real con un query simple
echo "[*] Verificando conexion MySQL en $DB_HOST:$DB_PORT ..."
MAX_RETRIES=30
RETRY=0
until node -e "
  const mysql = require('mysql2/promise');
  (async () => {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      connectTimeout: 5000
    });
    const [rows] = await conn.query('SELECT 1 as ok');
    console.log('    MySQL OK - Connection established');
    await conn.end();
  })().catch(e => { console.error('    ' + e.message); process.exit(1); });
" 2>/dev/null || [ $RETRY -ge $MAX_RETRIES ]; do
  RETRY=$((RETRY+1))
  echo "    Intento $RETRY/$MAX_RETRIES - Esperando BD lista..."
  sleep 3
done

echo "[OK] MySQL listo"

# Sincronizar imágenes seed al volumen
# - img/ se fuerza siempre (seed images: mariscos, logos demo) → garantiza versión fresca
# - resto usa -n (no clobber) para no sobreescribir uploads del usuario
if [ -d "/app/uploads-builtin" ]; then
  echo "[*] Sincronizando imágenes al volumen..."
  mkdir -p /app/uploads
  # Fuerza seed images (img/) — sobreescribe stale/corruptas del volumen
  if [ -d "/app/uploads-builtin/img" ]; then
    cp -rf /app/uploads-builtin/img /app/uploads/ 2>/dev/null || true
  fi
  # Todo lo demás sin sobreescribir (uploads de usuario)
  cp -rn /app/uploads-builtin/. /app/uploads/ 2>/dev/null || true
  echo "[OK] Imágenes sincronizadas"
fi

echo "[*] Iniciando backend..."

exec "$@"
