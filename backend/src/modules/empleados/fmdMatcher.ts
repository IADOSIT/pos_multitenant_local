/**
 * fmdMatcher.ts — comparador de plantillas biométricas ANSI 378-2004 (FMD) en TypeScript.
 * Portado de FitControl GYM (C:\sites\FITCONTROLGYM\reader-bridge\fmdMatcher.js, matching v2),
 * adaptado de `memberId` a `empleado_id` para el dominio de empleados.
 *
 * Mejoras v2:
 *  1. Normalización por centroide — elimina diferencias de posición absoluta
 *  2. Búsqueda rotacional -40°..+40° en pasos de 8° — tolera inclinación del dedo
 *  3. Denominador min(m1,m2) en vez de promedio — no penaliza capturas parciales
 *
 * Nota: era un .js plano requerido dinámicamente (require('./fmdMatcher')) — `nest build`
 * (tsc) no copia archivos .js sueltos a dist/, así que nunca llegaba al build de producción
 * (MODULE_NOT_FOUND). Convertido a .ts + import normal para que tsc lo compile como todo lo demás.
 */

interface Minutia {
  x: number;
  y: number;
  a: number;
}

export interface FmdCandidate {
  empleado_id: number;
  fmd_template: string | null | undefined;
}

export function isFmd(b64: string): boolean {
  try {
    const buf = Buffer.from(b64.substring(0, 8), 'base64');
    return buf[0] === 0x46 && buf[1] === 0x4d && buf[2] === 0x52; // "FMR"
  } catch {
    return false;
  }
}

export function decodeFMD(b64: string | null | undefined): Minutia[] | null {
  try {
    if (!b64) return null;
    const buf = Buffer.from(b64, 'base64');
    if (buf.length < 30) return null;
    if (buf[0] !== 0x46 || buf[1] !== 0x4d || buf[2] !== 0x52) return null;

    const minutiaeCount = buf[29];
    const minutiae: Minutia[] = [];
    let offset = 30;
    for (let i = 0; i < minutiaeCount; i++) {
      if (offset + 6 > buf.length) break;
      const x = buf.readUInt16BE(offset) & 0x3fff;
      const y = buf.readUInt16BE(offset + 2) & 0x3fff;
      const angle = buf[offset + 4];
      minutiae.push({ x, y, a: angle });
      offset += 6;
    }
    return minutiae;
  } catch {
    return null;
  }
}

function normalizeToCenter(minutiae: Minutia[]): Minutia[] {
  const cx = minutiae.reduce((s, m) => s + m.x, 0) / minutiae.length;
  const cy = minutiae.reduce((s, m) => s + m.y, 0) / minutiae.length;
  return minutiae.map((m) => ({ x: m.x - cx, y: m.y - cy, a: m.a }));
}

function rotateMinutiae(minutiae: Minutia[], angleRad: number): Minutia[] {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const aDelta = Math.round((angleRad * 256) / (2 * Math.PI));
  return minutiae.map((m) => ({
    x: m.x * cos - m.y * sin,
    y: m.x * sin + m.y * cos,
    a: (((m.a + aDelta) % 256) + 256) % 256,
  }));
}

function scoreMinutiae(m1: Minutia[], m2: Minutia[], distTolerance: number, angleTolerance: number): number {
  let matches = 0;
  const usedInM2 = new Set<number>();
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

export function matchFMDs(fmd1B64: string | null | undefined, fmd2B64: string | null | undefined): number {
  const m1 = decodeFMD(fmd1B64);
  const m2 = decodeFMD(fmd2B64);
  if (!m1 || !m2 || m1.length === 0 || m2.length === 0) return 0;

  const DIST = 20;
  const ANGLE = 25;
  const norm1 = normalizeToCenter(m1);
  const norm2 = normalizeToCenter(m2);

  let best = 0;
  for (let deg = -40; deg <= 40; deg += 8) {
    const rotated = rotateMinutiae(norm1, (deg * Math.PI) / 180);
    const s = scoreMinutiae(rotated, norm2, DIST, ANGLE);
    if (s > best) best = s;
  }
  return Math.min(100, best);
}

export const THRESHOLD = 45;
export const MIN_GAP = 10;

export function findMatch(
  probeB64: string,
  candidates: FmdCandidate[],
  threshold = THRESHOLD,
  minGap = MIN_GAP,
): number | null {
  if (!isFmd(probeB64)) return null;
  const probeM = decodeFMD(probeB64);
  if (!probeM || probeM.length < 5) return null;

  const results = candidates
    .filter((c) => c.fmd_template && c.fmd_template.length >= 40)
    .map((c) => ({ empleado_id: c.empleado_id, score: matchFMDs(probeB64, c.fmd_template) }))
    .sort((a, b) => b.score - a.score);

  const best = results[0];
  const second = results[1];
  if (!best || best.score < threshold) return null;
  if (second && best.score - second.score < minGap) return null;
  return best.empleado_id;
}
