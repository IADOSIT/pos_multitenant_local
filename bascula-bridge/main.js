/**
 * POS-iaDoS Bridge Bascula
 * Electron tray app que:
 *  1. Lee el peso en vivo de una bascula conectada por RS-232/USB (serialport)
 *  2. Retransmite el peso al backend via Socket.io (namespace /bascula)
 *  3. Recibe la orden de imprimir etiqueta y la saca por donde este configurada:
 *     ZPL por socket TCP crudo al 9100 de una etiquetadora en red (Zebra/GoDEX/TSC),
 *     o por el driver de Windows a una etiquetadora USB (Brother QL-800 y similares)
 *  4. Abre el cajon de dinero mandando un pulso por un adaptador serial/USB
 *  5. Levanta un PUENTE LOCAL en 127.0.0.1 para que el POS del navegador hable
 *     directo con este equipo SIN pasar por internet (ver "Puente local" abajo)
 *
 * Por que el puente local: la bascula, el cajon y el navegador estan en la MISMA
 * computadora, pero hasta la v1.2 el peso viajaba a la nube y regresaba. En una
 * tienda con internet intermitente eso significaba quedarse sin peso y sin cajon
 * justo cuando mas se necesitan. Ahora la nube es el respaldo, no el camino.
 */

const { app, Tray, Menu, nativeImage, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const net = require('net');
const http = require('http');
const fs = require('fs');
const { io } = require('socket.io-client');
const { SerialPort } = require('serialport');
const { execFile } = require('child_process');
const crypto = require('crypto');

// ── Instancia unica ───────────────────────────────────────────────────────────
// Dos bridges a la vez se pelean por el puerto COM: el segundo no puede abrirlo y
// el kiosko se queda sin peso. Quien llega primero se queda; el segundo abre la
// ventana de configuracion del que ya estaba corriendo y se cierra.
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// ── Log a archivo ────────────────────────────────────────────────────────────
const logFile = path.join(
  app.isPackaged ? path.dirname(process.execPath) : __dirname,
  'bridge.log',
);
// El bridge queda encendido semanas; sin rotar, bridge.log crece sin limite y deja
// de servir para diagnosticar. Al arrancar, si paso de 1 MB se conserva como .old.
try {
  if (fs.existsSync(logFile) && fs.statSync(logFile).size > 1024 * 1024) {
    fs.renameSync(logFile, logFile + '.old');
  }
} catch (_) {}

const _origLog = console.log.bind(console);
const _origWarn = console.warn.bind(console);
const _origErr = console.error.bind(console);
function writeLog(prefix, args) {
  const line = `[${new Date().toISOString()}] ${prefix}${args.map(String).join(' ')}\n`;
  try { fs.appendFileSync(logFile, line); } catch (_) {}
}
console.log = (...a) => { _origLog(...a); writeLog('', a); };
console.warn = (...a) => { _origWarn(...a); writeLog('WARN ', a); };
console.error = (...a) => { _origErr(...a); writeLog('ERR ', a); };

// ── Configuracion ─────────────────────────────────────────────────────────────
// Se resuelve en tres capas, la ultima gana:
//   1. defaults del codigo
//   2. .env junto al ejecutable  (instalaciones viejas, sigue funcionando igual)
//   3. config.json en userData   (lo que se guarda desde la ventana de Configuracion)
// La capa 3 va en userData y no junto al .exe porque una instalacion NSIS queda en
// Program Files, donde el usuario no tiene permiso de escritura.
const DEFAULTS = {
  BACKEND_URL: 'https://posapi.iados.online',
  TIENDA_TOKEN: '',
  // Nombre de ESTA computadora dentro de la tienda: "Caja 1", "Kiosko",
  // "Salchichoneria". Una tienda puede tener varias basculas, una por PC, y todas
  // comparten el mismo TIENDA_TOKEN; esto es lo unico que las distingue cuando el
  // peso sale a la nube. Vacio = "Principal", que es como se comportaban las
  // instalaciones anteriores.
  ESTACION: '',
  SCALE_PORT: '',
  SCALE_BAUD: '9600',
  // Basculas de polling (p.ej. Torrey por USB CDC): no transmiten solas, hay que
  // pedirles el peso. SCALE_POLL_MS=0 deja el comportamiento de flujo continuo.
  SCALE_POLL_CMD: 'P\\r\\n',
  SCALE_POLL_MS: '0',
  // ── Cajon de dinero ──
  // Puerto del adaptador serial/USB conectado al RJ11 del cajon. Vacio = sin cajon,
  // y entonces todo se comporta igual que en las instalaciones que solo traen bascula.
  // Como esta conectado el cajon. Son los dos unicos cableados que existen:
  //   'com'       → adaptador RJ11->USB: el cajon trae su propio puerto COM.
  //   'impresora' → el RJ11 del cajon va al puerto DK de la impresora de tickets,
  //                 y la impresora va por USB a la PC. Ahi no hay COM que abrir:
  //                 el pulso viaja como trabajo RAW por la cola de Windows.
  CAJON_MODO: 'com',
  CAJON_PORT: '',
  CAJON_BAUD: '9600',
  // Nombre EXACTO de la impresora en Windows (solo aplica con CAJON_MODO=impresora)
  CAJON_IMPRESORA: '',
  // ── Etiquetadora USB ──
  // Nombre EXACTO en Windows de la etiquetadora conectada por USB (Brother QL-800 y
  // cualquier otra con driver). Solo se usa cuando la tienda esta en printer_modo='usb'.
  // Se elige aqui, de una lista, y le gana al nombre que venga de la nube: el nombre de
  // una impresora es un dato de ESTA computadora, no de la configuracion del negocio.
  ETIQUETA_IMPRESORA: '',
  // Secuencia que dispara el pulso: una clave de SECUENCIAS_CAJON, o "hex:1B700019FA"
  // para un adaptador raro, sin tener que tocar el codigo.
  CAJON_CMD: 'escpos_pin2',
  // ── Puente local ──
  // Puerto en 127.0.0.1 donde el POS del navegador encuentra a este bridge sin
  // salir a internet.
  PUENTE_PORT: '9333',
};

const appDir = () => (app.isPackaged ? path.dirname(process.execPath) : __dirname);
const configPath = () => path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  const out = { ...DEFAULTS };

  const envPath = path.join(appDir(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const [k, ...v] = t.split('=');
        if (k && v.length) out[k.trim().replace(/^﻿/, '')] = v.join('=').trim();
      }
    } catch (e) { console.warn('[bridge] No se pudo leer .env:', e.message); }
  }

  try {
    if (fs.existsSync(configPath())) {
      const guardado = JSON.parse(fs.readFileSync(configPath(), 'utf8'));
      for (const [k, v] of Object.entries(guardado)) {
        if (v !== null && v !== undefined && String(v) !== '') out[k] = String(v);
      }
    }
  } catch (e) { console.warn('[bridge] config.json ilegible, se ignora:', e.message); }

  return out;
}

function saveConfig(patch) {
  let actual = {};
  try {
    if (fs.existsSync(configPath())) actual = JSON.parse(fs.readFileSync(configPath(), 'utf8'));
  } catch (_) {}
  const nuevo = { ...actual, ...patch };
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(nuevo, null, 2), 'utf8');
  Object.assign(config, loadConfig());
  return nuevo;
}

const FALLBACK_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABiSURBVDiNY/z//z8DJYCJgUIwasCoAaMGjBpAXQMYsSmur69nJNYFjBcuXGDEZzkjMQYwMjIyEusCkgwg2gBiXECyAcS4gGQDiHEByQYQ4wKSDSDGBSQbQIwLSDaAkXIAANiFF5DI3VkAAAAASUVORK5CYII=';

const config = loadConfig();
let tray = null;
let socket = null;
let scalePort = null;
let scaleBuffer = '';
let scalePoller = null;
let scaleReintento = null;
// Generacion de conexion. Cada cierre o reconfiguracion la incrementa, lo que
// invalida cualquier open() que haya quedado en vuelo: si termina despues, se
// da cuenta de que su generacion ya vencio y suelta el puerto en vez de
// quedarselo sin que nadie lo referencie (eso dejaba COMx tomado para siempre
// y todos los reintentos posteriores fallaban con "Access denied").
let scaleGen = 0;
// Candado de "apertura en vuelo": abrir un puerto serial es asincrono, asi que sin
// esto arrancar / guardar la configuracion / el reintento de 10s podian solaparse y
// dejar DOS objetos SerialPort peleandose el mismo COM (en el log se veia cada
// reintento duplicado). Si llega una peticion mientras abrimos, no se crea otro
// puerto: se anota en scaleRelanzar y se reintenta una sola vez al terminar.
let scaleAbriendo = false;
let scaleRelanzar = false;
// Ultimo fallo ya reportado (puerto|mensaje). El bridge reintenta cada 10s para
// siempre; sin esto escribia la misma linea en bridge.log cada 10s toda la noche.
let ultimoFalloBascula = null;
let ultimoFalloSocket = null;
let lastPesoEmitido = null;
let lastPesoEstable = 0;
let configWin = null;
// Cajon: un pulso a la vez. Dos aperturas encimadas abririan el mismo COM dos
// veces y la segunda fallaria con "Access denied".
let cajonOcupado = false;
// Puente local
let servidorLocal = null;
let puenteEscuchandoEn = null;
const sseClientes = new Set();

