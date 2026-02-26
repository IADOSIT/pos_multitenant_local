// gen_seed.js - Exporta BD local a SQL seed para el instalador EXE
// Uso: node installer/gen_seed.js > database/03_seed_datos_iniciales.sql
const mysql2 = require('../backend/node_modules/mysql2/promise');

function escVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (v instanceof Date) return `'${v.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '.000000')}'`;
  const s = String(v);
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
}

function toInsert(table, row) {
  const cols = Object.keys(row).map(c => `\`${c}\``).join(',');
  const vals = Object.values(row).map(escVal).join(',');
  return `INSERT IGNORE INTO \`${table}\` (${cols}) VALUES (${vals});`;
}

async function dump() {
  const conn = await mysql2.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'pos_iados', password: 'pos_iados_2024',
    database: 'pos_iados',
    dateStrings: false,
  });

  const q = async (sql, params) => (await conn.execute(sql, params))[0];

  const lines = [];
  lines.push('-- ============================================================');
  lines.push('-- POS-iaDoS v2.2.0: Seed completo exportado de BD local');
  lines.push('-- Generado: ' + new Date().toISOString());
  lines.push('-- ============================================================');
  lines.push('USE pos_iados;');
  lines.push('');

  // Tablas a exportar en orden (respetando FK)
  const tables = [
    { name: 'tenants',            where: '1=1', order: 'id' },
    { name: 'empresas',           where: '1=1', order: 'id' },
    { name: 'tiendas',            where: '1=1', order: 'id' },
    { name: 'licencias',          where: '1=1', order: 'id' },
    { name: 'users',              where: '1=1', order: 'id' },
    { name: 'ticket_configs',     where: '1=1', order: 'id' },
    { name: 'categorias',         where: 'activo=1', order: 'tenant_id,orden,id' },
    { name: 'productos',          where: 'activo=1', order: 'tenant_id,categoria_id,id' },
    { name: 'producto_tienda',    where: '1=1', order: 'tienda_id,producto_id' },
    { name: 'menu_digital_config', where: '1=1', order: 'id' },
  ];

  for (const t of tables) {
    const rows = await q(`SELECT * FROM \`${t.name}\` WHERE ${t.where} ORDER BY ${t.order}`);
    if (rows.length === 0) continue;
    lines.push(`-- ${t.name} (${rows.length} filas)`);
    for (const row of rows) {
      lines.push(toInsert(t.name, row));
    }
    lines.push('');
  }

  // Actualizar licencias para que sean válidas por 2 años
  lines.push('-- Asegurar licencias activas y con tiempo suficiente');
  lines.push("UPDATE `licencias` SET `estado`='activa', `fecha_fin`='2027-12-31', `max_tiendas`=10, `max_usuarios`=50, `grace_days`=30, `offline_allowed`=1 WHERE 1=1;");
  lines.push('');

  // Actualizar menu_digital_config: is_active=1, cloud_url a localhost
  lines.push('-- Activar menu digital y apuntar a servidor local');
  lines.push("UPDATE `menu_digital_config` SET `is_active`=1, `cloud_url`='http://localhost:3000' WHERE 1=1;");
  lines.push('');

  // Verificación rápida
  lines.push('-- Verificacion rapida');
  lines.push("SELECT 'Tenants:'      AS info, COUNT(*) AS total FROM tenants");
  lines.push("UNION ALL SELECT 'Empresas:',   COUNT(*) FROM empresas");
  lines.push("UNION ALL SELECT 'Tiendas:',    COUNT(*) FROM tiendas");
  lines.push("UNION ALL SELECT 'Usuarios:',   COUNT(*) FROM users");
  lines.push("UNION ALL SELECT 'Categorias:', COUNT(*) FROM categorias WHERE activo=1");
  lines.push("UNION ALL SELECT 'Productos:',  COUNT(*) FROM productos  WHERE activo=1");
  lines.push("UNION ALL SELECT 'Licencias:',  COUNT(*) FROM licencias");
  lines.push("UNION ALL SELECT 'Menu cfg:',   COUNT(*) FROM menu_digital_config;");

  await conn.end();
  process.stdout.write(lines.join('\n') + '\n');
}

dump().catch(e => { console.error(e); process.exit(1); });
