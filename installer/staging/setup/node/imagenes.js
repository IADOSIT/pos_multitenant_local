// =============================================================================
// POS-iaDoS - Inventario y reparacion de las URL de imagenes
//
//   node imagenes.js --install-dir C:\POS-iaDoS --salida <carpeta> [--arreglar]
//
// Sin --arreglar solo levanta inventario y no escribe una sola fila en la base.
// Con --arreglar deja las URL apuntando a la redireccion correcta.
//
// REGLA QUE NO SE ROMPE: ninguna URL se borra ni se vacia nunca. Si una imagen
// no se puede recuperar, la URL se queda EXACTAMENTE como estaba y el caso sale
// reportado. Es preferible una imagen rota y reportada que un dato perdido en
// silencio.
//
// Por que hay que "ajustar la redireccion":
//   - El backend sirve los archivos en /api/uploads (main.ts) y el frontend les
//     pega el origen en tiempo de ejecucion (resolveUploadUrl). Por eso la URL
//     RELATIVA '/api/uploads/x.jpg' es la unica que sobrevive a un cambio de
//     equipo, de IP o de puerto.
//   - Una URL absoluta ('http://192.168.1.50:3000/api/uploads/x.jpg') se rompe
//     en cuanto cambia la IP o el puerto -> se normaliza a relativa.
//   - Una URL externa (ej. images.pexels.com, que el buscador de imagenes del
//     admin guarda tal cual) no existe sin internet -> se descarga al equipo y
//     se vuelve relativa, para que el negocio offline la siga viendo.
// =============================================================================
'use strict';

const fs = require('fs');
const path = require('path');
const C = require('./comun');

// Cada entrada es un lugar donde el sistema guarda una URL de imagen.
// 'tipo' decide como se lee y como se escribe:
//   texto      -> columna varchar con una URL
//   jsonArray  -> columna json con un arreglo de URL (string[])
//   jsonRuta   -> columna json donde las URL viven en una propiedad anidada
const LUGARES = [
  { tabla: 'productos',                   columna: 'imagen_url',      tipo: 'texto',     etiqueta: 'Imagen del producto' },
  { tabla: 'categorias',                  columna: 'imagen_url',      tipo: 'texto',     etiqueta: 'Imagen de la categoria' },
  { tabla: 'empresas',                    columna: 'logo_url',        tipo: 'texto',     etiqueta: 'Logo de la empresa' },
  { tabla: 'tenants',                     columna: 'logo_url',        tipo: 'texto',     etiqueta: 'Logo del tenant' },
  { tabla: 'ticket_configs',              columna: 'logo_url',        tipo: 'texto',     etiqueta: 'Logo del ticket' },
  { tabla: 'empleados',                   columna: 'imagen_url',      tipo: 'texto',     etiqueta: 'Foto del empleado' },
  { tabla: 'ecommerce_configs',           columna: 'banner_url',      tipo: 'texto',     etiqueta: 'Banner de la tienda en linea' },
  { tabla: 'ecommerce_producto_configs',  columna: 'imagenes_extra',  tipo: 'jsonArray', etiqueta: 'Imagenes extra del producto' },
  { tabla: 'ecommerce_configs',           columna: 'preferencias',    tipo: 'jsonRuta',  etiqueta: 'Banners de la tienda en linea', ruta: ['banners'] },
];

const EXT_VALIDAS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];

