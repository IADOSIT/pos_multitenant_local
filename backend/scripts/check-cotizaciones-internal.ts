import { BadRequestException } from '@nestjs/common';
import { CotizacionesService } from '../src/modules/cotizaciones/cotizaciones.service';
import { InternalSecretGuard } from '../src/common/guards/internal-secret.guard';

let fallos = 0;
function check(nombre: string, real: any, esperado: any) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(
    `${ok ? 'OK  ' : 'FALLA'} ${nombre}` +
      (ok ? '' : `\n      esperado: ${JSON.stringify(esperado)}\n      real:     ${JSON.stringify(real)}`),
  );
}

function ctx(header?: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers: header ? { 'x-internal-secret': header } : {} }) }),
  } as any;
}

console.log('--- InternalSecretGuard ---');
process.env.INTERNAL_API_SECRET = 'secreto-de-prueba';
const guard = new InternalSecretGuard();
check('secreto correcto pasa', guard.canActivate(ctx('secreto-de-prueba')), true);
check('secreto incorrecto no pasa', guard.canActivate(ctx('otro')), false);
check('sin header no pasa', guard.canActivate(ctx()), false);
check('longitud distinta no pasa', guard.canActivate(ctx('secreto-de-prueba-mas-largo')), false);
delete process.env.INTERNAL_API_SECRET;
check('sin variable configurada nadie pasa', new InternalSecretGuard().canActivate(ctx('lo-que-sea')), false);

console.log('--- materializarPedido ---');

const ITEMS = [
  { producto_id: 1, nombre: 'Estampas', sku: 'A1', qty: 3, precio_unitario: 10, subtotal: 30 },
  { producto_id: 2, nombre: 'Encendedor', sku: 'B2', qty: 2, precio_unitario: 25, subtotal: 50 },
];

function servicio(cot: any) {
  const creados: any[] = [];
  const cotRepo = { findOne: async () => cot, save: async (c: any) => c, find: async () => [cot] };
  const verRepo = {
    findOne: async () => ({ version: 1, items: ITEMS, subtotal: 80, descuento: 0, total: 80 }),
    find: async () => [{ version: 1, items: ITEMS, subtotal: 80, descuento: 0, total: 80 }],
    create: (v: any) => v, save: async (v: any) => v,
  };
  const configRepo = { findOne: async () => ({ preferencias: {} }) };
  const pedidosService = {
    crear: async (data: any, scope: any) => {
      creados.push({ data, scope });
      return { id: 555, folio: 'IF00000042' };
    },
  };
  const svc = new CotizacionesService(cotRepo as any, verRepo as any, configRepo as any, pedidosService as any);
  return { svc, creados };
}

(async () => {
  {
    const cot = {
      id: 10, empresa_id: 7, tenant_id: 1, tienda_id: 3, estado: 'aceptada', pedido_id: null,
      numero: 'COT-26-0001', version_actual: 1, cliente_nombre: 'Ana', cliente_tel: '81',
      cliente_email: 'ana@x.mx', cliente_empresa: null, direccion_envio: null, notas_cliente: 'sin cebolla',
    };
    const { svc, creados } = servicio(cot);
    const r = await svc.materializarPedido(10);
    check('devuelve el pedido creado', r, { pedido_id: 555, folio: 'IF00000042' });
    check('escribe pedido_id en la cotizacion', cot.pedido_id, 555);
    check('el pedido nace listo para entrega', creados[0].data.estado, 'listo_para_entrega');
    check('el pedido queda ligado a la cotizacion', creados[0].data.cotizacion_id, 10);
    check('usa la tienda guardada al cotizar', creados[0].scope.tienda_id, 3);
    check('total del pedido', creados[0].data.total, 80);
    check('items convertidos a detalles', creados[0].data.items.length, 2);
    check('cantidad y precio del primer detalle',
      [creados[0].data.items[0].cantidad, creados[0].data.items[0].precio], [3, 10]);
    check('la nota trae el folio de la cotizacion',
      String(creados[0].data.notas).includes('COT-26-0001'), true);
  }

  {
    // Idempotencia: ya tiene pedido, no debe crear otro.
    const cot = { id: 10, empresa_id: 7, tenant_id: 1, tienda_id: 3, estado: 'aceptada', pedido_id: 555, numero: 'COT-26-0001' };
    const { svc, creados } = servicio(cot);
    const r = await svc.materializarPedido(10);
    check('no crea un segundo pedido', creados.length, 0);
    check('devuelve el pedido que ya existia', r.pedido_id, 555);
  }

  {
    // Solo materializa lo aceptado.
    const cot = { id: 10, empresa_id: 7, tenant_id: 1, tienda_id: 3, estado: 'enviada', pedido_id: null, numero: 'COT-26-0001' };
    const { svc } = servicio(cot);
    try {
      await svc.materializarPedido(10);
      fallos++;
      console.log('FALLA no materializa una cotizacion no aceptada\n      esperado: error');
    } catch (e: any) {
      const ok = e instanceof BadRequestException;
      if (!ok) fallos++;
      console.log(`${ok ? 'OK  ' : 'FALLA'} no materializa una cotizacion no aceptada`);
    }
  }

  console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLAS`);
  process.exit(fallos === 0 ? 0 : 1);
})();
