# Monitor de usuarios en línea — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar al superadmin una pantalla que muestre en tiempo real quién está usando el POS, agrupado por tienda, con la pantalla en la que está cada usuario y cómo se mueve entre pantallas.

**Architecture:** Un gateway Socket.io dedicado (namespace `/presencia`) mantiene la presencia en un `Map` en memoria, sin tocar MySQL. El cliente del POS abre el socket al autenticarse y emite un mensaje por cambio de ruta. El monitor del superadmin reutiliza ese mismo socket, se une a una room y recibe la foto inicial más los deltas. Si nadie tiene el monitor abierto, no se emite nada.

**Tech Stack:** NestJS 10 + `@nestjs/websockets` + socket.io (ya en el proyecto), React 18 + `socket.io-client` (ya en el proyecto), `@nestjs/jwt` (ya exportado por `AuthModule`). **Sin dependencias nuevas.**

**Spec:** `docs/superpowers/specs/2026-08-20-monitor-usuarios-en-linea-design.md`

## Global Constraints

- **Sin dependencias nuevas** en backend ni frontend.
- **Sin entidades, sin tablas, sin migraciones.** El módulo no escribe en MySQL. Si un paso te lleva a crear una entidad, te saliste del plan.
- **La IP no se captura.** No leer `x-forwarded-for` ni `handshake.address` en ningún punto.
- **Nada puede romper el POS.** Todo emit del cliente es fire-and-forget; ningún `await`, ningún estado de carga, ningún `console.error`, ningún toast atado a este módulo.
- **Deploy:** este repo compila en local y Docker solo copia artefactos. Cualquier cambio en `backend/` exige `backend/dist/` reconstruido y commiteado; cualquier cambio en `frontend/` exige **`dist-prod/` y `dist-vps/`** reconstruidos y commiteados. `npm run build` del frontend solo genera `dist-prod`; `dist-vps` sale de `npx vite build --outDir dist-vps`.
- **Regla de TypeORM del repo:** nunca combinar `@Column({ unique: true })` con un `@Index([...], { unique: true })` de clase. No aplica aquí porque no hay entidades, pero vale si te desvías.
- **Este repo no tiene test runner.** La verificación de lógica pura se hace con scripts de comprobación ejecutables, descritos en cada tarea. No instales jest ni vitest.

### Cómo se ejecutan las comprobaciones

Backend (tiene `ts-node`):

```bash
cd backend && npx ts-node scripts/check-monitor.ts
```

Frontend (los módulos importan `lucide-react`, hay que stubearlo):

```bash
cd frontend
npx esbuild scripts/check-rutas.ts --bundle --platform=node --format=cjs \
  --alias:lucide-react=scripts/lucide-stub.js --outfile=/tmp/check-rutas.cjs
node /tmp/check-rutas.cjs
```

Cada script termina con `process.exit(fallos === 0 ? 0 : 1)`, así que el código de salida es la señal.

### Desviación deliberada del spec

El spec dibuja dos sockets (uno del usuario, otro del monitor). **La implementación usa uno solo por pestaña:** el `MonitorPage` reutiliza el socket de presencia que ya abrió `MainLayout` y le emite `monitor-join`. El contrato de eventos del spec no cambia; solo se ahorra una conexión. Está aquí escrito para que la diferencia sea visible al revisar.

---

## Estructura de archivos

**Backend — crear `backend/src/modules/monitor/`:**

| Archivo | Responsabilidad |
|---|---|
| `monitor.types.ts` | Tipos compartidos. Sin lógica. |
| `user-agent.util.ts` | Función pura: user-agent → navegador, sistema, móvil. |
| `monitor.service.ts` | Dueño del `Map`. Alta, baja, cambio de pantalla, snapshot agrupado. Sin dependencias de constructor, para poder instanciarlo en las comprobaciones. |
| `monitor.gateway.ts` | Solo traduce entre socket y service. Verifica el JWT. |
| `monitor.module.ts` | Cableado. Importa `AuthModule` por el `JwtService`. |
| `scripts/check-monitor.ts` | Comprobaciones de `user-agent.util` y `MonitorService`. |

**Backend — modificar:** `backend/src/app.module.ts` (registrar `MonitorModule`).

**Frontend — crear:**

| Archivo | Responsabilidad |
|---|---|
| `src/api/presencia.ts` | Socket singleton + reglas de offline. Único lugar que habla con `/presencia`. |
| `src/hooks/usePresencia.ts` | Engancha el router y reporta la ruta. Se monta una sola vez. |
| `src/components/layout/navItems.ts` | `navItems` extraído de `MainLayout` + `etiquetaDeRuta()`. |
| `src/pages/superadmin/MonitorPage.tsx` | La pantalla. |
| `scripts/check-rutas.ts`, `scripts/lucide-stub.js` | Comprobaciones de `etiquetaDeRuta`. |

**Frontend — modificar:** `src/components/layout/MainLayout.tsx` (importar `navItems`, montar el hook), `src/App.tsx` (ruta nueva).

---

## Task 1: Parser de user-agent

**Files:**
- Create: `backend/src/modules/monitor/monitor.types.ts`
- Create: `backend/src/modules/monitor/user-agent.util.ts`
- Create: `backend/scripts/check-monitor.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `interface DispositivoInfo { navegador: string; sistema: string; movil: boolean }` y `function parseUserAgent(ua: string | undefined): DispositivoInfo`, ambos exportados. Task 3 los usa.

- [ ] **Step 1: Crear los tipos compartidos**

Crea `backend/src/modules/monitor/monitor.types.ts`:

```ts
// Tipos del monitor de presencia. Nada aqui se persiste: viven solo en memoria
// mientras el backend esta arriba.

