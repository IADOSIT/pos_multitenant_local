# Cotizaciones: flujo independiente del pedido

**Fecha:** 2026-09-17
**Alcance:** `pos_multitenant_local` (esquema, backend POS, frontend POS) y `POS_MULTITENANT_STORE` (API pública, tienda Angular)

---

## 1. Problema

Hoy una cotización no es una entidad: es un valor del enum `estado` en `ecommerce_pedidos`
(`pendiente | cotizacion | por_cobrar | confirmado | preparando | enviado | entregado | cancelado`).
El "modo cotización" es un flag de tienda en `preferencias.cotizaciones.activo` que solo oculta
los precios (`POS_STORE_API/src/public/public.service.ts:134`).

De ahí salen tres fallas concretas:

1. **Vocabulario incongruente.** El objeto es un pedido desde que nace, así que la tienda le habla
   al cliente de compra: "TU PEDIDO", "Ahorras −$3.00", "Total", "Continuar compra"
   (`POS_STORE_APP/src/app/pages/carrito/carrito.component.ts:16,62,63,64`). El checkout sí adapta
   el copy (`checkout.component.ts:20`); el carrito no.
2. **Carrito mixto sin resolver.** Un producto con `precio` null o 0 pinta "Cotizar"
   (`money.util.ts:4`) aunque el modo cotización de la tienda esté apagado. El carrito sigue en
   modo compra y suma solo los renglones que sí tienen precio: un total que no corresponde a nada.
3. **No hay negociación.** El flujo actual es de una sola vía: el cliente solicita →
   `cotizarPedido()` (`backend/src/modules/ecommerce/ecommerce.service.ts:275`) fija precios, crea
   el pedido de mostrador y pasa a `por_cobrar`. El cliente nunca acepta ni rechaza, no hay
   re-cotización y no queda historial de versiones.

## 2. Decisiones tomadas

| Decisión | Elección |
|---|---|
| Convivencia con la venta directa | **Switch de tienda: o todo se vende, o todo se cotiza.** Nunca conviven. |
| Canal de respuesta del cliente | **Enlace con token HMAC en la tienda** (`/cotizacion/:numero?t=…`), sin cuenta. |
| Negociación | **Aceptar, o rechazar con motivo.** El rechazo no cierra: se re-cotiza y nace una versión nueva. |
| Al aceptar | **Nace el pedido de mostrador listo para cobrar**, con el flujo normal de caja. |

## 3. Modelo conceptual

|  | Cotización | Pedido |
|---|---|---|
| Qué es | Una oferta del negocio, con vigencia | Un compromiso del cliente |
| Nace con | Productos y cantidades, sin precios | Precios cerrados |
| Puede | Revisarse n veces (v1, v2, v3…) | Cobrarse, entregarse, cancelarse |
| Compromete stock | No | Sí |
| Termina en | Un pedido, o en nada | Una venta |

Folio propio: `COT-YY-NNNN`, consecutivo **por empresa** (mismo criterio que `EP-YY-NNNN`). El
cliente ve "Cotización COT-26-0001", nunca un folio de pedido.

## 4. Máquina de estados

```
                         ┌──────────────┐
  cliente manda carrito →│  SOLICITADA  │
                         └──────┬───────┘
                   tú cotizas   │  (crea versión v1)
                         ┌──────▼───────┐
              ┌─────────→│   ENVIADA    │──── vence sin respuesta ──→ VENCIDA
              │          └──┬────────┬──┘                               │
              │    acepta   │        │  rechaza + motivo                │
   re-cotizas │      ┌──────▼──┐  ┌──▼──────────┐                       │
      (v2,v3) └──────┤ ACEPTADA│  │  RECHAZADA  ├───────────────────────┘
                     └────┬────┘  └─────────────┘   (re-cotizar reabre)
                          │
                   nace el PEDIDO → caja → venta → ticket
```

Reglas:

- `solicitada` → `enviada`: solo con al menos un precio > 0 capturado.
- `enviada` → `aceptada` | `rechazada`: solo el cliente, con token válido y dentro de la vigencia.
- `enviada` → `vencida`: cron horario, cuando `vigencia_hasta < NOW()`.
- `rechazada` | `vencida` → `enviada`: re-cotizar crea la versión siguiente y reabre. **Mismo folio,
  mismo enlace.**
- `aceptada` es terminal para la cotización. A partir de ahí el estado lo lleva el pedido.
- `cerrada` (terminal, manual): el negocio la da por perdida o duplicada, con motivo.

