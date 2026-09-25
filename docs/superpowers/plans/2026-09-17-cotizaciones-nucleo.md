# Cotizaciones — Núcleo: Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que una cotización sea una entidad propia con folio, versiones, vigencia y respuesta del cliente, y que al aceptarla nazca el pedido de mostrador — todo funcionando de punta a punta por API, sin tocar todavía la interfaz.

**Architecture:** Dos tablas nuevas (`cotizaciones`, `cotizacion_versiones`) cuyo dueño es el backend del POS vía entidades TypeORM con `synchronize: true`. El backend del POS expone el lado administrativo (listar, cotizar, re-cotizar, cerrar) y un endpoint **interno** que materializa el pedido. `POS_STORE_API` expone el lado público (crear solicitud, ver con token, aceptar, rechazar) leyendo y escribiendo la misma base en SQL crudo, y avisa al POS por HTTP con un secreto compartido cuando el cliente acepta.

**Tech Stack:** NestJS 10 + TypeORM + MySQL (ambos backends), `ts-node` para los check scripts del POS, Jest 29 para `POS_STORE_API`.

**Spec:** `pos_multitenant_local/docs/superpowers/specs/2026-09-17-cotizaciones-flujo-independiente-design.md`

## Global Constraints

- **Dos repos.** `pos_multitenant_local` (backend del POS) y `POS_MULTITENANT_STORE` (`POS_STORE_API`). Commits separados, nunca uno que cruce ambos.
- **El POS es dueño del esquema.** `synchronize: true` (`backend/src/config/typeorm.config.ts`) crea y altera las tablas al arrancar. **No** se escriben migraciones TypeORM para esta funcionalidad.
- **Nunca combinar `@Column({ unique: true })` con un `@Index([...], { unique: true })` de clase sobre la misma columna** — TypeORM intenta dos UNIQUE al sincronizar y el backend no arranca. Usar solo el `@Index` de clase.
- **`POS_STORE_API` no toca el esquema:** `synchronize: false`, `entities: []`, todo por `dataSource.query()` en SQL crudo. No se le agregan entidades.
- **Pruebas del POS:** el repo no tiene Jest. El patrón establecido son scripts en `backend/scripts/check-*.ts` con un helper `check(nombre, real, esperado)` que cuenta fallos y sale con código distinto de cero. Se ejecutan con `npx ts-node -r tsconfig-paths/register backend/scripts/<archivo>.ts`. **No introducir Jest en este repo.**
- **Pruebas de `POS_STORE_API`:** Jest ya está configurado (`npm test`). Los specs van junto al código, `*.spec.ts`.
- **Build antes de commit.** En el POS: `cd backend && npm run build`, y el commit incluye `backend/dist/` (el `.gitignore` lo des-ignora a propósito). En la tienda: `cd POS_STORE_API && npm run build`. Un fallo de build local es un fallo en el VPS.
- **Deploy:** termina en el push. El redeploy en Portainer lo hace el usuario; no intentarlo.
- **Nombres exactos de estados:** `solicitada`, `enviada`, `aceptada`, `rechazada`, `vencida`, `cerrada`.
- **Folio:** `COT-YY-NNNN`, consecutivo por empresa, `YY` = últimos dos dígitos del año.
- **Variable de entorno compartida:** `INTERNAL_API_SECRET` (mismo valor en ambos servicios). En la tienda además `POS_API_URL=http://pos-iados-api:3000`.

---

### Task 1: Entidades y esquema

**Files:**
- Create: `backend/src/modules/cotizaciones/cotizacion.entity.ts`
- Create: `backend/src/modules/cotizaciones/cotizacion-version.entity.ts`
- Create: `backend/src/modules/cotizaciones/cotizaciones.module.ts`
- Modify: `backend/src/modules/pedidos/pedido.entity.ts` (agregar `cotizacion_id` junto a `ecommerce_pedido_id`, línea ~105)
- Modify: `backend/src/app.module.ts` (registrar `CotizacionesModule`)

**Interfaces:**
- Consumes: nada.
- Produces: `Cotizacion`, `CotizacionVersion`, `CotizacionEstado` (tipo string union), `CotizacionesModule`. `Pedido.cotizacion_id: number | null`.

- [ ] **Step 1: Crear la entidad `Cotizacion`**

`backend/src/modules/cotizaciones/cotizacion.entity.ts`:

```ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type CotizacionEstado =
  | 'solicitada'   // el cliente mando su lista, todavia sin precios
  | 'enviada'      // hay una version con precios esperando respuesta
  | 'aceptada'     // terminal: de aqui en adelante manda el pedido
  | 'rechazada'    // el cliente dijo que no, con motivo. Se puede re-cotizar
  | 'vencida'      // se paso la vigencia sin respuesta. Se puede re-cotizar
  | 'cerrada';     // el negocio la dio por perdida

// El consecutivo COT-YY-NNNN se genera POR EMPRESA, asi que la unicidad tambien.
// Un UNIQUE global chocaria con el COT-26-0001 de otra tienda (el mismo error que
// ya se corrigio en ecommerce_pedidos).
@Entity('cotizaciones')
@Index(['empresa_id', 'numero'], { unique: true })
@Index(['empresa_id', 'estado'])
@Index(['estado', 'pedido_id'])
@Index(['created_at'])
export class Cotizacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empresa_id: number;

  @Column()
  tenant_id: number;

  @Column({ type: 'int', nullable: true })
  cliente_id: number | null;

  @Column({ length: 20 })
  numero: string;

  @Column({ length: 255 })
  cliente_nombre: string;

  @Column({ length: 255, default: '' })
  cliente_email: string;

  @Column({ length: 20, nullable: true })
  cliente_tel: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  cliente_empresa: string | null;

  @Column({ type: 'json', nullable: true })
  direccion_envio: any;

  @Column({ type: 'text', nullable: true })
  notas_cliente: string | null;

  @Column({
    type: 'enum',
    enum: ['solicitada', 'enviada', 'aceptada', 'rechazada', 'vencida', 'cerrada'],
    default: 'solicitada',
  })
  estado: CotizacionEstado;

  // 0 = solicitada, sin cotizar todavia. Denormalizacion deliberada: evita un
  // MAX(version) en cada renglon del tablero.
  @Column({ type: 'int', default: 0 })
  version_actual: number;

  // Sucursal que cobrara. Se fija al enviar la v1: cuando el cliente acepte, ya no
  // habra un operador en sesion de quien deducirla.
  @Column({ type: 'int', nullable: true })
  tienda_id: number | null;

  // Pedido de mostrador materializado al aceptar el cliente.
  @Column({ type: 'int', nullable: true })
  pedido_id: number | null;

  @Column({ type: 'text', nullable: true })
  notas_internas: string | null;

  @Column({ type: 'text', nullable: true })
  motivo_cierre: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

- [ ] **Step 2: Crear la entidad `CotizacionVersion`**

`backend/src/modules/cotizaciones/cotizacion-version.entity.ts`:

```ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export interface CotizacionItem {
  producto_id: number;
  nombre: string;
  sku: string;
  qty: number;
  precio_unitario: number;
  subtotal: number;
}

// Una fila por cada vez que el negocio cotiza. El historial de la negociacion
// vive aqui: la respuesta del cliente pertenece a la version que contesto, no a
// la cotizacion, porque cada version se acepta o se rechaza por separado.
@Entity('cotizacion_versiones')
@Index(['cotizacion_id', 'version'], { unique: true })
export class CotizacionVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cotizacion_id: number;

  @Column({ type: 'int' })
  version: number;

  // Snapshot con nombre y sku: la version enviada debe seguir siendo legible
  // aunque el producto cambie de precio o se borre despues.
  @Column({ type: 'json' })
  items: CotizacionItem[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'date' })
  vigencia_hasta: string;

  @Column({ type: 'text', nullable: true })
  mensaje_cliente: string | null;

  @Column({ type: 'datetime' })
  enviada_at: Date;

  @Column({ type: 'enum', enum: ['aceptada', 'rechazada'], nullable: true })
  respuesta: 'aceptada' | 'rechazada' | null;

  @Column({ type: 'text', nullable: true })
  respuesta_motivo: string | null;

  @Column({ type: 'datetime', nullable: true })
  respondida_at: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  respondida_ip: string | null;
}
```

- [ ] **Step 3: Agregar `cotizacion_id` al pedido**

En `backend/src/modules/pedidos/pedido.entity.ts`, justo después del bloque de `ecommerce_pedido_id` (~línea 105):

```ts
  // Cotizacion de origen (tabla `cotizaciones`). Un pedido lleva `cotizacion_id`
  // o `ecommerce_pedido_id`, nunca las dos: son dos caminos distintos de entrada
  // desde la tienda. Null en los pedidos normales de mostrador.
  @Column({ type: 'int', nullable: true })
  cotizacion_id: number | null;
```

- [ ] **Step 4: Crear el módulo**

`backend/src/modules/cotizaciones/cotizaciones.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cotizacion } from './cotizacion.entity';
import { CotizacionVersion } from './cotizacion-version.entity';
import { EcommerceConfig } from '../ecommerce/ecommerce-config.entity';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cotizacion, CotizacionVersion, EcommerceConfig]),
    // Al aceptar el cliente se materializa el pedido de mostrador.
    PedidosModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class CotizacionesModule {}
