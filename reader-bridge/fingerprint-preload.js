'use strict';
/**
 * Preload script para la ventana oculta de fingerprint.
 * Provee WebSdk usando window.WebSocket de Chromium (no Node.js ws).
 * Expone API al renderer via contextBridge.
 */
const { contextBridge, ipcRenderer } = require('electron');
const https = require('https');
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

async function discoverPort() {
  try {
    let netstatOut = execSync('netstat -ano', { encoding: 'utf8', timeout: 5000 });
    for (const exeName of ['DpHostW.exe', 'DPHostW.exe']) {
      try {
        const tasklist = execSync(`tasklist /FI "IMAGENAME eq ${exeName}" /FO CSV /NH`, { encoding: 'utf8', timeout: 3000 }).trim();
        if (!tasklist || tasklist.toLowerCase().includes('no tasks')) continue;
        const m = tasklist.match(/"[^"]+","(\d+)"/);
        if (!m) continue;
        const pid = m[1];
        for (const line of netstatOut.split('\n')) {
          if (line.includes('LISTENING') && line.trim().endsWith(pid)) {
            const pm = line.match(/127\.0\.0\.1:(\d+)/);
            if (pm) return parseInt(pm[1], 10);
          }
        }
      } catch (_) {}
    }
  } catch (_) {}
  for (const port of KNOWN_DP_PORTS) {
    if (await isPortOpen(port)) return port;
  }
  return 15897;
}

async function getConnectionEndpoint(port) {
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
            const wsBase = endpoint
              .replace('https://', 'wss://')
              .replace('http://', 'ws://')
              .replace(/\/$/, '');
            resolve(wsBase);
          } catch (e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(4000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// WebSdk shim usando window.WebSocket (Chromium) — disponible en contexto preload
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
      let wsUrl;
      try {
        const wsBase = await getConnectionEndpoint(port);
        // Insertar channelName antes del query string (DpHostW enruta por path)
        const qIdx = wsBase.indexOf('?');
        if (qIdx > 0) {
          wsUrl = wsBase.slice(0, qIdx).replace(/\/$/, '') + '/' + this.channelName + wsBase.slice(qIdx);
        } else {
          wsUrl = wsBase.replace(/\/$/, '') + '/' + this.channelName;
        }
      } catch (e) {
        wsUrl = `wss://127.0.0.1:${port}/${this.channelName}`;
        ipcRenderer.send('fp-log', `[preload] /get_connection falló: ${e.message}`);
      }
      ipcRenderer.send('fp-log', `[preload] Conectando Chromium WS: ${wsUrl.substring(0, 120)}`);

      try {
        // USA window.WebSocket de Chromium, NO el ws de Node.js
        const ws = new window.WebSocket(wsUrl);
        this._ws = ws;

        ws.onopen = () => {
          this._connected = true;
          ipcRenderer.send('fp-log', '[preload] Conectado a DpHostW via Chromium WS ✓');
          if (this.onConnectionSucceed) this.onConnectionSucceed();
        };

        ws.onmessage = (event) => {
          const raw = typeof event.data === 'string' ? event.data : event.data.toString();
          ipcRenderer.send('fp-log', `[preload] RX len=${raw.length} preview=${raw.substring(0, 60)}`);
          if (this.onDataReceivedTxt) {
            try { this.onDataReceivedTxt(raw); } catch (e) {
              ipcRenderer.send('fp-log', '[preload] onDataReceivedTxt error: ' + e.message);
            }
          }
        };

        ws.onerror = (e) => {
          ipcRenderer.send('fp-log', '[preload] WS error');
          if (!this._connected && this.onConnectionFailed) this.onConnectionFailed();
        };

        ws.onclose = () => {
          this._connected = false;
          this._ws = null;
        };
      } catch (e) {
        ipcRenderer.send('fp-log', '[preload] Error creando WS: ' + e.message);
        if (this.onConnectionFailed) this.onConnectionFailed();
      }
    }).catch(e => {
      ipcRenderer.send('fp-log', '[preload] discoverPort error: ' + e.message);
      if (this.onConnectionFailed) this.onConnectionFailed();
    });
  }

  isConnected() { return this._connected; }

  sendDataTxt(data) {
    if (this._ws && this._connected) {
      try { this._ws.send(data); } catch (e) {
        ipcRenderer.send('fp-log', '[preload] send error: ' + e.message);
      }
    }
  }

  disconnect() {
    if (this._ws) { try { this._ws.close(); } catch (_) {} this._ws = null; }
    this._connected = false;
  }
}

// Inyectar WebSdk en window para que @digitalpersona/devices lo encuentre
window.WebSdk = { WebChannelClient };

// Sin contextIsolation — exponer directamente en window
window.electronAPI = {
  log:           (msg)   => ipcRenderer.send('fp-log', msg),
  fmdCaptured:   (fmd)   => ipcRenderer.send('fp-fmd', fmd),
  enrollDone:    (data)  => ipcRenderer.send('fp-enroll-done', data),
  onStartEnroll: (cb)    => ipcRenderer.on('fp-start-enroll', (_, mid) => cb(mid)),
};