## 5. Esquema de datos

Migración TypeORM nueva en `backend/src/database/migrations/`. No se altera `ecommerce_pedidos`
hasta el paso 8 del plan.

```sql
cotizaciones
  id                INT PK AUTO_INCREMENT
  empresa_id        INT NOT NULL
  tenant_id         INT NOT NULL
  cliente_id        INT NULL
  numero            VARCHAR(20) NOT NULL          -- COT-26-0001
  cliente_nombre    VARCHAR(255) NOT NULL
  cliente_email     VARCHAR(255) NOT NULL DEFAULT ''
  cliente_tel       VARCHAR(20) NULL
  cliente_empresa   VARCHAR(200) NULL
  direccion_envio   JSON NULL
  notas_cliente     TEXT NULL
  estado            ENUM('solicitada','enviada','aceptada','rechazada','vencida','cerrada')
                    NOT NULL DEFAULT 'solicitada'
  version_actual    INT NOT NULL DEFAULT 0        -- 0 = solicitada, sin cotizar
  pedido_id         INT NULL                      -- pedido de mostrador, al aceptar
  notas_internas    TEXT NULL
  motivo_cierre     TEXT NULL
  created_at, updated_at
  UNIQUE (empresa_id, numero)
  INDEX (empresa_id, estado), INDEX (created_at)

cotizacion_versiones
  id                INT PK AUTO_INCREMENT
  cotizacion_id     INT NOT NULL
  version           INT NOT NULL                  -- 1, 2, 3…
  items             JSON NOT NULL                 -- [{producto_id,nombre,sku,qty,precio_unitario,subtotal}]
  subtotal          DECIMAL(12,2) NOT NULL
  descuento         DECIMAL(12,2) NOT NULL DEFAULT 0
  total             DECIMAL(12,2) NOT NULL
  vigencia_hasta    DATE NOT NULL
  mensaje_cliente   TEXT NULL
  enviada_at        DATETIME NOT NULL
  respuesta         ENUM('aceptada','rechazada') NULL
  respuesta_motivo  TEXT NULL
  respondida_at     DATETIME NULL
  respondida_ip     VARCHAR(45) NULL
  UNIQUE (cotizacion_id, version)
```

Los `items` se guardan como snapshot (nombre y sku incluidos), igual que en `ecommerce_pedidos`:
la versión enviada debe seguir siendo legible aunque el producto cambie o se borre después.

`version_actual` es denormalización deliberada: evita un `MAX(version)` en cada listado del tablero.

## 6. Configuración por tienda

`ecommerce_config.preferencias.cotizaciones` (JSON existente) se extiende:

```json
{
  "activo": true,
  "texto_boton": "Solicitar cotización",
  "mensaje": "Te enviaremos tu cotización por correo.",
  "vigencia_dias": 15,
  "mensaje_default": "Gracias por tu interés. Adjunto nuestra propuesta.",
  "avisar_email": true
}
```

`vigencia_dias` default 15 si falta. Sin columnas nuevas en `ecommerce_config`.

## 7. API

### 7.1 Pública (`POS_STORE_API`, `public.controller.ts`)

Token HMAC con el mismo mecanismo de `tokenConfirmacion()` (`public.service.ts:24`), derivado de
`empresa_id + numero`.

```
POST   /public/tienda/:sub/cotizaciones
       body: { cliente_nombre, cliente_email, cliente_tel, cliente_empresa,
               direccion_envio, notas_cliente, items: [{producto_id, qty}] }
       → { numero, estado: 'solicitada', token }
       Rechaza con 400 si la tienda no está en modo cotización.

GET    /public/tienda/:sub/cotizaciones/:numero?t=…
       → { numero, estado, version_actual, actual: {…}, historial: [{version, total,
           respuesta, respuesta_motivo, respondida_at}], pedido: {numero} | null }

POST   /public/tienda/:sub/cotizaciones/:numero/aceptar?t=…
       → { estado: 'aceptada', pedido_numero }
       400 si no está 'enviada', o si la versión actual ya venció.

POST   /public/tienda/:sub/cotizaciones/:numero/rechazar?t=…
       body: { motivo }            -- obligatorio, no vacío
       → { estado: 'rechazada' }
```

Aceptar y rechazar son **idempotentes por versión**: si `respuesta` de la versión actual ya está
puesta, responden el estado actual sin volver a aplicar el efecto (no crean un segundo pedido).

### 7.2 POS (`pos_multitenant_local`, módulo `cotizaciones` nuevo)

