"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserAgent = parseUserAgent;
const DESCONOCIDO = {
    navegador: 'Desconocido',
    sistema: 'Desconocido',
    movil: false,
};
function detectarNavegador(ua) {
    if (/Edg\//i.test(ua))
        return 'Edge';
    if (/OPR\/|Opera/i.test(ua))
        return 'Opera';
    if (/Firefox\//i.test(ua))
        return 'Firefox';
    if (/Chrome\//i.test(ua))
        return 'Chrome';
    if (/Safari\//i.test(ua))
        return 'Safari';
    return 'Desconocido';
}
function detectarSistema(ua) {
    if (/Windows NT/i.test(ua))
        return 'Windows';
    if (/Android/i.test(ua))
        return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua))
        return 'iOS';
    if (/Mac OS X|Macintosh/i.test(ua))
        return 'macOS';
    if (/Linux/i.test(ua))
        return 'Linux';
    return 'Desconocido';
}
function parseUserAgent(ua) {
    if (!ua || !ua.trim())
        return { ...DESCONOCIDO };
    return {
        navegador: detectarNavegador(ua),
        sistema: detectarSistema(ua),
        movil: /Mobile|Android|iPhone|iPad|iPod/i.test(ua),
    };
}
//# sourceMappingURL=user-agent.util.js.map