// Estado que se pinta en la ventana de Configuracion y en el menu de la bandeja.
const estado = {
  backend: 'Iniciando...',
  tienda_id: null,
  bascula: 'Sin abrir',
  puerto: '',
  polling: false,
  peso: null,
  ultimaTrama: '',
  cajon: 'Sin configurar',
  puente: 'Iniciando...',
};

function pushEstado() {
  if (configWin && !configWin.isDestroyed()) {
    configWin.webContents.send('estado', { ...estado, config: configPublica() });
  }
}

// Nunca mandamos el token completo a la ventana ni al log: solo su prefijo.
function configPublica() {
  return {
    BACKEND_URL: config.BACKEND_URL,
    TIENDA_TOKEN: config.TIENDA_TOKEN,
    ESTACION: config.ESTACION,
    SCALE_PORT: config.SCALE_PORT,
    SCALE_BAUD: config.SCALE_BAUD,
    SCALE_POLL_CMD: config.SCALE_POLL_CMD,
    SCALE_POLL_MS: config.SCALE_POLL_MS,
    CAJON_MODO: config.CAJON_MODO,
    CAJON_PORT: config.CAJON_PORT,
    CAJON_BAUD: config.CAJON_BAUD,
    CAJON_IMPRESORA: config.CAJON_IMPRESORA,
    CAJON_CMD: config.CAJON_CMD,
    ETIQUETA_IMPRESORA: config.ETIQUETA_IMPRESORA,
    PUENTE_PORT: config.PUENTE_PORT,
  };
}

// ── Socket.io -> backend (namespace /bascula) ─────────────────────────────────
function connectSocket() {
  if (socket) { try { socket.removeAllListeners(); socket.disconnect(); } catch (_) {} socket = null; }

  if (!config.TIENDA_TOKEN) {
    estado.backend = 'Falta el token de la tienda';
    updateTray(estado.backend);
    pushEstado();
    return;
  }

  socket = io(`${config.BACKEND_URL}/bascula`, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 5000,
  });

  socket.on('connect', () => {
    ultimoFalloSocket = null; // se recupero: el proximo corte si se registra
    socket.emit('bridge-join', {
      tienda_token: config.TIENDA_TOKEN,
      estacion: config.ESTACION,
    });
    console.log('[bridge] Conectado al backend, tienda_token:', config.TIENDA_TOKEN.substring(0, 8) + '...');
  });

  socket.on('bridge-welcome', ({ tienda_id }) => {
    console.log('[bridge] bridge-welcome tienda_id=', tienda_id);
    estado.backend = 'Conectado';
    estado.tienda_id = tienda_id;
    updateTray('Conectado — esperando peso');
    pushEstado();
  });

  socket.on('bridge-error', ({ message }) => {
    console.warn('[bridge] bridge-error:', message);
    estado.backend = 'Error: ' + message;
    updateTray('Error: ' + message);
    pushEstado();
  });

  socket.on('disconnect', (reason) => {
    console.log('[bridge] Desconectado:', reason);
    estado.backend = 'Sin conexion';
    estado.tienda_id = null;
    updateTray('Sin conexion con backend...');
    pushEstado();
  });

  socket.on('connect_error', (err) => {
    // socket.io reintenta cada 5s: se registra el primero de cada racha, no todos.
    if (err.message !== ultimoFalloSocket) {
      ultimoFalloSocket = err.message;
      console.warn('[bridge] Error conexion:', err.message, '— reintentando cada 5s (no se repite este aviso)');
    }
    estado.backend = 'Sin conexion (' + err.message + ')';
    pushEstado();
  });

  // Camino de respaldo para el cajon: si el navegador no logra hablar con el
  // puente local (otro equipo, puerto ocupado), el POS pide la apertura por la
  // nube y llega hasta aca. Con internet caido este camino no existe y el local si.
  socket.on('open-drawer', (payload = {}) => {
    console.log('[bridge] open-drawer recibido por la nube');
    abrirCajon({ cmd: payload.cmd }).then((r) => {
      if (!r.ok) console.warn('[bridge] open-drawer:', r.mensaje);
    });
  });

  socket.on('print-label', (payload) => {
    console.log('[bridge] print-label recibido:', JSON.stringify(payload));
    imprimirEtiqueta(payload).catch((err) => console.error('[bridge] Error al imprimir:', err.message));
  });
}

// ── Bascula por serial (RS-232/USB) ────────────────────────────────────────────
// Dos familias de bascula conviven aqui:
//  · Flujo continuo: la bascula emite sola (SCALE_POLL_MS=0, comportamiento por defecto).
//  · Polling: no dice nada hasta que se le pregunta. La Torrey por USB (CDC virtual
//    STMicroelectronics VID:0483 PID:5740) es de este tipo — contesta a "P\r\n" con
//    una trama "  1.752 kg" terminada en CR, y "  NEG.    " cuando el peso es negativo.
// El framing se resuelve por lineas (CR y/o LF) para no arrastrar restos entre lecturas.
const PESO_REGEX = /([+-]?\d{1,3}\.\d{1,3})/;

// "P\r\n" viene del .env como texto literal; hay que convertir los escapes a bytes.
function decodificarCmd(txt) {
  return String(txt || '').replace(/\\r/g, '\r').replace(/\\n/g, '\n').replace(/\\x05/g, '\x05');
}

function procesarLectura(linea) {
  estado.ultimaTrama = linea;

  const match = linea.match(PESO_REGEX);
  if (!match) return; // "NEG.", encabezados o basura: se descarta sin emitir

  const peso = Math.abs(parseFloat(match[1]));
  if (Number.isNaN(peso)) return;

  // Estabilidad simple: mismo valor (redondeado a 3 decimales) 2 lecturas seguidas
  const pesoRedondeado = Math.round(peso * 1000) / 1000;
  const estable = pesoRedondeado === lastPesoEstable;
  lastPesoEstable = pesoRedondeado;

  if (pesoRedondeado !== lastPesoEmitido || estable) {
    lastPesoEmitido = pesoRedondeado;
    estado.peso = pesoRedondeado;
    if (socket?.connected) socket.emit('bridge-weight', { peso_kg: pesoRedondeado, estable });
    // El navegador de esta misma computadora lo recibe por el puente local, sin
    // depender de que haya internet.
    emitirSse('peso', { peso_kg: pesoRedondeado, estable });
    pushEstado();
  }
}

// Cierra el puerto y detiene el polling. Se usa al reconfigurar y al salir.
function cerrarBascula(cb) {
  scaleGen++; // invalida cualquier apertura en vuelo
  if (scaleReintento) { clearTimeout(scaleReintento); scaleReintento = null; }
  if (scalePoller) { clearInterval(scalePoller); scalePoller = null; }
  scaleBuffer = '';
  const p = scalePort;
  scalePort = null;
  if (p) {
    p.removeAllListeners('close');
    // Si el open() todavia no termino, p.isOpen es false y no se puede cerrar
    // aun: el propio callback lo soltara al ver que su generacion vencio.
    if (p.isOpen) { p.close(() => cb && cb()); return; }
  }
  if (cb) cb();
}

// Un solo temporizador de reintento vivo a la vez. Antes cada fallo agregaba
// uno nuevo y se acumulaban, disparando aperturas en paralelo sobre el mismo COM.
function programarReintento() {
  if (scaleReintento) clearTimeout(scaleReintento);
  scaleReintento = setTimeout(() => { scaleReintento = null; abrirBascula(); }, 10000);
}

// Registra el fallo de apertura una sola vez por racha: el ciclo de reintento es
// infinito y antes escribia la misma linea en bridge.log cada 10s.
function reportarFalloApertura(portPath, mensaje) {
  const clave = `${portPath}|${mensaje}`;
  if (clave !== ultimoFalloBascula) {
    ultimoFalloBascula = clave;
    console.warn(`[bridge] No se pudo abrir ${portPath}: ${mensaje} — reintentando cada 10s (no se repite este aviso)`);
  }
  estado.bascula = `No abre ${portPath}: ${mensaje}`;
  updateTray(`Sin bascula (${portPath})`);
  pushEstado();
}

