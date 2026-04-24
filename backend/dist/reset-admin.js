/**
 * reset-admin.js — Restablece passwords de usuarios admin en VPS
 * Uso: docker exec -it pos-backend node dist/reset-admin.js
 */
'use strict';
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function main() {
  console.log('[reset-admin] Conectando a MySQL...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'pos_iados',
  });

  const pairs = [
    { emails: ['admin@iados.mx', 'admin2@iados.mx'], pass: 'admin123' },
    { emails: ['cajero@iados.mx', 'mesero@iados.mx'], pass: 'cajero123' },
  ];

  for (const { emails, pass } of pairs) {
    const hash = await bcrypt.hash(pass, 10);
    const placeholders = emails.map(() => '?').join(',');
    const [res] = await conn.execute(
      `UPDATE users SET password=? WHERE email IN (${placeholders})`,
      [hash, ...emails]
    );
    console.log(`[OK] ${pass}: ${res.affectedRows} usuario(s) actualizado(s) — ${emails.join(', ')}`);
  }

  console.log('[OK] Passwords restablecidos. Prueba login ahora.');
  await conn.end();
}

main().catch(e => { console.error('[ERR]', e.message); process.exit(1); });
