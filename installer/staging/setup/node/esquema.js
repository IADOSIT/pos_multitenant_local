/* =============================================================================
 *  POS-iaDoS - FOTOGRAFIA Y COMPARACION DEL ESQUEMA
 *
 *  Dos modos:
 *
 *  1) Tomar la foto de una base (tablas, columnas, indices y conteo real de
 *     filas de cada tabla):
 *
 *       node esquema.js --install-dir C:\POS-iaDoS --archivo antes.json
 *       node esquema.js --install-dir C:\POS-iaDoS --base pos_ensayo_1 --archivo despues.json
 *
 *  2) Comparar dos fotos y decir si se PERDIO algo:
 *
 *       node esquema.js --comparar antes.json --contra despues.json --salida ESQUEMA.txt
 *
 *  Codigos de salida del modo comparar:
 *       0  identico
 *       3  solo hubo agregados (tablas/columnas nuevas): es lo normal al subir version
 *       2  HAY PERDIDA (tabla o columna que desaparecio, tipo que se encogio,
 *          o una tabla con menos filas que antes)  ->  NO ACTUALIZAR
 *       1  error de ejecucion
 *
 *  El codigo 2 es el que importa: es la unica manera de saber, ANTES de tocar
 *  la instalacion real, que la version nueva se iba a llevar datos del cliente.
 * ========================================================================== */

const fs = require('fs');
const path = require('path');
const C = require('./comun');

const argv = process.argv.slice(2);

// --- helpers de tipo --------------------------------------------------------

