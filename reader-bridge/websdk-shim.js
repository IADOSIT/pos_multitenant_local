/**
 * WebSdk shim para Electron (Main Process)
 * Provee la interfaz que @digitalpersona/devices espera encontrar en un entorno web.
 *
 * Flujo correcto DpHostW:
 *   1. Descubrir puerto HTTP de DpHostW (netstat por PID o prueba de puertos conocidos)
 *   2. GET https://127.0.0.1:{port}/get_connection → { endpoint: "wss://127.0.0.1:{port}/..." }
 *   3. Conectar a {endpoint}/{channelName} vía WebSocket
 */
'use strict';

const WebSocket = require('ws');
const https     = require('https');
const { execSync } = require('child_process');
const net = require('net');

const KNOWN_DP_PORTS = [15897, 15896, 15898, 15899, 15900, 15901, 15895];

async function isPortOpen(port) {
  return new Promise(resolve => {
    const sock = new net.Socket();
    sock.setTimeout(300);
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error',   () => { sock.destroy(); resolve(false); });
    sock.on('timeout', () => { sock.destroy(); resolve(false); });
    sock.connect(port, '127.0.0.1');
  });
}

// Descubrir puerto HTTP de DpHostW.exe por PID
async function discoverPortByPid() {
  const DP_EXECUTABLES = ['DpHostW.exe', 'DPHostW.exe', 'dphost.exe'];
  try {
    let netstatOut;
    try { netstatOut = execSync('netstat -ano', { encoding: 'utf8', timeout: 5000 }); } catch (_) { return null; }
    for (const exeName of DP_EXECUTABLES) {
      try {
        const tasklist = execSync(`tasklist /FI "IMAGENAME eq ${exeName}" /FO CSV /NH`, { encoding: 'utf8', timeout: 3000 }).trim();
        if (!tasklist || tasklist.toLowerCase().includes('no tasks')) continue;
        const m = tasklist.match(/"[^"]+","(\d+)"/);
        if (!m) continue;
        const pid = m[1];
        for (const line of netstatOut.split('\n')) {
          if (line.includes('LISTENING') && line.trim().endsWith(pid)) {
            const pm = line.match(/127\.0\.0\.1:(\d+)/);
            if (pm) {
              const port = parseInt(pm[1], 10);
              console.log(`[websdk-shim] ${exeName} PID=${pid} puerto=${port}`);
              return port;
            }
          }
        }
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

async function discoverPort() {
  const pidPort = await discoverPortByPid();
  if (pidPort) return pidPort;

  for (const port of KNOWN_DP_PORTS) {
    if (await isPortOpen(port)) {
      console.log(`[websdk-shim] Puerto encontrado por probe: ${port}`);
      return port;
    }
  }
  return 15897;
}

// Obtener endpoint WebSocket real via GET /get_connection
// Retorna la URL base tal como viene (DpHostW espera concatenación directa + /channelName)
function getConnectionEndpoint(port) {
  return new Promise((resolve, reject) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const req = https.get(
      `https://127.0.0.1:${port}/get_connection`,
      { rejectUnauthorized: false },
      (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const { endpoint } = JSON.parse(d);
            // Convertir https→wss, quitar trailing slash
            const wsBase = endpoint
              .replace('https://', 'wss://')
              .replace('http://',  'ws://')
              .replace(/\/$/, '');
            console.log(`[websdk-shim] WS endpoint: ${wsBase.substring(0, 80)}...`);
            resolve(wsBase);
          } catch (e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(4000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ── WebChannelClient ─────────────────────────────────────────────────────────
class WebChannelClient {
  constructor(channelName, options) {
    this.channelName = channelName;
    this.options = options || {};
    this._ws = null;
    this._connected = false;
    this.onConnectionSucceed = null;
    this.onConnectionFailed = null;
    this.onDataReceivedTxt  = null;
  }

  connect() {
    if (this._connected) return;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    discoverPort().then(async port => {
      let url;
      try {
        const wsBase = await getConnectionEndpoint(port);
        // Insertar channelName en el path, antes del query string
        const qIdx = wsBase.indexOf('?');
        if (qIdx > 0) {
          url = wsBase.slice(0, qIdx).replace(/\/$/, '') + '/' + this.channelName + wsBase.slice(qIdx);
        } else {
          url = wsBase.replace(/\/$/, '') + '/' + this.channelName;
        }
      } catch (e) {
        url = `wss://127.0.0.1:${port}/${this.channelName}`;
        console.warn(`[websdk-shim] /get_connection falló (${e.message}), fallback: ${url}`);
      }
      console.log(`[websdk-shim] Conectando: ${url}`);

      try {
        const ws = new WebSocket(url, { rejectUnauthorized: false });
        this._ws = ws;

        ws.on('open', () => {
          this._connected = true;
          console.log('[websdk-shim] Conectado a DpHostW OK ✓');
          if (this.onConnectionSucceed) this.onConnectionSucceed();
        });

        ws.on('message', (data) => {
          const raw = data.toString();
          console.log(`[websdk-shim] RX len=${raw.length} preview=${raw.substring(0, 80)}`);
          if (this.onDataReceivedTxt) {
            try { this.onDataReceivedTxt(raw); } catch (e) {
              console.error('[websdk-shim] onDataReceivedTxt error:', e.message);
            }
          }
        });

        ws.on('error', (e) => {
          console.warn('[websdk-shim] WS error:', e.message);
          if (!this._connected && this.onConnectionFailed) this.onConnectionFailed();
        });

        ws.on('close', () => {
          this._connected = false;
          this._ws = null;
        });
      } catch (e) {
        console.warn('[websdk-shim] Error creando WS:', e.message);
        if (this.onConnectionFailed) this.onConnectionFailed();
      }
    }).catch(e => {
      console.warn('[websdk-shim] discoverPort error:', e.message);
      if (this.onConnectionFailed) this.onConnectionFailed();
    });
  }

  isConnected() { return this._connected; }

  sendDataTxt(data) {
    if (this._ws && this._connected) {
      try {
        console.log(`[websdk-shim] sendDataTxt len=${data.length} preview=${data.substring(0, 60)}`);
        this._ws.send(data);
      } catch (e) { console.error('[websdk-shim] send error:', e.message); }
    } else {
      console.warn('[websdk-shim] sendDataTxt: no conectado');
    }
  }

  disconnect() {
    if (this._ws) { try { this._ws.close(); } catch (_) {} this._ws = null; }
    this._connected = false;
  }
}

const WebSdk = { WebChannelClient };
global.WebSdk = WebSdk;

const Module   = require('module');
const _origReq = Module.prototype.require;
Module.prototype.require = function(name) {
  if (name === 'WebSdk') return WebSdk;
  return _origReq.apply(this, arguments);
};

module.exports = WebSdk;