function abrirBascula() {
  // Ya hay un open() en vuelo: no se crea un segundo puerto, se anota y al terminar
  // aquel se vuelve a entrar una sola vez.
  if (scaleAbriendo) { scaleRelanzar = true; return; }
  // Nunca dejar dos objetos SerialPort sobre el mismo COM: si ya hay uno, se
  // cierra y se vuelve a entrar por el callback.
  if (scalePort) { cerrarBascula(abrirBascula); return; }

  const portPath = config.SCALE_PORT;
  const baudRate = parseInt(config.SCALE_BAUD, 10) || 9600;
  const pollMs = parseInt(config.SCALE_POLL_MS, 10) || 0;
  const pollCmd = decodificarCmd(config.SCALE_POLL_CMD);

  if (!portPath) {
    estado.bascula = 'Sin puerto configurado';
    estado.puerto = '';
    updateTray('Falta elegir el puerto COM');
    pushEstado();
    return;
  }

  estado.puerto = portPath;
  const gen = scaleGen;
  const port = new SerialPort({ path: portPath, baudRate, autoOpen: false });
  scalePort = port;

  scaleAbriendo = true;
  port.open((err) => {
    scaleAbriendo = false;

    // Se reconfiguro/cerro, o pidieron reabrir mientras abriamos: este intento ya no vale.
    if (gen !== scaleGen || scaleRelanzar) {
      if (scalePort === port) scalePort = null;
      port.removeAllListeners();
      port.on('error', () => {}); // un puerto descartado no debe tumbar el proceso
      if (!err) {
        console.warn('[bridge] Apertura tardia descartada — soltando el puerto');
        port.close(() => {});
      }
      if (scaleRelanzar) { scaleRelanzar = false; abrirBascula(); }
      return;
    }
    if (err) {
      // El puerto NO quedo abierto: hay que soltar la referencia. Si se dejaba puesta,
      // el siguiente reintento entraba por cerrarBascula() y podia lanzar una apertura
      // extra en paralelo — de ahi los reintentos duplicados en el log.
      if (scalePort === port) scalePort = null;
      port.removeAllListeners();
      port.on('error', () => {}); // un puerto descartado no debe tumbar el proceso
      reportarFalloApertura(portPath, err.message);
      programarReintento();
      return;
    }
    ultimoFalloBascula = null; // abrio bien: el proximo fallo si se registra
    console.log(`[bridge] Bascula conectada en ${portPath} @ ${baudRate}bps`);
    estado.bascula = `Abierta en ${portPath}`;
    estado.polling = pollMs > 0 && !!pollCmd;
    updateTray('Conectado — esperando peso');

    if (pollMs > 0 && pollCmd) {
      console.log(`[bridge] Modo polling: enviando ${JSON.stringify(pollCmd)} cada ${pollMs}ms`);
      scalePoller = setInterval(() => {
        if (port.isOpen) port.write(pollCmd, (e) => { if (e) console.warn('[bridge] write:', e.message); });
      }, pollMs);
    } else {
      console.log('[bridge] Modo flujo continuo (sin polling)');
    }
    pushEstado();
  });

  port.on('data', (chunk) => {
    if (gen !== scaleGen) return; // datos de un puerto que ya quedo obsoleto
    scaleBuffer += chunk.toString('ascii');
    if (scaleBuffer.length > 200) scaleBuffer = scaleBuffer.slice(-200); // evitar crecimiento sin limite

    // Corta por CR o LF: la Torrey solo manda CR, otras basculas mandan CRLF.
    let i;
    while ((i = scaleBuffer.search(/[\r\n]/)) >= 0) {
      const linea = scaleBuffer.slice(0, i);
      scaleBuffer = scaleBuffer.slice(i + 1);
      if (linea.trim()) procesarLectura(linea);
    }
  });

  port.on('error', (err) => {
    console.error('[bridge] Error de puerto serial:', err.message);
  });

  port.on('close', () => {
    if (gen !== scaleGen) return; // cierre provocado por una reconfiguracion
    console.warn('[bridge] Puerto serial cerrado — reintentando en 10s');
    if (scalePoller) { clearInterval(scalePoller); scalePoller = null; }
    if (scalePort === port) scalePort = null;
    scaleBuffer = '';
    estado.bascula = 'Desconectada';
    estado.polling = false;
    updateTray('Bascula desconectada');
    pushEstado();
    programarReintento();
  });
}

// Reaplica la configuracion sin reiniciar la app (se llama al Guardar).
function reiniciarConexiones() {
  cerrarBascula(() => abrirBascula());
  connectSocket();
  // Solo si de verdad cambio el puerto: relanzar el servidor corta las conexiones
  // SSE vivas y el POS se quedaria un instante sin peso sin necesidad.
  const deseado = parseInt(config.PUENTE_PORT, 10) || 9333;
  if (deseado !== puenteEscuchandoEn) iniciarServidorLocal();
  // Si acaban de cambiar a la opcion B, dejar listo el ayudante y confirmar que
  // la impresora elegida existe, sin esperar al primer cobro.
  calentarImpresion();
  vigilarImpresora();
}

// ── Impresora de etiquetas ───────────────────────────────────────────────────
// Dos caminos, los elige la tienda desde Configuracion -> Bascula y viaja en el
// payload. Se resuelve aqui, en un solo lugar, para que el resto del bridge (el
// socket de la nube y el puente local) no tenga que saber cual es cual.
//   'usb' → etiquetadora por USB, va por el driver de Windows (Brother QL-800)
//   otro  → etiquetadora en red, ZPL por TCP al 9100 (comportamiento historico)
function imprimirEtiqueta(payload = {}) {
  if (String(payload.printer_modo || 'red') === 'usb') return imprimirEtiquetaUsb(payload);
  return imprimirEtiquetaRed(payload);
}

function imprimirEtiquetaRed(payload) {
  return new Promise((resolve, reject) => {
    if (!payload.printer_ip) return reject(new Error('printer_ip no configurado'));

    const zpl = construirZpl(payload);
    const socketImpresora = net.connect(payload.printer_port || 9100, payload.printer_ip);

    socketImpresora.setTimeout(5000);
    socketImpresora.on('connect', () => {
      socketImpresora.write(zpl, () => {
        socketImpresora.end();
        console.log('[bridge] Etiqueta enviada a', payload.printer_ip);
        resolve();
      });
    });
    socketImpresora.on('timeout', () => { socketImpresora.destroy(); reject(new Error('timeout conectando a la impresora')); });
    socketImpresora.on('error', (err) => reject(err));
  });
}

// ── Etiquetadora USB (Brother QL-800 y cualquier otra con driver de Windows) ──
// Por que por el driver y no con bytes crudos como el cajon: la QL-800 NO habla ZPL,
// habla el raster propio de Brother, y armar ese raster obliga a dibujar la etiqueta
// pixel por pixel (tipografia incluida) dentro del bridge. El driver ya hace eso, y
// Electron puede imprimirle en silencio eligiendo la impresora por nombre. Sale la
// MISMA etiqueta que en modo 'navegador' (mismo HTML), pero sin dialogo de impresion
// y sin depender de cual sea la impresora predeterminada de la PC.
function imprimirEtiquetaUsb(payload) {
  return new Promise((resolve, reject) => {
    const nombre = String(config.ETIQUETA_IMPRESORA || payload.printer_nombre || '').trim();
    if (!nombre) {
      return reject(new Error('No hay etiquetadora USB elegida. Abre la configuracion del bridge '
        + 'y eligela en "Impresora de etiquetas", o escribe su nombre en Configuracion -> Bascula.'));
    }
    // Mandarle una etiqueta a "Microsoft Print to PDF" abre un dialogo de guardado que
    // deja la etiqueta sin imprimir y al cliente esperando. Se corta antes.
    if (esImpresoraVirtual(nombre)) {
      return reject(new Error(`"${nombre}" es una impresora virtual (PDF/XPS/OneNote/Fax): `
        + 'abriria un dialogo de guardado en vez de imprimir la etiqueta.'));
    }

    // Siempre horizontal: el EAN-13 necesita el lado largo, igual que en el navegador.
    const w = Number(payload.label_width_mm) || 50;
    const h = Number(payload.label_height_mm) || 25;
    const anchoMm = Math.max(w, h);
    const altoMm = Math.min(w, h);

    let archivo;
    try {
      archivo = path.join(app.getPath('temp'), `pos-etiqueta-${Date.now()}.html`);
      fs.writeFileSync(archivo, htmlEtiqueta(payload, anchoMm, altoMm), 'utf8');
    } catch (e) {
      return reject(new Error('No se pudo escribir la etiqueta temporal: ' + e.message));
    }

    // Ventana oculta y desechable: una etiqueta se imprime en un instante y no vale la
    // pena dejar un WebContents vivo el dia entero. javascript queda apagado porque la
    // etiqueta es HTML estatico (el codigo de barras ya viene dibujado como SVG).
    const win = new BrowserWindow({
      show: false,
      width: 480,
      height: 320,
      webPreferences: { javascript: false, contextIsolation: true, nodeIntegration: false },
    });

    let cerrado = false;
    const limpiar = () => {
      if (cerrado) return;
      cerrado = true;
      clearTimeout(reloj);
      try { fs.unlinkSync(archivo); } catch (_) {}
      try { if (!win.isDestroyed()) win.destroy(); } catch (_) {}
    };
    // Si el driver se queda pensando (cola atorada, rollo abierto) no se puede dejar la
    // promesa colgada: el kiosko espera una respuesta para soltar al siguiente cliente.
    const reloj = setTimeout(() => {
      limpiar();
      reject(new Error(`La impresora "${nombre}" no contesto en 30 s. Revisa que este encendida, `
        + 'con rollo, la tapa cerrada y sin trabajos detenidos en la cola de Windows.'));
    }, 30000);

    win.webContents.once('did-fail-load', (_e, code, desc) => {
      limpiar();
      reject(new Error(`No se pudo preparar la etiqueta (${code} ${desc})`));
    });

    win.webContents.once('did-finish-load', () => {
      win.webContents.print(
        {
          silent: true,            // sin dialogo: es una caja, no un escritorio
          printBackground: true,
          deviceName: nombre,
          color: false,
          copies: 1,
          margins: { marginType: 'none' },
          landscape: false,        // el ancho ya es el lado largo
          pageSize: { width: Math.round(anchoMm * 1000), height: Math.round(altoMm * 1000) },
        },
        (ok, motivo) => {
          limpiar();
          if (ok) {
            console.log('[bridge] Etiqueta enviada a la etiquetadora USB', JSON.stringify(nombre));
            return resolve();
          }
          // Electron dice "cancelled" tanto si no existe la impresora como si el driver
          // rechazo el tamano de pagina: son los dos errores reales de esta ruta.
          reject(new Error(`Windows no acepto el trabajo (${motivo || 'sin motivo'}). `
            + `Verifica que "${nombre}" sea el nombre exacto de la impresora y que el rollo `
            + `cargado admita una etiqueta de ${anchoMm} x ${altoMm} mm.`));
        },
      );
    });

    win.loadFile(archivo).catch((e) => { limpiar(); reject(e); });
  });
}

