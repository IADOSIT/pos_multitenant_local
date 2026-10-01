// =============================================================================
// POS-iaDoS - Utilidades compartidas de los scripts de mantenimiento
//
// Estos scripts corren con el node empaquetado (C:\POS-iaDoS\node\node.exe) y
// resuelven sus dependencias (mysql2, exceljs) desde el node_modules del propio
// backend instalado. No se instala nada extra en el equipo del cliente.
//
// Sin acentos a proposito: la consola de Windows (cp850/cp437) los rompe y
// estos mensajes son lo unico que el tecnico ve cuando trabaja en remoto.
// =============================================================================
'use strict';

const fs = require('fs');
const path = require('path');

// --- Rutas ------------------------------------------------------------------
// Todo se cuelga de InstallDir, que llega por argumento o se deduce: este
// archivo vive en <InstallDir>\tools\node\comun.js
function resolverInstallDir(argv) {
  const desdeArg = leerArg(argv, '--install-dir');
  if (desdeArg) return desdeArg.replace(/[\\/]+$/, '');
  return path.resolve(__dirname, '..', '..');
}

function rutasDe(installDir) {
  const backend = path.join(installDir, 'backend');
  return {
    installDir,
    backend,
    env: path.join(backend, '.env'),
    uploads: path.join(backend, 'uploads'),
    uploadsBuiltin: path.join(backend, 'uploads-builtin'),
    versionJson: path.join(installDir, 'version.json'),
    backups: path.join(installDir, 'backups'),
    nodeModules: path.join(backend, 'node_modules'),
  };
}

// Las dependencias se cargan desde el backend instalado, no desde aqui.
function requerirDelBackend(rutas, modulo) {
  try {
    return require(path.join(rutas.nodeModules, modulo));
  } catch (e) {
    throw new Error(
      `No se pudo cargar '${modulo}' desde ${rutas.nodeModules}. ` +
      `Verifica que el backend este instalado completo. Detalle: ${e.message}`
    );
  }
}

// --- Lectura del .env -------------------------------------------------------
// Parser propio en lugar de dotenv: el .env del cliente puede traer valores con
// '=' adentro (passwords, JWT) y aqui no se puede fallar por eso.
function leerEnv(rutaEnv) {
  if (!fs.existsSync(rutaEnv)) {
    throw new Error(`No existe el archivo de configuracion: ${rutaEnv}`);
  }
  const out = {};
  const texto = fs.readFileSync(rutaEnv, 'utf8').replace(/^\uFEFF/, '');
  for (const linea of texto.split(/\r?\n/)) {
    const t = linea.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const clave = t.slice(0, i).trim();
    let valor = t.slice(i + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"') && valor.length > 1) ||
      (valor.startsWith("'") && valor.endsWith("'") && valor.length > 1)
    ) {
      valor = valor.slice(1, -1);
    }
    out[clave] = valor;
  }
  return out;
}

function datosConexion(env) {
  return {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USERNAME || 'pos_iados',
    password: env.DB_PASSWORD || '',
    database: env.DB_DATABASE || 'pos_iados',
    charset: 'utf8mb4',
    // Los JSON se devuelven ya parseados por mysql2; se normaliza aparte.
    dateStrings: true,
    multipleStatements: false,
  };
}

async function conectar(rutas) {
  const mysql = requerirDelBackend(rutas, 'mysql2/promise');
  const env = leerEnv(rutas.env);
  const cfg = datosConexion(env);
  const conn = await mysql.createConnection(cfg);
  return { conn, cfg, env };
}

// --- Version ----------------------------------------------------------------
function leerVersion(rutas) {
  try {
    const raw = fs.readFileSync(rutas.versionJson, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw).version || 'desconocida';
  } catch (e) {
    return 'desconocida';
  }
}

// --- Argumentos -------------------------------------------------------------
function leerArg(argv, nombre, porOmision = null) {
  const i = argv.indexOf(nombre);
  if (i === -1) return porOmision;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) return porOmision;
  return v;
}

function tieneFlag(argv, nombre) {
  return argv.includes(nombre);
}

// --- Salida -----------------------------------------------------------------
function log(msg) {
  process.stdout.write(`  ${msg}\n`);
}

function logPaso(msg) {
  process.stdout.write(`\n  ${msg}\n`);
}

function logError(msg) {
  process.stderr.write(`  [ERROR] ${msg}\n`);
}

// Fecha legible y fecha para nombres de carpeta
function sello() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function fechaLegible() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function asegurarDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function escribirJson(ruta, obj) {
  asegurarDir(path.dirname(ruta));
  fs.writeFileSync(ruta, JSON.stringify(obj, null, 2), 'utf8');
}

function leerJsonSiExiste(ruta) {
  try {
    return JSON.parse(fs.readFileSync(ruta, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {
    return null;
  }
}

// mysql2 devuelve las columnas JSON ya parseadas, pero segun version y driver a
// veces llegan como string. Esta funcion deja siempre un objeto/array/null.
function comoJson(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'object') return valor;
  if (typeof valor === 'string') {
    const t = valor.trim();
    if (!t) return null;
    try { return JSON.parse(t); } catch (e) { return null; }
  }
  return null;
}

// Lista de tablas reales de la base (no vistas). Se consulta en vivo a proposito:
// cualquier tabla nueva que agregue synchronize entra sola, sin tocar scripts.
async function listarTablas(conn, database) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME AS t FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME`,
    [database]
  );
  return rows.map((r) => r.t);
}

module.exports = {
  resolverInstallDir,
  rutasDe,
  requerirDelBackend,
  leerEnv,
  datosConexion,
  conectar,
  leerVersion,
  leerArg,
  tieneFlag,
  log,
  logPaso,
  logError,
  sello,
  fechaLegible,
  asegurarDir,
  escribirJson,
  leerJsonSiExiste,
  comoJson,
  listarTablas,
};
