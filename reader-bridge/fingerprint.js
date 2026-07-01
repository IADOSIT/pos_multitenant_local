/**
 * fingerprint.js — @digitalpersona/devices con DpHost activo
 * Captura FMDs y los entrega a main.js para matching local o enrollment.
 */

require('./websdk-shim'); // Inyectar WebSdk antes de cargar @digitalpersona/devices

let onCaptureCallback = null;
let enrollInProgress  = false;
let enrollMemberId    = null;
let enrollCallback    = null;
let reader            = null;

async function startFingerprintService(onCapture) {
  onCaptureCallback = onCapture;
  await initReader();
}

async function initReader() {
  let FingerprintReader, SampleFormat;
  try {
    const dp = require('@digitalpersona/devices');
    FingerprintReader = dp.FingerprintReader;
    SampleFormat      = dp.SampleFormat;
  } catch (err) {
    console.warn('[fingerprint] @digitalpersona/devices no disponible:', err.message);
    startDevSimulation();
    return;
  }

  try {
    reader = new FingerprintReader();

    reader.on('DeviceConnected', async (ev) => {
      console.log('[fingerprint] Lector conectado:', ev.deviceUid);
      try { await reader.startAcquisition(SampleFormat.Compressed); } catch (e) {
        console.warn('[fingerprint] Error startAcquisition en DeviceConnected:', e.message);
      }
    });

    reader.on('DeviceDisconnected', (ev) => {
      console.log('[fingerprint] Lector desconectado:', ev.deviceUid);
    });

    reader.on('AcquisitionStarted', () => {
      console.log('[fingerprint] Lector activo — esperando huella...');
    });

    reader.on('SamplesAcquired', (ev) => {
      try {
        const samples = ev.samples;
        if (!samples || samples.length === 0) return;
        const sample = samples[0];
        const fmdB64 = typeof sample === 'string' ? sample : (sample.Data || sample.data || null);
        if (!fmdB64) { console.warn('[fingerprint] Muestra vacía'); return; }

        console.log('[fingerprint] FMD capturado, bytes base64:', fmdB64.length);

        if (enrollInProgress && enrollMemberId) {
          const memberId = enrollMemberId;
          const cb       = enrollCallback;
          enrollInProgress = false;
          enrollMemberId   = null;
          enrollCallback   = null;
          console.log('[fingerprint] Enrollment OK para:', memberId);
          if (cb) cb({ success: true, memberId, fmdB64 });
        } else {
          if (onCaptureCallback) onCaptureCallback(fmdB64);
        }
      } catch (err) {
        console.error('[fingerprint] Error procesando muestra:', err.message);
      }
    });

    reader.on('QualityReported', (ev) => {
      console.log('[fingerprint] Calidad:', ev.quality);
    });

    reader.on('ErrorOccurred', (ev) => {
      console.warn('[fingerprint] Error lector:', JSON.stringify(ev.error || ev));
    });

    // Iniciar adquisición si ya hay lector conectado al arrancar
    try {
      const devices = await reader.enumerateDevices();
      const count = Array.isArray(devices) ? devices.length : 0;
      console.log('[fingerprint] Lectores detectados al inicio:', count);
      if (count > 0) {
        await reader.startAcquisition(SampleFormat.Compressed);
      }
    } catch (err) {
      console.warn('[fingerprint] Error enumerando lectores:', err.message);
    }

    console.log('[fingerprint] FingerprintReader listo — DpHost activo');
  } catch (err) {
    console.warn('[fingerprint] Error inicializando FingerprintReader:', err.message);
    startDevSimulation();
  }
}

function sendEnrollCommand(memberId, callback) {
  if (enrollInProgress) {
    console.log('[fingerprint] Enrollment ya en progreso, ignorando');
    return;
  }
  enrollInProgress = true;
  enrollMemberId   = memberId;
  enrollCallback   = callback;
  console.log('[fingerprint] Enrollment solicitado para:', memberId, '— pon el dedo');
}

function stopFingerprintService() {
  if (reader) { try { reader.stopAcquisition(); } catch (_) {} }
}

function startDevSimulation() {
  try {
    const { globalShortcut } = require('electron');
    globalShortcut.register('F2', () => {
      console.log('[fingerprint:DEV] F2 — FMD simulado');
      if (onCaptureCallback) onCaptureCallback('SIMULATED_FMD_DEV_001');
    });
    globalShortcut.register('F3', () => {
      console.log('[fingerprint:DEV] F3 — sin match simulado');
    });
    console.log('[fingerprint:DEV] F2=captura simulada, F3=sin match');
  } catch (err) {
    console.warn('[fingerprint:DEV] Shortcuts no registrados:', err.message);
  }
}

module.exports = { startFingerprintService, stopFingerprintService, sendEnrollCommand };