// ── Codigo de barras EAN-13 ──────────────────────────────────────────────────
// Espejo de frontend/src/utils/ean13.ts (ean13Modulos / ean13Svg): la etiqueta USB
// se dibuja aqui y tiene que salir identica a la que imprime el navegador, porque la
// misma caja escanea las dos. Si se toca una, se toca la otra.
const EAN_L = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];
const EAN_R = EAN_L.map((p) => p.replace(/[01]/g, (b) => (b === '0' ? '1' : '0')));
const EAN_G = EAN_R.map((p) => p.split('').reverse().join(''));
const EAN_PARIDAD = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL',
];

function ean13Modulos(code) {
  if (!/^\d{13}$/.test(String(code || ''))) return null;
  const d = String(code).split('').map(Number);
  const paridad = EAN_PARIDAD[d[0]];
  let bits = '101';
  for (let i = 0; i < 6; i++) bits += (paridad[i] === 'L' ? EAN_L : EAN_G)[d[i + 1]];
  bits += '01010';
  for (let i = 7; i < 13; i++) bits += EAN_R[d[i]];
  return bits + '101';
}

function ean13Svg(code, width, height) {
  const bits = ean13Modulos(code);
  if (!bits) return '';
  const barras = bits
    .split('')
    .map((b, i) => (b === '1' ? `<rect x="${i}" y="0" width="1" height="30" fill="#000"/>` : ''))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 95 30" preserveAspectRatio="none"`
    + ` width="${width}" height="${height}" shape-rendering="crispEdges">${barras}</svg>`;
}

// La etiqueta, calcada de frontend/src/utils/printEtiquetaBascula.ts para que el
// cliente reciba lo mismo sin importar por donde salio.
function htmlEtiqueta(payload, anchoMm, altoMm) {
  const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const barrasAncho = Math.max(20, anchoMm - 5);
  const barrasAlto = Math.min(12, Math.max(6, Math.round(altoMm * 0.3)));
  const barras = ean13Svg(payload.barcode, `${barrasAncho}mm`, `${barrasAlto}mm`);
  const k = Math.min(1.2, Math.max(0.72, anchoMm / 50));
  const pt = (base) => `${(base * k).toFixed(1)}pt`;

  // El precio por kilo no existia en los payload viejos: si no viene, se deduce del
  // peso y el importe antes que imprimir "$0.00/kg" en la etiqueta del cliente.
  const peso = num(payload.peso_kg);
  const total = num(payload.precio_total);
  const porKg = num(payload.precio_kg) || (peso > 0 ? total / peso : 0);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: ${anchoMm}mm ${altoMm}mm landscape; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 1.2mm 2mm;
    width: ${anchoMm}mm;
    height: ${altoMm}mm;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    overflow: hidden;
  }
  .nombre { font-size: ${pt(8)}; font-weight: bold; line-height: 1.05; max-height: 2.1em; overflow: hidden; }
  .fila { display: flex; align-items: baseline; justify-content: space-between; gap: 1.5mm; }
  .detalle { font-size: ${pt(7)}; white-space: nowrap; overflow: hidden; }
  .total { font-size: ${pt(13)}; font-weight: bold; line-height: 1; white-space: nowrap; }
  .barras { flex-shrink: 0; margin-top: auto; }
  .codigo { font-size: ${pt(6)}; letter-spacing: 0.4px; line-height: 1.4; }
  svg { display: block; margin: 0 auto; }
</style>
</head>
<body>
  <div class="nombre">${esc(payload.producto_nombre)}</div>
  <div class="fila">
    <div class="detalle">${peso.toFixed(3)} kg x $${porKg.toFixed(2)}/kg</div>
    <div class="total">$${total.toFixed(2)}</div>
  </div>
  <div class="barras">
    ${barras}
    <div class="codigo">${esc(payload.barcode)}</div>
  </div>
</body>
</html>`;
}

function construirZpl(payload) {
  // Etiqueta horizontal: el lado largo es el ancho (ahi va el EAN-13). Default 50x25 mm.
  const wMm = payload.label_width_mm || 50;
  const hMm = payload.label_height_mm || 25;
  const widthDots = Math.round(Math.max(wMm, hMm) * 8);  // ~8 dots/mm a 203dpi
  const heightDots = Math.round(Math.min(wMm, hMm) * 8);
  const precio = Number(payload.precio_total).toFixed(2);
  const nombre = String(payload.producto_nombre || '').substring(0, 30);

  return [
    '^XA',
    `^PW${widthDots}`,
    `^LL${heightDots}`,
    '^CF0,28',
    `^FO10,10^FD${nombre}^FS`,
    '^CF0,40',
    `^FO10,45^FD$${precio}^FS`,
    `^FO10,90^BY2`,
    '^BEN,60,Y,N',
    `^FD${payload.barcode}^FS`,
    '^XZ',
  ].join('\n');
}

// ── Cajon de dinero ───────────────────────────────────────────────────────────
// Fisica del aparato: un solenoide de 12/24 V destraba el cajon y un resorte lo
// empuja hacia afuera. El software SOLO puede abrirlo (un pulso); cerrarlo es a
// mano. Por eso aqui no existe ningun "cerrar-cajon": no hay POS en el mundo que
// lo haga, y prometerlo en la interfaz seria mentirle al usuario.
//
// Cada adaptador RJ11->USB entiende su propio comando, asi que en vez de apostar
// a uno estan todos y CAJON_CMD elige. "hex:1B700019FA" cubre el adaptador raro
// sin tener que volver a compilar.
const SECUENCIAS_CAJON = {
  escpos_pin2:  { etiqueta: 'ESC/POS pin 2 (el estandar)', bytes: [0x1B, 0x70, 0x00, 0x19, 0xFA] },
  escpos_pin5:  { etiqueta: 'ESC/POS pin 5',               bytes: [0x1B, 0x70, 0x01, 0x19, 0xFA] },
  escpos_largo: { etiqueta: 'ESC/POS pulso largo',         bytes: [0x1B, 0x70, 0x00, 0x40, 0x50] },
  dle_dc4:      { etiqueta: 'DLE DC4',                     bytes: [0x10, 0x14, 0x01, 0x00, 0x01] },
  bel:          { etiqueta: 'BEL (campana)',               bytes: [0x07] },
  texto_open:   { etiqueta: 'Texto OPEN',                  bytes: [0x4F, 0x50, 0x45, 0x4E, 0x0D, 0x0A] },
  dtr:          { etiqueta: 'Pulso por DTR/RTS',           bytes: null },
};

function bytesCajon(nombre) {
  const clave = String(nombre || '').trim();
  if (clave.toLowerCase().startsWith('hex:')) {
    const hex = clave.slice(4).replace(/[^0-9a-fA-F]/g, '');
    if (hex.length < 2) return null;
    return Buffer.from(hex.slice(0, hex.length - (hex.length % 2)), 'hex');
  }
  const seq = SECUENCIAS_CAJON[clave];
  return seq && seq.bytes ? Buffer.from(seq.bytes) : null;
}

function modoCajon(modo) {
  return String(modo || config.CAJON_MODO || 'com').trim().toLowerCase() === 'impresora'
    ? 'impresora'
    : 'com';
}

/** Hay cajon utilizable con la configuracion actual? Depende del modo. */
function cajonConfigurado() {
  return modoCajon() === 'impresora'
    ? !!String(config.CAJON_IMPRESORA || '').trim()
    : !!String(config.CAJON_PORT || '').trim();
}

/** Como se describe el cajon en la bandeja y en la ventana. */
function descripcionCajon() {
  if (modoCajon() === 'impresora') {
    return config.CAJON_IMPRESORA ? `Impresora "${config.CAJON_IMPRESORA}"` : '(sin configurar)';
  }
  return config.CAJON_PORT || '(sin configurar)';
}

// Un solo lugar donde termina cualquier pulso, venga por COM o por impresora:
// asi el estado que ve la ventana y la bandeja siempre dice lo mismo.
function finCajon(nombreCmd, res) {
  cajonOcupado = false;
  if (res.ok) {
    estado.cajon = res.aviso
      ? `Pulso enviado con avisos (${nombreCmd})`
      : `Pulso enviado (${nombreCmd})`;
    if (res.aviso) console.warn('[cajon]', res.aviso);
  } else {
    estado.cajon = `Error: ${res.mensaje}`;
  }
  pushEstado();
  return res;
}

// -- Opcion B: el cajon cuelga de la impresora de tickets ----------------------
// La impresora conectada por USB NO aparece como COM: Windows la expone como cola
// de impresion. El pulso tiene que entrar como un trabajo "RAW" (bytes crudos, sin
// que el driver los interprete), que es exactamente lo que hace WritePrinter de
// winspool. Node no lo expone, asi que se llama por PowerShell con P/Invoke.
//
// Se eligio esto en vez de otras salidas por buenas razones:
//  - Compartir la impresora y copiar a \\PC\recurso exige activar el compartido.
//  - Un modulo nativo (printer / node-thermal-printer) obliga a compilar con
//    node-gyp en cada version de Electron: justo lo que rompe instalaciones.
//  - Imprimir con el driver mandaria un ticket en blanco, no el pulso.
const PS_RAW_PRINT = `param(
  [string]$Printer = '',
  [string]$Ruta = '',
  [string]$Dll = '',
  [switch]$Verificar,
  [switch]$SoloCompilar
)
$ErrorActionPreference = 'Stop'

