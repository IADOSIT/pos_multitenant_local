import { etiquetaDeRuta } from '../src/components/layout/navItems';

let fallos = 0;
function check(nombre: string, real: any, esperado: any) {
  const ok = real === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}${ok ? '' : `  esperado ${esperado}, real ${real}`}`);
}

console.log('--- etiquetaDeRuta ---');
check('ruta del menu', etiquetaDeRuta('/pos'), 'POS');
check('ruta anidada del menu', etiquetaDeRuta('/admin/tienda-en-linea'), 'Tienda en Línea');
check('otra del menu', etiquetaDeRuta('/caja'), 'Caja');
check('el monitor tiene etiqueta', etiquetaDeRuta('/superadmin/monitor'), 'Monitor');
check('ruta fuera del menu cae a la ruta cruda', etiquetaDeRuta('/ruta/inventada'), '/ruta/inventada');
check('cadena vacia no revienta', etiquetaDeRuta(''), '');

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
