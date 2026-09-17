import {
  puedeCotizar,
  puedeResponder,
  folioCotizacion,
  calcularTotales,
  vigenciaHasta,
  estaVigente,
  direccionPlana,
} from '../src/modules/cotizaciones/cotizacion.logic';

let fallos = 0;
function check(nombre: string, real: any, esperado: any) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(
    `${ok ? 'OK  ' : 'FALLA'} ${nombre}` +
      (ok ? '' : `\n      esperado: ${JSON.stringify(esperado)}\n      real:     ${JSON.stringify(real)}`),
  );
}

console.log('--- puedeCotizar ---');
check('solicitada si', puedeCotizar('solicitada'), true);
check('rechazada si (re-cotizar)', puedeCotizar('rechazada'), true);
check('vencida si (re-cotizar)', puedeCotizar('vencida'), true);
check('enviada no', puedeCotizar('enviada'), false);
check('aceptada no', puedeCotizar('aceptada'), false);
check('cerrada no', puedeCotizar('cerrada'), false);

console.log('--- puedeResponder ---');
check('enviada si', puedeResponder('enviada'), true);
check('solicitada no', puedeResponder('solicitada'), false);
check('aceptada no', puedeResponder('aceptada'), false);
check('vencida no', puedeResponder('vencida'), false);

console.log('--- folioCotizacion ---');
check('primero', folioCotizacion('26', 1), 'COT-26-0001');
check('cuatro digitos', folioCotizacion('26', 42), 'COT-26-0042');
check('no trunca arriba de 9999', folioCotizacion('26', 12345), 'COT-26-12345');

console.log('--- calcularTotales ---');
const ITEMS = [
  { producto_id: 1, nombre: 'Estampas', sku: 'A1', qty: 3, precio_unitario: 0, subtotal: 0 },
  { producto_id: 2, nombre: 'Encendedor', sku: 'B2', qty: 2, precio_unitario: 0, subtotal: 0 },
];
check(
  'aplica precios y suma',
  calcularTotales(ITEMS, new Map([[1, 10], [2, 25]]), 0),
  {
    items: [
      { producto_id: 1, nombre: 'Estampas', sku: 'A1', qty: 3, precio_unitario: 10, subtotal: 30 },
      { producto_id: 2, nombre: 'Encendedor', sku: 'B2', qty: 2, precio_unitario: 25, subtotal: 50 },
    ],
    subtotal: 80,
    total: 80,
  },
);
check(
  'descuento resta del total, no del subtotal',
  calcularTotales(ITEMS, new Map([[1, 10], [2, 25]]), 30).total,
  50,
);
check(
  'descuento mayor que el subtotal no deja total negativo',
  calcularTotales(ITEMS, new Map([[1, 10], [2, 25]]), 500).total,
  0,
);
check(
  'un renglon sin precio nuevo conserva el que traia',
  calcularTotales(
    [{ producto_id: 9, nombre: 'X', sku: 'X', qty: 2, precio_unitario: 7, subtotal: 14 }],
    new Map(),
    0,
  ).subtotal,
  14,
);

console.log('--- vigencia ---');
check('15 dias', vigenciaHasta(new Date('2026-09-17T10:00:00Z'), 15), '2026-10-02');
check('fin de mes', vigenciaHasta(new Date('2026-01-20T10:00:00Z'), 15), '2026-02-04');
check('vigente el mismo dia', estaVigente('2026-10-02', new Date('2026-10-02T23:00:00Z')), true);
check('vencida al dia siguiente', estaVigente('2026-10-02', new Date('2026-10-03T00:01:00Z')), false);

console.log('--- direccionPlana ---');
check('null no truena', direccionPlana(null), null);
check('undefined no truena', direccionPlana(undefined), null);
check(
  'direccion completa se aplana en orden',
  direccionPlana({
    calle: 'Av. Siempre Viva 123',
    numero: '4B',
    colonia: 'Centro',
    ciudad: 'Monterrey',
    estado: 'NL',
    cp: '64000',
    referencias: 'porton negro',
  }),
  'Av. Siempre Viva 123, 4B, Centro, Monterrey, NL, 64000, porton negro',
);
check(
  'solo algunos campos llenos omite los vacios',
  direccionPlana({ calle: 'Hidalgo 10', numero: '', colonia: null, ciudad: 'Saltillo' }),
  'Hidalgo 10, Saltillo',
);
check('objeto sin ningun campo util da null', direccionPlana({}), null);
check('string corto se respeta tal cual', direccionPlana('Una linea de texto libre'), 'Una linea de texto libre');
{
  const larga = 'X'.repeat(350);
  check('string largo se recorta a 300 caracteres', direccionPlana(larga), 'X'.repeat(300));
}

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