$codigo = @'
using System;
using System.Runtime.InteropServices;
public class PosRawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public class DOCINFOW {
    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
  }
  [DllImport("winspool.drv", EntryPoint="OpenPrinterW", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool OpenPrinter(string pPrinterName, out IntPtr hPrinter, IntPtr pDefault);
  [DllImport("winspool.drv", EntryPoint="ClosePrinter", SetLastError=true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint="StartDocPrinterW", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOW di);
  [DllImport("winspool.drv", EntryPoint="EndDocPrinter", SetLastError=true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint="StartPagePrinter", SetLastError=true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint="EndPagePrinter", SetLastError=true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint="WritePrinter", SetLastError=true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

  public static string Enviar(string impresora, byte[] datos) {
    IntPtr h = IntPtr.Zero;
    if (!OpenPrinter(impresora, out h, IntPtr.Zero)) {
      int e = Marshal.GetLastWin32Error();
      if (e == 1801) return "Windows no tiene ninguna impresora con ese nombre exacto. Refresca la lista y vuelve a elegirla.";
      if (e == 5) return "Windows nego el acceso a esa impresora (error 5). Si es una impresora de red o compartida, abrela una vez desde Windows con este mismo usuario.";
      return "No se pudo abrir la impresora (error " + e + ")";
    }
    try {
      DOCINFOW di = new DOCINFOW();
      di.pDocName = "POS-iaDoS cajon";
      di.pDataType = "RAW";
      if (!StartDocPrinter(h, 1, di)) {
        int e1 = Marshal.GetLastWin32Error();
        // Algunos drivers rechazan la palabra "RAW" pero si aceptan su tipo por
        // omision. Cuesta nada reintentar antes de darlo por perdido.
        di.pDataType = null;
        if (!StartDocPrinter(h, 1, di)) {
          return "El driver de esa impresora no acepta comandos crudos (error " + e1 + "). En Windows: Propiedades de impresora -> Opciones avanzadas -> 'Imprimir directamente en la impresora'; si aun asi falla, instala el driver del fabricante en modo ESC/POS.";
        }
      }
      try {
        if (!StartPagePrinter(h)) {
          return "StartPagePrinter fallo (error " + Marshal.GetLastWin32Error() + ")";
        }
        IntPtr p = Marshal.AllocCoTaskMem(datos.Length);
        try {
          Marshal.Copy(datos, 0, p, datos.Length);
          int escritos = 0;
          if (!WritePrinter(h, p, datos.Length, out escritos)) {
            return "WritePrinter fallo (error " + Marshal.GetLastWin32Error() + ")";
          }
          if (escritos != datos.Length) {
            return "Solo salieron " + escritos + " de " + datos.Length + " bytes";
          }
        } finally {
          Marshal.FreeCoTaskMem(p);
          EndPagePrinter(h);
        }
      } finally {
        EndDocPrinter(h);
      }
    } finally {
      ClosePrinter(h);
    }
    return "";
  }
}
'@

# Compilar una sola vez y guardar el DLL: Add-Type -TypeDefinition invoca al
# compilador de C# y cuesta 1-2 segundos EN CADA PULSO. Con el ensamblado ya
# compilado en disco la carga baja a milisegundos, que es la diferencia entre
# que el cajon salte al cobrar o que el cajero se quede esperando.
function Cargar-Ayudante {
  if ($Dll -ne '') {
    if (Test-Path -LiteralPath $Dll) {
      try { Add-Type -Path $Dll; return } catch { }
    }
    try {
      $dir = Split-Path -Parent $Dll
      if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
      $tmp = Join-Path $dir ([System.IO.Path]::GetRandomFileName() + '.dll')
      Add-Type -TypeDefinition $codigo -OutputAssembly $tmp -OutputType Library
      # Si otro proceso gano la carrera y ya dejo el DLL bueno, se usa ese.
      try { Move-Item -LiteralPath $tmp -Destination $Dll -Force } catch { }
      if (Test-Path -LiteralPath $Dll) {
        try {
          Add-Type -Path $Dll
          Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
          return
        } catch { }
      }
      Add-Type -Path $tmp
      return
    } catch { }
  }
  Add-Type -TypeDefinition $codigo
}
Cargar-Ayudante

# El bridge llama con -SoloCompilar al arrancar: deja el DLL listo para que el
# primer pulso real no pague la compilacion.
if ($SoloCompilar) { exit 0 }
if ($Printer -eq '' -or $Ruta -eq '') { Write-Output 'Faltan datos para mandar el pulso.'; exit 1 }

$avisos = @()

# -Verificar solo lo mandan las pruebas manuales de la ventana. Durante una venta
# no se hace nada de esto: ahi lo que importa son los milisegundos.
if ($Verificar) {
  $imp = $null
  try { $imp = Get-CimInstance Win32_Printer -ErrorAction Stop | Where-Object { $_.Name -eq $Printer } | Select-Object -First 1 } catch { }
  if ($null -eq $imp) {
    Write-Output ('Windows ya no tiene una impresora llamada "' + $Printer + '". Refresca la lista y vuelve a elegirla.')
    exit 1
  }
  if ($imp.WorkOffline) { $avisos += 'La impresora esta marcada "Usar sin conexion" en Windows: el pulso se queda en la cola. Enciendela, revisa el cable USB y quita esa opcion.' }
  elseif ($imp.PrinterStatus -eq 7) { $avisos += 'Windows reporta la impresora fuera de linea.' }
  if (($imp.PrinterState -band 1) -ne 0) { $avisos += 'La cola de impresion esta EN PAUSA: reanudala o el pulso nunca saldra.' }
}

$bytes = [System.IO.File]::ReadAllBytes($Ruta)
$msg = [PosRawPrinter]::Enviar($Printer, $bytes)
if ($msg -ne '') {
  if ($avisos.Count -gt 0) { $msg = $msg + ' ' + ($avisos -join ' ') }
  Write-Output $msg
  exit 1
}

# El spooler acepta el trabajo aunque la impresora este apagada: sin esto el
# bridge diria "pulso enviado" con el cajon cerrado y nadie sabria por que.
if ($Verificar) {
  $limite = (Get-Date).AddSeconds(5)
  $atorado = $false
  while ((Get-Date) -lt $limite) {
    Start-Sleep -Milliseconds 350
    $t = @()
    try { $t = @(Get-CimInstance Win32_PrintJob -ErrorAction Stop | Where-Object { $_.Document -eq 'POS-iaDoS cajon' }) } catch { break }
    if ($t.Count -eq 0) { $atorado = $false; break }
    $atorado = $true
  }
  if ($atorado) { $avisos += 'El pulso se quedo detenido en la cola: Windows lo acepto pero la impresora no lo consumio. Revisa que este encendida, con papel, con la tapa cerrada y sin la cola en pausa.' }
}

if ($avisos.Count -gt 0) { Write-Output ($avisos -join ' ') }
exit 0
`;

// El .ps1 se deja en userData (NO junto al .exe: eso es Program Files, sin permiso
// de escritura). Se reescribe si cambio, para que una actualizacion del bridge no
// se quede usando el ayudante viejo.
function rutaScriptRaw() {
  try {
    const dir = path.join(app.getPath('userData'), 'bin');
    const f = path.join(dir, 'raw-print.ps1');
    fs.mkdirSync(dir, { recursive: true });
    let actual = null;
    try { actual = fs.readFileSync(f, 'utf8'); } catch (_) {}
    if (actual !== PS_RAW_PRINT) fs.writeFileSync(f, PS_RAW_PRINT, 'utf8');
    return f;
  } catch (e) {
    console.warn('[cajon] No se pudo preparar raw-print.ps1:', e.message);
    return null;
  }
}

// El nombre del DLL lleva la huella del script: si una actualizacion del bridge
// cambia el C#, el ensamblado viejo simplemente deja de usarse y se compila el
// nuevo, sin depender de borrar nada a mano.
function rutaDllRaw() {
  const huella = crypto.createHash('sha1').update(PS_RAW_PRINT).digest('hex').slice(0, 10);
  return path.join(app.getPath('userData'), 'bin', `PosRawPrinter-${huella}.dll`);
}

function argsPowerShell(ps1, extra) {
  return ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ps1].concat(extra);
}

/**
 * Deja el ayudante compilado ANTES de que se necesite. Se llama al arrancar y al
 * guardar configuracion, en segundo plano: si falla no pasa nada, el primer pulso
 * lo compilara (solo que tardara un par de segundos).
 */
function calentarImpresion() {
  if (modoCajon() !== 'impresora') return;
  const ps1 = rutaScriptRaw();
  if (!ps1) return;
  const dll = rutaDllRaw();
  if (fs.existsSync(dll)) return;
  const t0 = Date.now();
  execFile(
    'powershell.exe',
    argsPowerShell(ps1, ['-Dll', dll, '-SoloCompilar']),
    { windowsHide: true, timeout: 60000 },
    (err) => {
      if (err) console.warn('[cajon] No se pudo precompilar el ayudante:', err.message);
      else console.log(`[cajon] Ayudante de impresion listo en ${Date.now() - t0} ms`);
    },
  );
}

function enviarRawImpresora(impresora, datos, { verificar = false } = {}) {
  return new Promise((resolve) => {
    const nombre = String(impresora || '').trim();
    if (!nombre) return resolve({ ok: false, mensaje: 'No hay impresora elegida para el cajon.' });

    const ps1 = rutaScriptRaw();
    if (!ps1) return resolve({ ok: false, mensaje: 'No se pudo preparar el ayudante de impresion.' });

    let bin;
    try {
      bin = path.join(app.getPath('temp'), `pos-cajon-${Date.now()}.bin`);
      fs.writeFileSync(bin, datos);
    } catch (e) {
      return resolve({ ok: false, mensaje: 'No se pudo escribir el archivo temporal: ' + e.message });
    }

    // Los argumentos van como parametros, nunca interpolados en el comando: el
    // nombre de la impresora lo escribe el usuario y puede traer comillas.
    const extra = ['-Printer', nombre, '-Ruta', bin, '-Dll', rutaDllRaw()];
    if (verificar) extra.push('-Verificar');

    // La verificacion espera a que la cola consuma el trabajo, por eso su tope es
    // mas alto. En venta no se verifica y 20 s es de sobra.
    execFile(
      'powershell.exe',
      argsPowerShell(ps1, extra),
      { windowsHide: true, timeout: verificar ? 45000 : 20000 },
      (err, stdout, stderr) => {
        try { fs.unlinkSync(bin); } catch (_) {}
        const salida = String(stdout || '').trim() || String(stderr || '').trim();
        if (err && err.killed) {
          return resolve({
            ok: false,
            mensaje: 'Windows no contesto a tiempo. Suele ser la cola de impresion atorada: '
              + 'cancela los trabajos pendientes de esa impresora y vuelve a intentar.',
          });
        }
        if (err) return resolve({ ok: false, mensaje: salida || err.message });
        // Salio bien, pero el ayudante puede traer avisos (cola en pausa, etc.).
        resolve({ ok: true, via: 'impresora', aviso: salida || '' });
      },
    );
  });
}

// Casi toda PC trae impresoras que no son impresoras: mandarles el pulso abre un
// dialogo modal de "guardar como" que congela la caja. Se marcan para que la
// ventana no deje elegirlas por error.
const IMPRESORAS_VIRTUALES = [
  'microsoft print to pdf', 'microsoft xps document writer', 'onenote', 'fax',
  'adobe pdf', 'pdfcreator', 'foxit', 'cutepdf', 'print to pdf', 'xps document writer',
  'anydesk', 'quickbooks pdf', 'bullzip',
];

function esImpresoraVirtual(nombre) {
  const n = String(nombre || '').toLowerCase();
  return IMPRESORAS_VIRTUALES.some((v) => n.includes(v));
}

/**
 * Impresoras instaladas en Windows, para el desplegable de la ventana.
 * Primero por Electron (instantaneo); si no da nada, por PowerShell.
 */
async function listarImpresoras(sender) {
  try {
    if (sender && !sender.isDestroyed() && typeof sender.getPrintersAsync === 'function') {
      const lista = await sender.getPrintersAsync();
      if (lista && lista.length) {
        return lista.map((p) => ({
          nombre: p.name,
          etiqueta: p.displayName || p.description || p.name,
          predeterminada: !!p.isDefault,
          virtual: esImpresoraVirtual(p.name) || esImpresoraVirtual(p.displayName),
        }));
      }
    }
  } catch (e) { console.warn('[cajon] getPrintersAsync fallo, se usa PowerShell:', e.message); }

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command',
        'Get-CimInstance Win32_Printer | Select-Object Name,Default | ConvertTo-Json -Compress'],
      { windowsHide: true, timeout: 20000 },
      (err, stdout) => {
        if (err) return resolve([]);
        try {
          let datos = JSON.parse(String(stdout).trim() || '[]');
          if (!Array.isArray(datos)) datos = [datos];
          resolve(datos
            .filter((p) => p && p.Name)
            .map((p) => ({
              nombre: p.Name,
              etiqueta: p.Name,
              predeterminada: !!p.Default,
              virtual: esImpresoraVirtual(p.Name),
            })));
        } catch (_) { resolve([]); }
      },
    );
  });
}

// Una impresora se puede desinstalar, renombrar o quedarse sin driver despues de
// configurada. Se revisa de vez en cuando (no en cada /estado: enumerar impresoras
// cuesta un proceso de PowerShell) para poder avisar antes de que falle una venta.
let impresoraPresente = null;
let vigilanciaImpresora = null;

async function revisarImpresoraGuardada() {
  if (modoCajon() !== 'impresora') { impresoraPresente = null; return; }
  const nombre = String(config.CAJON_IMPRESORA || '').trim();
  if (!nombre) { impresoraPresente = null; return; }
  let hay;
  try {
    const lista = await listarImpresoras(null);
    if (!lista.length) return; // no se pudo enumerar: mejor no cambiar el estado
    hay = lista.some((i) => i.nombre === nombre);
  } catch (_) { return; }
  if (hay === impresoraPresente) return;
  impresoraPresente = hay;
  console.warn(`[cajon] Impresora "${nombre}": ${hay ? 'detectada' : 'YA NO esta instalada en Windows'}`);
  if (!hay) estado.cajon = `La impresora "${nombre}" ya no esta en Windows`;
  pushEstado();
  updateTray(estado.bascula);
}

function vigilarImpresora() {
  if (vigilanciaImpresora) clearInterval(vigilanciaImpresora);
  revisarImpresoraGuardada();
  if (modoCajon() !== 'impresora') return;
  vigilanciaImpresora = setInterval(revisarImpresoraGuardada, 5 * 60 * 1000);
}

async function abrirCajonPorImpresora({ impresora, cmd, diagnostico = false } = {}) {
  const nombreCmd = cmd || config.CAJON_CMD || 'escpos_pin2';
  const nombre = (impresora || config.CAJON_IMPRESORA || '').trim();
  if (!nombre) return finCajon(nombreCmd, { ok: false, mensaje: 'No hay impresora elegida para el cajon.' });
  // Mandarle bytes crudos a "Microsoft Print to PDF" abre un dialogo de guardado
  // que bloquea la caja entera. Se corta aqui, antes de tocar el spooler.
  if (esImpresoraVirtual(nombre)) {
    return finCajon(nombreCmd, {
      ok: false,
      mensaje: `"${nombre}" es una impresora virtual (PDF/XPS/OneNote), no fisica: no puede abrir el cajon. Elige la impresora de tickets real.`,
    });
  }
  if (cajonOcupado) return { ok: false, mensaje: 'El cajon ya esta recibiendo un pulso, espera un momento.' };

  const datos = bytesCajon(nombreCmd);
  if (!datos) {
    // 'dtr' levanta lineas fisicas del puerto serial; por la cola de impresion no
    // existe eso. Mejor decirlo que mandar un trabajo vacio y fingir que funciono.
    return finCajon(nombreCmd, {
      ok: false,
      mensaje: 'El pulso por DTR/RTS solo sirve con el adaptador serial. Por impresora elige un comando ESC/POS.',
    });
  }

  cajonOcupado = true;
  const r = await enviarRawImpresora(nombre, datos, { verificar: diagnostico });
  return finCajon(nombreCmd, r);
}

/**
 * Dispara el pulso de apertura por el puerto COM del adaptador (opcion A).
 *
 * Abre el puerto, escribe y lo cierra en el mismo acto: el cajon se usa unas
 * cuantas veces por hora y dejar el COM tomado impediria diagnosticarlo con
 * cualquier otra herramienta (y pelearia con la bascula si comparten adaptador).
 */
function abrirCajonPorCom({ puerto, baud, cmd } = {}) {
  return new Promise((resolve) => {
    const portPath = (puerto || config.CAJON_PORT || '').trim();
    if (!portPath) return resolve({ ok: false, mensaje: 'No hay puerto configurado para el cajon.' });
    if (cajonOcupado) return resolve({ ok: false, mensaje: 'El cajon ya esta recibiendo un pulso, espera un momento.' });
    // Caso raro pero posible: alguien apunta el cajon al mismo COM de la bascula.
    // Mejor un mensaje claro que un "Access denied" del driver.
    if (scalePort && portPath === config.SCALE_PORT) {
      return resolve({ ok: false, mensaje: `${portPath} lo esta usando la bascula. Conecta el cajon a otro puerto.` });
    }

    const nombreCmd = cmd || config.CAJON_CMD || 'escpos_pin2';
    const baudRate = parseInt(baud || config.CAJON_BAUD, 10) || 9600;
    const datos = bytesCajon(nombreCmd);

    cajonOcupado = true;
    const sp = new SerialPort({ path: portPath, baudRate, autoOpen: false });
    sp.on('error', () => {}); // un puerto que se desconecta no debe tumbar el proceso

    const terminar = (res) => resolve(finCajon(nombreCmd, res));

    sp.open((err) => {
      if (err) return terminar({ ok: false, mensaje: `No se pudo abrir ${portPath}: ${err.message}` });
      const cerrar = (res) => { try { sp.close(() => terminar(res)); } catch (_) { terminar(res); } };

      // Adaptadores "tontos": no entienden comandos, cierran el circuito cuando
      // las lineas de control se levantan.
      if (!datos) {
        try {
          sp.set({ dtr: true, rts: true }, () => {
            setTimeout(() => {
              try { sp.set({ dtr: false, rts: false }, () => cerrar({ ok: true, via: 'dtr' })); }
              catch (_) { cerrar({ ok: true, via: 'dtr' }); }
            }, 400);
          });
        } catch (e) { cerrar({ ok: false, mensaje: e.message }); }
        return;
      }

      sp.write(datos, (e) => {
        if (e) return cerrar({ ok: false, mensaje: e.message });
        // drain + respiro: cerrar el puerto antes de que los bytes salgan del
        // buffer del driver deja el cajon sin abrir y sin error visible.
        sp.drain(() => setTimeout(() => cerrar({ ok: true, via: nombreCmd }), 250));
      });
    });
  });
}

/**
 * Punto unico de entrada: elige el camino segun como este cableado el cajon.
 * Todo lo demas del bridge (POS, nube, bandeja) llama solo a esto.
 */
function abrirCajon(opts = {}) {
  return modoCajon(opts.modo) === 'impresora'
    ? abrirCajonPorImpresora(opts)
    : abrirCajonPorCom(opts);
}

/**
 * Prueba TODAS las secuencias con pausa entre cada una, para que quien instala vea
 * en cual salta el cajon. Es el diagnostico manual, pero desde la ventana de
 * configuracion y sin PowerShell.
 */
async function probarCajon(opts = {}) {
  const modo = modoCajon(opts.modo);
  const intentados = [];
  for (const [clave, seq] of Object.entries(SECUENCIAS_CAJON)) {
    // Por impresora no hay lineas de control que levantar: se salta en vez de
    // ensuciar la lista con un fallo que no dice nada.
    if (modo === 'impresora' && !seq.bytes) continue;

    const r = await abrirCajon({ ...opts, modo, cmd: clave, diagnostico: true });
    intentados.push({ clave, etiqueta: seq.etiqueta, ok: r.ok, mensaje: r.mensaje || r.aviso || '' });
    // Si ni siquiera se puede hablar con el aparato, repetirlo 7 veces solo alarga
    // la espera sin aportar nada.
    if (!r.ok && /No se pudo abrir|ninguna impresora|ya no tiene una impresora|no acepta comandos crudos|impresora virtual|nego el acceso|no contesto a tiempo/i.test(r.mensaje || '')) break;
    await new Promise((seguir) => setTimeout(seguir, 2200));
  }
  return { ok: intentados.some((i) => i.ok), intentados };
}

// ── Puente local (127.0.0.1) ──────────────────────────────────────────────────
// El POS corre en el navegador de ESTA misma computadora, pero hasta ahora el peso
// y el cajon viajaban a la nube y regresaban. Sin internet la tienda se quedaba sin
// bascula y sin cajon. Este servidor los pone a un salto:
//
//   navegador (https://pos.iados.online)  ->  http://127.0.0.1:9333  ->  hardware
//
// Cuatro detalles que no son opcionales:
//  · Solo escucha en 127.0.0.1, nunca en 0.0.0.0: el cajon no se abre desde la red.
//  · CORS explicito: el POS es una pagina de otro origen y el navegador exige que
//    este servidor lo autorice por nombre.
//  · Private Network Access (Chrome): una pagina publica que llama a 127.0.0.1 manda
//    un preflight con Access-Control-Request-Private-Network y solo continua si le
//    contestamos Access-Control-Allow-Private-Network: true.
//  · http://127.0.0.1 es "potentially trustworthy" para el navegador, asi que la
//    pagina https puede llamarlo sin que cuente como contenido mixto.
const ORIGENES_FIJOS = [
  'https://pos.iados.online',
  'https://www.pos.iados.online',
];

function origenPermitido(origin) {
  if (!origin) return true; // sin Origin no hay navegador que autorizar (curl, la propia app)
  if (ORIGENES_FIJOS.includes(origin)) return true;
  // Instalacion on-premise: el POS se sirve desde la propia red de la tienda.
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return true;
  // El backend configurado, y el front que le corresponde (posapi.x -> pos.x).
  try {
    const b = new URL(config.BACKEND_URL);
    if (origin === b.origin) return true;
    if (origin === `${b.protocol}//${b.host.replace(/^posapi\./, 'pos.')}`) return true;
  } catch (_) {}
  return false;
}

function cabecerasCors(req, res) {
  const origin = req.headers.origin;
  if (!origenPermitido(origin)) return false;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  return true;
}

function leerCuerpo(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 8192) raw = raw.slice(0, 8192); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function estadoPuente() {
  return {
    ok: true,
    app: 'pos-iados-bridge',
    version: app.getVersion(),
    tienda_id: estado.tienda_id,
    estacion: config.ESTACION || 'Principal',
    backend: estado.backend,
    bascula: {
      estado: estado.bascula,
      puerto: estado.puerto,
      polling: estado.polling,
      abierta: !!(scalePort && scalePort.isOpen),
    },
    cajon: {
      configurado: cajonConfigurado(),
      modo: modoCajon(),
      puerto: config.CAJON_PORT,
      impresora: config.CAJON_IMPRESORA,
      // Para que el POS pueda avisar "la impresora del cajon ya no esta" sin
      // tener que mandar un pulso de prueba a ciegas.
      impresora_presente: modoCajon() === 'impresora' ? impresoraPresente : null,
      cmd: config.CAJON_CMD,
      estado: estado.cajon,
    },
    peso: estado.peso,
    ultima_trama: estado.ultimaTrama,
  };
}

// Peso en vivo por SSE: una conexion abierta en lugar de que el POS pregunte cada
// 200 ms. Cuando el navegador se va, el 'close' lo saca de la lista.
function abrirSse(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 3000\n\n');
  res.write('event: estado\ndata: ' + JSON.stringify(estadoPuente()) + '\n\n');
  sseClientes.add(res);
  // Latido: sin trafico, un proxy o el propio navegador dan por muerta la conexion.
  const latido = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) {} }, 25000);
  const cerrar = () => { clearInterval(latido); sseClientes.delete(res); };
  req.on('close', cerrar);
  req.on('error', cerrar);
  res.on('error', cerrar);
}