export interface DispositivoInfo {
  navegador: string;
  sistema: string;
  movil: boolean;
}

/** Identidad que sale del JWT verificado. El cliente no puede falsearla. */
export interface IdentidadSesion {
  usuario_id: number;
  nombre: string;
  rol: string;
  tenant_id: number;
  empresa_id: number;
  tienda_id: number | null;
}

export interface SesionPresencia {
  socket_id: string;
  usuario_id: number;
  nombre: string;
  rol: string;
  tenant_id: number;
  empresa_id: number;
  tienda_id: number | null;
  dispositivo: DispositivoInfo;
  /** Ruta cruda, p.ej. '/admin/configuracion'. La etiqueta legible la resuelve el frontend. */
  pantalla_actual: string;
  pantalla_desde: number;
  conectado_desde: number;
  /** Ultimas RASTRO_MAX rutas INCLUYENDO la actual, la mas reciente al final. */
  rastro: string[];
}

export interface UsuarioEnLinea {
  usuario_id: number;
  nombre: string;
  rol: string;
  sesiones: SesionPresencia[];
}

export interface GrupoTienda {
  tienda_id: number | null;
  usuarios: UsuarioEnLinea[];
}

export interface SnapshotPresencia {
  grupos: GrupoTienda[];
  total_usuarios: number;
  total_sesiones: number;
  /** Solo tiendas reales: el grupo 'sin tienda' no cuenta. */
  total_tiendas: number;
}

export interface DeltaPantalla {
  socket_id: string;
  ruta: string;
  desde: number;
}
```

- [ ] **Step 2: Escribir la comprobación que falla**

Crea `backend/scripts/check-monitor.ts`:

```ts
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
```

- [ ] **Step 3: Ejecutar para verificar que falla**

Run: `cd backend && npx ts-node scripts/check-monitor.ts`
Expected: FAIL — el módulo `user-agent.util` todavía no existe (error de resolución).

- [ ] **Step 4: Implementar el parser**

Crea `backend/src/modules/monitor/user-agent.util.ts`:

```ts
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
```

- [ ] **Step 5: Ejecutar para verificar que pasa**

Run: `cd backend && npx ts-node scripts/check-monitor.ts`
Expected: `TODO OK`, código de salida 0. Las 7 comprobaciones en `OK`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/monitor/monitor.types.ts \
        backend/src/modules/monitor/user-agent.util.ts \
        backend/scripts/check-monitor.ts
git commit -m "feat(monitor): tipos de presencia y parser de user-agent"
```

---

## Task 2: MonitorService — el estado en memoria

**Files:**
- Create: `backend/src/modules/monitor/monitor.service.ts`
- Modify: `backend/scripts/check-monitor.ts` (añadir comprobaciones al final, antes del bloque que imprime el total)

**Interfaces:**
- Consumes: `SesionPresencia`, `SnapshotPresencia`, `DeltaPantalla`, `IdentidadSesion`, `DispositivoInfo` de `monitor.types.ts` (Task 1).
- Produces: clase `MonitorService` **sin dependencias de constructor**, con:
  - `alta(socketId: string, identidad: IdentidadSesion, dispositivo: DispositivoInfo, rutaInicial: string): SesionPresencia`
  - `baja(socketId: string): SesionPresencia | null`
  - `cambiarPantalla(socketId: string, ruta: string): DeltaPantalla | null`
  - `getSesion(socketId: string): SesionPresencia | undefined`
  - `snapshot(): SnapshotPresencia`

  Task 3 usa las cinco.

- [ ] **Step 1: Escribir las comprobaciones que fallan**

En `backend/scripts/check-monitor.ts`, añade el import arriba:

```ts
import { MonitorService } from '../src/modules/monitor/monitor.service';
import { IdentidadSesion, DispositivoInfo } from '../src/modules/monitor/monitor.types';
```

y este bloque **antes** de las dos últimas líneas (`console.log(fallos === 0 ...)` y `process.exit(...)`):

```ts
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
```

- [ ] **Step 2: Ejecutar para verificar que falla**

Run: `cd backend && npx ts-node scripts/check-monitor.ts`
Expected: FAIL — el módulo `monitor.service` no existe.

- [ ] **Step 3: Implementar el service**