// Longitud declarada de un tipo: varchar(120) -> 120, decimal(10,2) -> 10.
// Sirve para detectar que un tipo se ENCOGIO, que es perdida silenciosa.
function largoDe(tipo) {
  const m = String(tipo || '').match(/\((\d+)/);
  return m ? Number(m[1]) : null;
}

function familiaDe(tipo) {
  return String(tipo || '').replace(/\(.*$/, '').trim().toLowerCase();
}

// =============================================================================
//  MODO 1: tomar la foto
// =============================================================================
async function capturar() {
  const installDir = C.resolverInstallDir(argv);
  const rutas = C.rutasDe(installDir);
  const archivo = C.leerArg(argv, '--archivo');
  if (!archivo) throw new Error('Falta --archivo <ruta.json> donde guardar la foto.');

  const env = C.leerEnv(rutas.env);
  const cfg = C.datosConexion(env);

  // --base permite fotografiar una base DISTINTA a la del .env. Es lo que hace
  // posible el ensayo: la copia de prueba vive en otra base y el .env sigue
  // apuntando a la de produccion, que no se toca.
  const base = C.leerArg(argv, '--base');
  if (base) cfg.database = base;

  const mysql = C.requerirDelBackend(rutas, 'mysql2/promise');
  const conn = await mysql.createConnection(cfg);

  const foto = {
    generado: C.fechaLegible(),
    base: cfg.database,
    version_instalada: C.leerVersion(rutas),
    tablas: {},
  };

  try {
    const [tablas] = await conn.query(
      `SELECT TABLE_NAME AS t, ENGINE AS motor, TABLE_COLLATION AS colacion
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME`,
      [cfg.database]
    );
    if (!tablas.length) {
      throw new Error(`La base '${cfg.database}' no tiene ni una tabla. No hay nada que fotografiar.`);
    }

    const [columnas] = await conn.query(
      `SELECT TABLE_NAME AS t, COLUMN_NAME AS c, COLUMN_TYPE AS tipo,
              IS_NULLABLE AS nulo, COLUMN_DEFAULT AS omision,
              COLUMN_KEY AS llave, EXTRA AS extra, ORDINAL_POSITION AS pos
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [cfg.database]
    );

    const [indices] = await conn.query(
      `SELECT TABLE_NAME AS t, INDEX_NAME AS i, NON_UNIQUE AS no_unico,
              SEQ_IN_INDEX AS orden, COLUMN_NAME AS c
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
      [cfg.database]
    );

    for (const t of tablas) {
      foto.tablas[t.t] = {
        motor: t.motor || '',
        colacion: t.colacion || '',
        columnas: {},
        indices: {},
        filas: null,
      };
    }

    for (const col of columnas) {
      const tabla = foto.tablas[col.t];
      if (!tabla) continue;
      tabla.columnas[col.c] = {
        tipo: col.tipo,
        nulo: col.nulo,
        omision: col.omision === null ? null : String(col.omision),
        llave: col.llave || '',
        extra: col.extra || '',
        pos: Number(col.pos),
      };
    }

    for (const ix of indices) {
      const tabla = foto.tablas[ix.t];
      if (!tabla) continue;
      if (!tabla.indices[ix.i]) {
        tabla.indices[ix.i] = { unico: Number(ix.no_unico) === 0, columnas: [] };
      }
      tabla.indices[ix.i].columnas.push(ix.c);
    }

    // Conteo REAL, no la estimacion de information_schema: con InnoDB el campo
    // TABLE_ROWS miente hasta en 50%, y aqui hace falta saber si se perdieron
    // filas, no aproximarlo.
    let totalFilas = 0;
    for (const nombre of Object.keys(foto.tablas)) {
      try {
        const [r] = await conn.query(
          `SELECT COUNT(*) AS n FROM \`${cfg.database}\`.\`${nombre}\``
        );
        const n = Number(r[0].n);
        foto.tablas[nombre].filas = n;
        totalFilas += n;
      } catch (e) {
        foto.tablas[nombre].filas = null;
        foto.tablas[nombre].error_conteo = e.message;
      }
    }

    foto.resumen = {
      tablas: Object.keys(foto.tablas).length,
      columnas: columnas.length,
      filas: totalFilas,
    };
  } finally {
    try { await conn.end(); } catch (e) { /* ya cerrada */ }
  }

  C.asegurarDir(path.dirname(path.resolve(archivo)));
  C.escribirJson(archivo, foto);

  C.log(`Foto de '${foto.base}': ${foto.resumen.tablas} tablas, ` +
        `${foto.resumen.columnas} columnas, ${foto.resumen.filas} filas`);
  C.log(`Guardada en ${archivo}`);
  return 0;
}

// =============================================================================
//  MODO 2: comparar dos fotos
// =============================================================================
function comparar() {
  const rutaAntes  = C.leerArg(argv, '--comparar');
  const rutaDesp   = C.leerArg(argv, '--contra');
  const salida     = C.leerArg(argv, '--salida');
  if (!rutaAntes || !rutaDesp) {
    throw new Error('Faltan --comparar <antes.json> y --contra <despues.json>.');
  }

  const antes   = JSON.parse(fs.readFileSync(rutaAntes, 'utf8').replace(/^\uFEFF/, ''));
  const despues = JSON.parse(fs.readFileSync(rutaDesp, 'utf8').replace(/^\uFEFF/, ''));

  const perdidas  = [];   // esto cancela la actualizacion
  const agregados = [];   // esto es lo esperado
  const avisos    = [];   // cambios que conviene leer pero no pierden datos

  const tAntes = Object.keys(antes.tablas || {});
  const tDesp  = Object.keys(despues.tablas || {});

  for (const t of tAntes) {
    if (!tDesp.includes(t)) {
      const filas = antes.tablas[t].filas;
      perdidas.push(`TABLA PERDIDA: '${t}' existia antes` +
        (filas === null ? '' : ` con ${filas} filas`) + ' y ya no esta.');
    }
  }
  for (const t of tDesp) {
    if (!tAntes.includes(t)) agregados.push(`Tabla nueva: '${t}'`);
  }

  for (const t of tAntes) {
    if (!tDesp.includes(t)) continue;
    const a = antes.tablas[t];
    const d = despues.tablas[t];

    const cAntes = Object.keys(a.columnas || {});
    const cDesp  = Object.keys(d.columnas || {});

    for (const c of cAntes) {
      if (!cDesp.includes(c)) {
        perdidas.push(`COLUMNA PERDIDA: '${t}.${c}' (${a.columnas[c].tipo}) desaparecio.`);
      }
    }
    for (const c of cDesp) {
      if (!cAntes.includes(c)) {
        const col = d.columnas[c];
        const puedeNulo = col.nulo === 'YES' || col.omision !== null ||
                          /auto_increment/i.test(col.extra || '');
        agregados.push(`Columna nueva: '${t}.${c}' ${col.tipo}` +
          (puedeNulo ? '' : '  <- OJO: NOT NULL sin valor por omision'));
        if (!puedeNulo && (a.filas || 0) > 0) {
          avisos.push(`'${t}.${c}' entra como NOT NULL sin valor por omision en una ` +
            `tabla que ya tiene ${a.filas} filas: MariaDB le pondra el valor vacio a ` +
            `las filas viejas. Revisa que eso no cambie lo que ve el cliente.`);
        }
      }
    }

    // --- cambios de tipo ---
    for (const c of cAntes) {
      if (!cDesp.includes(c)) continue;
      const ta = a.columnas[c].tipo;
      const td = d.columnas[c].tipo;
      if (ta === td) continue;

      const la = largoDe(ta);
      const ld = largoDe(td);
      const fa = familiaDe(ta);
      const fd = familiaDe(td);

      if (la !== null && ld !== null && fa === fd && ld < la) {
        perdidas.push(`TIPO ENCOGIDO: '${t}.${c}' pasa de ${ta} a ${td}. ` +
          `Lo que no quepa se corta y eso SI borra datos.`);
      } else if (a.columnas[c].nulo === 'YES' && d.columnas[c].nulo === 'NO') {
        avisos.push(`'${t}.${c}' deja de aceptar vacios (${ta} -> ${td}). ` +
          `Si hay filas con ese campo vacio, la migracion las va a rellenar.`);
      } else {
        avisos.push(`Tipo cambiado: '${t}.${c}' ${ta} -> ${td}`);
      }
    }

    // --- filas ---
    if (typeof a.filas === 'number' && typeof d.filas === 'number' && d.filas < a.filas) {
      perdidas.push(`FILAS PERDIDAS: '${t}' tenia ${a.filas} filas y quedaron ${d.filas}.`);
    }

    // --- indices unicos nuevos: no borran, pero pueden tumbar el arranque ---
    for (const i of Object.keys(d.indices || {})) {
      if ((a.indices || {})[i]) continue;
      if (d.indices[i].unico) {
        avisos.push(`Indice unico nuevo en '${t}': ${i} (${d.indices[i].columnas.join(', ')}). ` +
          `Si los datos de hoy tienen repetidos, el arranque falla ahi.`);
      }
    }
  }

  // --- veredicto ---
  let codigo = 0;
  let veredicto = 'IDENTICO: la version nueva no cambio el esquema.';
  if (perdidas.length) {
    codigo = 2;
    veredicto = 'NO ACTUALIZAR: la version nueva PIERDE datos del cliente.';
  } else if (agregados.length) {
    codigo = 3;
    veredicto = 'SEGURO: solo se agregaron cosas, nada se perdio.';
  }

  const L = [];
  L.push('==============================================================');
  L.push('  POS-iaDoS - COMPARACION DEL ESQUEMA');
  L.push('==============================================================');
  L.push('');
  L.push(`  Fecha:            ${C.fechaLegible()}`);
  L.push(`  Base de hoy:      ${antes.base} (version ${antes.version_instalada})`);
  L.push(`  Base del ensayo:  ${despues.base}`);
  L.push('');
  L.push(`  VEREDICTO: ${veredicto}`);
  L.push('');
  L.push(`  Antes:   ${antes.resumen.tablas} tablas, ${antes.resumen.columnas} columnas, ${antes.resumen.filas} filas`);
  L.push(`  Despues: ${despues.resumen.tablas} tablas, ${despues.resumen.columnas} columnas, ${despues.resumen.filas} filas`);
  L.push('');

  L.push('--------------------------------------------------------------');
  L.push(`  PERDIDAS (${perdidas.length})`);
  L.push('--------------------------------------------------------------');
  if (!perdidas.length) {
    L.push('  Ninguna. No desaparecio ninguna tabla, ninguna columna y');
    L.push('  ninguna tabla quedo con menos filas que antes.');
  } else {
    for (const p of perdidas) L.push(`  X  ${p}`);
    L.push('');
    L.push('  NO se debe actualizar con esto. Manda este archivo completo.');
  }
  L.push('');

  L.push('--------------------------------------------------------------');
  L.push(`  AGREGADOS (${agregados.length})`);
  L.push('--------------------------------------------------------------');
  if (!agregados.length) L.push('  Ninguno.');
  else for (const g of agregados) L.push(`  +  ${g}`);
  L.push('');

  L.push('--------------------------------------------------------------');
  L.push(`  PARA LEER (${avisos.length})`);
  L.push('--------------------------------------------------------------');
  if (!avisos.length) L.push('  Nada que revisar.');
  else for (const v of avisos) L.push(`  !  ${v}`);
  L.push('');

  const texto = L.join('\r\n');
  if (salida) {
    C.asegurarDir(path.dirname(path.resolve(salida)));
    fs.writeFileSync(salida, texto, 'utf8');
    // El JSON de la diferencia queda al lado, para poder revisarlo con detalle.
    C.escribirJson(
      salida.replace(/\.txt$/i, '') + '.json',
      { veredicto, codigo, perdidas, agregados, avisos }
    );
  }
  console.log(texto);
  return codigo;
}

// =============================================================================
(async () => {
  try {
    const codigo = C.leerArg(argv, '--comparar') ? comparar() : await capturar();
    process.exit(codigo);
  } catch (e) {
    C.logError(e.message);
    process.exit(1);
  }
})();