function emitirSse(evento, dato) {
  if (!sseClientes.size) return;
  const linea = 'event: ' + evento + '\ndata: ' + JSON.stringify(dato) + '\n\n';
  for (const res of [...sseClientes]) {
    try { res.write(linea); } catch (_) { sseClientes.delete(res); }
  }
}

function iniciarServidorLocal() {
  if (servidorLocal) { try { servidorLocal.close(); } catch (_) {} servidorLocal = null; }
  puenteEscuchandoEn = null;
  const puerto = parseInt(config.PUENTE_PORT, 10) || 9333;

  servidorLocal = http.createServer(async (req, res) => {
    const responder = (code, body) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(body));
    };

    if (!cabecerasCors(req, res)) { responder(403, { ok: false, mensaje: 'Origen no autorizado' }); return; }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const ruta = ((req.url || '/').split('?')[0].replace(/\/+$/, '')) || '/';

    try {
      if (req.method === 'GET' && (ruta === '/' || ruta === '/estado')) {
        return responder(200, estadoPuente());
      }

      if (req.method === 'GET' && ruta === '/peso') {
        return responder(200, {
          ok: true,
          peso_kg: estado.peso,
          estable: estado.peso !== null && estado.peso === lastPesoEstable,
          bascula: estado.bascula,
        });
      }

      if (req.method === 'GET' && ruta === '/eventos') { abrirSse(req, res); return; }

      if (req.method === 'POST' && ruta === '/cajon/abrir') {
        const body = await leerCuerpo(req);
        const r = await abrirCajon({ cmd: body.cmd });
        console.log('[puente] cajon/abrir ->', r.ok ? 'abierto' : r.mensaje);
        return responder(r.ok ? 200 : 409, r);
      }

      if (req.method === 'POST' && ruta === '/etiqueta') {
        const body = await leerCuerpo(req);
        await imprimirEtiqueta(body);
        return responder(200, { ok: true });
      }

      responder(404, { ok: false, mensaje: 'Ruta no encontrada' });
    } catch (e) {
      responder(500, { ok: false, mensaje: e.message });
    }
  });

  // Que el puente no levante NO es fatal: el POS sigue funcionando por la nube.
  // Lo que no se vale es tumbar el bridge y dejar tambien la bascula muerta.
  servidorLocal.on('error', (err) => {
    console.warn(`[puente] No se pudo escuchar en 127.0.0.1:${puerto}: ${err.message} — el POS seguira usando la nube`);
    estado.puente = `No disponible (${err.code || err.message})`;
    updateTray(estado.backend);
    pushEstado();
  });

  servidorLocal.listen(puerto, '127.0.0.1', () => {
    puenteEscuchandoEn = puerto;
    console.log(`[puente] Escuchando en http://127.0.0.1:${puerto}`);
    estado.puente = `Activo en 127.0.0.1:${puerto}`;
    updateTray(estado.backend);
    pushEstado();
  });
}

