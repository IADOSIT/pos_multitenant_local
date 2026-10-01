// =============================================================================
// POS-iaDoS - Foto de los ajustes activos, y comparacion contra una foto previa
//
//   node ajustes.js --install-dir C:\POS-iaDoS --salida <carpeta>
//   node ajustes.js --install-dir C:\POS-iaDoS --salida <carpeta> --comparar <ajustes.json>
//
// Para que sirve: antes de sobrescribir el sistema se guarda EXACTAMENTE que
// trae prendido el cliente (toggles por tienda, apariencia, impresora, tickets,
// menu digital, pasarelas, licencia y el .env). Despues de actualizar se vuelve
// a leer y se comparan las dos fotos. Si algo cambio, sale listado: asi "quedo
// operando exactamente igual" se puede comprobar, no solo prometer.
//
// Las contrasenas y llaves NO se escriben en el reporte legible: ahi van
// enmascaradas. El JSON si guarda el valor real, porque se queda en el equipo
// del cliente y es lo que permite devolver un ajuste a como estaba.
// =============================================================================
'use strict';

const fs = require('fs');
const path = require('path');
const C = require('./comun');

// Tablas cuyas filas completas son configuracion.
const TABLAS_CONFIG = [
  'ticket_configs',
  'menu_digital_config',
  'gateway_configs',
  'ecommerce_configs',
  'licencias',
  'perfiles',
];

// Columnas json con ajustes, por tabla.
const COLUMNAS_AJUSTE = {
  tiendas:  ['config_pos', 'config_ticket', 'config_impresora'],
  empresas: ['config_apariencia', 'config_especial'],
};

// Nombres que nunca se imprimen en claro.
const SECRETO = /(pass|password|secret|token|key|llave|clave|jwt|private)/i;

function enmascarar(valor) {
  const s = String(valor);
  if (!s) return '';
  if (s.length <= 6) return '******';
  return s.slice(0, 3) + '*'.repeat(Math.min(12, s.length - 6)) + s.slice(-3);
}

async function existeTabla(conn, database, tabla) {
  const [r] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [database, tabla]
  );
  return Number(r[0].n) > 0;
}

async function columnasDe(conn, database, tabla) {
  const [r] = await conn.query(
    `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
    [database, tabla]
  );
  return r.map((x) => x.c);
}

// --- Lectura de la foto -----------------------------------------------------
async function tomarFoto(conn, cfg, rutas) {
  const foto = {
    fecha: C.fechaLegible(),
    version: C.leerVersion(rutas),
    base_datos: cfg.database,
    estructura: {},   // tabla -> [columnas], para detectar campos nuevos
    tiendas: [],
    empresas: [],
    tablas: {},
    env: {},
  };

  // --- toggles por tienda ---
  if (await existeTabla(conn, cfg.database, 'tiendas')) {
    const cols = await columnasDe(conn, cfg.database, 'tiendas');
    foto.estructura.tiendas = cols;
    const presentes = COLUMNAS_AJUSTE.tiendas.filter((c) => cols.includes(c));
    const sel = ['id', 'nombre', 'empresa_id', 'activa'].filter((c) => cols.includes(c)).concat(presentes);
    const [filas] = await conn.query(`SELECT ${sel.map((c) => '`' + c + '`').join(', ')} FROM \`tiendas\` ORDER BY id`);
    for (const f of filas) {
      const t = { id: f.id, nombre: f.nombre, empresa_id: f.empresa_id, activa: f.activa };
      for (const c of presentes) t[c] = C.comoJson(f[c]) || {};
      foto.tiendas.push(t);
    }
  }

  // --- apariencia y modulos por empresa ---
  if (await existeTabla(conn, cfg.database, 'empresas')) {
    const cols = await columnasDe(conn, cfg.database, 'empresas');
    foto.estructura.empresas = cols;
    const presentes = COLUMNAS_AJUSTE.empresas.filter((c) => cols.includes(c));
    const sel = ['id', 'nombre', 'tenant_id'].filter((c) => cols.includes(c)).concat(presentes);
    const [filas] = await conn.query(`SELECT ${sel.map((c) => '`' + c + '`').join(', ')} FROM \`empresas\` ORDER BY id`);
    for (const f of filas) {
      const e = { id: f.id, nombre: f.nombre, tenant_id: f.tenant_id };
      for (const c of presentes) e[c] = C.comoJson(f[c]) || {};
      foto.empresas.push(e);
    }
  }

  // --- tablas de configuracion completas ---
  // A la lista conocida se le suma cualquier tabla con 'config' en el nombre:
  // asi un modulo de configuracion que se agregue despues entra solo.
  const [extra] = await conn.query(
    `SELECT TABLE_NAME AS t FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME LIKE '%config%'`,
    [cfg.database]
  );
  const lista = Array.from(new Set(TABLAS_CONFIG.concat(extra.map((x) => x.t))));

  for (const tabla of lista) {
    if (!(await existeTabla(conn, cfg.database, tabla))) continue;
    const cols = await columnasDe(conn, cfg.database, tabla);
    foto.estructura[tabla] = cols;
    const [filas] = await conn.query(`SELECT * FROM \`${tabla}\``);
    foto.tablas[tabla] = filas.map((f) => {
      const o = {};
      for (const k of Object.keys(f)) {
        const v = f[k];
        // Los json se normalizan para que la comparacion no falle por
        // diferencias de formato del texto.
        o[k] = (v && typeof v === 'string' && (v.trim().startsWith('{') || v.trim().startsWith('[')))
          ? (C.comoJson(v) || v)
          : (v && typeof v === 'object' && !(v instanceof Date) ? v : v);
      }
      return o;
    });
  }

  // --- el .env del backend ---
  try {
    foto.env = C.leerEnv(rutas.env);
  } catch (e) {
    foto.env = {};
  }

  return foto;
}

