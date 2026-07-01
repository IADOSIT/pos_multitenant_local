/**
 * POS-iaDoS Reader Bridge
 * Adaptado de FitControl GYM (C:\sites\FITCONTROLGYM\reader-bridge\main.js)
 *
 * Electron tray app que:
 *  1. Crea una BrowserWindow oculta que corre @digitalpersona/devices en contexto Chromium
 *  2. La ventana captura FMDs usando la WebSocket nativa de Chromium (no Node.js ws)
 *  3. Envía FMDs al main via IPC → matching local → socket.io (/biometrico) → backend → frontend
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, net, ipcMain } = require('electron');
const path   = require('path');
const { io } = require('socket.io-client');
const { findMatch } = require('./fmdMatcher');
const fs     = require('fs');

// ── Log a archivo ─────────────────────────────────────────────────────────────
const logFile = path.join(
  app.isPackaged ? path.dirname(process.execPath) : __dirname,
  'bridge.log'
);
const _origLog  = console.log.bind(console);
const _origWarn = console.warn.bind(console);
const _origErr  = console.error.bind(console);
function writeLog(prefix, args) {
  const line = `[${new Date().toISOString()}] ${prefix}${args.map(String).join(' ')}\n`;
  try { fs.appendFileSync(logFile, line); } catch (_) {}
}
console.log   = (...a) => { _origLog(...a);  writeLog('', a); };
console.warn  = (...a) => { _origWarn(...a); writeLog('WARN ', a); };
console.error = (...a) => { _origErr(...a);  writeLog('ERR ', a); };

// ── Configuración ─────────────────────────────────────────────────────────────
function loadConfig() {
  const defaults = { BACKEND_URL: 'https://posapi.iados.online', EMPRESA_TOKEN: '' };
  const appDir   = app.isPackaged ? path.dirname(process.execPath) : __dirname;
  const envPath  = path.join(appDir, '.env');
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
let tray   = null;
let socket = null;
let fpWin  = null;
let empleadoTemplates = []; // [{ memberId: empleado_id, template: fmd_template }] — fmdMatcher.js usa estos nombres genéricos
let enrollCallback  = null;

// ── Heartbeat ─────────────────────────────────────────────────────────────────
function sendHeartbeat() {
  if (!socket?.connected) return;
  const req = net.request({ method: 'POST', url: `${config.BACKEND_URL}/api/public/biometrico/heartbeat/${config.EMPRESA_TOKEN}` });
  req.on('response', () => {});
  req.on('error', () => {});
  req.end();
}

// ── Templates ─────────────────────────────────────────────────────────────────
function fetchTemplates() {
  const url = `${config.BACKEND_URL}/api/public/biometrico/templates/${config.EMPRESA_TOKEN}`;
  console.log('[bridge] Refrescando plantillas desde:', url);
  const req = net.request(url);
  req.on('response', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const list = JSON.parse(data);
          empleadoTemplates = list.map(e => ({
            memberId: e.empleado_id,
            template: e.fmd_template
          })).filter(e => e.template);
          console.log(`[bridge] ${empleadoTemplates.length} plantillas cargadas ✓`);
        } catch (e) { console.error('[bridge] Error parseando templates:', e.message); }
      }
    });
  });
  req.on('error', () => {});
  req.end();
}

// ── IPC handlers — registrados UNA sola vez ───────────────────────────────────
ipcMain.on('fp-log', (_, msg) => console.log(msg));

ipcMain.on('fp-fmd', (_, fmdB64) => {
  if (!socket?.connected) { console.warn('[bridge] Sin socket — FMD descartado'); return; }
  const empleadoId = findMatch(fmdB64, empleadoTemplates);
  if (empleadoId) {
    console.log('[bridge] Match local: empleado_id=', empleadoId);
    socket.emit('bridge-match', { empleado_id: empleadoId, timestamp: new Date().toISOString() });
    updateTray('Huella reconocida ✓');
  } else {
    console.log('[bridge] Sin match — enviando FMD al backend');
    socket.emit('bridge-fmd', { fmdB64, timestamp: new Date().toISOString() });
    updateTray('FMD enviado');
  }
  setTimeout(() => updateTray('Conectado — esperando huella'), 2000);
});

ipcMain.on('fp-enroll-done', (_, result) => {
  console.log('[bridge] Enroll result:', JSON.stringify(result));
  // result viene del renderer como { success, memberId, fmdB64 } — memberId es el empleado_id que se pidió enrolar
  if (socket?.connected) socket.emit('bridge-enroll-done', { empleado_id: result.memberId, fmdB64: result.fmdB64 });
  if (enrollCallback) { enrollCallback(result); enrollCallback = null; }
  updateTray(result.success ? 'Enroll OK ✓' : 'Enroll fallido');
  setTimeout(() => updateTray('Conectado — esperando huella'), 3000);
});

// ── Ventana oculta de fingerprint (renderer Chromium) ────────────────────────
function createFingerprintWindow() {
  if (fpWin) return;   // evitar múltiples instancias
  fpWin = new BrowserWindow({
    show:        true,
    width:       300,
    height:      80,
    frame:       false,
    resizable:   false,
    skipTaskbar: true,
    alwaysOnTop: true,
    x:           0,
    y:           0,
    webPreferences: {
      nodeIntegration:       true,
      contextIsolation:      false,
      webSecurity:           false,
      backgroundThrottling:  false,
      preload: path.join(__dirname, 'fingerprint-preload.js'),
    },
  });

  fpWin.loadFile(path.join(__dirname, 'fingerprint-renderer.html'));

  fpWin.on('close', (e) => {
    e.preventDefault();
    fpWin.hide();
  });
}

// ── Socket.io → backend (namespace /biometrico) ───────────────────────────────
function connectSocket() {
  socket = io(`${config.BACKEND_URL}/biometrico`, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 5000,
  });

  socket.on('connect', () => {
    socket.emit('bridge-join', { empresa_token: config.EMPRESA_TOKEN });
    console.log('[bridge] Conectado al backend, empresa_token:', config.EMPRESA_TOKEN);
    updateTray('Conectado — esperando huella');
    fetchTemplates();
    sendHeartbeat();
  });

  socket.on('bridge-welcome', ({ empresa_id }) => {
    console.log('[bridge] bridge-welcome empresa_id=', empresa_id);
  });

  socket.on('bridge-error', ({ message }) => {
    console.warn('[bridge] bridge-error:', message);
    updateTray('Error: ' + message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[bridge] Desconectado:', reason);
    updateTray('Sin conexión con backend...');
  });

  socket.on('connect_error', (err) => {
    console.warn('[bridge] Error conexión:', err.message);
  });

  socket.on('bridge-enroll-start', ({ empleado_id }) => {
    if (!empleado_id) return;
    console.log('[bridge] Enroll solicitado para empleado_id:', empleado_id);
    updateTray('Enrollando — pon el dedo en el lector');
    fpWin?.webContents.send('fp-start-enroll', empleado_id);
  });

  // ── Stub torniquete: FitControl dispara un relay Shelly aqui via HTTP local.
  // Para POS-iaDoS se deja comentado — activar en el futuro si se agregan torniquetes.
  // socket.on('open_device', ({ ip_address, auto_timer_s }) => {
  //   if (!ip_address) return;
  //   const timer = auto_timer_s || 3;
  //   const http = require('http');
  //   const req = http.request({
  //     hostname: ip_address, port: 80,
  //     path: `/rpc/Switch.Set?id=0&on=true&toggle_after=${timer}`,
  //     method: 'GET', timeout: 5000,
  //   }, (res) => { console.log(`[bridge] Shelly ${ip_address} -> HTTP ${res.statusCode}`); });
  //   req.on('timeout', () => { req.destroy(); });
  //   req.on('error', (err) => { console.error(`[bridge] Shelly ${ip_address} error:`, err.message); });
  //   req.end();
  // });
}

// ── Electron app ───────────────────────────────────────────────────────────────
// Bypass TLS validation para DpHostW (certificado autofirmado local)
app.commandLine.appendSwitch('ignore-certificate-errors');

app.whenReady().then(() => {
  if (app.dock) app.dock.hide();
  app.setAppUserModelId('POS-iaDoS Bridge Biometrico');

  // Bypass TLS para websockets del renderer (DpHostW usa cert autofirmado)
  const { session } = require('electron');
  session.defaultSession.setCertificateVerifyProc((request, callback) => {
    if (request.hostname === '127.0.0.1') { callback(0); return; }
    callback(-3); // default behavior
  });

  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true, name: 'POS-iaDoS Bridge Biometrico', args: [] });
  }

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, 'icon.ico');
  const iconImg = nativeImage.createFromPath(iconPath);
  tray = new Tray(iconImg.isEmpty() ? nativeImage.createFromDataURL(FALLBACK_ICON) : iconImg);
  tray.setToolTip('POS-iaDoS — Bridge Biométrico');
  updateTray('Iniciando...');

  connectSocket();
  createFingerprintWindow();

  setInterval(fetchTemplates, 120000);
  setInterval(sendHeartbeat, 5000);
});

function updateTray(status) {
  if (!tray) return;
  tray.setToolTip('POS-iaDoS Bridge Biométrico — ' + status);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'POS-iaDoS — Bridge Biométrico', enabled: false },
    { label: status, enabled: false },
    { label: `Backend: ${config.BACKEND_URL}`, enabled: false },
    { label: `Empresa token: ${config.EMPRESA_TOKEN.substring(0, 8)}...`, enabled: false },
    { label: `Empleados en cache: ${empleadoTemplates.length}`, enabled: false },
    { type: 'separator' },
    { label: 'Refrescar plantillas', click: fetchTemplates },
    { label: 'Salir', click: () => { if (fpWin) fpWin.destroy(); app.quit(); } },
  ]));
}

app.on('window-all-closed', (e) => e.preventDefault());
app.on('will-quit', () => { if (socket) socket.disconnect(); });
