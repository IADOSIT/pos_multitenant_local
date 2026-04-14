#!/usr/bin/env node
/**
 * POS-iaDoS — Asistente de Alta de Nuevo Cliente
 * Complemento del instalador POS-iaDoS-Local
 *
 * Uso: node crear-cliente.js
 */

'use strict';

const readline = require('readline');
const fs       = require('fs');
const path     = require('path');
const { execSync } = require('child_process');

// ── Cargar bcryptjs desde el backend ────────────────────────────────────────
let bcryptjs;
const bcryptPaths = [
  path.join(__dirname, 'backend', 'node_modules', 'bcryptjs'),
  'bcryptjs',
];
for (const p of bcryptPaths) {
  try { bcryptjs = require(p); break; } catch {}
}
if (!bcryptjs) {
  console.error('\n  ✗ No se encontró bcryptjs.');
  console.error('  Ejecuta primero: cd backend && npm install\n');
  process.exit(1);
}

// ── Colores ANSI ─────────────────────────────────────────────────────────────
const C = {
  reset   : '\x1b[0m',
  bold    : '\x1b[1m',
  dim     : '\x1b[2m',
  cyan    : '\x1b[96m',
  green   : '\x1b[92m',
  yellow  : '\x1b[93m',
  red     : '\x1b[91m',
  blue    : '\x1b[94m',
  magenta : '\x1b[95m',
  white   : '\x1b[97m',
  bgBlue  : '\x1b[44m',
  bgGreen : '\x1b[42m',
  bgYellow: '\x1b[43m',
};

// ── Utilidades ────────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function cls()  { process.stdout.write('\x1Bc'); }
function ln()   { console.log(); }
function sep()  { console.log(`${C.dim}${'─'.repeat(62)}${C.reset}`); }
function sep2() { console.log(`${C.dim}${'═'.repeat(62)}${C.reset}`); }

function header(txt, color = C.bgBlue) {
  console.log(`\n${color}${C.bold}  ${txt.padEnd(60)}${C.reset}`);
}

function ok(txt)   { console.log(`  ${C.green}✓${C.reset}  ${txt}`); }
function warn(txt) { console.log(`  ${C.yellow}!${C.reset}  ${txt}`); }
function err(txt)  { console.log(`  ${C.red}✗${C.reset}  ${txt}`); }
function info(txt) { console.log(`  ${C.dim}${txt}${C.reset}`); }

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function randomCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = 'INS-';
  for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)];
  return r;
}