```

(Controladores y providers se llenan en las tareas 3 y 4.)

- [ ] **Step 5: Registrar el módulo en `app.module.ts`**

Agregar el import y meter `CotizacionesModule` en el arreglo `imports`, junto a `EcommerceModule`.

- [ ] **Step 6: Compilar y verificar que el esquema se crea**

```bash
cd backend && npm run build
```
Esperado: 0 errores.

Luego, con MySQL arriba:
```bash
npm run start:dev
```
Esperado: el backend arranca sin errores de `DataSource.initialize()`. Verificar en MySQL:
```sql
SHOW COLUMNS FROM cotizaciones;
SHOW COLUMNS FROM cotizacion_versiones;
SHOW COLUMNS FROM pedidos LIKE 'cotizacion_id';
SHOW INDEX FROM cotizaciones WHERE Key_name LIKE '%numero%';
```
Esperado: las dos tablas existen, `pedidos.cotizacion_id` existe, y hay **un solo** índice UNIQUE sobre `(empresa_id, numero)`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/cotizaciones backend/src/modules/pedidos/pedido.entity.ts backend/src/app.module.ts backend/dist
git commit -m "feat(cotizaciones): entidades cotizacion y cotizacion_version"
```

---

### Task 2: Lógica pura de estados, folio y totales

**Files:**
- Create: `backend/src/modules/cotizaciones/cotizacion.logic.ts`
- Test: `backend/scripts/check-cotizacion-logic.ts`

**Interfaces:**
- Consumes: `CotizacionEstado` (Task 1), `CotizacionItem` (Task 1).
- Produces:
  - `puedeCotizar(estado: CotizacionEstado): boolean`
  - `puedeResponder(estado: CotizacionEstado): boolean`
  - `folioCotizacion(yy: string, consecutivo: number): string`
  - `calcularTotales(items: CotizacionItem[], precios: Map<number, number>, descuento: number): { items: CotizacionItem[]; subtotal: number; total: number }`
  - `vigenciaHasta(desde: Date, dias: number): string`
  - `estaVigente(vigencia_hasta: string, hoy: Date): boolean`

- [ ] **Step 1: Escribir el check script que falla**

`backend/scripts/check-cotizacion-logic.ts`:

```ts
import {
  puedeCotizar,
  puedeResponder,
  folioCotizacion,
  calcularTotales,
  vigenciaHasta,
  estaVigente,
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

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
```

- [ ] **Step 2: Ejecutarlo y verificar que falla**

```bash
cd backend && npx ts-node -r tsconfig-paths/register scripts/check-cotizacion-logic.ts
```
Esperado: FALLA con `Cannot find module '../src/modules/cotizaciones/cotizacion.logic'`.

- [ ] **Step 3: Escribir la implementación mínima**

`backend/src/modules/cotizaciones/cotizacion.logic.ts`:

```ts
import { CotizacionEstado } from './cotizacion.entity';
import { CotizacionItem } from './cotizacion-version.entity';

// Se puede cotizar (o RE-cotizar) mientras el trato siga vivo. Rechazada y vencida
// no son callejones sin salida a proposito: re-cotizar las reabre con el mismo
// folio y el mismo enlace, que es lo que convierte esto en una negociacion.
const COTIZABLES: CotizacionEstado[] = ['solicitada', 'rechazada', 'vencida'];

export function puedeCotizar(estado: CotizacionEstado): boolean {
  return COTIZABLES.includes(estado);
}

// Solo hay algo que responder cuando hay una version con precios en la mesa.
export function puedeResponder(estado: CotizacionEstado): boolean {
  return estado === 'enviada';
}

export function folioCotizacion(yy: string, consecutivo: number): string {
  return `COT-${yy}-${String(consecutivo).padStart(4, '0')}`;
}

export function calcularTotales(
  items: CotizacionItem[],
  precios: Map<number, number>,
  descuento: number,
): { items: CotizacionItem[]; subtotal: number; total: number } {
  let subtotal = 0;
  const conPrecio = items.map((it) => {
    const precio_unitario = precios.has(Number(it.producto_id))
      ? Number(precios.get(Number(it.producto_id)))
      : Number(it.precio_unitario || 0);
    const qty = Number(it.qty || 0);
    const sub = precio_unitario * qty;
    subtotal += sub;
    return { ...it, precio_unitario, subtotal: sub };
  });
  return { items: conPrecio, subtotal, total: Math.max(0, subtotal - Number(descuento || 0)) };
}

// Fecha, no timestamp: la vigencia se comunica como dia ("valida hasta el 2 de
// octubre") y vence al terminar ese dia, no a la hora exacta en que se envio.
export function vigenciaHasta(desde: Date, dias: number): string {
  const d = new Date(desde.getTime());
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function estaVigente(vigencia_hasta: string, hoy: Date): boolean {
  return hoy.toISOString().slice(0, 10) <= vigencia_hasta;
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
cd backend && npx ts-node -r tsconfig-paths/register scripts/check-cotizacion-logic.ts
```
Esperado: `TODO OK`, salida con código 0.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/cotizaciones/cotizacion.logic.ts backend/scripts/check-cotizacion-logic.ts
git commit -m "feat(cotizaciones): logica pura de estados, folio, totales y vigencia"
```

---

### Task 3: Servicio y controlador del POS (listar, cotizar, re-cotizar, cerrar)

**Files:**
- Create: `backend/src/modules/cotizaciones/cotizaciones.service.ts`
- Create: `backend/src/modules/cotizaciones/cotizaciones.controller.ts`
- Modify: `backend/src/modules/cotizaciones/cotizaciones.module.ts` (registrar controller y provider)
- Test: `backend/scripts/check-cotizaciones-service.ts`

**Interfaces:**
- Consumes: `Cotizacion`, `CotizacionVersion` (Task 1); `puedeCotizar`, `calcularTotales`, `vigenciaHasta` (Task 2).
- Produces:
  - `CotizacionesService.listar(scope, filtros): Promise<Cotizacion[]>`
  - `CotizacionesService.detalle(scope, id): Promise<{ cotizacion: Cotizacion; versiones: CotizacionVersion[] }>`
  - `CotizacionesService.cotizar(scope, id, dto: CotizarDto): Promise<{ cotizacion: Cotizacion; version: CotizacionVersion }>`
  - `CotizacionesService.cerrar(scope, id, motivo): Promise<Cotizacion>`
  - `CotizacionesService.actualizarNotas(scope, id, notas_internas): Promise<Cotizacion>`
  - `interface CotizarDto { items: { producto_id: number; precio_unitario: number }[]; descuento?: number; vigencia_dias?: number; mensaje_cliente?: string; tienda_id?: number }`

- [ ] **Step 1: Escribir el check script que falla**

`backend/scripts/check-cotizaciones-service.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
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

// Repos falsos: guardan lo ultimo que se les mando para poder afirmarlo.
function repos(cot: any, versiones: any[] = []) {
  const guardadas: any[] = [];
  const cotRepo = {
    findOne: async () => cot,
    save: async (c: any) => { guardadas.push({ tabla: 'cotizaciones', ...c }); return c; },
    find: async () => [cot],
  };
  const verRepo = {
    find: async () => versiones,
    findOne: async () => versiones[versiones.length - 1] ?? null,
    create: (v: any) => v,
    save: async (v: any) => { guardadas.push({ tabla: 'versiones', ...v }); return { id: 99, ...v }; },
  };
  const configRepo = {
    findOne: async () => ({ empresa_id: 7, preferencias: { cotizaciones: { activo: true, vigencia_dias: 15 } } }),
  };
  return { cotRepo, verRepo, configRepo, guardadas };
}

function servicio(cot: any, versiones: any[] = []) {
  const r = repos(cot, versiones);
  const svc = new CotizacionesService(r.cotRepo as any, r.verRepo as any, r.configRepo as any);
  return { svc, ...r };
}

const ITEMS_SOLICITADOS = [
  { producto_id: 1, nombre: 'Estampas', sku: 'A1', qty: 3, precio_unitario: 0, subtotal: 0 },
  { producto_id: 2, nombre: 'Encendedor', sku: 'B2', qty: 2, precio_unitario: 0, subtotal: 0 },
];

