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
# Si uploads/img ya tiene archivos (bind mount activo desde git), NO sobreescribir
# Si uploads/img está vacío (volumen nombrado recién creado), copiar desde builtin
if [ -d "/app/uploads-builtin" ]; then
  echo "[*] Verificando imágenes..."
  mkdir -p /app/uploads
  IMG_COUNT=$(find /app/uploads/img -type f 2>/dev/null | wc -l)
  if [ "$IMG_COUNT" -gt "0" ]; then
    echo "[OK] uploads/img tiene $IMG_COUNT archivos (bind mount activo) — no se sobreescribe"
    # Solo copiar archivos que NO existen en uploads (sin tocar img/)
    cp -rn /app/uploads-builtin/. /app/uploads/ 2>/dev/null || true
  else
    echo "[*] uploads/img vacío — copiando desde builtin..."
    cp -rn /app/uploads-builtin/. /app/uploads/ 2>/dev/null || true
    echo "[OK] Imágenes inicializadas desde builtin"
  fi
fi

echo "[*] Iniciando backend..."

exec "$@"