// --- Comparacion ------------------------------------------------------------
// Se aplanan las dos fotos a pares 'ruta = valor' y se comparan por ruta. Es
// mas util que un diff de texto: dice exactamente que toggle cambio.
function aplanar(obj, prefijo, salida) {
  if (obj === null || obj === undefined) {
    salida[prefijo] = null;
    return salida;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => aplanar(v, `${prefijo}[${i}]`, salida));
    return salida;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    for (const k of Object.keys(obj).sort()) aplanar(obj[k], prefijo ? `${prefijo}.${k}` : k, salida);
    return salida;
  }
  salida[prefijo] = obj instanceof Date ? obj.toISOString() : obj;
  return salida;
}

// Campos que cambian solos y cuyo cambio no significa nada: no se reportan
// como diferencia para que el reporte no se llene de ruido.
const RUIDO = [
  /\.updated_at$/i, /\.created_at$/i, /\.fecha_actualizacion$/i,
  /^env\.APP_VERSION$/i, /^version$/i, /^fecha$/i,
  /\.ultimo_chequeo/i, /\.ultima_/i,
];

function esRuido(ruta) {
  return RUIDO.some((r) => r.test(ruta));
}

function comparar(antes, ahora) {
  const a = aplanar({ tiendas: antes.tiendas, empresas: antes.empresas, tablas: antes.tablas, env: antes.env }, '', {});
  const b = aplanar({ tiendas: ahora.tiendas, empresas: ahora.empresas, tablas: ahora.tablas, env: ahora.env }, '', {});

  const cambiados = [];
  const perdidos = [];
  const nuevos = [];

  for (const k of Object.keys(a)) {
    if (esRuido(k)) continue;
    if (!(k in b)) { perdidos.push({ ruta: k, antes: a[k] }); continue; }
    if (String(a[k]) !== String(b[k])) cambiados.push({ ruta: k, antes: a[k], ahora: b[k] });
  }
  for (const k of Object.keys(b)) {
    if (esRuido(k)) continue;
    if (!(k in a)) nuevos.push({ ruta: k, ahora: b[k] });
  }

  // Campos de estructura que aparecieron (los que agrega synchronize).
  const columnasNuevas = [];
  for (const tabla of Object.keys(ahora.estructura || {})) {
    const viejas = (antes.estructura || {})[tabla];
    if (!viejas) { columnasNuevas.push({ tabla, columna: '(tabla nueva)' }); continue; }
    for (const c of ahora.estructura[tabla]) {
      if (!viejas.includes(c)) columnasNuevas.push({ tabla, columna: c });
    }
  }
  const columnasPerdidas = [];
  for (const tabla of Object.keys(antes.estructura || {})) {
    const nuevas = (ahora.estructura || {})[tabla];
    if (!nuevas) { columnasPerdidas.push({ tabla, columna: '(TABLA YA NO EXISTE)' }); continue; }
    for (const c of antes.estructura[tabla]) {
      if (!nuevas.includes(c)) columnasPerdidas.push({ tabla, columna: c });
    }
  }

  return { cambiados, perdidos, nuevos, columnasNuevas, columnasPerdidas };
}

