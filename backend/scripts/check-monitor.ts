import { parseUserAgent } from '../src/modules/monitor/user-agent.util';
import { MonitorService } from '../src/modules/monitor/monitor.service';
import { IdentidadSesion, DispositivoInfo } from '../src/modules/monitor/monitor.types';

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

console.log('\n--- MonitorService ---');

const DISPOSITIVO: DispositivoInfo = { navegador: 'Chrome', sistema: 'Windows', movil: false };
const ident = (usuario_id: number, nombre: string, tienda_id: number | null, rol = 'cajero'): IdentidadSesion => ({
  usuario_id, nombre, rol, tenant_id: 1, empresa_id: 1, tienda_id,
});

// -- alta y snapshot basico --
const s1 = new MonitorService();
s1.alta('sock-a', ident(10, 'Ana', 3), DISPOSITIVO, '/pos');
const snap1 = s1.snapshot();
check('una alta = 1 usuario, 1 sesion, 1 tienda',
  [snap1.total_usuarios, snap1.total_sesiones, snap1.total_tiendas], [1, 1, 1]);
check('el rastro arranca con la ruta inicial', s1.getSesion('sock-a')!.rastro, ['/pos']);

// -- varias pestanas del mismo usuario NO inflan el conteo --
const s2 = new MonitorService();
s2.alta('sock-a', ident(10, 'Ana', 3), DISPOSITIVO, '/pos');
s2.alta('sock-b', ident(10, 'Ana', 3), DISPOSITIVO, '/caja');
const snap2 = s2.snapshot();
check('2 pestanas del mismo usuario = 1 usuario, 2 sesiones',
  [snap2.total_usuarios, snap2.total_sesiones], [1, 2]);
check('las 2 sesiones cuelgan del mismo usuario',
  snap2.grupos[0].usuarios[0].sesiones.length, 2);

// -- agrupacion por tienda --
const s3 = new MonitorService();
s3.alta('a', ident(10, 'Ana', 3), DISPOSITIVO, '/pos');
s3.alta('b', ident(11, 'Beto', 3), DISPOSITIVO, '/caja');
s3.alta('c', ident(12, 'Caro', 7), DISPOSITIVO, '/pos');
const snap3 = s3.snapshot();
check('2 tiendas', snap3.total_tiendas, 2);
check('tienda 3 tiene 2 usuarios', snap3.grupos.find(g => g.tienda_id === 3)!.usuarios.length, 2);
check('usuarios ordenados por nombre',
  snap3.grupos.find(g => g.tienda_id === 3)!.usuarios.map(u => u.nombre), ['Ana', 'Beto']);

// -- sesiones sin tienda: se muestran, van al final, no cuentan como tienda --
const s4 = new MonitorService();
s4.alta('a', ident(10, 'Ana', 3), DISPOSITIVO, '/pos');
s4.alta('z', ident(1, 'Super', null, 'superadmin'), DISPOSITIVO, '/superadmin/monitor');
const snap4 = s4.snapshot();
check('el superadmin sin tienda aparece', snap4.total_usuarios, 2);
check('pero no cuenta como tienda', snap4.total_tiendas, 1);
check('y su grupo va al ultimo', snap4.grupos[snap4.grupos.length - 1].tienda_id, null);

// -- cambio de pantalla --
const s5 = new MonitorService();
s5.alta('a', ident(10, 'Ana', 3), DISPOSITIVO, '/pos');
const delta = s5.cambiarPantalla('a', '/caja');
check('cambiar devuelve el delta', [delta!.socket_id, delta!.ruta], ['a', '/caja']);
check('la pantalla actual se actualiza', s5.getSesion('a')!.pantalla_actual, '/caja');
check('el rastro incluye la actual al final', s5.getSesion('a')!.rastro, ['/pos', '/caja']);
check('repetir la misma ruta no genera delta', s5.cambiarPantalla('a', '/caja'), null);
check('y no duplica el rastro', s5.getSesion('a')!.rastro, ['/pos', '/caja']);
check('cambiar en un socket desconocido no revienta', s5.cambiarPantalla('no-existe', '/pos'), null);

// -- el rastro se recorta a 5 --
const s6 = new MonitorService();
s6.alta('a', ident(10, 'Ana', 3), DISPOSITIVO, '/r0');
['/r1', '/r2', '/r3', '/r4', '/r5', '/r6'].forEach(r => s6.cambiarPantalla('a', r));
check('el rastro se recorta a 5', s6.getSesion('a')!.rastro, ['/r2', '/r3', '/r4', '/r5', '/r6']);

// -- baja --
const s7 = new MonitorService();
s7.alta('a', ident(10, 'Ana', 3), DISPOSITIVO, '/pos');
s7.alta('b', ident(11, 'Beto', 3), DISPOSITIVO, '/caja');
check('baja devuelve la sesion que se fue', s7.baja('a')!.usuario_id, 10);
check('y queda 1 usuario', s7.snapshot().total_usuarios, 1);
check('baja de un socket desconocido no revienta', s7.baja('no-existe'), null);

// -- vacio --
const s8 = new MonitorService();
const snap8 = s8.snapshot();
check('sin nadie conectado',
  [snap8.grupos.length, snap8.total_usuarios, snap8.total_sesiones, snap8.total_tiendas], [0, 0, 0, 0]);

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
