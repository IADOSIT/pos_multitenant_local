// =============================================================================
// POS-iaDoS - Exporta TODA la base a un Excel, antes de sobrescribir nada
//
//   node exportar-excel.js --install-dir C:\POS-iaDoS --salida <carpeta>
//                          [--archivo datos-completos.xlsx] [--max-filas 300000]
//
// Esto NO sustituye al respaldo .sql: el .sql es lo que se restaura, el Excel
// es lo que una persona puede abrir y leer sin herramientas. Van juntos a
// proposito, porque "tengo un respaldo" solo sirve si alguien puede comprobar
// que los datos estan ahi.
//
// Se recorren todas las tablas que existan en ese momento (information_schema),
// no una lista fija: si una version trae tablas nuevas, salen solas. Una hoja
// por tabla, mas una hoja RESUMEN al principio con los conteos.
//
// Se escribe en modo streaming (WorkbookWriter) y se leen las filas por bloques:
// el equipo del cliente puede ser modesto y una tabla de ventas con anos de
// operacion no cabe en memoria de golpe.
// =============================================================================
'use strict';

const fs = require('fs');
const path = require('path');
const C = require('./comun');

const BLOQUE = 2000;          // filas por consulta
const TOPE_HOJA = 1000000;    // limite real de Excel: 1,048,576 filas

// Excel prohibe : \ / ? * [ ] en el nombre de la hoja y lo corta en 31.
function nombreHoja(tabla, usados) {
  let base = tabla.replace(/[:\\\/\?\*\[\]]/g, '_');
  if (base.length > 31) base = base.slice(0, 31);
  let n = base;
  let i = 2;
  while (usados.has(n.toLowerCase())) {
    const sufijo = `~${i++}`;
    n = base.slice(0, 31 - sufijo.length) + sufijo;
  }
  usados.add(n.toLowerCase());
  return n;
}

