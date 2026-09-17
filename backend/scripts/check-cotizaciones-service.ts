import { BadRequestException } from '@nestjs/common';
import { Like, And, MoreThanOrEqual, LessThan } from 'typeorm';
import { CotizacionesService } from '../src/modules/cotizaciones/cotizaciones.service';

let fallos = 0;
function check(nombre: string, real: any, esperado: any) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(
    `${ok ? 'OK  ' : 'FALLA'} ${nombre}` +
      (ok ? '' : `\n      esperado: ${JSON.stringify(esperado)}\n      real:     ${JSON.stringify(real)}`),
  );
}
async function checkThrows(nombre: string, fn: () => Promise<any>, mensaje: string) {
  try {
    await fn();
    fallos++;
    console.log(`FALLA ${nombre}\n      esperado: error "${mensaje}"\n      real:     no lanzo`);
  } catch (e: any) {
    const ok = e instanceof BadRequestException && String(e.message).includes(mensaje);
    if (!ok) fallos++;
    console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}` + (ok ? '' : `\n      real: ${e.message}`));
  }
}

const SCOPE = { tenant_id: 1, empresa_id: 7, tienda_id: 3 };

function cotizacionFake(over: any = {}) {
  return {
    id: 10, empresa_id: 7, tenant_id: 1, numero: 'COT-26-0001',
    estado: 'solicitada', version_actual: 0, tienda_id: null, pedido_id: null,
    cliente_nombre: 'Ana', cliente_email: 'ana@x.mx', notas_internas: null,
    ...over,
  };
}

// Manager falso de la transaccion: registra cada save() en el mismo array
// `guardadas` que ya usaban los repos sueltos, distinguiendo la tabla por el
// nombre de la clase de entidad con la que el servicio llama a manager.save(...).
// Marca via:'manager' para poder distinguirlo de un save() que se hubiera colado
// por this.cotRepo/this.verRepo directo (fuera de la transaccion) - sin esa marca
// la aserción de mas abajo pasaria igual aunque alguien quitara la transaccion.
function fakeManager(guardadas: any[]) {
  return {
    save: async (entidad: any, data: any) => {
      const nombre = typeof entidad === 'function' ? entidad.name : String(entidad);
      const tabla = nombre === 'CotizacionVersion' ? 'versiones' : 'cotizaciones';
      guardadas.push({ tabla, via: 'manager', ...data });
      return tabla === 'versiones' ? { id: 99, ...data } : data;
    },
  };
}

// Repos falsos: guardan lo ultimo que se les mando para poder afirmarlo.
// cotRepo.save()/verRepo.save() (el camino SIN transaccion) quedan marcados
// via:'repo' - cerrar()/actualizarNotas() los usan legitimamente fuera de toda
// transaccion, asi que no lanzan; lo que prueba que cotizar() no los toco es la
// aserción explicita de mas abajo sobre guardadas.map(g => g.via).
function repos(cot: any, versiones: any[] = []) {
  const guardadas: any[] = [];
  let ultimoWhere: any = null;
  let transacciones = 0;
  const cotRepo = {
    findOne: async () => cot,
    save: async (c: any) => { guardadas.push({ tabla: 'cotizaciones', via: 'repo', ...c }); return c; },
    find: async (opts: any) => { ultimoWhere = opts?.where; return [cot]; },
    // El servicio ya no guarda version+cotizacion por separado: ambas van dentro
    // de una sola transaccion para que no pueda quedar una version huerfana.
    manager: { transaction: async (cb: any) => { transacciones++; return cb(fakeManager(guardadas)); } },
  };
  const verRepo = {
    find: async () => versiones,
    findOne: async () => versiones[versiones.length - 1] ?? null,
    create: (v: any) => v,
    save: async (v: any) => { guardadas.push({ tabla: 'versiones', via: 'repo', ...v }); return { id: 99, ...v }; },
  };
  const configRepo = {
    findOne: async () => ({ empresa_id: 7, preferencias: { cotizaciones: { activo: true, vigencia_dias: 15 } } }),
  };
  return {
    cotRepo, verRepo, configRepo, guardadas,
    ultimoWhere: () => ultimoWhere,
    transacciones: () => transacciones,
  };
}

function servicio(cot: any, versiones: any[] = []) {
  const r = repos(cot, versiones);
  const svc = new CotizacionesService(r.cotRepo as any, r.verRepo as any, r.configRepo as any, {} as any);
  return { svc, ...r };
}

const ITEMS_SOLICITADOS = [
  { producto_id: 1, nombre: 'Estampas', sku: 'A1', qty: 3, precio_unitario: 0, subtotal: 0 },
  { producto_id: 2, nombre: 'Encendedor', sku: 'B2', qty: 2, precio_unitario: 0, subtotal: 0 },
];

(async () => {
  console.log('--- listar ---');
  {
    const { svc, ultimoWhere } = servicio(cotizacionFake());
    await svc.listar(SCOPE, {});
    check('sin filtros: solo el scope, sin texto ni fechas', ultimoWhere(), {
      empresa_id: 7, tenant_id: 1,
    });
  }
  {
    const { svc, ultimoWhere } = servicio(cotizacionFake());
    await svc.listar(SCOPE, { q: 'ana' });
    check('q arma un OR numero/cliente_nombre, ambas ramas con el scope completo', ultimoWhere(), [
      { empresa_id: 7, tenant_id: 1, numero: Like('%ana%') },
      { empresa_id: 7, tenant_id: 1, cliente_nombre: Like('%ana%') },
    ]);
  }
  {
    const { svc, ultimoWhere } = servicio(cotizacionFake());
    await svc.listar(SCOPE, { desde: '2026-01-01' });
    check('desde solo: MoreThanOrEqual', ultimoWhere(), {
      empresa_id: 7, tenant_id: 1, created_at: MoreThanOrEqual('2026-01-01'),
    });
  }
  {
    // 'hasta' nombra un DIA, no un instante: created_at es datetime completo, asi que
    // el limite tiene que llegar hasta el inicio del dia SIGUIENTE (LessThan estricto),
    // no quedarse en 'hasta 00:00:00' - eso dejaria fuera casi todo lo creado ese dia.
    const { svc, ultimoWhere } = servicio(cotizacionFake());
    await svc.listar(SCOPE, { hasta: '2026-12-31' });
    check('hasta solo: inclusivo de todo el dia (LessThan el dia siguiente)', ultimoWhere(), {
      empresa_id: 7, tenant_id: 1, created_at: LessThan('2027-01-01'),
    });
  }
  {
    const { svc, ultimoWhere } = servicio(cotizacionFake());
    await svc.listar(SCOPE, { desde: '2026-01-01', hasta: '2026-12-31' });
    check('desde y hasta juntos: And(MoreThanOrEqual, LessThan el dia siguiente)', ultimoWhere(), {
      empresa_id: 7, tenant_id: 1,
      created_at: And(MoreThanOrEqual('2026-01-01'), LessThan('2027-01-01')),
    });
  }

  console.log('--- cotizar (v1) ---');
  {
    const { svc, guardadas, transacciones } = servicio(
      cotizacionFake(),
      [{ version: 0, items: ITEMS_SOLICITADOS }],
    );
    const r = await svc.cotizar(SCOPE, 10, {
      items: [{ producto_id: 1, precio_unitario: 10 }, { producto_id: 2, precio_unitario: 25 }],
      descuento: 0, vigencia_dias: 15, mensaje_cliente: 'Va nuestra propuesta', tienda_id: 3,
    });
    check('crea la version 1', r.version.version, 1);
    check('subtotal correcto', r.version.subtotal, 80);
    check('estado pasa a enviada', r.cotizacion.estado, 'enviada');
    check('version_actual sube a 1', r.cotizacion.version_actual, 1);
    check('guarda la tienda que cobrara', r.cotizacion.tienda_id, 3);
    check('guardo version y cotizacion', guardadas.map((g) => g.tabla), ['versiones', 'cotizaciones']);
    // Estas dos pruebas son las que hacen que la suite falle si alguien quita la
    // transaccion: no solo miran la FORMA de lo guardado (eso pasaria igual con dos
    // saves sueltos), sino el CAMINO exacto por el que se guardo.
    check('cotizar usa la transaccion exactamente una vez', transacciones(), 1);
    check('ambas escrituras entraron via manager, ninguna via repo suelto', guardadas.map((g) => g.via), ['manager', 'manager']);
  }

  console.log('--- re-cotizar (v2) ---');
  {
    const { svc, guardadas, transacciones } = servicio(
      cotizacionFake({ estado: 'rechazada', version_actual: 1, tienda_id: 3 }),
      [{ version: 1, items: [{ ...ITEMS_SOLICITADOS[0], precio_unitario: 10, subtotal: 30 }], respuesta: 'rechazada' }],
    );
    const r = await svc.cotizar(SCOPE, 10, { items: [{ producto_id: 1, precio_unitario: 8 }] });
    check('crea la version 2', r.version.version, 2);
    check('reabre a enviada', r.cotizacion.estado, 'enviada');
    check('re-cotiza sobre los items de la version anterior', r.version.subtotal, 24);
    check('re-cotizar tambien usa la transaccion exactamente una vez', transacciones(), 1);
    check('re-cotizar: ambas escrituras via manager', guardadas.map((g) => g.via), ['manager', 'manager']);
  }

  console.log('--- validaciones de cotizar ---');
  await checkThrows(
    'no se cotiza una ya enviada',
    () => servicio(cotizacionFake({ estado: 'enviada', version_actual: 1 }), [{ version: 1, items: ITEMS_SOLICITADOS }])
      .svc.cotizar(SCOPE, 10, { items: [{ producto_id: 1, precio_unitario: 5 }] }),
    'no se puede cotizar',
  );
  await checkThrows(
    'no se cotiza una aceptada',
    () => servicio(cotizacionFake({ estado: 'aceptada' }), [{ version: 1, items: ITEMS_SOLICITADOS }])
      .svc.cotizar(SCOPE, 10, { items: [{ producto_id: 1, precio_unitario: 5 }] }),
    'no se puede cotizar',
  );
  await checkThrows(
    'todos los precios en cero',
    () => servicio(cotizacionFake(), [{ version: 0, items: ITEMS_SOLICITADOS }])
      .svc.cotizar(SCOPE, 10, { items: [{ producto_id: 1, precio_unitario: 0 }, { producto_id: 2, precio_unitario: 0 }] }),
    'al menos un precio',
  );
  await checkThrows(
    'precio negativo',
    () => servicio(cotizacionFake(), [{ version: 0, items: ITEMS_SOLICITADOS }])
      .svc.cotizar(SCOPE, 10, { items: [{ producto_id: 1, precio_unitario: -5 }] }),
    'Precio invalido',
  );
  await checkThrows(
    'sin tienda que cobre',
    () => servicio(cotizacionFake(), [{ version: 0, items: ITEMS_SOLICITADOS }])
      .svc.cotizar({ tenant_id: 1, empresa_id: 7 }, 10, { items: [{ producto_id: 1, precio_unitario: 10 }] }),
    'tienda',
  );

  console.log('--- cerrar ---');
  {
    const { svc } = servicio(cotizacionFake({ estado: 'rechazada' }));
    const c = await svc.cerrar(SCOPE, 10, 'el cliente compro en otro lado');
    check('queda cerrada', c.estado, 'cerrada');
    check('guarda el motivo', c.motivo_cierre, 'el cliente compro en otro lado');
  }
  await checkThrows(
    'no se cierra una aceptada',
    () => servicio(cotizacionFake({ estado: 'aceptada' })).svc.cerrar(SCOPE, 10, 'x'),
    'aceptada',
  );

  console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLAS`);
  process.exit(fallos === 0 ? 0 : 1);
})();