// --- Clasificacion ----------------------------------------------------------
// relativa_ok        la URL es relativa y el archivo esta en disco -> perfecta
// relativa_huerfana  la URL es relativa pero el archivo no esta -> se reporta
// absoluta_local     trae host/puerto pero apunta a /api/uploads -> se normaliza
// externa            vive en internet -> se descarga y se vuelve relativa
// embebida           data:image/...;base64 -> se deja, ya viaja en la base
// otra               no se reconoce -> se deja intacta y se reporta
function clasificar(url, rutas) {
  const u = String(url).trim();
  if (!u) return { clase: 'vacia' };

  if (u.startsWith('data:')) return { clase: 'embebida' };

  if (/^https?:\/\//i.test(u)) {
    let parsed;
    try { parsed = new URL(u); } catch (e) { return { clase: 'otra', motivo: 'URL mal formada' }; }
    // Absoluta que apunta a los uploads del propio sistema: el nombre de
    // archivo es lo unico que importa, el origen se descarta.
    if (/^\/api\/uploads\//i.test(parsed.pathname) || /^\/uploads\//i.test(parsed.pathname)) {
      const nombre = path.basename(decodeURIComponent(parsed.pathname));
      return { clase: 'absoluta_local', nombre, destino: `/api/uploads/${nombre}` };
    }
    return { clase: 'externa', host: parsed.host };
  }

  if (u.startsWith('/api/uploads/') || u.startsWith('/uploads/')) {
    const nombre = path.basename(decodeURIComponent(u.split('?')[0]));
    const enUploads = fs.existsSync(path.join(rutas.uploads, nombre));
    const enBuiltin = fs.existsSync(path.join(rutas.uploadsBuiltin, nombre));
    if (enUploads || enBuiltin) {
      // Se normaliza el prefijo: '/uploads/x' tambien se sirve, pero
      // '/api/uploads/x' es el formato que genera el sistema hoy.
      const destino = `/api/uploads/${nombre}`;
      return { clase: 'relativa_ok', nombre, builtin: !enUploads && enBuiltin, destino: destino !== u ? destino : null };
    }
    return { clase: 'relativa_huerfana', nombre };
  }

  return { clase: 'otra', motivo: 'No parece una ruta de uploads' };
}

// --- Descarga de una imagen externa ----------------------------------------
// fetch viene en node 20, no hace falta ninguna dependencia extra.
async function descargar(url, rutas, prefijo) {
  const ctrl = new AbortController();
  const corte = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) return { ok: false, motivo: `HTTP ${res.status}` };

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return { ok: false, motivo: 'respuesta vacia' };
    if (buf.length > 12 * 1024 * 1024) return { ok: false, motivo: 'archivo mayor a 12 MB' };

    // La extension sale del content-type y, si no, de la propia URL.
    const ct = String(res.headers.get('content-type') || '').toLowerCase();
    let ext = ct.includes('png') ? '.png'
      : ct.includes('webp') ? '.webp'
      : ct.includes('gif') ? '.gif'
      : ct.includes('jpeg') || ct.includes('jpg') ? '.jpg'
      : '';
    if (!ext) {
      try {
        const p = path.extname(new URL(url).pathname).toLowerCase();
        if (EXT_VALIDAS.includes(p)) ext = p === '.jpeg' ? '.jpg' : p;
      } catch (e) { /* se queda sin extension y cae al .jpg de abajo */ }
    }
    if (!ext) ext = '.jpg';

    // Mismo formato de nombre que genera el backend (upload-image.util.ts),
    // para que estos archivos no se distingan de los que sube el usuario.
    const nombre = `${prefijo}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}${ext}`;
    C.asegurarDir(rutas.uploads);
    fs.writeFileSync(path.join(rutas.uploads, nombre), buf);
    return { ok: true, nombre, destino: `/api/uploads/${nombre}`, bytes: buf.length };
  } catch (e) {
    return { ok: false, motivo: e.name === 'AbortError' ? 'tiempo de espera agotado' : e.message };
  } finally {
    clearTimeout(corte);
  }
}

// --- Existencia de tabla / columna ------------------------------------------
async function existeColumna(conn, database, tabla, columna) {
  const [r] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, tabla, columna]
  );
  return Number(r[0].n) > 0;
}