// Un valor de MySQL hecho celda de Excel.
function aCelda(v) {
  if (v === null || v === undefined) return null;
  if (Buffer.isBuffer(v)) return `[binario ${v.length} bytes]`;
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ');
  if (typeof v === 'object') {
    // Las columnas json llegan como objeto; se guardan como texto para que se
    // puedan leer en la celda tal cual estan en la base.
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  if (typeof v === 'string') {
    // Excel interpreta una celda que empieza con = como formula.
    if (/^[=+\-@]/.test(v) && v.length > 1) return `'${v}`;
    // Tope por celda de Excel.
    return v.length > 32000 ? v.slice(0, 32000) + ' [...texto recortado]' : v;
  }
  return v;
}

async function contar(conn, tabla) {
  try {
    const [r] = await conn.query(`SELECT COUNT(*) AS n FROM \`${tabla}\``);
    return Number(r[0].n);
  } catch (e) {
    return -1;
  }
}

// Columna por la que paginar: la llave primaria si hay una sola, si no 'id'.
async function columnaOrden(conn, database, tabla) {
  const [r] = await conn.query(
    `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_KEY = 'PRI'`,
    [database, tabla]
  );
  if (r.length === 1) return r[0].c;
  const [r2] = await conn.query(
    `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'id'`,
    [database, tabla]
  );
  return r2.length ? r2[0].c : null;
}

async function principal() {
  const argv = process.argv.slice(2);
  const installDir = C.resolverInstallDir(argv);
  const rutas = C.rutasDe(installDir);
  const salida = C.asegurarDir(C.leerArg(argv, '--salida', path.join(rutas.backups, 'excel-' + C.sello())));
  const archivo = C.leerArg(argv, '--archivo', 'datos-completos.xlsx');
  const maxFilas = Math.min(TOPE_HOJA, Number(C.leerArg(argv, '--max-filas', '300000')) || 300000);
  const destino = path.join(salida, archivo);

  const ExcelJS = C.requerirDelBackend(rutas, 'exceljs');
  const { conn, cfg } = await C.conectar(rutas);

  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: destino,
    useStyles: true,
    useSharedStrings: false,   // menos memoria con mucho texto
  });
  wb.creator = 'POS-iaDoS';
  wb.created = new Date();

  const resumen = [];
  const usados = new Set();

  try {
    const tablas = await C.listarTablas(conn, cfg.database);
    C.log(`Tablas a exportar: ${tablas.length}`);

    // La hoja RESUMEN se crea primero para que quede como primera pestana,
    // pero se llena al final, cuando ya se conocen los conteos.
    const hojaResumen = wb.addWorksheet('RESUMEN', { views: [{ state: 'frozen', ySplit: 5 }] });
    // Solo anchos: si se declara 'header' aqui, el writer escribe su propia
    // fila de encabezado y saldria duplicada con la que se arma abajo.
    hojaResumen.columns = [
      { width: 38 }, { width: 18 }, { width: 18 }, { width: 34 }, { width: 52 },
    ];

    for (const tabla of tablas) {
      const total = await contar(conn, tabla);
      const hoja = nombreHoja(tabla, usados);

      if (total <= 0) {
        // Se crea la hoja igual: una tabla vacia es informacion (confirma que
        // existe y que no se perdio nada).
        const ws = wb.addWorksheet(hoja);
        const [cols] = await conn.query(
          `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
          [cfg.database, tabla]
        );
        const fila = ws.addRow(cols.map((x) => x.c));
        fila.font = { bold: true };
        fila.commit();
        ws.commit();
        resumen.push({ tabla, filas: Math.max(0, total), exportadas: 0, hoja, nota: total === 0 ? 'Tabla vacia' : 'No se pudo contar' });
        continue;
      }

      const orden = await columnaOrden(conn, cfg.database, tabla);
      const ws = wb.addWorksheet(hoja, { views: [{ state: 'frozen', ySplit: 1 }] });

      let encabezadoPuesto = false;
      let exportadas = 0;
      let offset = 0;
      let nota = '';

      while (exportadas < Math.min(total, maxFilas)) {
        const lim = Math.min(BLOQUE, maxFilas - exportadas);
        const sql = orden
          ? `SELECT * FROM \`${tabla}\` ORDER BY \`${orden}\` LIMIT ${lim} OFFSET ${offset}`
          : `SELECT * FROM \`${tabla}\` LIMIT ${lim} OFFSET ${offset}`;
        let filas;
        try {
          [filas] = await conn.query(sql);
        } catch (e) {
          nota = `Lectura interrumpida: ${e.message}`;
          break;
        }
        if (filas.length === 0) break;

        if (!encabezadoPuesto) {
          const enc = ws.addRow(Object.keys(filas[0]));
          enc.font = { bold: true };
          enc.commit();
          encabezadoPuesto = true;
        }

        for (const f of filas) {
          ws.addRow(Object.keys(f).map((k) => aCelda(f[k]))).commit();
        }

        exportadas += filas.length;
        offset += filas.length;
        if (filas.length < lim) break;
      }

      if (!encabezadoPuesto) {
        const enc = ws.addRow(['(sin filas leidas)']);
        enc.font = { bold: true };
        enc.commit();
      }
      ws.commit();

      if (!nota && exportadas < total) {
        nota = `RECORTADA: solo las primeras ${exportadas.toLocaleString('es-MX')} de ${total.toLocaleString('es-MX')}. El respaldo .sql si las trae todas.`;
      }
      resumen.push({ tabla, filas: total, exportadas, hoja, nota });
      C.log(`  ${tabla}: ${exportadas.toLocaleString('es-MX')} / ${total.toLocaleString('es-MX')}${nota ? '  <- ' + nota : ''}`);
    }

    // --- se llena el RESUMEN ---
    const cab = hojaResumen.addRow([`POS-iaDoS - Exportacion completa de la base`]);
    cab.font = { bold: true, size: 14 };
    cab.commit();
    hojaResumen.addRow([`Fecha: ${C.fechaLegible()}`]).commit();
    hojaResumen.addRow([`Version instalada: ${C.leerVersion(rutas)}`]).commit();
    hojaResumen.addRow([`Base de datos: ${cfg.database}`]).commit();
    hojaResumen.addRow([]).commit();
    const enc = hojaResumen.addRow(['Tabla', 'Filas en la base', 'Filas en el Excel', 'Hoja', 'Observacion']);
    enc.font = { bold: true };
    enc.commit();
    for (const r of resumen.slice().sort((a, b) => b.filas - a.filas)) {
      hojaResumen.addRow([r.tabla, r.filas, r.exportadas, r.hoja, r.nota]).commit();
    }
    hojaResumen.addRow([]).commit();
    const totFilas = resumen.reduce((t, r) => t + Math.max(0, r.filas), 0);
    const totExp = resumen.reduce((t, r) => t + r.exportadas, 0);
    const tot = hojaResumen.addRow(['TOTAL', totFilas, totExp, '', totExp === totFilas ? 'Se exporto el 100%' : 'Hay tablas recortadas, ver arriba']);
    tot.font = { bold: true };
    tot.commit();
    hojaResumen.commit();

    await wb.commit();

    const bytes = fs.existsSync(destino) ? fs.statSync(destino).size : 0;
    C.escribirJson(path.join(salida, 'excel.json'), {
      fecha: C.fechaLegible(),
      version: C.leerVersion(rutas),
      archivo: destino,
      bytes,
      tablas: resumen.length,
      filas_en_base: totFilas,
      filas_exportadas: totExp,
      completo: totExp === totFilas,
      detalle: resumen,
    });

    C.logPaso(`Excel listo: ${destino}`);
    C.log(`${resumen.length} tablas, ${totExp.toLocaleString('es-MX')} de ${totFilas.toLocaleString('es-MX')} filas, ${(bytes / 1048576).toFixed(1)} MB`);
    if (totExp !== totFilas) {
      C.log('Algunas tablas se recortaron por el limite de Excel; el respaldo .sql trae todo.');
    }
  } finally {
    await conn.end();
  }
}

principal().catch((e) => {
  C.logError(e.message);
  process.exit(1);
});
