/**
 * fmdMatcher.js
 * Comparador de plantillas biométricas ANSI 378-2004 (FMD) en JavaScript puro.
 *
 * Estructura ANSI 378-2004:
 *   [0-3]  magic "FMR\0"
 *   [4-7]  version " 20\0"
 *   [8-11] record length
 *  [12-13] CBEFF product ID
 *  [14-15] scanner compliance
 *  [16-17] image width (px)
 *  [18-19] image height (px)
 *  [20-21] X resolution
 *  [22-23] Y resolution
 *    [24]  number of views
 *    [25]  reserved
 *  -- Finger view header (offset 26) --
 *    [26]  finger position
 *    [27]  view / impression
 *    [28]  quality
 *    [29]  number of minutiae  ← CONTEO REAL
 *  -- Minutiae data (offset 30, 6 bytes cada una) --
 *         type(2b) + X(14b) | (2b) + Y(14b) | angle(8b) | quality(8b)
 *
 * Mejoras v2 (2026-06-12):
 *  1. Normalización por centroide — elimina diferencias de posición absoluta
 *  2. Búsqueda rotacional -40°..+40° en pasos de 8° — tolera inclinación del dedo
 *  3. Denominador min(m1,m2) en vez de promedio — no penaliza capturas parciales
 */

function decodeFMD(b64) {
  try {
    if (!b64) return null;
    const buf = Buffer.from(b64, 'base64');

    if (buf.length < 30) {
      console.warn('[fmdMatcher] Buffer demasiado corto:', buf.length, 'bytes');
      return null;
    }

    if (buf[0] !== 0x46 || buf[1] !== 0x4D || buf[2] !== 0x52) {
      const magic = buf.slice(0, 4).toString('hex');
      console.warn('[fmdMatcher] Magic incorrecto:', magic, '— no es FMD ANSI 378 (esperado 464d5200)');
      return null;
    }

    const minutiaeCount = buf[29];
    const minutiae = [];
    let offset = 30;

    for (let i = 0; i < minutiaeCount; i++) {
      if (offset + 6 > buf.length) break;
      const x     = buf.readUInt16BE(offset)     & 0x3FFF;
      const y     = buf.readUInt16BE(offset + 2) & 0x3FFF;
      const angle = buf[offset + 4];
      minutiae.push({ x, y, a: angle });
      offset += 6;
    }

    console.log('[fmdMatcher] FMD decodificado:', minutiaeCount, 'minucias declaradas,', minutiae.length, 'leídas');
    return minutiae;
  } catch (e) {
    console.error('[fmdMatcher] Error decodificando FMD:', e.message);
    return null;
  }
}

function normalizeToCenter(minutiae) {
  const cx = minutiae.reduce((s, m) => s + m.x, 0) / minutiae.length;
  const cy = minutiae.reduce((s, m) => s + m.y, 0) / minutiae.length;
  return minutiae.map(m => ({ x: m.x - cx, y: m.y - cy, a: m.a }));
}

function rotateMinutiae(minutiae, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const aDelta = Math.round(angleRad * 256 / (2 * Math.PI));
  return minutiae.map(m => ({
    x: m.x * cos - m.y * sin,
    y: m.x * sin + m.y * cos,
    a: ((m.a + aDelta) % 256 + 256) % 256
  }));
}

function scoreMinutiae(m1, m2, distTolerance, angleTolerance) {
  let matches = 0;
  const usedInM2 = new Set();

  for (const p1 of m1) {
    for (let j = 0; j < m2.length; j++) {
      if (usedInM2.has(j)) continue;
      const p2 = m2[j];
      const dx = Math.abs(p1.x - p2.x);
      const dy = Math.abs(p1.y - p2.y);
      let da = Math.abs(p1.a - p2.a);
      if (da > 128) da = 256 - da;
      if (dx < distTolerance && dy < distTolerance && da < angleTolerance) {
        matches++;
        usedInM2.add(j);
        break;
      }
    }
  }

  const denom = Math.min(m1.length, m2.length);
  return denom > 0 ? (matches / denom) * 100 : 0;
}

function compareMinutiae(m1, m2) {
  if (!m1 || !m2 || m1.length === 0 || m2.length === 0) return 0;

  const DIST  = 20;
  const ANGLE = 25;

  const norm1 = normalizeToCenter(m1);
  const norm2 = normalizeToCenter(m2);

  let best = 0;
  for (let deg = -40; deg <= 40; deg += 8) {
    const rotated = rotateMinutiae(norm1, deg * Math.PI / 180);
    const s = scoreMinutiae(rotated, norm2, DIST, ANGLE);
    if (s > best) best = s;
  }

  return Math.min(100, best);
}

const MIN_GAP = 10;

function findMatch(probeB64, candidates, threshold = 45) {
  const probeM = decodeFMD(probeB64);
  if (!probeM || probeM.length < 5) {
    console.warn('[fmdMatcher] Probe inválido — minucias:', probeM ? probeM.length : 0);
    return null;
  }

  const results = [];

  for (const cand of candidates) {
    if (!cand.template || cand.template.length < 40) continue;

    const candM = decodeFMD(cand.template);
    if (!candM || candM.length < 3) continue;

    const score = compareMinutiae(probeM, candM);
    console.log(`[fmdMatcher] ${cand.memberId} score=${score.toFixed(1)} (probe=${probeM.length} cand=${candM.length} minutiae)`);
    results.push({ memberId: cand.memberId, score });
  }

  results.sort((a, b) => b.score - a.score);

  const best   = results[0];
  const second = results[1];

  if (!best || best.score < threshold) {
    console.log(`[fmdMatcher] ✗ Sin match (mejor=${best?.score.toFixed(1) ?? 0}, umbral=${threshold})`);
    return null;
  }

  if (second && (best.score - second.score) < MIN_GAP) {
    console.log(`[fmdMatcher] ✗ Ambiguo — gap ${(best.score - second.score).toFixed(1)} < ${MIN_GAP}`);
    return null;
  }

  console.log(`[fmdMatcher] ✓ Match: memberId=${best.memberId} score=${best.score.toFixed(1)}`);
  return best.memberId;
}

module.exports = { decodeFMD, compareMinutiae, findMatch };