// --- Recorrido de un lugar --------------------------------------------------
async function revisarLugar(ctx, lugar) {
  const { conn, cfg, rutas, arreglar, hallazgos, cambios } = ctx;

  // La version instalada en el cliente puede ser anterior a alguna de estas
  // tablas: si no existe, se salta sin ruido.
  if (!(await existeColumna(conn, cfg.database, lugar.tabla, lugar.columna))) {
    return { tabla: lugar.tabla, columna: lugar.columna, existe: false, revisadas: 0 };
  }

  const [filas] = await conn.query(
    `SELECT \`id\`, \`${lugar.columna}\` AS valor FROM \`${lugar.tabla}\``
  );

  let revisadas = 0;
  for (const fila of filas) {
    if (lugar.tipo === 'texto') {
      if (!fila.valor) continue;
      revisadas++;
      const r = await procesarUrl(ctx, lugar, fila.id, String(fila.valor), null);
      if (r && arreglar) {
        await conn.query(
          `UPDATE \`${lugar.tabla}\` SET \`${lugar.columna}\` = ? WHERE \`id\` = ?`,
          [r, fila.id]
        );
        cambios.push({ tabla: lugar.tabla, id: fila.id, columna: lugar.columna, de: String(fila.valor), a: r });
      }
      continue;
    }

    // --- columnas json ---
    const json = C.comoJson(fila.valor);
    if (!json) continue;

    let lista = null;
    if (lugar.tipo === 'jsonArray') {
      lista = Array.isArray(json) ? json : null;
    } else {
      let nodo = json;
      for (const paso of lugar.ruta) nodo = nodo && nodo[paso];
      lista = Array.isArray(nodo) ? nodo : null;
    }
    if (!lista || lista.length === 0) continue;

    let huboCambio = false;
    const nueva = [];
    for (let i = 0; i < lista.length; i++) {
      const item = lista[i];
      // Los banners pueden ser objetos {imagen_url, texto, ...} o strings.
      const esObjeto = item && typeof item === 'object' && !Array.isArray(item);
      const claveUrl = esObjeto
        ? ['imagen_url', 'url', 'imagen', 'src'].find((k) => typeof item[k] === 'string' && item[k])
        : null;
      const url = esObjeto ? (claveUrl ? item[claveUrl] : null) : (typeof item === 'string' ? item : null);

      if (!url) { nueva.push(item); continue; }
      revisadas++;
      const r = await procesarUrl(ctx, lugar, fila.id, String(url), i);
      if (r) {
        huboCambio = true;
        if (esObjeto) nueva.push(Object.assign({}, item, { [claveUrl]: r }));
        else nueva.push(r);
      } else {
        nueva.push(item);
      }
    }

    if (huboCambio && arreglar) {
      let aGuardar;
      if (lugar.tipo === 'jsonArray') {
        aGuardar = nueva;
      } else {
        // Se reescribe solo la rama de las URL; el resto de preferencias
        // (promociones, envio_gratis, etc.) se conserva intacto.
        aGuardar = JSON.parse(JSON.stringify(json));
        let nodo = aGuardar;
        for (let k = 0; k < lugar.ruta.length - 1; k++) nodo = nodo[lugar.ruta[k]];
        nodo[lugar.ruta[lugar.ruta.length - 1]] = nueva;
      }
      await conn.query(
        `UPDATE \`${lugar.tabla}\` SET \`${lugar.columna}\` = ? WHERE \`id\` = ?`,
        [JSON.stringify(aGuardar), fila.id]
      );
      cambios.push({
        tabla: lugar.tabla, id: fila.id, columna: lugar.columna,
        de: JSON.stringify(json), a: JSON.stringify(aGuardar),
      });
    }
  }

  return { tabla: lugar.tabla, columna: lugar.columna, existe: true, revisadas };
}

