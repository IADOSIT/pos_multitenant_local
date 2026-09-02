/**
 * POS-iaDoS Bridge Bascula
 * Electron tray app que:
 *  1. Lee el peso en vivo de una bascula conectada por RS-232/USB (serialport)
 *  2. Retransmite el peso al backend via Socket.io (namespace /bascula)
 *  3. Recibe la orden de imprimir etiqueta y envia el ZPL por socket TCP crudo
 *     al puerto 9100 de una impresora de etiquetas en red (Zebra/GoDEX/TSC compatible)
 */

const { app, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');
const { io } = require('socket.io-client');
const { SerialPort } = require('serialport');

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
function loadConfig() {
  const defaults = {
    BACKEND_URL: 'https://posapi.iados.online',
    TIENDA_TOKEN: '',
    SCALE_PORT: 'COM3',
    SCALE_BAUD: '9600',
    // Basculas de polling (p.ej. Torrey por USB CDC): no transmiten solas, hay que
    // pedirles el peso. SCALE_POLL_MS=0 deja el comportamiento de flujo continuo.
    SCALE_POLL_CMD: 'P\\r\\n',
    SCALE_POLL_MS: '0',
  };
  const appDir = app.isPackaged ? path.dirname(process.execPath) : __dirname;
  const envPath = path.join(appDir, '.env');
  if (!fs.existsSync(envPath)) return defaults;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [k, ...v] = t.split('=');
    if (k && v.length) defaults[k.trim()] = v.join('=').trim();
  }
  return defaults;
}

const FALLBACK_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABiSURBVDiNY/z//z8DJYCJgUIwasCoAaMGjBpAXQMYsSmur69nJNYFjBcuXGDEZzkjMQYwMjIyEusCkgwg2gBiXECyAcS4gGQDiHEByQYQ4wKSDSDGBSQbQIwLSDaAkXIAANiFF5DI3VkAAAAASUVORK5CYII=';

const config = loadConfig();
let tray = null;
let socket = null;
let scalePort = null;
let scaleBuffer = '';
let scalePoller = null;
let lastPesoEmitido = null;
let lastPesoEstable = 0;

// ── Socket.io -> backend (namespace /bascula) ─────────────────────────────────
function connectSocket() {
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
    updateTray('Conectado — esperando peso');
  });

  socket.on('bridge-error', ({ message }) => {
    console.warn('[bridge] bridge-error:', message);
    updateTray('Error: ' + message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[bridge] Desconectado:', reason);
    updateTray('Sin conexion con backend...');
  });

  socket.on('connect_error', (err) => {
    console.warn('[bridge] Error conexion:', err.message);
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
    if (socket?.connected) socket.emit('bridge-weight', { peso_kg: pesoRedondeado, estable });
  }
}

function abrirBascula() {
  const portPath = config.SCALE_PORT;
  const baudRate = parseInt(config.SCALE_BAUD, 10) || 9600;
  const pollMs = parseInt(config.SCALE_POLL_MS, 10) || 0;
  const pollCmd = decodificarCmd(config.SCALE_POLL_CMD);

  scalePort = new SerialPort({ path: portPath, baudRate, autoOpen: false });

  scalePort.open((err) => {
    if (err) {
      console.warn(`[bridge] No se pudo abrir ${portPath}: ${err.message} — reintentando en 10s`);
      updateTray(`Sin bascula (${portPath})`);
      setTimeout(abrirBascula, 10000);
      return;
    }
    console.log(`[bridge] Bascula conectada en ${portPath} @ ${baudRate}bps`);
    updateTray('Conectado — esperando peso');

    if (pollMs > 0 && pollCmd) {
      console.log(`[bridge] Modo polling: enviando ${JSON.stringify(pollCmd)} cada ${pollMs}ms`);
      scalePoller = setInterval(() => {
        if (scalePort?.isOpen) scalePort.write(pollCmd, (e) => { if (e) console.warn('[bridge] write:', e.message); });
      }, pollMs);
    }
  });

  scalePort.on('data', (chunk) => {
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

  scalePort.on('error', (err) => {
    console.error('[bridge] Error de puerto serial:', err.message);
  });

  scalePort.on('close', () => {
    console.warn('[bridge] Puerto serial cerrado — reintentando en 10s');
    if (scalePoller) { clearInterval(scalePoller); scalePoller = null; }
    scaleBuffer = '';
    updateTray('Bascula desconectada');
    setTimeout(abrirBascula, 10000);
  });
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

// ── Electron app ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (app.dock) app.dock.hide();
  app.setAppUserModelId('POS-iaDoS Bridge Bascula');

  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true, name: 'POS-iaDoS Bridge Bascula', args: [] });
  }

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, 'icon.ico');
  const iconImg = nativeImage.createFromPath(iconPath);
  tray = new Tray(iconImg.isEmpty() ? nativeImage.createFromDataURL(FALLBACK_ICON) : iconImg);
  tray.setToolTip('POS-iaDoS — Bridge Bascula');
  updateTray('Iniciando...');

  connectSocket();
  abrirBascula();
});

function updateTray(status) {
  if (!tray) return;
  tray.setToolTip('POS-iaDoS Bridge Bascula — ' + status);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'POS-iaDoS — Bridge Bascula', enabled: false },
    { label: status, enabled: false },
    { label: `Backend: ${config.BACKEND_URL}`, enabled: false },
    { label: `Puerto bascula: ${config.SCALE_PORT}`, enabled: false },
    { type: 'separator' },
    { label: 'Salir', click: () => { app.quit(); } },
  ]));
}

app.on('window-all-closed', (e) => e.preventDefault());
app.on('will-quit', () => {
  if (socket) socket.disconnect();
  if (scalePoller) { clearInterval(scalePoller); scalePoller = null; }
  if (scalePort?.isOpen) scalePort.close();
});
