# Monitor de usuarios en línea

**Fecha:** 2026-08-20
**Estado:** aprobado, pendiente de plan de implementación

## Problema

No hay forma de saber quién está usando el POS en este momento. El superadmin
no puede responder preguntas básicas de operación: cuántos usuarios hay activos,
en qué tienda, y qué están haciendo.

## Qué se construye

Una pantalla nueva, **Monitor**, visible solo para el superadmin, que muestra en
tiempo real quién está conectado al POS, agrupado por tienda, con la pantalla en
la que está cada usuario y cómo se mueve entre pantallas.

## Decisiones tomadas

Cuatro decisiones acotan el alcance. Están aquí porque cambiarlas cambia el diseño.

| Decisión | Elegido | Descartado |
|---|---|---|
| Alcance del despliegue | Solo usuarios de la nube (`pos.iados.online`) | Incluir instalaciones on-premise |
| Persistencia | Solo en vivo, en memoria | Historial en BD para auditoría |
| Granularidad de "pantalla" | Ruta, enganchada al router | Ruta + pestañas internas |
| Transporte | Gateway Socket.io dedicado | SSE + REST, o polling REST |

**Por qué solo la nube.** El POS es de despliegue dual: la nube y las
instalaciones on-premise en la PC del cliente, cada una con su propio backend.
Incluir on-premise obligaría a que cada instalación reporte hacia el VPS, con
token por instalación, salida a internet y manejo de caída — en un producto que
está pensado justamente para operar aislado. Queda fuera de alcance.

**Por qué en memoria.** El requisito explícito fue no sacrificar el performance.
Persistir cada cambio de pantalla es un INSERT por navegación por usuario, más una
tabla que crece y hay que purgar. La contrapartida aceptada: al reiniciar el
backend la información se pierde y se repuebla sola conforme los clientes
reconectan.

**Por qué un gateway propio.** Es el patrón que el repo ya usa dos veces
(`BiometricoGateway`, `BasculaGateway`), es el único de los tres transportes que es
realmente bidireccional en tiempo real, y es el más barato por navegación.

## Lo que NO se guarda

**La IP no se captura.** Ni se muestra ni se almacena en memoria. Se decidió
sacarla del alcance; el gateway no debe leerla del handshake.

Tampoco se persiste nada: este módulo no define entidades, no crea tablas y no
escribe en MySQL. `synchronize` no tiene nada que reconciliar al arrancar.

## Arquitectura

```
Navegador (usuario del POS)                    Navegador (superadmin)
  MainLayout                                     MonitorPage
    usePresencia()  ──┐                            │
                      │ socket /presencia          │ socket /presencia
                      │ emit 'pantalla'            │ emit 'monitor-join'
                      ▼                            ▼
              ┌───────────────────────────────────────────┐
              │  MonitorGateway  (namespace /presencia)   │
              │    verifica JWT en el handshake           │
              │    Map<socketId, Sesion>   ← en RAM       │
              │    room 'monitor'  ← solo superadmins     │
              └───────────────────────────────────────────┘
                             │
                   ¿hay alguien en 'monitor'?
                     no → no emite nada
                     si → emite solo el delta
```

### Backend — `backend/src/modules/monitor/`

Archivos: `monitor.module.ts`, `monitor.gateway.ts`, `monitor.service.ts`,
`user-agent.util.ts`.

El **service** es dueño del `Map` y de la lógica pura (alta, baja, cambio de
pantalla, agrupar por tienda y por usuario). El **gateway** solo traduce entre
socket y service. Esa separación existe para que la lógica sea verificable sin
levantar un socket.

**Autenticación.** El cliente manda el JWT en `handshake.auth.token`. El gateway
lo verifica con `JwtService`, que `AuthModule` ya exporta. Un handshake sin token
válido se desconecta.

Esto es deliberadamente más estricto que los gateways existentes, que confían en
un token de tienda: aquí se maneja identidad de personas.

**Origen de cada dato.** El cliente solo aporta lo que el servidor no puede saber:

| Dato | Origen | Falsificable por el cliente |
|---|---|---|
| `usuario_id`, `nombre`, `rol` | JWT verificado | No |
| `tenant_id`, `empresa_id`, `tienda_id` | JWT verificado | No |
| navegador, sistema operativo, móvil/escritorio | header `user-agent` | Sí, pero es informativo |
| ruta actual | mensaje del cliente | Sí, pero es informativo |

**Forma de una sesión en memoria:**

```ts
interface SesionPresencia {
  socket_id: string;
  usuario_id: number;
  nombre: string;
  rol: string;
  tenant_id: number;
  empresa_id: number;
  tienda_id: number | null;
  dispositivo: { navegador: string; sistema: string; movil: boolean };
  pantalla_actual: string;      // ruta cruda, p.ej. '/admin/configuracion'
  pantalla_desde: number;       // timestamp
  conectado_desde: number;
  rastro: string[];             // ultimas 5 rutas, la mas reciente al final
}
```

Un usuario con tres pestañas son tres sesiones. Se agrupan por `usuario_id` al
construir la vista, para que el conteo de "usuarios en línea" no se infle.

**Eventos.**

| Evento | Dirección | Carga |
|---|---|---|
| `pantalla` | cliente → servidor | `{ ruta: string }` |
| `monitor-join` | superadmin → servidor | — |
| `presencia:snapshot` | servidor → monitor | todas las sesiones |
| `presencia:alta` | servidor → monitor | la sesión nueva |
| `presencia:baja` | servidor → monitor | `{ socket_id }` |
| `presencia:pantalla` | servidor → monitor | `{ socket_id, ruta, desde }` |

**Difusión condicionada.** Al procesar cualquier cambio, el Map se actualiza
siempre; la emisión solo ocurre si la room `monitor` tiene al menos un socket.
Cuando nadie está mirando — lo normal — el costo de difusión es cero.

**Limpieza.** `handleDisconnect` borra la sesión del Map. Socket.io ya trae su
propio ping/pong, así que una desconexión sucia se detecta sola en ~25 segundos;
no se implementa heartbeat de aplicación.

**Parser de user-agent.** Función pura de ~25 líneas en `user-agent.util.ts`, sin
dependencia nueva: devuelve navegador, sistema y si es móvil. Para un monitor,
"Chrome / Windows" es suficiente. Si en el futuro hiciera falta más exactitud, el
reemplazo por `ua-parser-js` queda aislado en ese archivo.

### Frontend — cliente

Archivos: `frontend/src/api/presencia.ts` (el socket, mismo patrón que
`api/socket.ts`) y `frontend/src/hooks/usePresencia.ts`.

El hook se monta **una sola vez**, en `MainLayout`, que ya vive dentro de
`PrivateRoute` — así solo corre para usuarios autenticados. Detecta la ruta con
`useLocation()`.

**Nombres legibles.** `MainLayout` ya tiene `navItems` con `to` y `label`. Ese
mapeo se extrae a un módulo compartido y se reutiliza, en vez de mantener un
segundo diccionario que se desincronice. Las rutas fuera del menú caen a la ruta
cruda.

**Coalescing de 400 ms.** Tres navegaciones en un segundo producen un solo mensaje
con la última ruta.

### Frontend — comportamiento offline

Requisito explícito: los usuarios que trabajan offline no deben generar errores.

```
navigator.onLine === false  →  no se crea el socket
evento 'offline'            →  desconectar a proposito
evento 'online'             →  reconectar
connect_error               →  silencio: sin toast, sin console.error
isExterno === false         →  el modulo queda apagado de raiz
```

`isExterno` se deriva de `VITE_API_URL` y ya existe en `MainLayout`. En una
instalación on-premise vale `false`, así que ahí el módulo ni siquiera intenta
conectar — consistente con la decisión de alcance.

Cuatro reglas que garantizan que esto no pueda romper el POS:

1. Todo emit va envuelto: si el socket no existe o está caído, no hace nada y no lanza.
2. Nada de la app espera al socket. No hay `await` ni estado de carga atado a él.
3. El módulo es opcional: si falla al cargar o conectar, la app funciona idéntica.
4. Una venta offline nunca se entera de que este módulo existe.

### Frontend — pantalla del monitor

`frontend/src/pages/superadmin/MonitorPage.tsx`, ruta `/superadmin/monitor`,
entrada en `navItems` con `roles: ['superadmin']`.

```
Monitor                        ● En vivo    14 usuarios · 17 sesiones · 5 tiendas

┌─ Albercas JM · Matriz ──────────────────────────────── 3 en linea ─┐
│ Fabian Ramirez    admin     [Punto de venta]      4m   Chrome/Win   │
│                                       /caja → /pedidos → /pos       │
│                                       2 pestanas                    │
│                                                                     │
│ Ana Torres        mesero    [Pedidos]  ← acaba de cambiar           │
│                                       /pos → /pedidos               │
│                                       Safari/iPhone                 │
└─────────────────────────────────────────────────────────────────────┘
```

- Agrupado por tienda, con el contador de usuarios en línea por tienda.
- Cada usuario: pantalla actual, tiempo en ella, rastro reciente, dispositivo.
- Un cambio de pantalla resalta la fila un instante y el resaltado se apaga solo.
- Varias pestañas del mismo usuario se agrupan en una fila que lista sus pantallas.
- `● En vivo` refleja el socket del propio monitor: si se cae, lo dice, para no
  leer datos viejos creyéndolos vivos.
- Los "hace 4m" se recalculan con un timer de 1 s local a la página, que muere al
  desmontarla. No genera tráfico.

### Dos casos que hay que decidir explícitamente

**Sesiones sin tienda.** Un superadmin, o un admin que aún no eligió tienda en el
selector "ver como", tiene `tienda_id === null`. Esas sesiones se agrupan en un
bloque **"Sin tienda asignada"** al final del listado. No se ocultan: son usuarios
en línea igual, y omitirlos haría que el total de arriba no cuadrara con la suma
de los bloques.

**El superadmin se ve a sí mismo.** Cualquier usuario autenticado genera sesión,
incluido quien está mirando el monitor, y "Monitor" es una pantalla como cualquier
otra. Es lo correcto: si se excluyera, el total dejaría de ser "todos los
conectados" y habría que explicar la excepción.

## Presupuesto de performance

| Acción | Costo |
|---|---|
| Usuario cambia de pantalla | 1 mensaje de ~100 B + 1 escritura en RAM |
| Consultas SQL por navegación | 0 |
| Difusión con el monitor cerrado | 0 |
| Difusión con el monitor abierto | 1 delta a la room, solo a superadmins |
| Timers periódicos en el cliente del POS | ninguno |
| Sockets por usuario | 1 por pestaña |

## Verificación

El repo no tiene test runner en ningún subproyecto. La verificación es:

1. `npm run build` en backend y frontend (tsc estricto atrapa errores de tipos).
2. Pruebas de la lógica pura del `MonitorService` y del parser de user-agent
   mediante un script desechable con esbuild — el mismo método usado para los
   normalizadores de pedidos. Es donde estarían los errores reales:
   agrupación por usuario, conteo por tienda, recorte del rastro a 5, alta y baja.
3. Prueba manual con dos navegadores: navegar en uno y confirmar que el monitor
   refleja el cambio; cerrar la pestaña y confirmar que desaparece.
4. Prueba explícita del caso offline: cortar la red con el POS abierto y confirmar
   que no aparece ningún error en consola ni ningún toast, y que el POS sigue
   operando.

## Fuera de alcance

- Instalaciones on-premise.
- Historial o auditoría de navegación.
- Pestañas internas dentro de una pantalla.
- IP del usuario.
- Acciones sobre las sesiones (cerrar sesión de alguien a distancia, mensajería).
- Que admins o managers vean el monitor: es exclusivo del superadmin.