Crea `backend/src/modules/monitor/monitor.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import {
  SesionPresencia, IdentidadSesion, DispositivoInfo,
  SnapshotPresencia, GrupoTienda, UsuarioEnLinea, DeltaPantalla,
} from './monitor.types';

/** Cuantas rutas recuerda cada sesion, incluyendo la actual. */
const RASTRO_MAX = 5;

// Estado de presencia, EN MEMORIA. No toca MySQL: cambiar de pantalla no debe
// costar una escritura. Al reiniciar el backend se pierde y se repuebla solo
// conforme los clientes reconectan.
//
// Sin dependencias de constructor a proposito: asi se puede instanciar en
// scripts/check-monitor.ts sin levantar Nest.
@Injectable()
export class MonitorService {
  private sesiones = new Map<string, SesionPresencia>();

  alta(
    socketId: string,
    identidad: IdentidadSesion,
    dispositivo: DispositivoInfo,
    rutaInicial: string,
  ): SesionPresencia {
    const ahora = Date.now();
    const sesion: SesionPresencia = {
      socket_id: socketId,
      ...identidad,
      dispositivo,
      pantalla_actual: rutaInicial,
      pantalla_desde: ahora,
      conectado_desde: ahora,
      rastro: [rutaInicial],
    };
    this.sesiones.set(socketId, sesion);
    return sesion;
  }

  baja(socketId: string): SesionPresencia | null {
    const sesion = this.sesiones.get(socketId);
    if (!sesion) return null;
    this.sesiones.delete(socketId);
    return sesion;
  }

  /**
   * Devuelve el delta a difundir, o null si no hay nada que difundir: socket
   * desconocido, o el usuario "navego" a la pantalla en la que ya estaba (pasa
   * al re-renderizar el router). Devolver null evita ruido en el monitor.
   */
  cambiarPantalla(socketId: string, ruta: string): DeltaPantalla | null {
    const sesion = this.sesiones.get(socketId);
    if (!sesion) return null;
    if (sesion.pantalla_actual === ruta) return null;

    sesion.pantalla_actual = ruta;
    sesion.pantalla_desde = Date.now();
    sesion.rastro = [...sesion.rastro, ruta].slice(-RASTRO_MAX);

    return { socket_id: socketId, ruta, desde: sesion.pantalla_desde };
  }

  getSesion(socketId: string): SesionPresencia | undefined {
    return this.sesiones.get(socketId);
  }

  /**
   * Foto completa, agrupada por tienda y dentro de cada tienda por usuario.
   * Las sesiones sin tienda (superadmin, o admin que aun no elige tienda) van
   * en su propio grupo al final: se muestran, pero no cuentan como tienda, o
   * el total del encabezado no cuadraria con la suma de los bloques.
   */
  snapshot(): SnapshotPresencia {
    const porTienda = new Map<number | null, Map<number, UsuarioEnLinea>>();

    for (const sesion of this.sesiones.values()) {
      if (!porTienda.has(sesion.tienda_id)) porTienda.set(sesion.tienda_id, new Map());
      const usuarios = porTienda.get(sesion.tienda_id)!;

      if (!usuarios.has(sesion.usuario_id)) {
        usuarios.set(sesion.usuario_id, {
          usuario_id: sesion.usuario_id,
          nombre: sesion.nombre,
          rol: sesion.rol,
          sesiones: [],
        });
      }
      usuarios.get(sesion.usuario_id)!.sesiones.push(sesion);
    }

    const grupos: GrupoTienda[] = [...porTienda.entries()]
      .map(([tienda_id, usuarios]) => ({
        tienda_id,
        usuarios: [...usuarios.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }))
      .sort((a, b) => {
        if (a.tienda_id === null) return 1;   // 'sin tienda' siempre al final
        if (b.tienda_id === null) return -1;
        return a.tienda_id - b.tienda_id;
      });

    const usuariosUnicos = new Set([...this.sesiones.values()].map(s => s.usuario_id));

    return {
      grupos,
      total_usuarios: usuariosUnicos.size,
      total_sesiones: this.sesiones.size,
      total_tiendas: grupos.filter(g => g.tienda_id !== null).length,
    };
  }
}
```

- [ ] **Step 4: Ejecutar para verificar que pasa**

Run: `cd backend && npx ts-node scripts/check-monitor.ts`
Expected: `TODO OK`, código de salida 0. 28 comprobaciones en `OK` (7 de Task 1 + 21 de esta).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/monitor/monitor.service.ts backend/scripts/check-monitor.ts
git commit -m "feat(monitor): estado de presencia en memoria con agrupacion por tienda"
```

---

## Task 3: MonitorGateway y cableado del módulo

**Files:**
- Create: `backend/src/modules/monitor/monitor.gateway.ts`
- Create: `backend/src/modules/monitor/monitor.module.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Consumes: `MonitorService` (Task 2), `parseUserAgent` (Task 1), `JwtService` de `@nestjs/jwt` vía `AuthModule`.
- Produces: el namespace `/presencia` con el contrato de eventos de abajo. Tasks 4 y 6 lo consumen desde el frontend.

| Evento | Dirección | Carga |
|---|---|---|
| `pantalla` | cliente → servidor | `{ ruta: string }` |
| `monitor-join` | superadmin → servidor | — |
| `presencia:snapshot` | servidor → monitor | `SnapshotPresencia` |
| `presencia:alta` | servidor → monitor | `SesionPresencia` |
| `presencia:baja` | servidor → monitor | `{ socket_id: string }` |
| `presencia:pantalla` | servidor → monitor | `DeltaPantalla` |

La conexión se autentica con el JWT en `handshake.auth.token`. La ruta inicial viaja en `handshake.auth.ruta`.

- [ ] **Step 1: Implementar el gateway**

Crea `backend/src/modules/monitor/monitor.gateway.ts`:

```ts
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MonitorService } from './monitor.service';
import { parseUserAgent } from './user-agent.util';
import { IdentidadSesion } from './monitor.types';

/** Room a la que se unen los superadmins que tienen el monitor abierto. */
const ROOM_MONITOR = 'monitor';

// Presencia en vivo del POS. A diferencia de BiometricoGateway y BasculaGateway,
// que confian en un token de tienda, aqui SI se verifica el JWT: se maneja
// identidad de personas, y un cliente no debe poder decir "soy Juan".
//
// La IP no se lee del handshake a proposito: quedo fuera de alcance.
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/presencia' })
export class MonitorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly monitor: MonitorService,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      client.disconnect(true);
      return;
    }

    const identidad: IdentidadSesion = {
      usuario_id: payload.sub,
      nombre: payload.nombre || payload.email || 'Sin nombre',
      rol: payload.rol,
      tenant_id: payload.tenant_id,
      empresa_id: payload.empresa_id,
      tienda_id: payload.tienda_id ?? null,
    };

    const dispositivo = parseUserAgent(client.handshake.headers['user-agent']);
    const rutaInicial = client.handshake.auth?.ruta || '/';

    const sesion = this.monitor.alta(client.id, identidad, dispositivo, rutaInicial);
    this.emitirSiHayMonitores('presencia:alta', sesion);
  }

  handleDisconnect(client: Socket) {
    const sesion = this.monitor.baja(client.id);
    if (sesion) this.emitirSiHayMonitores('presencia:baja', { socket_id: client.id });
  }

  @SubscribeMessage('pantalla')
  handlePantalla(@ConnectedSocket() client: Socket, @MessageBody() data: { ruta?: string }) {
    if (!data?.ruta) return;
    const delta = this.monitor.cambiarPantalla(client.id, data.ruta);
    if (delta) this.emitirSiHayMonitores('presencia:pantalla', delta);
  }

  @SubscribeMessage('monitor-join')
  handleMonitorJoin(@ConnectedSocket() client: Socket) {
    // El rol sale de la sesion, que se construyo con el JWT verificado.
    // No se le pregunta al cliente que rol tiene.
    const sesion = this.monitor.getSesion(client.id);
    if (sesion?.rol !== 'superadmin') return;
    client.join(ROOM_MONITOR);
    client.emit('presencia:snapshot', this.monitor.snapshot());
  }

  // El Map se actualiza siempre; difundir solo cuesta cuando alguien mira.
  // Con el monitor cerrado — lo normal — esto no emite nada.
  private emitirSiHayMonitores(evento: string, carga: any) {
    const room = this.server?.sockets?.adapter?.rooms?.get(ROOM_MONITOR);
    if (!room || room.size === 0) return;
    this.server.to(ROOM_MONITOR).emit(evento, carga);
  }
}
```

- [ ] **Step 2: Crear el módulo**

Crea `backend/src/modules/monitor/monitor.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MonitorGateway } from './monitor.gateway';
import { MonitorService } from './monitor.service';

// AuthModule se importa por el JwtService, que ya exporta. No hay TypeOrmModule
// aqui: este modulo no toca la base de datos.
@Module({
  imports: [AuthModule],
  providers: [MonitorGateway, MonitorService],
})
export class MonitorModule {}
```

- [ ] **Step 3: Registrar el módulo**

En `backend/src/app.module.ts`, añade el import junto a los demás módulos:

```ts
import { MonitorModule } from './modules/monitor/monitor.module';
```

y agrega `MonitorModule` al array `imports` del `@Module`, al final de la lista de módulos de negocio.

- [ ] **Step 4: Compilar**

Run: `cd backend && npm run build`
Expected: sin errores. Un fallo aquí suele ser una importación circular con `AuthModule` — si aparece, revisa que `AuthModule` siga exportando `JwtModule`.

- [ ] **Step 5: Comprobar que el backend arranca**

Run: `cd backend && node dist/main` (con la BD accesible; corta con Ctrl+C al ver el log de arranque)
Expected: arranca sin excepciones y sin ninguna línea de `synchronize` creando tablas nuevas. Si TypeORM intenta crear algo, algo se desvió del plan: este módulo no tiene entidades.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/monitor/monitor.gateway.ts \
        backend/src/modules/monitor/monitor.module.ts \
        backend/src/app.module.ts backend/dist
git commit -m "feat(monitor): gateway /presencia con verificacion de JWT"
```

---

## Task 4: Cliente de presencia y hook del router

**Files:**
- Create: `frontend/src/api/presencia.ts`
- Create: `frontend/src/hooks/usePresencia.ts`
- Modify: `frontend/src/components/layout/MainLayout.tsx`

**Interfaces:**
- Consumes: el contrato de eventos de Task 3.
- Produces:
  - `iniciarPresencia(token: string, rutaInicial: string): void`
  - `reportarPantalla(ruta: string): void`
  - `detenerPresencia(): void`
  - `getPresenciaSocket(): Socket | null` — Task 6 lo usa para que el monitor reutilice el mismo socket.
  - `usePresencia(): void` — hook sin retorno.

- [ ] **Step 1: Implementar el cliente del socket**

Crea `frontend/src/api/presencia.ts`:

```ts
import { io, Socket } from 'socket.io-client';

// Cliente del monitor de presencia. Es ESTRICTAMENTE OPCIONAL: si falla, la app
// debe seguir funcionando identica. Por eso no lanza nunca, no muestra toasts y
// no escribe en consola. Un cajero trabajando offline no debe enterarse de que
// este modulo existe.

let socket: Socket | null = null;
let tokenActual: string | null = null;

// El POS se instala tambien on-premise, donde VITE_API_URL apunta a localhost.
// Ahi el monitor no aplica (vive solo en la nube), asi que ni se intenta conectar.
const apiUrl = import.meta.env.VITE_API_URL || '/api';
const esNube = !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1');

function baseSocket(): string {
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://posapi.iados.online';
}

function puedeConectar(): boolean {
  return esNube && typeof navigator !== 'undefined' && navigator.onLine;
}

export function iniciarPresencia(token: string, rutaInicial: string): void {
  if (!puedeConectar() || !token) return;
  if (socket) return;

  tokenActual = token;
  try {
    socket = io(`${baseSocket()}/presencia`, {
      transports: ['websocket'],
      auth: { token, ruta: rutaInicial },
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
    });
    // Silencio deliberado: sin la red, fallar es lo esperado, no un error que
    // haya que reportarle al cajero.
    socket.on('connect_error', () => {});
  } catch {
    socket = null;
  }
}

export function reportarPantalla(ruta: string): void {
  try {
    if (socket?.connected) socket.emit('pantalla', { ruta });
  } catch {
    // fire-and-forget: nunca propagar
  }
}

export function getPresenciaSocket(): Socket | null {
  return socket;
}

export function detenerPresencia(): void {
  try {
    socket?.disconnect();
  } catch {
    // ignorado
  }
  socket = null;
}