```
GET    /cotizaciones?estado=&q=&desde=&hasta=
GET    /cotizaciones/:id                       -- con todas sus versiones
POST   /cotizaciones/:id/cotizar
       body: { items: [{producto_id, precio_unitario}], descuento, vigencia_dias,
               mensaje_cliente, tienda_id }
       → crea la versión siguiente, estado 'enviada', dispara el correo
POST   /cotizaciones/:id/cerrar     body: { motivo }
PATCH  /cotizaciones/:id/notas      body: { notas_internas }
```

`/cotizar` es el mismo verbo para la v1 y para la re-cotización: si ya hay versiones, crea la
siguiente e incrementa `version_actual`. Validaciones: al menos un precio > 0, ningún precio
negativo, estado en `('solicitada','rechazada','vencida')`.

### 7.3 El cambio de fondo

La creación del pedido de mostrador se **mueve** de `cotizarPedido()` (hoy ocurre cuando el negocio
fija precios) al endpoint público de **aceptar**. La lógica en sí se conserva tal cual: se reusa
`pedidosService.crear()` con `estado: PedidoEstado.LISTO_PARA_ENTREGA`, exactamente como en
`ecommerce.service.ts:307-332`.

Lo único que cambia es el vínculo. `pedido.entity.ts` gana una columna `cotizacion_id` (nullable)
**junto a** la ya existente `ecommerce_pedido_id`, que se conserva sin tocar para los pedidos web
que no vienen de cotización. Un pedido lleva una u otra, nunca las dos.

Con eso, `pedidos.service.ts:272` (el cierre automático de la cotización web al cobrar en caja)
gana su rama gemela: si el pedido trae `cotizacion_id`, al cobrarse **no** se cambia el estado de la
cotización — ya es `aceptada`, que es terminal. Solo se registra el cobro para que el enlace del
cliente muestre "Pedido pagado". La rama vieja de `ecommerce_pedido_id` sigue igual.

## 8. Interfaz

### 8.1 Tienda en modo cotización

El switch cambia el vocabulario completo, no un botón:

| Hoy | En modo cotización |
|---|---|
| "TU PEDIDO / Carrito" | "TU SOLICITUD / Lo que quieres cotizar" |
| Subtotal · Ahorras · Total | *(nada: no hay números todavía)* |
| "Continuar compra" | "Solicitar cotización" |
| Barra de envío gratis | *(oculta)* |
| "Seguir comprando" | "Seguir explorando" |
| "Mis pedidos" | "Mis cotizaciones" |
| "Pedir por WhatsApp" | "Preguntar por WhatsApp" |
| Ícono de carrito en navbar | Ícono de lista/documento, mismo contador |

En `carrito.component.ts` el bloque de resumen (líneas 51-63) se sustituye por uno que cuenta
productos y explica qué sigue; desaparecen el precio unitario y el de línea; permanece la cantidad.

### 8.2 Pantalla nueva `/cotizacion/:numero`

`POS_STORE_APP/src/app/pages/cotizacion/cotizacion.component.ts`, ruta nueva en `app.routes.ts`.