// ── Ventana de configuracion ──────────────────────────────────────────────────
function abrirConfig() {
  if (configWin && !configWin.isDestroyed()) { configWin.show(); configWin.focus(); return; }

  configWin = new BrowserWindow({
    width: 620,
    height: 720,
    title: 'POS-iaDoS — Configuracion del Bridge',
    icon: rutaIcono(),
    autoHideMenuBar: true,
    resizable: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  configWin.loadFile(path.join(__dirname, 'config.html'));
  configWin.once('ready-to-show', () => { configWin.show(); pushEstado(); });
  configWin.on('closed', () => { configWin = null; });
}

// ── Deteccion automatica del tipo de bascula ──────────────────────────────────
// Resuelve el problema que costo el diagnostico manual: abre el puerto, escucha
// un momento en silencio y, si no llega nada, prueba los comandos de polling
// conocidos. Devuelve la configuracion que hay que guardar.
function detectarBascula(portPath, baudRate) {
  return new Promise((resolve) => {
    const CANDIDATOS = [['P\\r\\n', 'P\r\n'], ['W\\r\\n', 'W\r\n'], ['\\x05', '\x05'], ['S\\r\\n', 'S\r\n']];
    const sp = new SerialPort({ path: portPath, baudRate: baudRate || 9600, autoOpen: false });
    let buf = '';
    const traeNumero = () => PESO_REGEX.test(buf) || /NEG/i.test(buf);

    sp.on('data', (c) => { buf += c.toString('ascii'); });
    sp.on('error', () => {});

    sp.open(async (err) => {
      if (err) return resolve({ ok: false, mensaje: `No se pudo abrir ${portPath}: ${err.message}` });

      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const cerrar = () => new Promise((r) => { try { sp.close(() => r()); } catch (_) { r(); } });

      // 1) flujo continuo
      buf = '';
      await espera(2500);
      if (traeNumero()) {
        const muestra = buf.trim().split(/[\r\n]/).filter(Boolean)[0] || buf.trim();
        await cerrar();
        return resolve({ ok: true, tipo: 'continuo', SCALE_POLL_MS: '0', muestra,
          mensaje: `Bascula de flujo continuo detectada. Trama: "${muestra}"` });
      }

      // 2) polling
      for (const [literal, real] of CANDIDATOS) {
        buf = '';
        try { sp.write(real); } catch (_) {}
        await espera(1200);
        if (traeNumero()) {
          const muestra = buf.trim().split(/[\r\n]/).filter(Boolean)[0] || buf.trim();
          await cerrar();
          return resolve({ ok: true, tipo: 'polling', SCALE_POLL_CMD: literal, SCALE_POLL_MS: '400', muestra,
            mensaje: `Bascula de polling detectada con el comando "${literal}". Trama: "${muestra}"` });
        }
      }

      await cerrar();
      resolve({ ok: false, mensaje: `${portPath} abre bien pero la bascula no respondio ni sola ni a los comandos conocidos. Revisa el cable, que la bascula este encendida, y el baudrate en el manual.` });
    });
  });
}

// ── IPC con la ventana de configuracion ───────────────────────────────────────
ipcMain.handle('listar-puertos', async () => {
  try {
    const ports = await SerialPort.list();
    return ports.map((p) => ({
      path: p.path,
      etiqueta: `${p.path} — ${p.friendlyName || p.manufacturer || 'dispositivo serial'}`,
    }));
  } catch (e) { return []; }
});

ipcMain.handle('obtener-estado', () => ({ ...estado, config: configPublica() }));

ipcMain.handle('detectar', async (_e, { puerto, baud }) => {
  if (!puerto) return { ok: false, mensaje: 'Elige primero un puerto COM.' };
  // Hay que soltar el puerto: no se puede abrir dos veces.
  await new Promise((r) => cerrarBascula(r));
  const res = await detectarBascula(puerto, parseInt(baud, 10) || 9600);
  abrirBascula();
  return res;
});

ipcMain.handle('guardar', async (_e, patch) => {
  const limpio = {};
  for (const k of ['BACKEND_URL', 'TIENDA_TOKEN', 'ESTACION', 'SCALE_PORT', 'SCALE_BAUD', 'SCALE_POLL_CMD', 'SCALE_POLL_MS',
                   'CAJON_MODO', 'CAJON_PORT', 'CAJON_BAUD', 'CAJON_IMPRESORA', 'CAJON_CMD',
                   'ETIQUETA_IMPRESORA', 'PUENTE_PORT']) {
    if (patch[k] !== undefined) limpio[k] = String(patch[k]).trim();
  }
  saveConfig(limpio);
  console.log('[bridge] Configuracion guardada:', JSON.stringify({ ...limpio, TIENDA_TOKEN: limpio.TIENDA_TOKEN ? limpio.TIENDA_TOKEN.slice(0, 8) + '...' : '' }));
  reiniciarConexiones();
  return { ok: true, config: configPublica() };
});

// Catalogo para el desplegable de la ventana de configuracion.
ipcMain.handle('secuencias-cajon', () =>
  Object.entries(SECUENCIAS_CAJON).map(([clave, v]) => ({ clave, etiqueta: v.etiqueta })));

// Impresoras de Windows, para el cajon conectado a la impresora de tickets.
ipcMain.handle('listar-impresoras', async (e) => {
  try { return await listarImpresoras(e.sender); }
  catch (err) { console.warn('[cajon] No se pudieron listar impresoras:', err.message); return []; }
});

ipcMain.handle('abrir-cajon', async (_e, opts = {}) => abrirCajon({ ...opts, diagnostico: true }));

ipcMain.handle('probar-cajon', async (_e, opts = {}) => {
  if (modoCajon(opts.modo) === 'impresora') {
    if (!opts.impresora) return { ok: false, mensaje: 'Elige primero la impresora de tickets.' };
  } else if (!opts.puerto) {
    return { ok: false, mensaje: 'Elige primero el puerto COM del cajon.' };
  }
  return probarCajon(opts);
});

// Etiqueta de prueba para la etiquetadora USB. Sirve para lo unico que se puede
// equivocar en esta ruta: el nombre de la impresora y el tamano del rollo.
ipcMain.handle('probar-etiqueta', async (_e, opts = {}) => {
  const nombre = String(opts.impresora || config.ETIQUETA_IMPRESORA || '').trim();
  if (!nombre) return { ok: false, mensaje: 'Elige primero la etiquetadora USB.' };
  const ancho = parseInt(opts.ancho, 10) || 50;
  const alto = parseInt(opts.alto, 10) || 25;
  try {
    // 2 + PLU 00001 + 003690 centavos + digito verificador: un EAN-13 real, para que
    // la prueba tambien sirva para comprobar que la caja lo escanea.
    await imprimirEtiquetaUsb({
      printer_modo: 'usb',
      printer_nombre: nombre,
      producto_nombre: 'PRUEBA - Jitomate saladet',
      peso_kg: 1.234,
      precio_kg: 29.9,
      precio_total: 36.9,
      barcode: '2000010036905',
      label_width_mm: ancho,
      label_height_mm: alto,
    });
    return { ok: true, mensaje: `Etiqueta de prueba enviada a "${nombre}". Si sale en blanco o cortada, `
      + 'revisa el tamano del rollo en el driver de la impresora.' };
  } catch (e) {
    return { ok: false, mensaje: e.message };
  }
});

ipcMain.handle('abrir-log', () => { shell.showItemInFolder(logFile); });

// ── Electron app ────────────────────────────────────────────────────────────────
function rutaIcono() {
  return app.isPackaged ? path.join(process.resourcesPath, 'icon.ico') : path.join(__dirname, 'icon.ico');
}

// Si alguien intenta abrir un segundo bridge, en vez de pelear por el puerto COM
// traemos al frente la configuracion del que ya esta corriendo.
app.on('second-instance', () => {
  console.log('[bridge] Se intento abrir una segunda instancia — se muestra la configuracion de la actual');
  abrirConfig();
});

app.whenReady().then(() => {
  if (app.dock) app.dock.hide();
  app.setAppUserModelId('POS-iaDoS Bridge Bascula');

  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true, name: 'POS-iaDoS Bridge Bascula', args: [] });
  }

  const iconImg = nativeImage.createFromPath(rutaIcono());
  tray = new Tray(iconImg.isEmpty() ? nativeImage.createFromDataURL(FALLBACK_ICON) : iconImg);
  tray.setToolTip('POS-iaDoS — Bridge Bascula');
  tray.on('double-click', abrirConfig);
  updateTray('Iniciando...');

  connectSocket();
  abrirBascula();
  iniciarServidorLocal();
  calentarImpresion();
  vigilarImpresora();

  // Primera vez: no dejamos al usuario adivinando. Basta con que tenga token y al
  // menos un aparato configurado — hay tiendas que solo quieren el cajon.
  if (!config.TIENDA_TOKEN || (!config.SCALE_PORT && !cajonConfigurado())) abrirConfig();
});