function esc(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function fechaFutura(anos) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + anos);
  return d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  cls();

  // ── Banner ─────────────────────────────────────────────────────────────────
  console.log(`${C.cyan}${C.bold}
  ╔═══════════════════════════════════════════════════════════╗
  ║           POS-iaDoS — Alta de Nuevo Cliente               ║
  ║        Complemento del Instalador POS-iaDoS-Local         ║
  ╚═══════════════════════════════════════════════════════════╝${C.reset}
`);
  info('Este asistente crea el tenant, empresa, tienda, licencia');
  info('y los usuarios base (Admin, Cajero, Mesero) en la BD.');
  ln();

  // ─────────────────────────────────────────────────────────
  //  PASO 1 — Email del administrador
  // ─────────────────────────────────────────────────────────
  header('PASO 1 de 4 — Correo del Administrador');
  ln();
  console.log(`  ${C.dim}Ejemplo: admin@iados.mx${C.reset}`);
  ln();

  const email = (await ask(`  ${C.cyan}Email del administrador:${C.reset} `)).trim();

  if (!email || !email.includes('@') || !email.includes('.')) {
    err('Email inválido. El formato debe ser usuario@dominio.ext');
    rl.close(); return;
  }

  // ─────────────────────────────────────────────────────────
  //  PASO 2 — Contraseña
  // ─────────────────────────────────────────────────────────
  header('PASO 2 de 4 — Contraseña del Administrador');
  ln();
  warn('La contraseña se mostrará en pantalla — anótala.');
  ln();

  const password = (await ask(`  ${C.cyan}Contraseña:${C.reset} `)).trim();

  if (password.length < 6) {
    err('La contraseña debe tener al menos 6 caracteres.');
    rl.close(); return;
  }

  // ─────────────────────────────────────────────────────────
  //  PASO 3 — Nombre del negocio
  // ─────────────────────────────────────────────────────────
  header('PASO 3 de 4 — Nombre del Negocio');
  ln();
  info('Este nombre se usará para el Tenant, Empresa y Tienda.');
  console.log(`  ${C.dim}Ejemplo: Restaurante El Buen Sabor${C.reset}`);
  ln();

  const nombre = (await ask(`  ${C.cyan}Nombre del negocio:${C.reset} `)).trim();

  if (!nombre) {
    err('El nombre no puede estar vacío.');
    rl.close(); return;
  }

  // ─────────────────────────────────────────────────────────
  //  PASO 4 — Tipo de licencia
  // ─────────────────────────────────────────────────────────
  header('PASO 4 de 4 — Tipo de Licencia');
  ln();
  console.log(`  ${C.yellow}[1]${C.reset} ${C.bold}Permanente${C.reset}   Sin caducidad ${C.dim}(recomendada para instalaciones físicas)${C.reset}`);
  console.log(`  ${C.yellow}[2]${C.reset} ${C.bold}3 años${C.reset}       Expira el ${fechaFutura(3)} ${C.dim}${C.reset}`);
  ln();

  const licOpc = (await ask(`  ${C.cyan}Selecciona [1/2]:${C.reset} `)).trim();
  const esPermanente = licOpc !== '2';
  const fechaFin   = esPermanente ? '2099-12-31' : fechaFutura(3);
  const licLabel   = esPermanente ? 'Permanente (sin caducidad)' : `3 años — expira ${fechaFin}`;

  // ─────────────────────────────────────────────────────────
  //  Generando hashes y SQL
  // ─────────────────────────────────────────────────────────
  header('Procesando...', C.bgYellow + C.bold);
  ln();

  process.stdout.write(`  Generando hash para el administrador...`);
  const hashAdmin  = await bcryptjs.hash(password, 10);
  process.stdout.write(` ${C.green}✓${C.reset}\n`);

  process.stdout.write(`  Generando hash cajero123...`);
  const hashCajero = await bcryptjs.hash('cajero123', 10);
  process.stdout.write(` ${C.green}✓${C.reset}\n`);

  process.stdout.write(`  Generando hash mesero123...`);
  const hashMesero = await bcryptjs.hash('mesero123', 10);
  process.stdout.write(` ${C.green}✓${C.reset}\n`);

  // Derivar datos
  const dominio      = email.split('@')[1];
  const emailCajero  = `cajero@${dominio}`;
  const emailMesero  = `mesero@${dominio}`;
  const slug         = slugify(nombre);
  const licCodigo    = randomCode();
  const hoy          = new Date().toISOString().split('T')[0];

  // ── Construir SQL ──────────────────────────────────────────
  const sql = `-- ============================================================
-- POS-iaDoS — Alta de Cliente
-- Negocio : ${nombre}
-- Email   : ${email}
-- Licencia: ${licLabel}
-- Fecha   : ${new Date().toLocaleString('es-MX')}
-- ============================================================
USE pos_iados;
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ── 1. Tenant ─────────────────────────────────────────────
INSERT INTO \`tenants\`
  (nombre, slug, activo, created_at, updated_at)
VALUES
  ('${esc(nombre)}', '${esc(slug)}-${Date.now()}', 1, NOW(), NOW());

SET @tenant_id = LAST_INSERT_ID();

-- ── 2. Empresa ────────────────────────────────────────────
INSERT INTO \`empresas\`
  (tenant_id, nombre, activo, created_at, updated_at)
VALUES
  (@tenant_id, '${esc(nombre)}', 1, NOW(), NOW());

SET @empresa_id = LAST_INSERT_ID();

-- ── 3. Tienda ─────────────────────────────────────────────
INSERT INTO \`tiendas\`
  (tenant_id, empresa_id, nombre, timezone,
   activo, created_at, updated_at,
   config_pos, slug, folio_venta_counter, folio_orden_counter)
VALUES
  (@tenant_id, @empresa_id, '${esc(nombre)}', 'America/Mexico_City',
   1, NOW(), NOW(),
   '{"iva_enabled":false,"iva_incluido":true,"iva_porcentaje":16,"modo_servicio":"mostrador","num_mesas":0,"self_order_enabled":false}',
   CONCAT('${esc(slug)}-', FLOOR(RAND()*9000+1000)),
   0, 0);

SET @tienda_id = LAST_INSERT_ID();

-- ── 4. Licencia (${licLabel}) ───────────────────────────
INSERT INTO \`licencias\`
  (tenant_id, codigo_instalacion, plan, features,
   max_tiendas, max_usuarios,
   fecha_inicio, fecha_fin,
   grace_days, offline_allowed, estado,
   created_at, updated_at)
VALUES
  (@tenant_id, '${esc(licCodigo)}', 'pro',
   '["pos","caja","pedidos","reportes","dashboard"]',
   5, 20,
   '${hoy}', '${fechaFin}',
   30, 1, 'activa',
   NOW(), NOW());

-- ── 5. Usuario Administrador ──────────────────────────────
INSERT INTO \`users\`
  (tenant_id, empresa_id, tienda_id,
   nombre, email, password, rol, pin,
   activo, created_at, updated_at)
VALUES
  (@tenant_id, @empresa_id, @tienda_id,
   'Administrador', '${esc(email)}', '${esc(hashAdmin)}',
   'admin', '0000',
   1, NOW(), NOW());

-- ── 6. Cajero (auto) ──────────────────────────────────────
INSERT INTO \`users\`
  (tenant_id, empresa_id, tienda_id,
   nombre, email, password, rol, pin,
   activo, created_at, updated_at)
VALUES
  (@tenant_id, @empresa_id, @tienda_id,
   CONCAT('Cajero ', '${esc(nombre)}'),
   '${esc(emailCajero)}', '${esc(hashCajero)}',
   'cajero', '1234',
   1, NOW(), NOW());

-- ── 7. Mesero (auto) ──────────────────────────────────────
INSERT INTO \`users\`
  (tenant_id, empresa_id, tienda_id,
   nombre, email, password, rol, pin,
   activo, created_at, updated_at)
VALUES
  (@tenant_id, @empresa_id, @tienda_id,
   CONCAT('Mesero ', '${esc(nombre)}'),
   '${esc(emailMesero)}', '${esc(hashMesero)}',
   'mesero', '5678',
   1, NOW(), NOW());

-- ── 8. Configuración de Ticket ────────────────────────────
INSERT INTO \`ticket_configs\`
  (tenant_id, empresa_id, tienda_id,
   encabezado_linea1, encabezado_linea2,
   pie_linea1, pie_linea2,
   ancho_papel, columnas,
   mostrar_logo, mostrar_fecha, mostrar_cajero, mostrar_folio, mostrar_marca_iados,
   fuente_familia, fuente_tamano, logo_posicion,
   copias, comanda_enabled, comanda_ancho, comanda_auto_print,
   comanda_mostrar_precio, comanda_copias,
   created_at, updated_at)
VALUES
  (@tenant_id, @empresa_id, @tienda_id,
   '${esc(nombre)}', '',
   'Gracias por su preferencia!', 'Punto de Venta iaDoS',
   80, 42,
   1, 1, 1, 1, 0,
   'Consolas', 11, 'centro',
   1, 0, 80, 0,
   1, 1,
   NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
-- ✓ Fin de alta: ${nombre}
`;

  // ── Guardar archivo SQL ────────────────────────────────────
  const ts      = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outFile = path.join(__dirname, `alta-cliente-${slug}-${ts}.sql`);
  fs.writeFileSync(outFile, sql, 'utf8');
  ok(`SQL generado: ${path.basename(outFile)}`);
  ln();

  // ─────────────────────────────────────────────────────────
  //  Preguntar si ejecutar
  // ─────────────────────────────────────────────────────────
  sep();
  console.log(`\n  ${C.yellow}¿Deseas ejecutar el SQL ahora contra la BD local?${C.reset}`);
  info('Requiere que MariaDB/MySQL esté corriendo y que el usuario');
  info('root tenga acceso sin contraseña (instalación estándar POS-iaDoS).');
  ln();

  const ejecutar = (await ask(`  ${C.cyan}Ejecutar ahora [s/N]:${C.reset} `)).trim().toLowerCase();

  let ejecutado = false;
  if (ejecutar === 's') {
    process.stdout.write(`  Ejecutando en pos_iados...`);
    try {
      execSync(`mysql -u root pos_iados < "${outFile}"`, { stdio: 'pipe' });
      process.stdout.write(` ${C.green}✓ Éxito${C.reset}\n`);
      ejecutado = true;
    } catch (e) {
      process.stdout.write(` ${C.red}✗ Error${C.reset}\n`);
      const msg = (e.stderr?.toString() || e.message || '').trim();
      if (msg) warn(msg);
      ln();
      warn('Ejecuta manualmente:');
      console.log(`  ${C.cyan}mysql -u root pos_iados < "${path.basename(outFile)}"${C.reset}`);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  RESUMEN FINAL
  // ─────────────────────────────────────────────────────────
  cls();
  sep2();
  console.log(`${C.bgGreen}${C.bold}  ✓  ALTA COMPLETADA — ANOTA ESTAS CREDENCIALES${''.padEnd(15)}${C.reset}`);
  sep2();

  // Negocio
  console.log(`\n${C.bold}${C.yellow}  NEGOCIO${C.reset}`);
  console.log(`  Nombre:        ${C.cyan}${nombre}${C.reset}`);
  console.log(`  Licencia:      ${C.cyan}${licLabel}${C.reset}`);
  console.log(`  Código lic.:   ${C.cyan}${licCodigo}${C.reset}`);

  sep();

  // Administrador
  console.log(`${C.bold}${C.yellow}  ADMINISTRADOR${C.reset}`);
  console.log(`  Email:         ${C.green}${email}${C.reset}`);
  console.log(`  Contraseña:    ${C.green}${password}${C.reset}`);
  console.log(`  PIN:           ${C.green}0000${C.reset}`);
  console.log(`  Rol:           ${C.green}admin${C.reset}`);

  sep();

  // Cajero
  console.log(`${C.bold}${C.yellow}  CAJERO  (creado automáticamente)${C.reset}`);
  console.log(`  Email:         ${C.green}${emailCajero}${C.reset}`);
  console.log(`  Contraseña:    ${C.green}cajero123${C.reset}`);
  console.log(`  PIN:           ${C.green}1234${C.reset}`);
  console.log(`  Rol:           ${C.green}cajero${C.reset}`);

  sep();

  // Mesero
  console.log(`${C.bold}${C.yellow}  MESERO  (creado automáticamente)${C.reset}`);
  console.log(`  Email:         ${C.green}${emailMesero}${C.reset}`);
  console.log(`  Contraseña:    ${C.green}mesero123${C.reset}`);
  console.log(`  PIN:           ${C.green}5678${C.reset}`);
  console.log(`  Rol:           ${C.green}mesero${C.reset}`);

  sep();

  // Acceso
  console.log(`${C.bold}${C.yellow}  ACCESO AL SISTEMA${C.reset}`);
  console.log(`  URL (offline): ${C.cyan}http://localhost:3000${C.reset}  ${C.dim}← instalación EXE${C.reset}`);
  console.log(`  URL (dev):     ${C.cyan}http://localhost:5173${C.reset}  ${C.dim}← modo desarrollo${C.reset}`);

  sep2();

  // Guía de primer uso
  console.log(`${C.bold}${C.magenta}  CONFIGURACIÓN BÁSICA — PRIMER USO${C.reset}
`);
  const pasos = [
    ['Iniciar sesión',     `Usa el email y contraseña del ${C.bold}Administrador${C.reset}`],
    ['Configurar ticket',  `Menú → ${C.cyan}Configuración → Ticket${C.reset} → nombre, dirección, teléfono`],
    ['Ajustar POS',        `Menú → ${C.cyan}Configuración → POS${C.reset} → modo servicio (mostrador / mesa)`],
    ['Crear productos',    `Menú → ${C.cyan}Productos${C.reset} → primero crea categorías, luego productos`],
    ['Abrir caja',         `Menú → ${C.cyan}Caja${C.reset} → "Abrir sesión" con el monto inicial`],
    ['Comenzar a vender',  `Menú → ${C.cyan}POS${C.reset} → selecciona productos y cobra`],
  ];

  pasos.forEach(([titulo, desc], i) => {
    console.log(`  ${C.yellow}${i + 1}.${C.reset} ${C.bold}${titulo}${C.reset}`);
    console.log(`     ${desc}${C.reset}`);
  });

  ln();
  info(`Consejo: cambia los PINs de cajero y mesero desde`);
  info(`Menú → Configuración → Usuarios una vez que el cliente`);
  info(`haya iniciado sesión por primera vez.`);
  ln();

  sep2();

  if (ejecutado) {
    ok(`SQL aplicado correctamente a la base de datos.`);
  } else {
    warn(`SQL NO aplicado aún. Ejecuta manualmente:`);
    console.log(`  ${C.cyan}mysql -u root pos_iados < "${path.basename(outFile)}"${C.reset}`);
  }

  info(`Archivo guardado: ${path.basename(outFile)}`);
  info(`Guárdalo como respaldo del alta.`);
  ln();

  rl.close();
}

// ─────────────────────────────────────────────────────────────────────────────
main().catch((e) => {
  console.error(`\n${C.red}  Error inesperado:${C.reset}`, e.message);
  rl.close();
  process.exit(1);
});