// Devuelve la URL nueva si hay que escribirla, o null si se deja como esta.
async function procesarUrl(ctx, lugar, id, url, indice) {
  const { rutas, arreglar, hallazgos, resumen } = ctx;
  const cl = clasificar(url, rutas);
  const base = {
    tabla: lugar.tabla, columna: lugar.columna, id,
    indice, etiqueta: lugar.etiqueta, url_original: url, clase: cl.clase,
  };

  resumen[cl.clase] = (resumen[cl.clase] || 0) + 1;

  switch (cl.clase) {
    case 'relativa_ok':
      // Caso sano. Solo se toca si hay que normalizar '/uploads' a '/api/uploads'.
      if (cl.destino) {
        hallazgos.push(Object.assign(base, { accion: 'normalizar_prefijo', url_nueva: cl.destino, archivo: cl.nombre }));
        return arreglar ? cl.destino : null;
      }
      if (cl.builtin) {
        hallazgos.push(Object.assign(base, { accion: 'ninguna', nota: 'El archivo vive en uploads-builtin (viene con el sistema)', archivo: cl.nombre }));
      }
      return null;

    case 'absoluta_local':
      // Se normaliza solo si el archivo esta de verdad en disco. Si no esta,
      // quitarle el host convertiria una URL quiza viva en una rota.
      if (fs.existsSync(path.join(rutas.uploads, cl.nombre)) || fs.existsSync(path.join(rutas.uploadsBuiltin, cl.nombre))) {
        hallazgos.push(Object.assign(base, { accion: 'volver_relativa', url_nueva: cl.destino, archivo: cl.nombre }));
        return arreglar ? cl.destino : null;
      }
      hallazgos.push(Object.assign(base, {
        accion: 'ninguna',
        nota: 'Trae host fijo y el archivo no esta en disco. Se deja igual para no romper lo que quiza aun responda.',
        archivo: cl.nombre,
      }));
      return null;

    case 'externa': {
      if (!arreglar) {
        hallazgos.push(Object.assign(base, {
          accion: 'descargar',
          nota: `Imagen en ${cl.host}: sin internet no se ve. Se puede traer al equipo.`,
        }));
        return null;
      }
      const prefijo = lugar.tabla.replace(/_/g, '-').slice(0, 20);
      const d = await descargar(url, rutas, prefijo);
      if (d.ok) {
        hallazgos.push(Object.assign(base, { accion: 'descargada', url_nueva: d.destino, archivo: d.nombre, bytes: d.bytes }));
        resumen.descargadas = (resumen.descargadas || 0) + 1;
        return d.destino;
      }
      // No se pudo bajar: la URL original se queda. Nunca se vacia.
      hallazgos.push(Object.assign(base, {
        accion: 'ninguna',
        nota: `No se pudo descargar (${d.motivo}). La URL original se conserva sin cambios.`,
      }));
      resumen.descargas_falladas = (resumen.descargas_falladas || 0) + 1;
      return null;
    }

    case 'relativa_huerfana':
      hallazgos.push(Object.assign(base, {
        accion: 'ninguna',
        nota: 'La base apunta a este archivo pero no esta en uploads. La URL se conserva: si el archivo reaparece, la imagen vuelve sola.',
        archivo: cl.nombre,
      }));
      return null;

    case 'embebida':
      return null;

    default:
      hallazgos.push(Object.assign(base, { accion: 'ninguna', nota: cl.motivo || 'Formato no reconocido. Se deja intacta.' }));
      return null;
  }
}

// --- Archivos en disco que la base ya no menciona ---------------------------
// No se borran: se cuentan, para que el respaldo de uploads se pueda comparar.
function archivosEnDisco(rutas) {
  try {
    return fs.readdirSync(rutas.uploads, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name);
  } catch (e) {
    return [];
  }
}

// --- Reporte legible --------------------------------------------------------
function escribirReporte(salida, datos) {
  const L = [];
  const r = datos.resumen;
  L.push('===============================================================');
  L.push('  IMAGENES - ' + (datos.modo === 'arreglar' ? 'REPARACION APLICADA' : 'INVENTARIO (sin cambios)'));
  L.push('  ' + datos.fecha + '   version ' + datos.version);
  L.push('===============================================================');
  L.push('');
  L.push(`  URL encontradas en la base : ${datos.total_urls}`);
  L.push(`  Archivos en uploads        : ${datos.archivos_en_disco}`);
  L.push('');
  L.push('  Estado de las URL:');
  L.push(`    Correctas (relativas, archivo presente) : ${r.relativa_ok || 0}`);
  L.push(`    Con host fijo (se vuelven relativas)    : ${r.absoluta_local || 0}`);
  L.push(`    En internet (se descargan al equipo)    : ${r.externa || 0}`);
  L.push(`    Sin archivo en disco                    : ${r.relativa_huerfana || 0}`);
  L.push(`    Incrustadas en la base (base64)         : ${r.embebida || 0}`);
  L.push(`    Formato no reconocido                   : ${r.otra || 0}`);
  L.push('');
  if (datos.modo === 'arreglar') {
    L.push(`  Imagenes descargadas al equipo : ${r.descargadas || 0}`);
    L.push(`  Descargas que no se lograron   : ${r.descargas_falladas || 0}`);
    L.push(`  Filas actualizadas             : ${datos.cambios.length}`);
    L.push('');
    L.push('  Ninguna URL fue borrada ni vaciada.');
    L.push('  El valor anterior de cada fila modificada quedo guardado en');
    L.push('  urls-antes.json, por si hubiera que devolverlas una por una.');
  } else {
    const porHacer = (r.absoluta_local || 0) + (r.externa || 0);
    L.push(porHacer > 0
      ? `  ${porHacer} URL se pueden mejorar. Corre el mantenimiento con la opcion`
      : '  No hay nada que ajustar: todas las URL ya estan en el formato bueno.');
    if (porHacer > 0) L.push('  de arreglar imagenes para aplicarlo.');
  }
  L.push('');

  const pendientes = datos.hallazgos.filter((h) => h.accion === 'ninguna' && h.clase !== 'embebida');
  if (pendientes.length > 0) {
    L.push('---------------------------------------------------------------');
    L.push('  CASOS QUE QUEDAN POR REVISAR A MANO (nada se perdio)');
    L.push('---------------------------------------------------------------');
    for (const h of pendientes.slice(0, 200)) {
      L.push('');
      L.push(`  ${h.etiqueta} - ${h.tabla} id ${h.id}`);
      L.push(`    URL  : ${h.url_original.slice(0, 150)}`);
      L.push(`    Nota : ${h.nota || ''}`);
    }
    if (pendientes.length > 200) {
      L.push('');
      L.push(`  ... y ${pendientes.length - 200} casos mas. El detalle completo esta en imagenes.json`);
    }
    L.push('');
  }

  L.push('===============================================================');
  fs.writeFileSync(path.join(salida, 'IMAGENES.txt'), L.join('\r\n'), 'utf8');
}