function updateTray(status) {
  if (!tray) return;
  tray.setToolTip('POS-iaDoS Bridge Bascula — ' + status);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'POS-iaDoS — Bridge Bascula', enabled: false },
    { label: status, enabled: false },
    { label: `Backend: ${config.BACKEND_URL}`, enabled: false },
    { label: `Puerto bascula: ${config.SCALE_PORT || '(sin configurar)'}`, enabled: false },
    { label: `Cajon (${modoCajon() === 'impresora' ? 'por impresora' : 'adaptador USB'}): ${descripcionCajon()}`
        + (modoCajon() === 'impresora' && impresoraPresente === false ? '  [no instalada]' : ''), enabled: false },
    { label: `Puente local: ${estado.puente}`, enabled: false },
    { type: 'separator' },
    { label: 'Abrir cajon (prueba)', enabled: cajonConfigurado(), click: () => {
      abrirCajon({ diagnostico: true }).then((r) => { if (!r.ok) console.warn('[bridge] Abrir cajon:', r.mensaje); });
    } },
    { label: 'Configuracion...', click: abrirConfig },
    { label: 'Ver bitacora (bridge.log)', click: () => shell.showItemInFolder(logFile) },
    { type: 'separator' },
    { label: 'Salir', click: () => { app.quit(); } },
  ]));
}

app.on('window-all-closed', (e) => e.preventDefault());
app.on('will-quit', () => {
  for (const res of [...sseClientes]) { try { res.end(); } catch (_) {} }
  sseClientes.clear();
  if (servidorLocal) { try { servidorLocal.close(); } catch (_) {} servidorLocal = null; }
  if (socket) socket.disconnect();
  if (scaleReintento) { clearTimeout(scaleReintento); scaleReintento = null; }
  if (scalePoller) { clearInterval(scalePoller); scalePoller = null; }
  if (scalePort?.isOpen) scalePort.close();
});
