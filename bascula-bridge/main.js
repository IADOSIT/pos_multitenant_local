/**
 * POS-iaDoS Bridge Bascula
 * Electron tray app que:
 *  1. Lee el peso en vivo de una bascula conectada por RS-232/USB (serialport)
 *  2. Retransmite el peso al backend via Socket.io (namespace /bascula)
 *  3. Recibe la orden de imprimir etiqueta y envia el ZPL por socket TCP crudo
 *     al puerto 9100 de una impresora de etiquetas en red (Zebra/GoDEX/TSC compatible)
 */

const { app, Tray, Menu, nativeImage, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');
const { io } = require('socket.io-client');
const { SerialPort } = require('serialport');

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
  SCALE_PORT: '',
  SCALE_BAUD: '9600',
  // Basculas de polling (p.ej. Torrey por USB CDC): no transmiten solas, hay que
  // pedirles el peso. SCALE_POLL_MS=0 deja el comportamiento de flujo continuo.
  SCALE_POLL_CMD: 'P\\r\\n',
  SCALE_POLL_MS: '0',
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
let lastPesoEmitido = null;
let lastPesoEstable = 0;
let configWin = null;

// Estado que se pinta en la ventana de Configuracion y en el menu de la bandeja.
const estado = {
  backend: 'Iniciando...',
  tienda_id: null,
  bascula: 'Sin abrir',
  puerto: '',
  polling: false,
  peso: null,
  ultimaTrama: '',
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
    SCALE_PORT: config.SCALE_PORT,
    SCALE_BAUD: config.SCALE_BAUD,
    SCALE_POLL_CMD: config.SCALE_POLL_CMD,
    SCALE_POLL_MS: config.SCALE_POLL_MS,
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
    socket.emit('bridge-join', { tienda_token: config.TIENDA_TOKEN });
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
    console.warn('[bridge] Error conexion:', err.message);
    estado.backend = 'Sin conexion (' + err.message + ')';
    pushEstado();
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
  scaleReintento = setTimeout(abrirBascula, 10000);
}

function abrirBascula() {
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

  port.open((err) => {
    // Se reconfiguro (o se cerro) mientras abriamos: este intento ya no vale.
    if (gen !== scaleGen) {
      if (!err) {
        console.warn('[bridge] Apertura tardia descartada — soltando el puerto');
        port.close(() => {});
      }
      return;
    }
    if (err) {
      console.warn(`[bridge] No se pudo abrir ${portPath}: ${err.message} — reintentando en 10s`);
      estado.bascula = `No abre ${portPath}: ${err.message}`;
      updateTray(`Sin bascula (${portPath})`);
      pushEstado();
      programarReintento();
      return;
    }
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
}

// ── Impresora de etiquetas (ZPL por TCP crudo, puerto 9100) ───────────────────
function imprimirEtiqueta(payload) {
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

function construirZpl(payload) {
  const widthDots = Math.round((payload.label_width_mm || 40) * 8);  // ~8 dots/mm a 203dpi
  const heightDots = Math.round((payload.label_height_mm || 30) * 8);
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
  for (const k of ['BACKEND_URL', 'TIENDA_TOKEN', 'SCALE_PORT', 'SCALE_BAUD', 'SCALE_POLL_CMD', 'SCALE_POLL_MS']) {
    if (patch[k] !== undefined) limpio[k] = String(patch[k]).trim();
  }
  saveConfig(limpio);
  console.log('[bridge] Configuracion guardada:', JSON.stringify({ ...limpio, TIENDA_TOKEN: limpio.TIENDA_TOKEN ? limpio.TIENDA_TOKEN.slice(0, 8) + '...' : '' }));
  reiniciarConexiones();
  return { ok: true, config: configPublica() };
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

  // Primera vez (sin token o sin puerto): no dejamos al usuario adivinando.
  if (!config.TIENDA_TOKEN || !config.SCALE_PORT) abrirConfig();
});

function updateTray(status) {
  if (!tray) return;
  tray.setToolTip('POS-iaDoS Bridge Bascula — ' + status);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'POS-iaDoS — Bridge Bascula', enabled: false },
    { label: status, enabled: false },
    { label: `Backend: ${config.BACKEND_URL}`, enabled: false },
    { label: `Puerto bascula: ${config.SCALE_PORT || '(sin configurar)'}`, enabled: false },
    { type: 'separator' },
    { label: 'Configuracion...', click: abrirConfig },
    { label: 'Ver bitacora (bridge.log)', click: () => shell.showItemInFolder(logFile) },
    { type: 'separator' },
    { label: 'Salir', click: () => { app.quit(); } },
  ]));
}

app.on('window-all-closed', (e) => e.preventDefault());
app.on('will-quit', () => {
  if (socket) socket.disconnect();
  if (scaleReintento) { clearTimeout(scaleReintento); scaleReintento = null; }
  if (scalePoller) { clearInterval(scalePoller); scalePoller = null; }
  if (scalePort?.isOpen) scalePort.close();
});
