import { DispositivoInfo } from './monitor.types';

// Parser compacto de user-agent: solo navegador, sistema y si es movil, que es
// todo lo que muestra el monitor. Sin dependencia externa a proposito; si algun
// dia hiciera falta mas exactitud, cambiar por ua-parser-js queda aislado aqui.
//
// El ORDEN de las comprobaciones importa: Edge y Opera se anuncian tambien como
// Chrome, y Chrome se anuncia tambien como Safari. Van de mas especifico a menos.

const DESCONOCIDO: DispositivoInfo = {
  navegador: 'Desconocido',
  sistema: 'Desconocido',
  movil: false,
};

function detectarNavegador(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\/|Opera/i.test(ua)) return 'Opera';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua)) return 'Safari';
  return 'Desconocido';
}

function detectarSistema(ua: string): string {
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Desconocido';
}

export function parseUserAgent(ua: string | undefined): DispositivoInfo {
  if (!ua || !ua.trim()) return { ...DESCONOCIDO };
  return {
    navegador: detectarNavegador(ua),
    sistema: detectarSistema(ua),
    movil: /Mobile|Android|iPhone|iPad|iPod/i.test(ua),
  };
}