(async () => {
  console.log('--- cotizar (v1) ---');
  {
    const { svc, guardadas } = servicio(
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
  }

  console.log('--- re-cotizar (v2) ---');
  {
    const { svc } = servicio(
      cotizacionFake({ estado: 'rechazada', version_actual: 1, tienda_id: 3 }),
      [{ version: 1, items: [{ ...ITEMS_SOLICITADOS[0], precio_unitario: 10, subtotal: 30 }], respuesta: 'rechazada' }],
    );
    const r = await svc.cotizar(SCOPE, 10, { items: [{ producto_id: 1, precio_unitario: 8 }] });
    check('crea la version 2', r.version.version, 2);
    check('reabre a enviada', r.cotizacion.estado, 'enviada');
    check('re-cotiza sobre los items de la version anterior', r.version.subtotal, 24);
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
```

- [ ] **Step 2: Ejecutarlo y verificar que falla**

```bash
cd backend && npx ts-node -r tsconfig-paths/register scripts/check-cotizaciones-service.ts
```
Esperado: FALLA con `Cannot find module '../src/modules/cotizaciones/cotizaciones.service'`.

- [ ] **Step 3: Escribir el servicio**

`backend/src/modules/cotizaciones/cotizaciones.service.ts`:

```ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cotizacion } from './cotizacion.entity';
import { CotizacionVersion, CotizacionItem } from './cotizacion-version.entity';
import { EcommerceConfig } from '../ecommerce/ecommerce-config.entity';
import { puedeCotizar, calcularTotales, vigenciaHasta } from './cotizacion.logic';

export interface CotizarDto {
  items: { producto_id: number; precio_unitario: number }[];
  descuento?: number;
  vigencia_dias?: number;
  mensaje_cliente?: string;
  tienda_id?: number;
}

const VIGENCIA_DEFAULT = 15;

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectRepository(Cotizacion) private cotRepo: Repository<Cotizacion>,
    @InjectRepository(CotizacionVersion) private verRepo: Repository<CotizacionVersion>,
    @InjectRepository(EcommerceConfig) private configRepo: Repository<EcommerceConfig>,
  ) {}

  async listar(scope: any, filtros: { estado?: string; q?: string } = {}) {
    const where: any = { empresa_id: scope.empresa_id, tenant_id: scope.tenant_id };
    if (filtros.estado) where.estado = filtros.estado;
    return this.cotRepo.find({ where, order: { created_at: 'DESC' }, take: 200 });
  }

  private async buscar(scope: any, id: number): Promise<Cotizacion> {
    const c = await this.cotRepo.findOne({
      where: { id, empresa_id: scope.empresa_id, tenant_id: scope.tenant_id },
    });
    if (!c) throw new NotFoundException('Cotización no encontrada');
    return c;
  }

  async detalle(scope: any, id: number) {
    const cotizacion = await this.buscar(scope, id);
    const versiones = await this.verRepo.find({
      where: { cotizacion_id: cotizacion.id },
      order: { version: 'ASC' },
    });
    return { cotizacion, versiones };
  }

  // Mismo verbo para la v1 y para la re-cotizacion: si ya hay versiones, crea la
  // siguiente. Rechazada y vencida vuelven a 'enviada' con el mismo folio.
  async cotizar(scope: any, id: number, dto: CotizarDto) {
    const cotizacion = await this.buscar(scope, id);
    if (!puedeCotizar(cotizacion.estado)) {
      throw new BadRequestException(
        `Una cotización ${cotizacion.estado} no se puede cotizar`,
      );
    }

    const tienda_id = dto.tienda_id || cotizacion.tienda_id || scope.tienda_id;
    if (!tienda_id) {
      throw new BadRequestException('Selecciona la tienda que cobrará la cotización');
    }

    const precios = new Map<number, number>();
    for (const it of dto.items || []) {
      const precio = Number(it.precio_unitario);
      if (!Number.isFinite(precio) || precio < 0) {
        throw new BadRequestException('Precio invalido en la cotización');
      }
      precios.set(Number(it.producto_id), precio);
    }

    // Los renglones salen SIEMPRE de la version anterior (o de la solicitud
    // original, guardada como version 0): el cliente pidio esos productos y esas
    // cantidades, el negocio solo pone precios.
    const base = await this.itemsBase(cotizacion);
    const descuento = Number(dto.descuento || 0);
    const { items, subtotal, total } = calcularTotales(base, precios, descuento);

    if (!items.length) throw new BadRequestException('La cotización no tiene productos');
    if (subtotal <= 0) throw new BadRequestException('Captura al menos un precio mayor a cero');

    const dias = Number(dto.vigencia_dias || (await this.vigenciaDeTienda(cotizacion)) || VIGENCIA_DEFAULT);
    const ahora = new Date();

    const version = await this.verRepo.save(
      this.verRepo.create({
        cotizacion_id: cotizacion.id,
        version: cotizacion.version_actual + 1,
        items,
        subtotal,
        descuento,
        total,
        vigencia_hasta: vigenciaHasta(ahora, dias),
        mensaje_cliente: dto.mensaje_cliente || null,
        enviada_at: ahora,
        respuesta: null,
        respuesta_motivo: null,
        respondida_at: null,
        respondida_ip: null,
      }),
    );

    cotizacion.estado = 'enviada';
    cotizacion.version_actual = version.version;
    cotizacion.tienda_id = tienda_id;
    await this.cotRepo.save(cotizacion);

    return { cotizacion, version };
  }

  private async itemsBase(c: Cotizacion): Promise<CotizacionItem[]> {
    const ultima = await this.verRepo.findOne({
      where: { cotizacion_id: c.id },
      order: { version: 'DESC' },
    });
    return (ultima?.items as CotizacionItem[]) || [];
  }

  private async vigenciaDeTienda(c: Cotizacion): Promise<number | null> {
    const config: any = await this.configRepo.findOne({ where: { empresa_id: c.empresa_id } });
    const dias = Number(config?.preferencias?.cotizaciones?.vigencia_dias || 0);
    return dias > 0 ? dias : null;
  }

  async cerrar(scope: any, id: number, motivo: string) {
    const c = await this.buscar(scope, id);
    if (c.estado === 'aceptada') {
      throw new BadRequestException('Una cotización aceptada ya generó su pedido');
    }
    c.estado = 'cerrada';
    c.motivo_cierre = motivo || null;
    return this.cotRepo.save(c);
  }

  async actualizarNotas(scope: any, id: number, notas_internas: string) {
    const c = await this.buscar(scope, id);
    c.notas_internas = notas_internas;
    return this.cotRepo.save(c);
  }
}
```

**Nota para quien implementa:** el check script construye el servicio con `new CotizacionesService(cotRepo, verRepo, configRepo)` — respetar ese orden de parámetros exacto.

La solicitud original se guarda como **versión 0** (sin precios, `vigencia_hasta` vacía no aplica: ver Task 6, que la crea). Por eso `itemsBase()` lee la última versión y funciona igual para la v1 que para una re-cotización.

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
cd backend && npx ts-node -r tsconfig-paths/register scripts/check-cotizaciones-service.ts
```
Esperado: `TODO OK`.

- [ ] **Step 5: Escribir el controlador**

`backend/src/modules/cotizaciones/cotizaciones.controller.ts`:

```ts
import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantScope } from '../../common/decorators/tenant.decorator';
import { CotizacionesService, CotizarDto } from './cotizaciones.service';

@Controller('cotizaciones')
@UseGuards(AuthGuard('jwt'))
export class CotizacionesController {
  constructor(private readonly service: CotizacionesService) {}

  @Get()
  listar(@TenantScope() scope: any, @Query() query: any) {
    return this.service.listar(scope, { estado: query.estado, q: query.q });
  }

  @Get(':id')
  detalle(@TenantScope() scope: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.detalle(scope, id);
  }

  @Post(':id/cotizar')
  cotizar(@TenantScope() scope: any, @Param('id', ParseIntPipe) id: number, @Body() dto: CotizarDto) {
    return this.service.cotizar(scope, id, dto);
  }

  @Post(':id/cerrar')
  cerrar(@TenantScope() scope: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.cerrar(scope, id, body?.motivo);
  }

  @Patch(':id/notas')
  notas(@TenantScope() scope: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.actualizarNotas(scope, id, body?.notas_internas);
  }
}
```

**Antes de escribirlo:** abrir `backend/src/modules/ecommerce/ecommerce.controller.ts` y copiar de ahí la forma exacta de los guards y del decorador de scope (import path de `@TenantScope`, si usa `@Roles()`, etc.). Este repo tiene un `LicenciaGuard` global — no agregarlo a mano.

- [ ] **Step 6: Registrar en el módulo**

En `cotizaciones.module.ts`: `controllers: [CotizacionesController]`, `providers: [CotizacionesService]`, `exports: [CotizacionesService]`.

- [ ] **Step 7: Compilar**

```bash
cd backend && npm run build
```
Esperado: 0 errores.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/cotizaciones backend/scripts/check-cotizaciones-service.ts backend/dist
git commit -m "feat(cotizaciones): servicio y endpoints del POS para cotizar y re-cotizar"
```

---

### Task 4: Endpoint interno y materialización del pedido

**Files:**
- Create: `backend/src/common/guards/internal-secret.guard.ts`
- Create: `backend/src/modules/cotizaciones/cotizaciones-internal.controller.ts`
- Modify: `backend/src/modules/cotizaciones/cotizaciones.service.ts` (agregar `materializarPedido`)
- Modify: `backend/src/modules/cotizaciones/cotizaciones.module.ts`
- Modify: `backend/src/main.ts` (agregar `/internal` a `BYPASS_PATHS` del `LicenciaGuard`)
- Modify: `docker-compose.yml` (variable `INTERNAL_API_SECRET`)
- Test: `backend/scripts/check-cotizaciones-internal.ts`

**Interfaces:**
- Consumes: `CotizacionesService` (Task 3), `PedidosService.crear(data, scope)` (existente), `PedidoEstado` (existente).
- Produces:
  - `CotizacionesService.materializarPedido(id: number): Promise<{ pedido_id: number; folio: string }>`
  - `InternalSecretGuard`
  - `POST /internal/cotizaciones/:id/pedido`

- [ ] **Step 1: Escribir el check script que falla**

`backend/scripts/check-cotizaciones-internal.ts`:

```ts
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
```

- [ ] **Step 2: Ejecutarlo y verificar que falla**

```bash
cd backend && npx ts-node -r tsconfig-paths/register scripts/check-cotizaciones-internal.ts
```
Esperado: FALLA con `Cannot find module '../src/common/guards/internal-secret.guard'`.

- [ ] **Step 3: Escribir el guard**

`backend/src/common/guards/internal-secret.guard.ts`:

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

// Autenticacion servicio-a-servicio para las llamadas que POS_STORE_API hace al
// POS por la red interna de docker. No hay usuario ni JWT: el scope sale del
// registro que se esta tocando, no de un token.
@Injectable()
export class InternalSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const esperado = process.env.INTERNAL_API_SECRET || '';
    // Sin secreto configurado el endpoint queda cerrado, no abierto.
    if (!esperado) return false;

    const req = context.switchToHttp().getRequest();
    const recibido = String(req?.headers?.['x-internal-secret'] || '');
    if (recibido.length !== esperado.length) return false;
    return crypto.timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
  }
}
```

- [ ] **Step 4: Agregar `materializarPedido` al servicio**

En `cotizaciones.service.ts`, inyectar `PedidosService` como **cuarto** parámetro del constructor:

```ts
import { PedidosService } from '../pedidos/pedidos.service';
import { PedidoEstado } from '../pedidos/pedido.entity';

// ...dentro del constructor, despues de configRepo:
    private pedidosService: PedidosService,
```

Y el método:

```ts
  // Convierte una cotizacion aceptada en el pedido de mostrador que se cobra en
  // caja. Lo llama el endpoint interno cuando el cliente acepta en la tienda, y
  // el job de reintento si esa llamada no llego. Idempotente por `pedido_id`.
  async materializarPedido(id: number): Promise<{ pedido_id: number; folio: string }> {
    const c = await this.cotRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Cotización no encontrada');
    if (c.pedido_id) {
      return { pedido_id: c.pedido_id, folio: '' };
    }
    if (c.estado !== 'aceptada') {
      throw new BadRequestException('Solo se materializa una cotización aceptada');
    }
    if (!c.tienda_id) {
      throw new BadRequestException('La cotización no tiene tienda asignada');
    }

    const version = await this.verRepo.findOne({
      where: { cotizacion_id: c.id, version: c.version_actual },
    });
    if (!version) throw new BadRequestException('La cotización no tiene versión vigente');

    const pedido = await this.pedidosService.crear(
      {
        mesa: 0,
        subtotal: version.subtotal,
        descuento: version.descuento,
        impuestos: 0,
        total: version.total,
        notas: `Cotización ${c.numero}${c.notas_cliente ? ' | ' + c.notas_cliente : ''}`,
        cliente_nombre: c.cliente_nombre,
        cliente_telefono: c.cliente_tel,
        cliente_direccion: direccionPlana(c.direccion_envio),
        cliente_email: c.cliente_email,
        cliente_empresa: c.cliente_empresa,
        tipo_servicio: 'para_llevar',
        estado: PedidoEstado.LISTO_PARA_ENTREGA,
        cotizacion_id: c.id,
        items: (version.items || []).map((it) => ({
          producto_id: it.producto_id,
          nombre: it.nombre,
          sku: it.sku,
          cantidad: Number(it.qty || 0),
          precio: Number(it.precio_unitario || 0),
        })),
      },
      {
        tenant_id: c.tenant_id,
        empresa_id: c.empresa_id,
        tienda_id: c.tienda_id,
        nombre: 'Tienda en línea',
      },
    );

    c.pedido_id = pedido!.id;
    await this.cotRepo.save(c);
    return { pedido_id: pedido!.id, folio: pedido!.folio };
  }
```

`direccionPlana` ya existe en `ecommerce.service.ts`: moverla a
`backend/src/modules/cotizaciones/cotizacion.logic.ts` como export e importarla en **ambos** archivos, en vez de copiarla.

**Y en `pedidos.service.ts`, en `crear()`**, agregar junto a `ecommerce_pedido_id`:

```ts
      cotizacion_id: data.cotizacion_id ?? null,
```

- [ ] **Step 4b: NO tocar el cierre automatico al cobrar**

En `pedidos.service.ts` (~línea 272) hay una rama que, al cobrar, marca como `entregado` el
`ecommerce_pedidos` de origen. **Esa rama se deja exactamente como está** y **no** se le agrega una
gemela para `cotizacion_id`: una cotización `aceptada` es terminal, y cobrarla no debe moverla. El
cliente ve "Pedido pagado" porque `ver()` (Task 7) lee el estado del pedido ligado, no el de la
cotización.

Este paso no cambia código. Está aquí para que nadie "arregle" después una asimetría que es
intencional.

- [ ] **Step 5: Ejecutar el check y verificar que pasa**

```bash
cd backend && npx ts-node -r tsconfig-paths/register scripts/check-cotizaciones-internal.ts
```
Esperado: `TODO OK`.

Volver a correr el de la Task 3 — el constructor cambió de aridad:
```bash
npx ts-node -r tsconfig-paths/register scripts/check-cotizaciones-service.ts
```
Esperado: `TODO OK` (el cuarto parámetro llega `undefined` y esas pruebas no lo usan). Si falla, pasarle `{} as any` en el helper `servicio()` de ese script.

- [ ] **Step 6: Escribir el controlador interno**

`backend/src/modules/cotizaciones/cotizaciones-internal.controller.ts`:

```ts
import { Controller, Post, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { InternalSecretGuard } from '../../common/guards/internal-secret.guard';
import { CotizacionesService } from './cotizaciones.service';

// Lo llama POS_STORE_API por la red interna cuando el cliente acepta. No lleva
// JWT: el scope sale de la cotizacion.
@Controller('internal/cotizaciones')
@UseGuards(InternalSecretGuard)
export class CotizacionesInternalController {
  constructor(private readonly service: CotizacionesService) {}

  @Post(':id/pedido')
  materializar(@Param('id', ParseIntPipe) id: number) {
    return this.service.materializarPedido(id);
  }
}
```

Registrarlo en `cotizaciones.module.ts` junto al otro controlador.

- [ ] **Step 7: Dejar pasar `/internal` en el guard global de licencia**

En `backend/src/main.ts`, agregar `'internal'` a la lista `BYPASS_PATHS` del `LicenciaGuard`, con este comentario:

```ts
  // Llamadas servicio-a-servicio: ya van autenticadas por InternalSecretGuard y
  // no representan a un usuario cuya licencia se pueda evaluar.
```

- [ ] **Step 8: Agregar la variable de entorno**

En `docker-compose.yml`, servicio `backend`, bloque `environment`:

```yaml
      # Secreto compartido con POS_STORE_API para /internal/* (aceptacion de
      # cotizaciones). Debe ser IDENTICO en los dos stacks.
      INTERNAL_API_SECRET: cambiar_este_valor_en_produccion
```

- [ ] **Step 9: Compilar y commit**

```bash
cd backend && npm run build
cd .. && git add backend/src backend/scripts/check-cotizaciones-internal.ts backend/dist docker-compose.yml
git commit -m "feat(cotizaciones): endpoint interno que materializa el pedido al aceptar"
```

---

### Task 5: Jobs — vencimiento y reintento

**Files:**
- Create: `backend/src/modules/cotizaciones/cotizaciones.jobs.ts`
- Modify: `backend/src/modules/cotizaciones/cotizaciones.module.ts`
- Test: verificación manual (los jobs son SQL contra la base; la lógica que sí es pura ya quedó probada en la Task 2)

**Interfaces:**
- Consumes: `CotizacionesService.materializarPedido` (Task 4).
- Produces: `CotizacionesJobs` (provider con dos `@Cron`).

- [ ] **Step 1: Escribir el provider**

`backend/src/modules/cotizaciones/cotizaciones.jobs.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CotizacionesService } from './cotizaciones.service';

@Injectable()
export class CotizacionesJobs {
  private readonly log = new Logger('CotizacionesJobs');

  constructor(
    @InjectDataSource() private ds: DataSource,
    private service: CotizacionesService,
  ) {}

  // Una cotizacion enviada cuya version vigente ya expiro deja de poder
  // aceptarse. No se cierra: re-cotizar la reabre con el mismo folio.
  @Cron(CronExpression.EVERY_HOUR)
  async marcarVencidas(): Promise<void> {
    const r = await this.ds.query(
      `UPDATE cotizaciones c
         JOIN cotizacion_versiones v
           ON v.cotizacion_id = c.id AND v.version = c.version_actual
        SET c.estado = 'vencida', c.updated_at = NOW()
      WHERE c.estado = 'enviada'
        AND v.respuesta IS NULL
        AND v.vigencia_hasta < CURDATE()`,
    );
    if (r?.affectedRows) this.log.warn(`Cotizaciones vencidas: ${r.affectedRows}`);
  }

  // Red de seguridad, no el camino normal: si la llamada interna de la tienda no
  // llego (POS caido, particion de red), la aceptacion ya quedo escrita en la
  // base y aqui se materializa el pedido que falto.
  @Cron(CronExpression.EVERY_MINUTE)
  async materializarPendientes(): Promise<void> {
    const filas = await this.ds.query(
      `SELECT id FROM cotizaciones
        WHERE estado = 'aceptada' AND pedido_id IS NULL
        ORDER BY updated_at ASC
        LIMIT 20`,
    );
    for (const f of filas) {
      try {
        const r = await this.service.materializarPedido(f.id);
        this.log.log(`Cotización ${f.id} materializada como pedido ${r.folio || r.pedido_id}`);
      } catch (e: any) {
        this.log.error(`Cotización ${f.id} no se pudo materializar: ${e.message}`);
      }
    }
  }
}
```

- [ ] **Step 2: Registrar el provider**

En `cotizaciones.module.ts`, agregar `CotizacionesJobs` a `providers`.

Verificar que `ScheduleModule.forRoot()` ya esté en `app.module.ts` (lo usan otros jobs). Si no está, agregarlo.

- [ ] **Step 3: Compilar y probar a mano**

```bash
cd backend && npm run build && npm run start:dev
```

Sembrar un caso vencido en MySQL:
```sql
-- id de la version vigente de una cotizacion en estado 'enviada'
UPDATE cotizacion_versiones v
   JOIN cotizaciones c ON c.id = v.cotizacion_id AND c.version_actual = v.version
    SET v.vigencia_hasta = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
  WHERE c.estado = 'enviada' LIMIT 1;
```

Correr el mismo `UPDATE` que hace el job, sin esperar la hora:
```sql
UPDATE cotizaciones c
  JOIN cotizacion_versiones v ON v.cotizacion_id = c.id AND v.version = c.version_actual
   SET c.estado = 'vencida', c.updated_at = NOW()
 WHERE c.estado = 'enviada' AND v.respuesta IS NULL AND v.vigencia_hasta < CURDATE();

SELECT numero, estado FROM cotizaciones WHERE estado = 'vencida';
```
Esperado: la cotización sembrada aparece como `vencida`. Confirmar además en el log del backend que
`CotizacionesJobs` arrancó (`materializarPendientes` se registra cada minuto).

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/cotizaciones backend/dist
git commit -m "feat(cotizaciones): jobs de vencimiento y reintento de materializacion"
```

---

### Task 6: API pública — crear la solicitud

**Repo:** `POS_MULTITENANT_STORE`

**Files:**
- Create: `POS_STORE_API/src/public/cotizaciones.service.ts`
- Create: `POS_STORE_API/src/public/cotizaciones.service.spec.ts`
- Modify: `POS_STORE_API/src/public/public.controller.ts` (rutas nuevas)
- Modify: `POS_STORE_API/src/public/public.module.ts` (registrar el servicio)

**Interfaces:**
- Consumes: tablas `cotizaciones` y `cotizacion_versiones` (Task 1), en SQL crudo.
- Produces:
  - `CotizacionesPublicService.crear(sub: string, body): Promise<{ numero: string; estado: 'solicitada'; token: string }>`
  - `siguienteNumeroCotizacion(empresa_id: number, yy: string, intento: number): Promise<string>`
  - `tokenCotizacion(empresa_id: number, numero: string): string`
  - `POST /public/tienda/:sub/cotizaciones`

- [ ] **Step 1: Escribir el spec que falla**

`POS_STORE_API/src/public/cotizaciones.service.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { CotizacionesPublicService } from './cotizaciones.service';

// DataSource falso: responde por orden de llamada y graba los INSERT para poder
// afirmar sobre ellos.
function dsFake(respuestas: any[][]) {
  const queries: { sql: string; params: any[] }[] = [];
  let i = 0;
  return {
    queries,
    ds: {
      query: async (sql: string, params: any[] = []) => {
        queries.push({ sql, params });
        return respuestas[i++] ?? [];
      },
    } as any,
  };
}

const CONFIG_COTIZACION = {
  empresa_id: 7, tenant_id: 1, subdominio: 'flordepapel', nombre_tienda: 'Flor de Papel',
  preferencias: JSON.stringify({ cotizaciones: { activo: true } }),
  campos_formulario: null, modo_mayoreo: 0, qty_min_mayoreo: 1,
};

const PRODUCTO = { id: 1, nombre: 'Estampas Panini', sku: 'A1', precio: 0 };

describe('CotizacionesPublicService.crear', () => {
  it('crea la cotizacion con folio, estado solicitada y version 0', async () => {
    const { ds, queries } = dsFake([
      [CONFIG_COTIZACION],   // getConfigBySubdominio
      [{ max: 0 }],          // siguienteNumeroCotizacion
      [PRODUCTO],            // producto del item
      [],                    // INSERT cotizaciones
      [{ id: 55 }],          // SELECT LAST_INSERT_ID / id recien creado
      [],                    // INSERT version 0
    ]);
    const svc = new CotizacionesPublicService(ds, { enviarCotizacion: async () => {} } as any);

    const r = await svc.crear('flordepapel', {
      cliente_nombre: 'Ana',
      cliente_email: 'ana@x.mx',
      items: [{ producto_id: 1, qty: 3 }],
    });

    expect(r.numero).toBe('COT-26-0001');
    expect(r.estado).toBe('solicitada');
    expect(r.token).toHaveLength(32);

    const insert = queries.find((q) => q.sql.includes('INSERT INTO cotizaciones'));
    expect(insert).toBeDefined();
    expect(insert!.params).toContain('solicitada');
  });

  it('rechaza si la tienda no esta en modo cotizacion', async () => {
    const { ds } = dsFake([
      [{ ...CONFIG_COTIZACION, preferencias: JSON.stringify({ cotizaciones: { activo: false } }) }],
    ]);
    const svc = new CotizacionesPublicService(ds, { enviarCotizacion: async () => {} } as any);

    await expect(
      svc.crear('flordepapel', { cliente_nombre: 'Ana', items: [{ producto_id: 1, qty: 1 }] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza un carrito vacio', async () => {
    const { ds } = dsFake([[CONFIG_COTIZACION]]);
    const svc = new CotizacionesPublicService(ds, { enviarCotizacion: async () => {} } as any);

    await expect(
      svc.crear('flordepapel', { cliente_nombre: 'Ana', items: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('guarda los items en la version 0 sin precios', async () => {
    const { ds, queries } = dsFake([
      [CONFIG_COTIZACION], [{ max: 0 }], [PRODUCTO], [], [{ id: 55 }], [],
    ]);
    const svc = new CotizacionesPublicService(ds, { enviarCotizacion: async () => {} } as any);

    await svc.crear('flordepapel', {
      cliente_nombre: 'Ana', items: [{ producto_id: 1, qty: 3 }],
    });

    const insertVersion = queries.find((q) => q.sql.includes('INSERT INTO cotizacion_versiones'));
    expect(insertVersion).toBeDefined();
    const items = JSON.parse(insertVersion!.params.find((p: any) => typeof p === 'string' && p.startsWith('[')));
    expect(items).toEqual([
      { producto_id: 1, nombre: 'Estampas Panini', sku: 'A1', qty: 3, precio_unitario: 0, subtotal: 0 },
    ]);
  });
});
```

**Nota:** el spec asume año 26 en el folio. Si se ejecuta en otro año, cambiar el `expect` a
``expect(r.numero).toBe(`COT-${new Date().getFullYear().toString().slice(-2)}-0001`)``.

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
cd POS_STORE_API && npx jest src/public/cotizaciones.service.spec.ts
```
Esperado: FALLA con `Cannot find module './cotizaciones.service'`.

- [ ] **Step 3: Escribir el servicio**

`POS_STORE_API/src/public/cotizaciones.service.ts`. Antes de escribirlo, **leer `public.service.ts`**: de ahí se reusan `tokenConfirmacion` (líneas 24-32), `parseJson`, `esDuplicado`, `MAX_REINTENTOS_NUMERO` y la forma de `getConfigBySubdominio`. Exportarlos desde `public.service.ts` en vez de duplicarlos.

```ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotifyService } from '../notify/notify.service';
import { tokenConfirmacion, parseJson, esDuplicado, MAX_REINTENTOS_NUMERO } from './public.service';

export function tokenCotizacion(empresa_id: number, numero: string): string {
  return tokenConfirmacion(empresa_id, numero);
}

@Injectable()
export class CotizacionesPublicService {
  constructor(
    @InjectDataSource() private ds: DataSource,
    private notify: NotifyService,
  ) {}

  private async config(sub: string) {
    const [config] = await this.ds.query(
      `SELECT empresa_id, tenant_id, subdominio, nombre_tienda, preferencias
         FROM ecommerce_config WHERE subdominio = ? AND activo = 1 LIMIT 1`,
      [sub],
    );
    if (!config) throw new NotFoundException('Tienda no encontrada');
    return config;
  }

  private esModoCotizacion(config: any): boolean {
    return !!parseJson(config?.preferencias, null)?.cotizaciones?.activo;
  }

  private async siguienteNumero(empresa_id: number, yy: string, intento: number): Promise<string> {
    const [r] = await this.ds.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(numero, 8) AS UNSIGNED)), 0) AS max
         FROM cotizaciones WHERE empresa_id = ? AND numero LIKE ?`,
      [empresa_id, `COT-${yy}-%`],
    );
    const siguiente = Number(r?.max || 0) + 1 + intento;
    return `COT-${yy}-${String(siguiente).padStart(4, '0')}`;
  }

  async crear(sub: string, body: any) {
    const config = await this.config(sub);
    if (!this.esModoCotizacion(config)) {
      throw new BadRequestException('Esta tienda no recibe solicitudes de cotización');
    }

    const itemsInput = Array.isArray(body?.items) ? body.items : [];
    if (!itemsInput.length) throw new BadRequestException('La solicitud no tiene productos');
    if (!body?.cliente_nombre?.trim()) throw new BadRequestException('El nombre es obligatorio');

    // Snapshot sin precios: el cliente pidio estos productos y estas cantidades.
    // Los precios los pone el negocio al cotizar, en la version 1.
    const items: any[] = [];
    for (const it of itemsInput) {
      const [prod] = await this.ds.query(
        `SELECT p.id, p.nombre, p.sku FROM productos p
          WHERE p.id = ? AND p.empresa_id = ? AND p.activo = 1`,
        [it.producto_id, config.empresa_id],
      );
      if (!prod) throw new BadRequestException(`Producto ${it.producto_id} no encontrado`);
      items.push({
        producto_id: prod.id, nombre: prod.nombre, sku: prod.sku,
        qty: Number(it.qty || 0), precio_unitario: 0, subtotal: 0,
      });
    }

    const yy = new Date().getFullYear().toString().slice(-2);
    let numero = '';
    let cotizacion_id = 0;

    // El consecutivo es por empresa y la unicidad en BD tambien: dos solicitudes
    // simultaneas pueden calcular el mismo numero, y al chocar se reintenta con
    // el siguiente en vez de devolver 500.
    for (let intento = 0; ; intento++) {
      numero = await this.siguienteNumero(config.empresa_id, yy, intento);
      try {
        await this.ds.query(
          `INSERT INTO cotizaciones
             (empresa_id, tenant_id, numero, cliente_nombre, cliente_email, cliente_tel,
              cliente_empresa, direccion_envio, notas_cliente, estado, version_actual,
              created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'solicitada', 0, NOW(), NOW())`,
          [
            config.empresa_id, config.tenant_id, numero,
            body.cliente_nombre.trim(),
            body.cliente_email || '',
            body.cliente_tel || null,
            body.cliente_empresa?.trim() || null,
            body.direccion_envio ? JSON.stringify(body.direccion_envio) : null,
            body.notas_cliente || null,
          ],
        );
        break;
      } catch (e: any) {
        if (!esDuplicado(e) || intento >= MAX_REINTENTOS_NUMERO) throw e;
      }
    }

    const [creada] = await this.ds.query(
      'SELECT id FROM cotizaciones WHERE empresa_id = ? AND numero = ? LIMIT 1',
      [config.empresa_id, numero],
    );
    cotizacion_id = creada.id;

    // Version 0 = la solicitud tal como la mando el cliente. Le da a `cotizar()`
    // del POS de donde sacar los renglones sin tratar el caso "primera vez" aparte.
    await this.ds.query(
      `INSERT INTO cotizacion_versiones
         (cotizacion_id, version, items, subtotal, descuento, total, vigencia_hasta, enviada_at)
       VALUES (?, 0, ?, 0, 0, 0, CURDATE(), NOW())`,
      [cotizacion_id, JSON.stringify(items)],
    );

    return { numero, estado: 'solicitada' as const, token: tokenCotizacion(config.empresa_id, numero) };
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
cd POS_STORE_API && npx jest src/public/cotizaciones.service.spec.ts
```
Esperado: 4 tests PASS.

- [ ] **Step 5: Exponer la ruta**

En `public.controller.ts`, inyectar `CotizacionesPublicService` y agregar:

```ts
  @Post(':subdominio/cotizaciones')
  crearCotizacion(@Param('subdominio') sub: string, @Body() body: any) {
    return this.cotizaciones.crear(sub, body);
  }
```

Registrar el servicio en `public.module.ts` (`providers` y, si hace falta, `exports`).

- [ ] **Step 6: Compilar y commit**

```bash
cd POS_STORE_API && npm run build && npx jest
cd .. && git add POS_STORE_API/src
git commit -m "feat(cotizaciones): endpoint publico para crear la solicitud"
```

---

### Task 7: API pública — ver, aceptar y rechazar

**Repo:** `POS_MULTITENANT_STORE`

**Files:**
- Modify: `POS_STORE_API/src/public/cotizaciones.service.ts`
- Modify: `POS_STORE_API/src/public/cotizaciones.service.spec.ts`
- Modify: `POS_STORE_API/src/public/public.controller.ts`
- Modify: `docker-compose.yml` (`INTERNAL_API_SECRET`, `POS_API_URL`)

**Interfaces:**
- Consumes: `tokenCotizacion` (Task 6), `POST /internal/cotizaciones/:id/pedido` (Task 4).
- Produces:
  - `CotizacionesPublicService.ver(sub, numero, token): Promise<{ numero: string; estado: string; cliente_nombre: string; version_actual: number; actual: object | null; historial: object[]; pedido: { folio: string; estado: string } | null }>`
  - `CotizacionesPublicService.aceptar(sub, numero, token, ip): Promise<{ estado: string; pedido_numero: string | null }>`
  - `CotizacionesPublicService.rechazar(sub, numero, token, motivo, ip): Promise<{ estado: string }>`
  - `CotizacionesPublicService.avisarAlPos(cotizacion_id): Promise<void>`

- [ ] **Step 1: Agregar los specs que fallan**

Añadir a `cotizaciones.service.spec.ts`:

```ts
describe('CotizacionesPublicService.aceptar', () => {
  const COT = {
    id: 55, empresa_id: 7, numero: 'COT-26-0001', estado: 'enviada',
    version_actual: 1, pedido_id: null,
  };
  const VER_VIGENTE = { id: 9, version: 1, vigencia_hasta: '2099-01-01', respuesta: null, total: 80 };

  function svcCon(respuestas: any[][], avisos: number[] = []) {
    const { ds, queries } = dsFake(respuestas);
    const svc = new CotizacionesPublicService(ds, { enviarCotizacion: async () => {} } as any);
    // El aviso al POS se prueba aparte: aqui solo se cuenta que se intente.
    (svc as any).avisarAlPos = async (id: number) => { avisos.push(id); };
    return { svc, queries };
  }

  it('acepta y marca la cotizacion aceptada', async () => {
    const avisos: number[] = [];
    const { svc, queries } = svcCon([
      [CONFIG_COTIZACION], [COT], [VER_VIGENTE], [], [],
    ], avisos);

    const r = await svc.aceptar('flordepapel', 'COT-26-0001', tokenValido(), '1.2.3.4');

    expect(r.estado).toBe('aceptada');
    expect(queries.some((q) => q.sql.includes("estado = 'aceptada'"))).toBe(true);
    expect(queries.some((q) => q.sql.includes("respuesta = 'aceptada'"))).toBe(true);
    expect(avisos).toEqual([55]);
  });

  it('rechaza un token invalido', async () => {
    const { svc } = svcCon([[CONFIG_COTIZACION], [COT]]);
    await expect(
      svc.aceptar('flordepapel', 'COT-26-0001', 'token-falso', '1.2.3.4'),
    ).rejects.toThrow();
  });

  it('no acepta una version vencida', async () => {
    const { svc } = svcCon([
      [CONFIG_COTIZACION], [COT], [{ ...VER_VIGENTE, vigencia_hasta: '2000-01-01' }],
    ]);
    await expect(
      svc.aceptar('flordepapel', 'COT-26-0001', tokenValido(), '1.2.3.4'),
    ).rejects.toThrow(BadRequestException);
  });

  it('es idempotente: aceptar dos veces no repite el efecto', async () => {
    const avisos: number[] = [];
    const { svc, queries } = svcCon([
      [CONFIG_COTIZACION],
      [{ ...COT, estado: 'aceptada', pedido_id: 555 }],
      [{ ...VER_VIGENTE, respuesta: 'aceptada' }],
    ], avisos);

    const r = await svc.aceptar('flordepapel', 'COT-26-0001', tokenValido(), '1.2.3.4');

    expect(r.estado).toBe('aceptada');
    expect(queries.some((q) => q.sql.startsWith('UPDATE'))).toBe(false);
    expect(avisos).toEqual([]);
  });
});

describe('CotizacionesPublicService.rechazar', () => {
  it('exige motivo', async () => {
    const { ds } = dsFake([[CONFIG_COTIZACION], [{ id: 55, empresa_id: 7, numero: 'COT-26-0001', estado: 'enviada', version_actual: 1 }]]);
    const svc = new CotizacionesPublicService(ds, { enviarCotizacion: async () => {} } as any);
    await expect(
      svc.rechazar('flordepapel', 'COT-26-0001', tokenValido(), '   ', '1.2.3.4'),
    ).rejects.toThrow(BadRequestException);
  });

  it('guarda el motivo en la version y deja la cotizacion rechazada', async () => {
    const { ds, queries } = dsFake([
      [CONFIG_COTIZACION],
      [{ id: 55, empresa_id: 7, numero: 'COT-26-0001', estado: 'enviada', version_actual: 1 }],
      [{ id: 9, version: 1, vigencia_hasta: '2099-01-01', respuesta: null }],
      [], [],
    ]);
    const svc = new CotizacionesPublicService(ds, { enviarCotizacion: async () => {} } as any);

    const r = await svc.rechazar('flordepapel', 'COT-26-0001', tokenValido(), 'muy caro', '1.2.3.4');

    expect(r.estado).toBe('rechazada');
    const update = queries.find((q) => q.sql.includes('respuesta_motivo'));
    expect(update!.params).toContain('muy caro');
  });
});
```

Y arriba del archivo, el helper del token — importar `tokenCotizacion` del propio servicio:

```ts
import { tokenCotizacion } from './cotizaciones.service';
function tokenValido() { return tokenCotizacion(7, 'COT-26-0001'); }
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
cd POS_STORE_API && npx jest src/public/cotizaciones.service.spec.ts
```
Esperado: los tests nuevos FALLAN con `svc.aceptar is not a function`.

- [ ] **Step 3: Implementar ver / aceptar / rechazar**

Agregar a `cotizaciones.service.ts`:

```ts
import { ForbiddenException } from '@nestjs/common';

// ...dentro de la clase:

  private async buscarPorNumero(config: any, numero: string, token: string) {
    const esperado = tokenCotizacion(config.empresa_id, numero);
    if (!token || token !== esperado) throw new ForbiddenException('Enlace inválido');

    const [c] = await this.ds.query(
      `SELECT id, empresa_id, numero, estado, version_actual, pedido_id, cliente_nombre
         FROM cotizaciones WHERE numero = ? AND empresa_id = ? LIMIT 1`,
      [numero, config.empresa_id],
    );
    if (!c) throw new NotFoundException('Cotización no encontrada');
    return c;
  }

  private async versionActual(cotizacion_id: number, version: number) {
    const [v] = await this.ds.query(
      `SELECT * FROM cotizacion_versiones WHERE cotizacion_id = ? AND version = ? LIMIT 1`,
      [cotizacion_id, version],
    );
    return v || null;
  }

  async ver(sub: string, numero: string, token: string) {
    const config = await this.config(sub);
    const c = await this.buscarPorNumero(config, numero, token);
    const actual = await this.versionActual(c.id, c.version_actual);
    const historial = await this.ds.query(
      `SELECT version, total, respuesta, respuesta_motivo, respondida_at, vigencia_hasta
         FROM cotizacion_versiones
        WHERE cotizacion_id = ? AND version > 0
        ORDER BY version DESC`,
      [c.id],
    );
    // `estado` del pedido para poder decirle al cliente "Pedido pagado" sin
    // tocar el estado de la cotizacion, que ya es terminal en 'aceptada'.
    let pedido = null;
    if (c.pedido_id) {
      const [p] = await this.ds.query('SELECT folio, estado FROM pedidos WHERE id = ? LIMIT 1', [c.pedido_id]);
      pedido = p ? { folio: p.folio, estado: p.estado } : null;
    }
    return {
      numero: c.numero,
      estado: c.estado,
      cliente_nombre: c.cliente_nombre,
      version_actual: c.version_actual,
      actual: actual ? { ...actual, items: parseJson(actual.items, []) } : null,
      historial,
      pedido,
    };
  }

  async aceptar(sub: string, numero: string, token: string, ip: string) {
    const config = await this.config(sub);
    const c = await this.buscarPorNumero(config, numero, token);

    // Idempotente: aceptar dos veces (doble clic, reenvio del enlace) no debe
    // generar un segundo pedido. Si ya se respondio, se devuelve el estado.
    if (c.estado === 'aceptada') return { estado: 'aceptada', pedido_numero: null };
    if (c.estado !== 'enviada') {
      throw new BadRequestException('Esta cotización ya no se puede aceptar');
    }

    const v = await this.versionActual(c.id, c.version_actual);
    if (!v) throw new BadRequestException('La cotización no tiene versión vigente');
    if (v.respuesta) return { estado: c.estado, pedido_numero: null };
    if (String(v.vigencia_hasta).slice(0, 10) < new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException('Esta cotización venció. Pide una nueva al negocio.');
    }

    await this.ds.query(
      `UPDATE cotizacion_versiones
          SET respuesta = 'aceptada', respondida_at = NOW(), respondida_ip = ?
        WHERE id = ?`,
      [ip || null, v.id],
    );
    await this.ds.query(
      `UPDATE cotizaciones SET estado = 'aceptada', updated_at = NOW() WHERE id = ?`,
      [c.id],
    );

    // La aceptacion ya quedo escrita. Si el aviso al POS falla, el job de
    // reintento del POS materializa el pedido: al cliente no se le falla.
    await this.avisarAlPos(c.id);

    return { estado: 'aceptada', pedido_numero: null };
  }

  async rechazar(sub: string, numero: string, token: string, motivo: string, ip: string) {
    const config = await this.config(sub);
    const c = await this.buscarPorNumero(config, numero, token);

    if (!motivo || !String(motivo).trim()) {
      throw new BadRequestException('Cuéntanos por qué no te sirve');
    }
    if (c.estado === 'rechazada') return { estado: 'rechazada' };
    if (c.estado !== 'enviada') {
      throw new BadRequestException('Esta cotización ya no se puede responder');
    }

    const v = await this.versionActual(c.id, c.version_actual);
    if (!v) throw new BadRequestException('La cotización no tiene versión vigente');
    if (v.respuesta) return { estado: c.estado };

    await this.ds.query(
      `UPDATE cotizacion_versiones
          SET respuesta = 'rechazada', respuesta_motivo = ?, respondida_at = NOW(), respondida_ip = ?
        WHERE id = ?`,
      [String(motivo).trim(), ip || null, v.id],
    );
    await this.ds.query(
      `UPDATE cotizaciones SET estado = 'rechazada', updated_at = NOW() WHERE id = ?`,
      [c.id],
    );

    return { estado: 'rechazada' };
  }

  // Le avisa al POS que hay una cotizacion aceptada por materializar. Nunca
  // lanza: la aceptacion del cliente ya esta guardada y no depende de esto.
  async avisarAlPos(cotizacion_id: number): Promise<void> {
    const base = process.env.POS_API_URL;
    const secreto = process.env.INTERNAL_API_SECRET;
    if (!base || !secreto) return;
    try {
      const res = await fetch(`${base}/api/internal/cotizaciones/${cotizacion_id}/pedido`, {
        method: 'POST',
        headers: { 'X-Internal-Secret': secreto },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) console.warn(`[cotizaciones] POS respondio ${res.status} al materializar ${cotizacion_id}`);
    } catch (e: any) {
      console.warn(`[cotizaciones] no se pudo avisar al POS (${e.message}); el job de reintento lo recogera`);
    }
  }
```

**Verificar el prefijo de ruta del POS:** `backend/src/main.ts` fija un prefijo global (`api`). Confirmarlo antes de dejar la URL como `${base}/api/internal/...`.

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
cd POS_STORE_API && npx jest src/public/cotizaciones.service.spec.ts
```
Esperado: todos PASS.

- [ ] **Step 5: Exponer las rutas**

En `public.controller.ts`:

```ts
  @Get(':subdominio/cotizaciones/:numero')
  verCotizacion(
    @Param('subdominio') sub: string,
    @Param('numero') numero: string,
    @Query('t') token: string,
  ) {
    return this.cotizaciones.ver(sub, numero, token);
  }

  @Post(':subdominio/cotizaciones/:numero/aceptar')
  aceptarCotizacion(
    @Param('subdominio') sub: string,
    @Param('numero') numero: string,
    @Query('t') token: string,
    @Ip() ip: string,
  ) {
    return this.cotizaciones.aceptar(sub, numero, token, ip);
  }

  @Post(':subdominio/cotizaciones/:numero/rechazar')
  rechazarCotizacion(
    @Param('subdominio') sub: string,
    @Param('numero') numero: string,
    @Query('t') token: string,
    @Body() body: any,
    @Ip() ip: string,
  ) {
    return this.cotizaciones.rechazar(sub, numero, token, body?.motivo, ip);
  }
```

Agregar `Ip` al import de `@nestjs/common`.

**Orden de rutas:** declarar `:subdominio/cotizaciones/:numero` **después** de `:subdominio/cotizaciones`, igual que ya se hace con pedidos.

- [ ] **Step 6: Variables de entorno**

En `POS_MULTITENANT_STORE/docker-compose.yml`, servicio de la API:

```yaml
      # Aviso al POS cuando el cliente acepta una cotizacion. El secreto debe ser
      # IDENTICO al del stack del POS.
      POS_API_URL: http://pos-iados-api:3000
      INTERNAL_API_SECRET: cambiar_este_valor_en_produccion
```

Verificar que el servicio esté en `web_network` (ya lo está) — es la red donde vive `pos-iados-api`.

- [ ] **Step 7: Compilar y commit**

```bash
cd POS_STORE_API && npm run build && npx jest
cd .. && git add POS_STORE_API/src docker-compose.yml
git commit -m "feat(cotizaciones): aceptar, rechazar y consultar por enlace tokenizado"
```

---

### Task 8: Migración de las cotizaciones existentes

**Files:**
- Create: `backend/scripts/migrar-cotizaciones.ts`
- Test: el propio script corre en modo `--dry-run` primero

**Interfaces:**
- Consumes: tablas `cotizaciones`, `cotizacion_versiones` (Task 1), `ecommerce_pedidos` (existente).
- Produces: un script idempotente, ejecutable con `npx ts-node`.

- [ ] **Step 1: Escribir el script**

`backend/scripts/migrar-cotizaciones.ts`:

```ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Migra las cotizaciones que hoy viven como estados de ecommerce_pedidos:
//   estado='cotizacion'  -> solicitud sin cotizar        -> cotizaciones.solicitada
//   estado='por_cobrar'  -> ya cotizada, con pedido      -> cotizaciones.aceptada + v1
// Idempotente: salta las que ya tengan su fila en `cotizaciones` (se reconocen
// por notas_internas, donde se deja el folio EP- de origen).
//
// Uso:  npx ts-node -r tsconfig-paths/register scripts/migrar-cotizaciones.ts [--dry-run]

const DRY = process.argv.includes('--dry-run');

const ds = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'pos_iados',
  entities: [],
  synchronize: false,
});

function folio(yy: string, n: number) {
  return `COT-${yy}-${String(n).padStart(4, '0')}`;
}

(async () => {
  await ds.initialize();

  const origen = await ds.query(
    `SELECT * FROM ecommerce_pedidos
      WHERE estado IN ('cotizacion', 'por_cobrar')
      ORDER BY empresa_id, created_at ASC`,
  );
  console.log(`${origen.length} registros por migrar${DRY ? ' (dry-run)' : ''}`);

  const consecutivos = new Map<string, number>();
  let migrados = 0, saltados = 0;

  for (const p of origen) {
    const marca = `migrado-de:${p.numero_pedido}`;
    const [ya] = await ds.query(
      'SELECT id FROM cotizaciones WHERE empresa_id = ? AND notas_internas LIKE ? LIMIT 1',
      [p.empresa_id, `%${marca}%`],
    );
    if (ya) { saltados++; continue; }

    const yy = new Date(p.created_at).getFullYear().toString().slice(-2);
    const llave = `${p.empresa_id}-${yy}`;
    if (!consecutivos.has(llave)) {
      const [r] = await ds.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(numero, 8) AS UNSIGNED)), 0) AS max
           FROM cotizaciones WHERE empresa_id = ? AND numero LIKE ?`,
        [p.empresa_id, `COT-${yy}-%`],
      );
      consecutivos.set(llave, Number(r?.max || 0));
    }
    const n = consecutivos.get(llave)! + 1;
    consecutivos.set(llave, n);
    const numero = folio(yy, n);

    const aceptada = p.estado === 'por_cobrar';
    const estado = aceptada ? 'aceptada' : 'solicitada';
    const version_actual = aceptada ? 1 : 0;

    console.log(`  ${p.numero_pedido} (${p.estado}) -> ${numero} (${estado})`);
    if (DRY) { migrados++; continue; }

    await ds.query(
      `INSERT INTO cotizaciones
         (empresa_id, tenant_id, numero, cliente_nombre, cliente_email, cliente_tel,
          cliente_empresa, direccion_envio, notas_cliente, estado, version_actual,
          pedido_id, notas_internas, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.empresa_id, p.tenant_id, numero, p.cliente_nombre, p.cliente_email, p.cliente_tel,
        p.cliente_empresa, p.direccion_envio, p.notas_cliente, estado, version_actual,
        p.pedido_id, `${marca}${p.notas_internas ? ' | ' + p.notas_internas : ''}`,
        p.created_at, p.updated_at,
      ],
    );
    const [creada] = await ds.query(
      'SELECT id FROM cotizaciones WHERE empresa_id = ? AND numero = ? LIMIT 1',
      [p.empresa_id, numero],
    );

    // Version 0 siempre: la solicitud original, sin precios.
    const itemsSinPrecio = (typeof p.items === 'string' ? JSON.parse(p.items) : p.items || [])
      .map((it: any) => ({ ...it, precio_unitario: 0, subtotal: 0 }));
    await ds.query(
      `INSERT INTO cotizacion_versiones
         (cotizacion_id, version, items, subtotal, descuento, total, vigencia_hasta, enviada_at)
       VALUES (?, 0, ?, 0, 0, 0, DATE(?), ?)`,
      [creada.id, JSON.stringify(itemsSinPrecio), p.created_at, p.created_at],
    );

    if (aceptada) {
      // v1 reconstruida de lo que ya se cotizo, marcada como aceptada en la fecha
      // en que el POS la mando a cobrar.
      await ds.query(
        `INSERT INTO cotizacion_versiones
           (cotizacion_id, version, items, subtotal, descuento, total, vigencia_hasta,
            mensaje_cliente, enviada_at, respuesta, respondida_at)
         VALUES (?, 1, ?, ?, ?, ?, DATE(?), NULL, ?, 'aceptada', ?)`,
        [
          creada.id,
          typeof p.items === 'string' ? p.items : JSON.stringify(p.items || []),
          p.subtotal, p.descuento, p.total, p.updated_at, p.updated_at, p.updated_at,
        ],
      );
      // El pedido de mostrador existente queda apuntando a la cotizacion nueva.
      if (p.pedido_id) {
        await ds.query('UPDATE pedidos SET cotizacion_id = ? WHERE id = ?', [creada.id, p.pedido_id]);
      }
    }
    migrados++;
  }

  console.log(`\nMigrados: ${migrados} | Ya existian: ${saltados}`);
  await ds.destroy();
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Correrlo en seco contra una copia de la base**

```bash
cd backend && npx ts-node -r tsconfig-paths/register scripts/migrar-cotizaciones.ts --dry-run
```
Esperado: lista los registros y sus folios nuevos, sin escribir nada.

- [ ] **Step 3: Respaldar y ejecutar de verdad**

```bash
mysqldump -u root -p pos_iados ecommerce_pedidos pedidos > /tmp/respaldo-antes-cotizaciones.sql
npx ts-node -r tsconfig-paths/register scripts/migrar-cotizaciones.ts
```

- [ ] **Step 4: Verificar en MySQL**

```sql
-- ningun por_cobrar se quedo sin su cotizacion
SELECT COUNT(*) FROM ecommerce_pedidos ep
 WHERE ep.estado = 'por_cobrar'
   AND NOT EXISTS (SELECT 1 FROM cotizaciones c
                    WHERE c.empresa_id = ep.empresa_id
                      AND c.notas_internas LIKE CONCAT('%migrado-de:', ep.numero_pedido, '%'));
-- esperado: 0

-- ningun pedido de mostrador perdio su vinculo
SELECT COUNT(*) FROM cotizaciones WHERE estado = 'aceptada' AND pedido_id IS NULL;
-- esperado: 0

-- toda aceptada tiene su v1
SELECT COUNT(*) FROM cotizaciones c WHERE c.estado = 'aceptada'
   AND NOT EXISTS (SELECT 1 FROM cotizacion_versiones v WHERE v.cotizacion_id = c.id AND v.version = 1);
-- esperado: 0
```

- [ ] **Step 5: Correrlo dos veces para comprobar idempotencia**

```bash
npx ts-node -r tsconfig-paths/register scripts/migrar-cotizaciones.ts
```
Esperado: `Migrados: 0 | Ya existian: N`.

- [ ] **Step 6: Commit**

```bash
git add backend/scripts/migrar-cotizaciones.ts
git commit -m "chore(cotizaciones): script de migracion de las cotizaciones existentes"
```

---

## Verificación de punta a punta

Con los dos servicios arriba y una tienda con `preferencias.cotizaciones.activo = true`:

1. `POST /api/public/tienda/<sub>/cotizaciones` con dos productos → devuelve `COT-26-000X` y token.
2. En el POS, `GET /api/cotizaciones?estado=solicitada` → aparece.
3. `POST /api/cotizaciones/<id>/cotizar` con precios → estado `enviada`, versión 1.
4. `GET /api/public/tienda/<sub>/cotizaciones/<numero>?t=<token>` → precios y vigencia.
5. `POST .../rechazar` con motivo → estado `rechazada`, motivo guardado en la v1.
6. `POST /api/cotizaciones/<id>/cotizar` con precios menores → versión 2, estado `enviada`.
7. `POST .../aceptar` → estado `aceptada`; en segundos, `cotizaciones.pedido_id` lleno y el pedido visible en la pantalla del POS (suena el SSE).
8. `POST .../aceptar` otra vez → mismo estado, **sin** un segundo pedido.
9. Apagar el contenedor del POS, aceptar otra cotización, levantarlo → en ≤1 minuto el pedido aparece por el job de reintento.

## Lo que este plan NO incluye

Todo lo visible va en el segundo plan (`2026-09-17-cotizaciones-experiencia.md`): modo cotización en el carrito de la tienda, pantalla `/cotizacion/:numero`, "Mis cotizaciones", sección Cotizaciones en el POS, correos y notificaciones, y el retiro de `cotizacion`/`por_cobrar` del enum de `ecommerce_pedidos`.