function valorLegible(ruta, valor) {
  if (valor === null) return '(vacio)';
  if (SECRETO.test(ruta)) return enmascarar(valor);
  const s = String(valor);
  return s.length > 90 ? s.slice(0, 87) + '...' : s;
}

// --- Reportes ---------------------------------------------------------------
function reporteFoto(salida, foto) {
  const L = [];
  L.push('===============================================================');
  L.push('  AJUSTES ACTIVOS DEL CLIENTE');
  L.push('  ' + foto.fecha + '   version ' + foto.version);
  L.push('===============================================================');
  L.push('');
  L.push('  Esta es la configuracion que trae prendida hoy. Despues de');
  L.push('  actualizar se vuelve a leer y se compara contra esta foto.');
  L.push('');

  for (const t of foto.tiendas) {
    L.push('---------------------------------------------------------------');
    L.push(`  TIENDA ${t.id}: ${t.nombre}`);
    L.push('---------------------------------------------------------------');
    for (const col of ['config_pos', 'config_ticket', 'config_impresora']) {
      const cfg = t[col];
      if (!cfg || Object.keys(cfg).length === 0) continue;
      L.push(`  ${col}:`);
      for (const k of Object.keys(cfg).sort()) {
        const v = cfg[k];
        const txt = (v !== null && typeof v === 'object') ? JSON.stringify(v) : String(v);
        L.push(`    ${k.padEnd(34)} ${valorLegible(k, txt)}`);
      }
    }
    L.push('');
  }

  for (const e of foto.empresas) {
    L.push('---------------------------------------------------------------');
    L.push(`  EMPRESA ${e.id}: ${e.nombre}`);
    L.push('---------------------------------------------------------------');
    for (const col of ['config_apariencia', 'config_especial']) {
      const cfg = e[col];
      if (!cfg || Object.keys(cfg).length === 0) continue;
      L.push(`  ${col}:`);
      for (const k of Object.keys(cfg).sort()) {
        const v = cfg[k];
        const txt = (v !== null && typeof v === 'object') ? JSON.stringify(v) : String(v);
        L.push(`    ${k.padEnd(34)} ${valorLegible(k, txt)}`);
      }
    }
    L.push('');
  }

  L.push('---------------------------------------------------------------');
  L.push('  TABLAS DE CONFIGURACION');
  L.push('---------------------------------------------------------------');
  for (const tabla of Object.keys(foto.tablas).sort()) {
    L.push(`  ${tabla.padEnd(34)} ${foto.tablas[tabla].length} fila(s)`);
  }
  L.push('');

  L.push('---------------------------------------------------------------');
  L.push('  .env DEL BACKEND (valores sensibles enmascarados)');
  L.push('---------------------------------------------------------------');
  for (const k of Object.keys(foto.env).sort()) {
    L.push(`  ${k.padEnd(28)} ${valorLegible(k, foto.env[k])}`);
  }
  L.push('');
  L.push('===============================================================');
  fs.writeFileSync(path.join(salida, 'AJUSTES.txt'), L.join('\r\n'), 'utf8');
}

