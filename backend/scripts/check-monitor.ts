import { parseUserAgent } from '../src/modules/monitor/user-agent.util';

let fallos = 0;
function check(nombre: string, real: any, esperado: any) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(
    `${ok ? 'OK  ' : 'FALLA'} ${nombre}` +
      (ok ? '' : `\n      esperado: ${JSON.stringify(esperado)}\n      real:     ${JSON.stringify(real)}`),
  );
}

const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36';
const FIREFOX_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0';
const EDGE_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

console.log('--- parseUserAgent ---');
check('Chrome en Windows', parseUserAgent(CHROME_WIN), { navegador: 'Chrome', sistema: 'Windows', movil: false });
check('Safari en iPhone', parseUserAgent(SAFARI_IPHONE), { navegador: 'Safari', sistema: 'iOS', movil: true });
check('Chrome en Android', parseUserAgent(CHROME_ANDROID), { navegador: 'Chrome', sistema: 'Android', movil: true });
check('Firefox en macOS', parseUserAgent(FIREFOX_MAC), { navegador: 'Firefox', sistema: 'macOS', movil: false });
check('Edge no se confunde con Chrome', parseUserAgent(EDGE_WIN), { navegador: 'Edge', sistema: 'Windows', movil: false });
check('user-agent ausente no revienta', parseUserAgent(undefined), { navegador: 'Desconocido', sistema: 'Desconocido', movil: false });
check('cadena vacia no revienta', parseUserAgent(''), { navegador: 'Desconocido', sistema: 'Desconocido', movil: false });

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
