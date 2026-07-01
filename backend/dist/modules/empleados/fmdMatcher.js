"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_GAP = exports.THRESHOLD = void 0;
exports.isFmd = isFmd;
exports.decodeFMD = decodeFMD;
exports.matchFMDs = matchFMDs;
exports.findMatch = findMatch;
function isFmd(b64) {
    try {
        const buf = Buffer.from(b64.substring(0, 8), 'base64');
        return buf[0] === 0x46 && buf[1] === 0x4d && buf[2] === 0x52;
    }
    catch {
        return false;
    }
}
function decodeFMD(b64) {
    try {
        if (!b64)
            return null;
        const buf = Buffer.from(b64, 'base64');
        if (buf.length < 30)
            return null;
        if (buf[0] !== 0x46 || buf[1] !== 0x4d || buf[2] !== 0x52)
            return null;
        const minutiaeCount = buf[29];
        const minutiae = [];
        let offset = 30;
        for (let i = 0; i < minutiaeCount; i++) {
            if (offset + 6 > buf.length)
                break;
            const x = buf.readUInt16BE(offset) & 0x3fff;
            const y = buf.readUInt16BE(offset + 2) & 0x3fff;
            const angle = buf[offset + 4];
            minutiae.push({ x, y, a: angle });
            offset += 6;
        }
        return minutiae;
    }
    catch {
        return null;
    }
}
function normalizeToCenter(minutiae) {
    const cx = minutiae.reduce((s, m) => s + m.x, 0) / minutiae.length;
    const cy = minutiae.reduce((s, m) => s + m.y, 0) / minutiae.length;
    return minutiae.map((m) => ({ x: m.x - cx, y: m.y - cy, a: m.a }));
}
function rotateMinutiae(minutiae, angleRad) {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const aDelta = Math.round((angleRad * 256) / (2 * Math.PI));
    return minutiae.map((m) => ({
        x: m.x * cos - m.y * sin,
        y: m.x * sin + m.y * cos,
        a: (((m.a + aDelta) % 256) + 256) % 256,
    }));
}
function scoreMinutiae(m1, m2, distTolerance, angleTolerance) {
    let matches = 0;
    const usedInM2 = new Set();
    for (const p1 of m1) {
        for (let j = 0; j < m2.length; j++) {
            if (usedInM2.has(j))
                continue;
            const p2 = m2[j];
            const dx = Math.abs(p1.x - p2.x);
            const dy = Math.abs(p1.y - p2.y);
            let da = Math.abs(p1.a - p2.a);
            if (da > 128)
                da = 256 - da;
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
function matchFMDs(fmd1B64, fmd2B64) {
    const m1 = decodeFMD(fmd1B64);
    const m2 = decodeFMD(fmd2B64);
    if (!m1 || !m2 || m1.length === 0 || m2.length === 0)
        return 0;
    const DIST = 20;
    const ANGLE = 25;
    const norm1 = normalizeToCenter(m1);
    const norm2 = normalizeToCenter(m2);
    let best = 0;
    for (let deg = -40; deg <= 40; deg += 8) {
        const rotated = rotateMinutiae(norm1, (deg * Math.PI) / 180);
        const s = scoreMinutiae(rotated, norm2, DIST, ANGLE);
        if (s > best)
            best = s;
    }
    return Math.min(100, best);
}
exports.THRESHOLD = 45;
exports.MIN_GAP = 10;
function findMatch(probeB64, candidates, threshold = exports.THRESHOLD, minGap = exports.MIN_GAP) {
    if (!isFmd(probeB64))
        return null;
    const probeM = decodeFMD(probeB64);
    if (!probeM || probeM.length < 5)
        return null;
    const results = candidates
        .filter((c) => c.fmd_template && c.fmd_template.length >= 40)
        .map((c) => ({ empleado_id: c.empleado_id, score: matchFMDs(probeB64, c.fmd_template) }))
        .sort((a, b) => b.score - a.score);
    const best = results[0];
    const second = results[1];
    if (!best || best.score < threshold)
        return null;
    if (second && best.score - second.score < minGap)
        return null;
    return best.empleado_id;
}
//# sourceMappingURL=fmdMatcher.js.map