// --- Principal --------------------------------------------------------------
async function principal() {
  const argv = process.argv.slice(2);
  const installDir = C.resolverInstallDir(argv);
  const rutas = C.rutasDe(installDir);
  const arreglar = C.tieneFlag(argv, '--arreglar');
  const salida = C.asegurarDir(C.leerArg(argv, '--salida', path.join(rutas.backups, 'imagenes-' + C.sello())));

  C.log(`Base de datos : ${rutas.env}`);
  C.log(`Uploads       : ${rutas.uploads}`);
  C.log(`Modo          : ${arreglar ? 'ARREGLAR (escribe en la base)' : 'INVENTARIO (solo lectura)'}`);

  const { conn, cfg } = await C.conectar(rutas);
  const ctx = {
    conn, cfg, rutas, arreglar,
    hallazgos: [], cambios: [], resumen: {},
  };

  try {
    const porLugar = [];
    for (const lugar of LUGARES) {
      const r = await revisarLugar(ctx, lugar);
      porLugar.push(r);
      if (r.existe) C.log(`  ${lugar.tabla}.${lugar.columna}: ${r.revisadas} URL`);
      else C.log(`  ${lugar.tabla}.${lugar.columna}: no existe en esta version (se omite)`);
    }

    const enDisco = archivosEnDisco(rutas);
    const total = Object.entries(ctx.resumen)
      .filter(([k]) => !['descargadas', 'descargas_falladas'].includes(k))
      .reduce((t, [, v]) => t + v, 0);

    const datos = {
      modo: arreglar ? 'arreglar' : 'inventario',
      fecha: C.fechaLegible(),
      version: C.leerVersion(rutas),
      install_dir: installDir,
      total_urls: total,
      archivos_en_disco: enDisco.length,
      resumen: ctx.resumen,
      por_lugar: porLugar,
      hallazgos: ctx.hallazgos,
      cambios: ctx.cambios,
    };

    C.escribirJson(path.join(salida, 'imagenes.json'), datos);
    // El antes de cada fila tocada, aparte y en un archivo chico: es lo que
    // permite devolver una URL concreta sin restaurar toda la base.
    if (ctx.cambios.length > 0) {
      C.escribirJson(path.join(salida, 'urls-antes.json'), {
        fecha: datos.fecha,
        nota: 'Valor anterior de cada fila modificada por el arreglo de imagenes.',
        cambios: ctx.cambios,
      });
    }
    escribirReporte(salida, datos);

    C.logPaso(`URL revisadas: ${total}   correctas: ${ctx.resumen.relativa_ok || 0}`);
    if (arreglar) {
      C.log(`Descargadas: ${ctx.resumen.descargadas || 0}   filas actualizadas: ${ctx.cambios.length}`);
      if (ctx.resumen.descargas_falladas) {
        C.log(`Sin descargar (URL conservada): ${ctx.resumen.descargas_falladas}`);
      }
    }
    C.log(`Reporte: ${path.join(salida, 'IMAGENES.txt')}`);
  } finally {
    await conn.end();
  }
}

principal().catch((e) => {
  C.logError(e.message);
  process.exit(1);
});
