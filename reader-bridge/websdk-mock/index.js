'use strict';

/**
 * Adaptador WebSdk para Electron Renderer.
 * Prepara globales browser-like y carga @digitalpersona/websdk oficial (SRP real).
 * Fallback a shim manual si falla.
 */

function ensureBrowserGlobals() {
  const g = globalThis;
  if (!g.window)      g.window      = g;
  if (!g.self)        g.self        = g;
  if (!g.document)    g.document    = { createElement: (tag) => ({ href: '', hostname: '', search: '' }) };
  if (!g.navigator)   g.navigator   = { userAgent: 'electron' };
  if (!g.location)    g.location    = { protocol: 'https:' };
  const store = new Map();
  if (!g.localStorage)  g.localStorage  = { getItem: k => store.get(k) ?? null, setItem: (k,v) => store.set(k,v), removeItem: k => store.delete(k) };
  if (!g.sessionStorage) g.sessionStorage = g.localStorage;
  if (!g.atob) g.atob = i => Buffer.from(String(i), 'base64').toString('binary');
  if (!g.btoa) g.btoa = i => Buffer.from(String(i), 'binary').toString('base64');
  // El bundle de @digitalpersona/websdk necesita `async` como global
  if (!g.async) {
    try { g.async = require('async'); } catch (_) {}
  }
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
ensureBrowserGlobals();

try {
  require('@digitalpersona/websdk');
  if (globalThis.WebSdk && typeof globalThis.WebSdk.WebChannelClient === 'function') {
    console.log('[WebSdk] SDK oficial cargado ✓ (SRP auth)');
    module.exports = globalThis.WebSdk;
    return;
  }
  console.warn('[WebSdk] require ok pero WebSdk no expuesto — usando shim');
} catch (err) {
  console.warn('[WebSdk] SDK oficial falló (' + err.message + ') — usando shim');
}

// ── Shim de fallback ──────────────────────────────────────────────────────────
const https = require('https');
const { execSync } = require('child_process');
const net   = require('net');

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
    const out = execSync('netstat -ano', { encoding: 'utf8', timeout: 5000 });
    for (const exe of ['DpHostW.exe', 'DPHostW.exe']) {
      try {
        const tl = execSync(`tasklist /FI "IMAGENAME eq ${exe}" /FO CSV /NH`, { encoding: 'utf8', timeout: 3000 }).trim();
        if (!tl || tl.toLowerCase().includes('no tasks')) continue;
        const m = tl.match(/"[^"]+","(\d+)"/);
        if (!m) continue;
        const pid = m[1];
        for (const line of out.split('\n')) {
          if (line.includes('LISTENING') && line.trim().endsWith(pid)) {
            const pm = line.match(/127\.0\.0\.1:(\d+)/);
            if (pm) return parseInt(pm[1], 10);
          }
        }
      } catch (_) {}
    }
  } catch (_) {}
  for (const p of KNOWN_DP_PORTS) { if (await isPortOpen(p)) return p; }
  return 15897;
}

async function getConnectionEndpoint(port) {
  return new Promise((resolve, reject) => {
    const req = https.get(`https://127.0.0.1:${port}/get_connection`, { rejectUnauthorized: false }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const { endpoint } = JSON.parse(d);
          resolve(endpoint.replace('https://', 'wss://').replace('http://', 'ws://').replace(/\/$/, ''));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(4000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

class WebChannelClient {
  constructor(channelName) {
    this.channelName = channelName;
    this._ws = null;
    this._connected = false;
    this.onConnectionSucceed = null;
    this.onConnectionFailed  = null;
    this.onDataReceivedTxt   = null;
  }

  connect() {
    if (this._connected) return;
    discoverPort().then(async port => {
      let wsUrl;
      try {
        const base = await getConnectionEndpoint(port);
        const q = base.indexOf('?');
        wsUrl = q > 0
          ? base.slice(0, q).replace(/\/$/, '') + '/' + this.channelName + base.slice(q)
          : base.replace(/\/$/, '') + '/' + this.channelName;
      } catch (e) {
        wsUrl = `wss://127.0.0.1:${port}/${this.channelName}`;
      }
      console.log('[WebSdk-shim] Conectando:', wsUrl.substring(0, 100));
      try {
        const WS = (typeof window !== 'undefined' && window.WebSocket) ? window.WebSocket : require('ws');
        const ws = new WS(wsUrl);
        this._ws = ws;
        const onOpen  = () => { this._connected = true; if (this.onConnectionSucceed) this.onConnectionSucceed(); };
        const onMsg   = ev  => { const raw = ev.data !== undefined ? ev.data.toString() : ev.toString(); if (this.onDataReceivedTxt) this.onDataReceivedTxt(raw); };
        const onErr   = ()  => { if (!this._connected && this.onConnectionFailed) this.onConnectionFailed(); };
        const onClose = ()  => { this._connected = false; this._ws = null; };
        if (typeof ws.on === 'function') {
          ws.on('open', onOpen); ws.on('message', onMsg); ws.on('error', onErr); ws.on('close', onClose);
        } else {
          ws.onopen = onOpen; ws.onmessage = onMsg; ws.onerror = onErr; ws.onclose = onClose;
        }
      } catch (e) { if (this.onConnectionFailed) this.onConnectionFailed(); }
    }).catch(() => { if (this.onConnectionFailed) this.onConnectionFailed(); });
  }

  isConnected()     { return this._connected; }
  sendDataTxt(data) { if (this._ws && this._connected) { try { this._ws.send(data); } catch (_) {} } }
  disconnect()      { if (this._ws) { try { this._ws.close(); } catch (_) {} this._ws = null; } this._connected = false; }
}

const WebSdk = { WebChannelClient };
globalThis.WebSdk = WebSdk;
module.exports = WebSdk;