/** Reconecta con el token ya conocido. La usa el listener de 'online'. */
export function reanudarPresencia(rutaActual: string): void {
  if (socket || !tokenActual) return;
  iniciarPresencia(tokenActual, rutaActual);
}
```

- [ ] **Step 2: Implementar el hook**

Crea `frontend/src/hooks/usePresencia.ts`:

```ts
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import {
  iniciarPresencia, reportarPantalla, detenerPresencia, reanudarPresencia,
} from '../api/presencia';

/** Ventana para agrupar navegaciones rapidas en un solo mensaje. */
const COALESCE_MS = 400;

// Se monta UNA sola vez, en MainLayout, que ya vive dentro de PrivateRoute.
// Reporta la ruta actual al backend para el monitor del superadmin.
export function usePresencia(): void {
  const token = useAuthStore(s => s.token);
  const location = useLocation();
  const rutaRef = useRef(location.pathname);
  rutaRef.current = location.pathname;

  // Conexion: atada al token, no a la ruta, para no reconectar al navegar.
  useEffect(() => {
    if (!token) return;
    iniciarPresencia(token, rutaRef.current);
    return () => detenerPresencia();
  }, [token]);

  // La red se va y vuelve: desconectar a proposito y reconectar sin ruido.
  useEffect(() => {
    const alVolver = () => reanudarPresencia(rutaRef.current);
    const alCaerse = () => detenerPresencia();
    window.addEventListener('online', alVolver);
    window.addEventListener('offline', alCaerse);
    return () => {
      window.removeEventListener('online', alVolver);
      window.removeEventListener('offline', alCaerse);
    };
  }, []);

  // Cambio de ruta, agrupado: tres navegaciones en un segundo = un mensaje.
  useEffect(() => {
    const t = setTimeout(() => reportarPantalla(location.pathname), COALESCE_MS);
    return () => clearTimeout(t);
  }, [location.pathname]);
}
```

- [ ] **Step 3: Montar el hook en MainLayout**

En `frontend/src/components/layout/MainLayout.tsx`, añade el import:

```ts
import { usePresencia } from '../../hooks/usePresencia';
```

y dentro del componente `MainLayout`, junto a los demás hooks (después de la línea que calcula `necesitaTienda`), añade la llamada:

```ts
  // Presencia para el monitor del superadmin. Opcional: si falla, no afecta nada.
  usePresencia();
```

- [ ] **Step 4: Compilar**

Run: `cd frontend && npm run build`
Expected: sin errores de tipos.

- [ ] **Step 5: Verificar a mano que no rompe el modo offline**

Con el backend levantado y sesión iniciada:
1. Abre las DevTools, pestaña Console, y déjala visible.
2. Network → throttling → **Offline**.
3. Navega entre POS, Caja y Pedidos.

Expected: ni un `console.error`, ni un toast, ni una excepción. El POS sigue navegando normal. En Network se ve el intento de websocket fallando, que es lo esperado — lo que no debe haber es ruido en Console ni en la UI.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/presencia.ts frontend/src/hooks/usePresencia.ts \
        frontend/src/components/layout/MainLayout.tsx
git commit -m "feat(monitor): cliente de presencia con apagado en offline y on-premise"
```

---

## Task 5: Extraer navItems y resolver etiquetas de ruta

**Files:**
- Create: `frontend/src/components/layout/navItems.ts`
- Create: `frontend/scripts/lucide-stub.js`
- Create: `frontend/scripts/check-rutas.ts`
- Modify: `frontend/src/components/layout/MainLayout.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: `navItems` (el mismo array que hoy vive en `MainLayout`) y `etiquetaDeRuta(ruta: string): string`. Task 6 usa `etiquetaDeRuta`.

- [ ] **Step 1: Escribir la comprobación que falla**

Crea `frontend/scripts/lucide-stub.js`:

```js
// Stub de lucide-react: navItems solo guarda los iconos como valores.
const icon = () => null;
module.exports = new Proxy({}, { get: () => icon });
```

Crea `frontend/scripts/check-rutas.ts`:

```ts
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
```

- [ ] **Step 2: Ejecutar para verificar que falla**

Run:
```bash
cd frontend
npx esbuild scripts/check-rutas.ts --bundle --platform=node --format=cjs \
  --alias:lucide-react=scripts/lucide-stub.js --outfile=/tmp/check-rutas.cjs
node /tmp/check-rutas.cjs
```
Expected: FAIL — `navItems.ts` no existe.

- [ ] **Step 3: Extraer navItems**

Crea `frontend/src/components/layout/navItems.ts` moviendo el array `navItems` **tal cual está hoy** en `MainLayout.tsx` (líneas ~66-80), con sus imports de iconos, y añadiendo la entrada de Monitor y el resolvedor de etiquetas:

```ts
import {
  ShoppingCart, LayoutDashboard, ClipboardList, CreditCard, FileBarChart,
  Warehouse, BookOpen, Grid3X3, Users, Store, Settings, Building2, HelpCircle,
  Activity,
} from 'lucide-react';

export interface NavItem {
  to: string;
  icon: any;
  label: string;
  roles: string[];
  badge?: boolean;
}