- Encabezado: folio, estado con color, y vigencia ("Válida hasta el 2 de octubre" / "Venció el…").
- Mensaje del negocio, tabla de renglones con precio unitario e importe, descuento y total.
- Estado `enviada` y vigente: **Aceptar cotización** (con confirmación: "al aceptar generamos tu
  pedido") y **No me sirve** (abre campo de motivo, obligatorio).
- Estado `rechazada`: aviso de "estamos revisando tu comentario" y el motivo enviado.
- Estado `aceptada`: folio del pedido y enlace a `/pedido/:numero`.
- Estado `vencida`: aviso y botón de contacto; sin acciones.
- Al pie, **historial plegable**: "Versión 1 — $4,200 — rechazada el 12 sep: *muy caro*".

El folio y su token se guardan en `localStorage` con el mismo patrón de `PedidosLocalStore`
(`pedidos/pedidos-local.store.ts`), en una clave `cotizaciones:<subdominio>`, para alimentar
"Mis cotizaciones".

### 8.3 Producto sin precio en tienda de venta

Con el switch de tienda, un producto con `precio` 0 o null en una tienda **en modo venta** queda
huérfano: hoy pinta "Cotizar" sin flujo detrás (la causa raíz del carrito mixto). Regla: **no es
agregable al carrito**; la ficha muestra "Consultar disponibilidad" y enlaza a Contacto.
`esCotizable()` (`money.util.ts:4`) se conserva, pero los `product-card-*.component.ts` dejan de
llamar `add()` en ese caso.

### 8.4 POS

Sección **Cotizaciones** propia (`frontend/src/pages/cotizaciones/`), separada de Pedidos, con
tablero por estado: *Por cotizar* · *Enviadas* (con días restantes) · *Rechazadas* (con el motivo,
listas para re-cotizar) · *Vencidas* · *Aceptadas*.

El modal de cotizar precarga los precios de la versión anterior cuando es re-cotización, para que
solo se ajuste lo que cambia.

`cotizacion` y `por_cobrar` salen de `pedidosUnificados.ts` (líneas 18, 58, 78-80, 98-99): Pedidos
vuelve a ser solo pedidos.

## 9. Notificaciones

- **Al cliente** (`notify.service.ts`, mismo patrón que `enviarConfirmacion`): "Tu cotización
  COT-26-0001 está lista" con enlace tokenizado. En re-cotización: "Nueva versión de tu cotización".
- **Al negocio**: correo y notificación en el POS (módulo `notificaciones` existente) cuando el
  cliente acepta o rechaza, y cuando entra una solicitud nueva.
- **Cron de vencidas**: se suma a `jobs/cancel.service.ts` (ya corre cada hora) un `UPDATE` que pasa
  a `vencida` las `enviada` cuya versión actual expiró.

Los correos son best-effort y no bloquean la respuesta (`void this.notify…`), igual que hoy.

## 10. Migración de datos existentes

En la misma migración que crea las tablas:

- `ecommerce_pedidos` con `estado='cotizacion'` (solicitudes sin cotizar) → fila en `cotizaciones`
  con estado `solicitada`, `version_actual = 0`, sin versiones.
- `ecommerce_pedidos` con `estado='por_cobrar'` (ya cotizadas, con `pedido_id`) → fila en
  `cotizaciones` con estado `aceptada`, una v1 reconstruida de sus `items` (`vigencia_hasta` =
  `updated_at`, `respuesta='aceptada'`, `respondida_at = updated_at`) y el `pedido_id` intacto.
  Ningún pedido en caja se pierde.
- El folio nuevo se asigna por consecutivo de empresa respetando el orden de `created_at`.
- Los dos valores salen del enum de `ecommerce_pedidos` **al final** del plan, no al principio, para
  que la versión desplegada siga leyendo datos viejos mientras dura la transición.

## 11. Pruebas

Unitarias (Vitest en la tienda, Jest en el POS):

- Transiciones válidas e inválidas de la máquina de estados, incluida la reapertura desde
  `rechazada` y `vencida`.
- Numeración `COT-YY-NNNN` por empresa, con el reintento ante duplicado que ya usa
  `siguienteNumeroPedido()`.
- Token HMAC: válido, inválido, de otra empresa.
- Aceptar dos veces la misma versión → un solo pedido (idempotencia).
- Aceptar una versión vencida → 400.
- Rechazar sin motivo → 400.
- `carrito.component` en modo cotización: no renderiza total, subtotal ni ahorro.
- Migración: un `por_cobrar` con pedido ligado conserva su `pedido_id` y queda en `aceptada`.

Manual, de punta a punta: solicitar → cotizar → rechazar con motivo → re-cotizar v2 → aceptar →
cobrar en caja → ver la cotización cerrada con su historial.

## 12. Orden de construcción

1. Tablas y migración de datos, con los estados viejos todavía operando en paralelo.
2. Backend de cotizaciones en el POS: listar, cotizar/re-cotizar, cerrar.
3. API pública y pantalla `/cotizacion/:numero`: aceptar, rechazar, historial.
4. Aceptar → pedido: mover ahí la creación del pedido de mostrador.
5. Modo cotización en la tienda: carrito, navbar, checkout, "Mis cotizaciones", y el producto sin
   precio en tiendas de venta.
6. Sección Cotizaciones en el POS.
7. Correos, notificaciones y cron de vencidas.
8. Retiro de `cotizacion` y `por_cobrar` del enum de `ecommerce_pedidos` y de
   `pedidosUnificados.ts`.

Del 1 al 4 el sistema opera igual de cara al usuario. Del 5 en adelante cambia lo que ve el cliente.

## 13. Fuera de alcance

- Cuentas de cliente con login (el enlace tokenizado las sustituye).
- Aceptación parcial por renglón.
- PDF de la cotización.
- Chat o hilo de mensajes: la negociación se registra como versiones y motivos, no como conversación.
- Anticipos o pagos en línea sobre la cotización.