function reporteComparacion(salida, antes, ahora, dif) {
  const L = [];
  const todoIgual = dif.cambiados.length === 0 && dif.perdidos.length === 0 && dif.columnasPerdidas.length === 0;

  L.push('===============================================================');
  L.push('  COMPARACION DE AJUSTES - ANTES Y DESPUES DE ACTUALIZAR');
  L.push(`  Antes : version ${antes.version}  (${antes.fecha})`);
  L.push(`  Ahora : version ${ahora.version}  (${ahora.fecha})`);
  L.push('===============================================================');
  L.push('');
  L.push(todoIgual
    ? '  RESULTADO: el sistema quedo operando con los MISMOS ajustes.'
    : '  RESULTADO: hay diferencias. Revisalas abajo antes de dar por buena');
  if (!todoIgual) L.push('  la actualizacion.');
  L.push('');
  L.push(`  Ajustes que cambiaron de valor : ${dif.cambiados.length}`);
  L.push(`  Ajustes que desaparecieron     : ${dif.perdidos.length}`);
  L.push(`  Ajustes nuevos de esta version : ${dif.nuevos.length}`);
  L.push(`  Columnas nuevas en la base     : ${dif.columnasNuevas.length}`);
  L.push(`  Columnas que ya no estan       : ${dif.columnasPerdidas.length}`);
  L.push('');

  if (dif.cambiados.length > 0) {
    L.push('---------------------------------------------------------------');
    L.push('  CAMBIARON DE VALOR  (revisar: deberian ser los mismos)');
    L.push('---------------------------------------------------------------');
    for (const c of dif.cambiados.slice(0, 300)) {
      L.push('');
      L.push(`  ${c.ruta}`);
      L.push(`    antes : ${valorLegible(c.ruta, c.antes)}`);
      L.push(`    ahora : ${valorLegible(c.ruta, c.ahora)}`);
    }
    if (dif.cambiados.length > 300) L.push(`\r\n  ... y ${dif.cambiados.length - 300} mas (ver comparacion.json)`);
    L.push('');
  }

  if (dif.perdidos.length > 0) {
    L.push('---------------------------------------------------------------');
    L.push('  DESAPARECIERON  (esto es lo grave: habia un ajuste y ya no esta)');
    L.push('---------------------------------------------------------------');
    for (const c of dif.perdidos.slice(0, 300)) {
      L.push(`  ${c.ruta.padEnd(60)} valia: ${valorLegible(c.ruta, c.antes)}`);
    }
    if (dif.perdidos.length > 300) L.push(`  ... y ${dif.perdidos.length - 300} mas (ver comparacion.json)`);
    L.push('');
  }

  if (dif.columnasPerdidas.length > 0) {
    L.push('---------------------------------------------------------------');
    L.push('  COLUMNAS QUE YA NO EXISTEN EN LA BASE');
    L.push('---------------------------------------------------------------');
    for (const c of dif.columnasPerdidas) L.push(`  ${c.tabla}.${c.columna}`);
    L.push('');
  }

  if (dif.columnasNuevas.length > 0) {
    L.push('---------------------------------------------------------------');
    L.push('  COLUMNAS NUEVAS  (lo que agrego la migracion; es lo esperado)');
    L.push('---------------------------------------------------------------');
    for (const c of dif.columnasNuevas) L.push(`  ${c.tabla}.${c.columna}`);
    L.push('');
  }

  if (dif.nuevos.length > 0) {
    L.push('---------------------------------------------------------------');
    L.push('  AJUSTES NUEVOS DE ESTA VERSION (apagados salvo que se diga)');
    L.push('---------------------------------------------------------------');
    for (const c of dif.nuevos.slice(0, 200)) {
      L.push(`  ${c.ruta.padEnd(60)} ${valorLegible(c.ruta, c.ahora)}`);
    }
    if (dif.nuevos.length > 200) L.push(`  ... y ${dif.nuevos.length - 200} mas (ver comparacion.json)`);
    L.push('');
  }

  L.push('===============================================================');
  fs.writeFileSync(path.join(salida, 'COMPARACION-AJUSTES.txt'), L.join('\r\n'), 'utf8');
  return todoIgual;
}

// --- Principal --------------------------------------------------------------
async function principal() {
  const argv = process.argv.slice(2);
  const installDir = C.resolverInstallDir(argv);
  const rutas = C.rutasDe(installDir);
  const salida = C.asegurarDir(C.leerArg(argv, '--salida', path.join(rutas.backups, 'ajustes-' + C.sello())));
  const rutaPrevia = C.leerArg(argv, '--comparar');

  const { conn, cfg } = await C.conectar(rutas);
  try {
    const foto = await tomarFoto(conn, cfg, rutas);
    C.escribirJson(path.join(salida, 'ajustes.json'), foto);
    reporteFoto(salida, foto);
    C.log(`Ajustes leidos: ${foto.tiendas.length} tienda(s), ${foto.empresas.length} empresa(s), ${Object.keys(foto.tablas).length} tabla(s) de configuracion`);

    if (rutaPrevia) {
      const antes = C.leerJsonSiExiste(rutaPrevia);
      if (!antes) {
        C.logError(`No se pudo leer la foto previa: ${rutaPrevia}`);
        process.exit(2);
      }
      const dif = comparar(antes, foto);
      C.escribirJson(path.join(salida, 'comparacion.json'), { antes_version: antes.version, ahora_version: foto.version, ...dif });
      const todoIgual = reporteComparacion(salida, antes, foto, dif);
      C.logPaso(todoIgual
        ? 'Los ajustes quedaron IGUALES que antes de actualizar.'
        : `ATENCION: ${dif.cambiados.length} ajuste(s) cambiaron y ${dif.perdidos.length} desaparecieron. Ver COMPARACION-AJUSTES.txt`);
      // Codigo 3 = hay diferencias. El script que llama decide que hacer.
      if (!todoIgual) process.exitCode = 3;
    }

    C.log(`Reporte: ${path.join(salida, 'AJUSTES.txt')}`);
  } finally {
    await conn.end();
  }
}

principal().catch((e) => {
  C.logError(e.message);
  process.exit(1);
});