// Fuente unica del menu lateral. Vivia dentro de MainLayout; se extrajo para que
// el monitor pueda traducir rutas a nombres legibles sin mantener un segundo
// diccionario que se desincronice.
export const navItems: NavItem[] = [
  { to: '/pos',                   icon: ShoppingCart,    label: 'POS',        roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'] },
  { to: '/dashboard',             icon: LayoutDashboard, label: 'Dashboard',  roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/pedidos',               icon: ClipboardList,   label: 'Pedidos',    roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'], badge: true },
  { to: '/caja',                  icon: CreditCard,      label: 'Caja',       roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/reportes',              icon: FileBarChart,    label: 'Reportes',   roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/inventario',            icon: Warehouse,       label: 'Inventario', roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/catalogos',             icon: BookOpen,        label: 'Catalogos',  roles: ['superadmin', 'admin'] },
  { to: '/admin/mesas',           icon: Grid3X3,         label: 'Mesas',      roles: ['superadmin', 'admin'] },
  { to: '/admin/usuarios',        icon: Users,           label: 'Usuarios',   roles: ['superadmin', 'admin'] },
  { to: '/admin/tienda-en-linea', icon: Store,           label: 'Tienda en Línea', roles: ['superadmin', 'admin'] },
  { to: '/admin/configuracion',   icon: Settings,        label: 'Config',     roles: ['superadmin', 'admin'] },
  { to: '/admin/tenants',         icon: Building2,       label: 'Tenants',    roles: ['superadmin'] },
  { to: '/superadmin/monitor',    icon: Activity,        label: 'Monitor',    roles: ['superadmin'] },
  { to: '/ayuda',                 icon: HelpCircle,      label: 'Ayuda',      roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'] },
];

const ETIQUETAS = new Map(navItems.map(i => [i.to, i.label]));

/** Nombre legible de una ruta. Las que no estan en el menu se muestran crudas. */
export function etiquetaDeRuta(ruta: string): string {
  return ETIQUETAS.get(ruta) ?? ruta;
}
```

- [ ] **Step 4: Ejecutar para verificar que pasa**

Run:
```bash
cd frontend
npx esbuild scripts/check-rutas.ts --bundle --platform=node --format=cjs \
  --alias:lucide-react=scripts/lucide-stub.js --outfile=/tmp/check-rutas.cjs
node /tmp/check-rutas.cjs
```
Expected: `TODO OK`, 6 comprobaciones, código de salida 0.

- [ ] **Step 5: Hacer que MainLayout use el módulo extraído**

En `frontend/src/components/layout/MainLayout.tsx`:
1. Borra el array `navItems` local (líneas ~66-80).
2. Añade `import { navItems } from './navItems';`.
3. Quita de la lista de imports de `lucide-react` los iconos que **solo** usaba `navItems` y ya no se referencian en el archivo. Deja los que sigue usando el JSX.

**Importante:** no cambies el JSX que recorre `navItems`. La entrada de Monitor aparece sola porque ya trae `roles: ['superadmin']`, que es el filtro que el menú ya aplica.

**No añadas `/superadmin/monitor` a `RUTAS_POR_TIENDA`.** Monitor es una pantalla global: el superadmin debe poder abrirla sin haber elegido tienda. Ese conjunto es exactamente lo que fuerza a elegir tienda, y meterlo ahí rompería el requisito.

- [ ] **Step 6: Compilar y revisar el menú**

Run: `cd frontend && npm run build`
Expected: sin errores. Un error típico aquí es un icono importado y ya no usado — con `noUnusedLocals: false` no falla la compilación, pero límpialo igual.

Revisa a mano: el menú lateral se ve idéntico a antes para un admin, y un superadmin ve además la entrada **Monitor**.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/layout/navItems.ts \
        frontend/src/components/layout/MainLayout.tsx \
        frontend/scripts/check-rutas.ts frontend/scripts/lucide-stub.js
git commit -m "refactor(layout): extraer navItems y resolver etiquetas de ruta"
```

---

## Task 6: La pantalla del monitor

**Files:**
- Create: `frontend/src/pages/superadmin/MonitorPage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `getPresenciaSocket()` (Task 4), `etiquetaDeRuta()` (Task 5), el contrato de eventos (Task 3), `tiendasApi.list()` (ya existe; para un superadmin devuelve **todas** las tiendas, sin filtro de tenant).
- Produces: la ruta `/superadmin/monitor`.

- [ ] **Step 1: Implementar la pantalla**

Crea `frontend/src/pages/superadmin/MonitorPage.tsx`:

```tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, Users, Store, Smartphone, MonitorSmartphone } from 'lucide-react';
import { getPresenciaSocket } from '../../api/presencia';
import { etiquetaDeRuta } from '../../components/layout/navItems';
import { tiendasApi } from '../../api/endpoints';
import { usePageHeader } from '../../store/pageHeader.store';

interface Dispositivo { navegador: string; sistema: string; movil: boolean }
interface Sesion {
  socket_id: string; usuario_id: number; nombre: string; rol: string;
  tienda_id: number | null; dispositivo: Dispositivo;
  pantalla_actual: string; pantalla_desde: number; conectado_desde: number; rastro: string[];
}
interface UsuarioEnLinea { usuario_id: number; nombre: string; rol: string; sesiones: Sesion[] }
interface GrupoTienda { tienda_id: number | null; usuarios: UsuarioEnLinea[] }
interface Snapshot {
  grupos: GrupoTienda[]; total_usuarios: number; total_sesiones: number; total_tiendas: number;
}

const VACIO: Snapshot = { grupos: [], total_usuarios: 0, total_sesiones: 0, total_tiendas: 0 };

/** Cuanto dura el resaltado de una fila que acaba de cambiar de pantalla. */
const FLASH_MS = 2500;

function hace(desde: number, ahora: number): string {
  const min = Math.floor((ahora - desde) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export default function MonitorPage() {
  usePageHeader({ title: 'Monitor', subtitle: 'Usuarios en linea en tiempo real' });

  const [snapshot, setSnapshot] = useState<Snapshot>(VACIO);
  const [conectado, setConectado] = useState(false);
  const [tiendas, setTiendas] = useState<Record<number, string>>({});
  const [flash, setFlash] = useState<Record<string, number>>({});
  // Fuerza el recalculo de los "hace 4m" sin pedir nada al servidor.
  const [ahora, setAhora] = useState(Date.now());
  const flashTimers = useRef<Record<string, any>>({});

  // El nombre de la tienda no viaja en el JWT ni en la sesion: se resuelve aqui.
  // Para un superadmin, /tiendas devuelve todas, sin filtro de tenant.
  useEffect(() => {
    tiendasApi.list()
      .then(r => {
        const mapa: Record<number, string> = {};
        (r.data || []).forEach((t: any) => { mapa[t.id] = t.nombre; });
        setTiendas(mapa);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const socket = getPresenciaSocket();
    if (!socket) return;

    const marcarFlash = (socketId: string) => {
      setFlash(f => ({ ...f, [socketId]: Date.now() }));
      clearTimeout(flashTimers.current[socketId]);
      flashTimers.current[socketId] = setTimeout(() => {
        setFlash(f => { const { [socketId]: _, ...resto } = f; return resto; });
      }, FLASH_MS);
    };

    const onSnapshot = (s: Snapshot) => { setSnapshot(s); setConectado(true); };
    const onAlta = () => socket.emit('monitor-join');   // pedir foto nueva: es barato y evita reconciliar a mano
    const onBaja = () => socket.emit('monitor-join');
    const onPantalla = (d: { socket_id: string; ruta: string; desde: number }) => {
      setSnapshot(prev => ({
        ...prev,
        grupos: prev.grupos.map(g => ({
          ...g,
          usuarios: g.usuarios.map(u => ({
            ...u,
            sesiones: u.sesiones.map(s =>
              s.socket_id === d.socket_id
                ? { ...s, pantalla_actual: d.ruta, pantalla_desde: d.desde, rastro: [...s.rastro, d.ruta].slice(-5) }
                : s,
            ),
          })),
        })),
      }));
      marcarFlash(d.socket_id);
    };

    // Con nombre, no anonimos: hay que poder quitarlos al desmontar. El socket
    // sobrevive a esta pantalla (lo abrio MainLayout), asi que un listener que no
    // se quita se acumula cada vez que se entra al monitor.
    const onDesconectado = () => setConectado(false);
    const onConectado = () => socket.emit('monitor-join');

    socket.on('presencia:snapshot', onSnapshot);
    socket.on('presencia:alta', onAlta);
    socket.on('presencia:baja', onBaja);
    socket.on('presencia:pantalla', onPantalla);
    socket.on('disconnect', onDesconectado);
    socket.on('connect', onConectado);

    // Si el socket ya estaba conectado, 'connect' no vuelve a dispararse.
    socket.emit('monitor-join');
    if (socket.connected) setConectado(true);

    return () => {
      socket.off('presencia:snapshot', onSnapshot);
      socket.off('presencia:alta', onAlta);
      socket.off('presencia:baja', onBaja);
      socket.off('presencia:pantalla', onPantalla);
      socket.off('disconnect', onDesconectado);
      socket.off('connect', onConectado);
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, []);

  const nombreTienda = (id: number | null) =>
    id === null ? 'Sin tienda asignada' : tiendas[id] || `Tienda ${id}`;

  const hayGente = useMemo(() => snapshot.total_sesiones > 0, [snapshot.total_sesiones]);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity size={24} /> Monitor
        </h1>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className={`flex items-center gap-1.5 ${conectado ? 'text-green-400' : 'text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${conectado ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {conectado ? 'En vivo' : 'Sin conexion'}
          </span>
          <span className="flex items-center gap-1"><Users size={14} /> {snapshot.total_usuarios} usuarios</span>
          <span>{snapshot.total_sesiones} sesiones</span>
          <span className="flex items-center gap-1"><Store size={14} /> {snapshot.total_tiendas} tiendas</span>
        </div>
      </div>

      {!hayGente && (
        <div className="text-center text-slate-500 py-16">
          <Activity size={40} className="mx-auto mb-3 opacity-50" />
          <p>No hay usuarios en linea en este momento</p>
        </div>
      )}

      {snapshot.grupos.map(grupo => (
        <div key={String(grupo.tienda_id)} className="bg-iados-surface rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Store size={15} className="text-slate-400" /> {nombreTienda(grupo.tienda_id)}
            </h2>
            <span className="text-xs text-slate-400">{grupo.usuarios.length} en linea</span>
          </div>

          <div className="divide-y divide-slate-700/50">
            {grupo.usuarios.map(u => {
              const reciente = u.sesiones.some(s => flash[s.socket_id]);
              return (
                <div
                  key={u.usuario_id}
                  className={`px-4 py-3 transition-colors duration-700 ${reciente ? 'bg-iados-primary/15' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-white font-medium">{u.nombre}</span>
                      <span className="ml-2 text-xs text-slate-500">{u.rol}</span>
                      {u.sesiones.length > 1 && (
                        <span className="ml-2 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">
                          {u.sesiones.length} pestanas
                        </span>
                      )}
                    </div>
                  </div>

                  {u.sesiones.map(s => (
                    <div key={s.socket_id} className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 bg-iados-primary/20 text-iados-primary px-2 py-0.5 rounded-full font-medium">
                        {etiquetaDeRuta(s.pantalla_actual)}
                      </span>
                      <span className="text-slate-500">{hace(s.pantalla_desde, ahora)}</span>
                      <span className="text-slate-500 flex items-center gap-1">
                        {s.dispositivo.movil ? <Smartphone size={11} /> : <MonitorSmartphone size={11} />}
                        {s.dispositivo.navegador} / {s.dispositivo.sistema}
                      </span>
                      {s.rastro.length > 1 && (
                        <span className="text-slate-600">
                          {s.rastro.map(r => etiquetaDeRuta(r)).join(' → ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**El monitor NO filtra por `viewAs`.** Aunque el superadmin esté "viendo como" una
tienda concreta, esta pantalla sigue mostrando todas: su razón de ser es la vista
cruzada. No agregues un filtro por la tienda en contexto — vaciaría la pantalla de
su propósito y dejaría el total del encabezado inconsistente con lo listado.

- [ ] **Step 2: Registrar la ruta**

En `frontend/src/App.tsx`, añade el lazy import junto a los demás:

```ts
const MonitorPage = lazy(() => import('./pages/superadmin/MonitorPage'));
```

y dentro del bloque de rutas privadas (junto a `admin/tenants`), la ruta:

```tsx
          <Route path="superadmin/monitor" element={
            <PrivateRoute roles={['superadmin']}><MonitorPage /></PrivateRoute>
          } />
```

- [ ] **Step 3: Compilar**

Run: `cd frontend && npm run build`
Expected: sin errores de tipos.

- [ ] **Step 4: Prueba manual con dos navegadores**

Con el backend levantado:
1. Navegador A: entra como superadmin y abre **Monitor**.
2. Navegador B (o ventana privada): entra como cajero de alguna tienda.
3. En B, navega POS → Caja → Pedidos.

Expected en A:
- El usuario de B aparece bajo el nombre de su tienda.
- La pantalla cambia en vivo y la fila se resalta un instante en cada cambio.
- El rastro crece: `POS → Caja → Pedidos`.
- El navegador y el sistema son los correctos.
- **No aparece ninguna IP.**
- Al cerrar la pestaña de B, su usuario desaparece del monitor.
- El superadmin se ve a sí mismo, en la pantalla "Monitor".

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/superadmin/MonitorPage.tsx frontend/src/App.tsx
git commit -m "feat(monitor): pantalla de usuarios en linea para superadmin"
```

---

## Task 7: Artefactos de deploy

**Files:**
- Modify: `backend/dist/` (regenerado)
- Modify: `frontend/dist-prod/`, `frontend/dist-vps/` (regenerados)
- Modify: `docker-compose.yml`

- [ ] **Step 1: Traer lo remoto antes de reconstruir**

Este repo recibe pushes desde otra máquina que también commitea artefactos. Si vas por detrás, reconstruir ahora produce un `dist` que pisa el trabajo ajeno.

```bash
git fetch origin
git status -sb | head -1
```

Si dice `behind`, descarta los `dist` (son regenerables), rebasea, y reconstruye después:

```bash
git checkout -- backend/dist frontend/dist-prod frontend/dist-vps
git pull --rebase --autostash origin main
```

- [ ] **Step 2: Reconstruir los tres artefactos**

```bash
cd backend && npm run build && cd ..
cd frontend && npm run build && npx vite build --outDir dist-vps && cd ..
```

Expected: los tres sin errores. `npm run build` del frontend genera **solo** `dist-prod`; `dist-vps` es el que consume el contenedor del VPS y exige el segundo comando.

- [ ] **Step 3: Subir los CACHE_BUST**

En `docker-compose.yml`, cambia el `CACHE_BUST` de **ambos** servicios — este cambio toca backend y frontend:

- línea ~8 (servicio `backend`): `CACHE_BUST: "20260820-monitor-usuarios-en-linea"`
- línea ~44 (servicio `frontend`): `CACHE_BUST: "20260820-monitor-usuarios-en-linea"`

Sin esto, Docker reutiliza la capa `COPY dist` cacheada y despliega el código viejo.

- [ ] **Step 4: Verificar que los artefactos traen el código nuevo**

```bash
grep -c "MonitorGateway" backend/dist/modules/monitor/monitor.gateway.js
ls frontend/dist-prod/assets/MonitorPage-*.js frontend/dist-vps/assets/MonitorPage-*.js
```

Expected: el `grep` devuelve al menos 1, y existe un chunk `MonitorPage-*.js` en **los dos** directorios.

- [ ] **Step 5: Correr las dos comprobaciones una última vez**

```bash
cd backend && npx ts-node scripts/check-monitor.ts && cd ..
cd frontend && npx esbuild scripts/check-rutas.ts --bundle --platform=node --format=cjs \
  --alias:lucide-react=scripts/lucide-stub.js --outfile=/tmp/check-rutas.cjs && node /tmp/check-rutas.cjs
```

Expected: `TODO OK` en ambas.

- [ ] **Step 6: Commit y push**

```bash
git add backend/dist frontend/dist-prod frontend/dist-vps docker-compose.yml
git commit -m "chore(monitor): rebuild de artefactos y bump de CACHE_BUST"
git push origin main
```

- [ ] **Step 7: Avisar del redeploy**

El redeploy lo hace Fabián en Portainer. Hay que decirle explícitamente que este cambio necesita **los dos** servicios: `pos-iados-api` (el gateway) y `pos-iados-web` (la pantalla). Con solo uno de los dos, el monitor no funciona.

---

## Verificación final

Antes de dar el trabajo por terminado, los cinco puntos del spec:

1. `npm run build` limpio en backend y frontend.
2. `check-monitor.ts` en verde (28 comprobaciones) y `check-rutas.ts` en verde (6).
3. Prueba con dos navegadores: el movimiento se ve en vivo y la desconexión limpia la fila.
4. Prueba offline explícita: con la red cortada, ni un error en consola ni un toast, y el POS sigue operando.
5. Confirmar que **no aparece ninguna IP** en la pantalla ni en el payload de los eventos (revisable en DevTools → Network → WS → Messages).
