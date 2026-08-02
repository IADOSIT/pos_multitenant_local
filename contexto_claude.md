# CONTEXTO_CLAUDE — POS-iaDoS (iaDoS)

**Última actualización:** 2026-08-02 (Sesión 2 — diagnóstico ecommerce/subdominios, sin cambios de código)
**HEAD actual:** `0b95c0c` (rama `main`, working tree limpio, ya pusheado a `origin/main`)
**Tag de checkpoint:** ninguno.
**Este archivo es la fuente única de verdad de la sesión para Claude Code / Claude web.** Léelo completo antes de tocar cualquier parte del sistema. El archivo `CLAUDE.md` (mismo repo) complementa esto con la arquitectura estable de referencia — este archivo es más narrativo/histórico, `CLAUDE.md` es la ficha técnica.

---

## 0. Qué es este proyecto

**POS-iaDoS** — SaaS de punto de venta multitenant de iaDoS (iados.mx). Jerarquía **Tenant → Empresa → Tienda**, licenciado por cliente. Producto activo en producción (251+ commits desde marzo 2026), NO en fase de pruebas.

| Campo | Valor |
|---|---|
| **URLs producción** | `pos.iados.online` (admin/POS), `posapi.iados.online` (API), `tienda.iados.online` (shop) |
| **Repo** | `https://github.com/IADOSIT/pos_multitenant_local.git` |
| **Local** | `C:\sites\pos_multitenant_local` |
| **Stack** | NestJS 10 + TypeORM + MySQL 8 (backend) · React 18 + Vite (frontend admin/POS) · Next.js 14 (shop) |
| **Deploy** | Docker + Portainer en VPS compartido (sin CI/CD automático) |
| **Credenciales demo** (seed original, no confirmado si siguen vigentes en prod) | `admin@iados.mx` / `admin123` (superadmin, PIN `0000`) |

---

## 1. REGLAS CRÍTICAS — no omitir nunca

1. **Claude Code solo compila local y hace `git push`. Nunca toca el VPS, nunca corre Docker (ni local ni remoto), nunca hace `docker exec`/`docker restart`.** El usuario hace **Pull & Redeploy en Portainer** siempre — él, nunca Claude.
2. **El VPS aloja otras apps y bases de datos del mismo usuario** (VALIDA_CFDI_APP, BELATZ_RH, FITCONTROLGYM, etc.). `docker-compose.yml` de este repo conecta a `web_network` (marcada `external: true`, red compartida) y a un contenedor `mysql_local` que **ya existe fuera de este stack**. Nunca agregar un servicio de base de datos a este compose, nunca quitar `external: true`.
3. **Compilar local antes de cada push, siempre:**
   - `backend/`: `npm run build` → `backend/dist/`
   - `frontend/`: `npm run build` genera **`dist-prod/`** (modo instalador on-premise) — **NO** genera `dist-vps/` (lo que usa el contenedor Docker del VPS). Hay que correr aparte `npx vite build --outDir dist-vps --emptyOutDir` antes de comitear, o el VPS se queda con un build viejo.
   - `shop/`: `npm run build` → `.next/standalone/` + `.next/static/`
   - Bump el `CACHE_BUST` en `docker-compose.yml` (backend y/o frontend, el que haya cambiado) en cada push — invalida la capa de Docker que copia `dist`/`dist-vps`.
4. **`synchronize: true` en TypeORM** — el schema se auto-migra al arrancar el backend, no hay migraciones manuales. Pero: nunca combinar `@Column({unique:true})` **y** `@Index([...], {unique:true})` sobre la misma columna (puede tumbar el arranque del backend completo).
5. Identidad git local de este repo: `Axel Muniz` / `axel.muniz@live.com` (configurada, no global).
6. Comunicación siempre en español.

---

## 2. Arquitectura (resumen — ver `CLAUDE.md` para el detalle completo)

- **Backend**: 28 módulos en `backend/src/modules/`. Multi-tenant real vía `TenantScopeMiddleware` + `@TenantScope()` + `@Roles()`/`RolesGuard`. `LicenciaGuard` global bloquea tenants con licencia vencida (solo lectura).
- **Bridges de hardware local (patrón repetido, reusar para cualquier integración futura)**: `reader-bridge/` (lector de huella) y `bascula-bridge/` (báscula + impresora de etiquetas) son apps Electron que corren en la PC de Windows con el hardware conectado, y se conectan como **cliente** Socket.io hacia un namespace dedicado del backend (`/biometrico`, `/bascula`) — nunca al revés, así funciona detrás de NAT sin abrir puertos. El gateway de NestJS autentica al bridge con un token por empresa/tienda y lo mete a una room; la pantalla del navegador que necesita los datos en vivo (pantalla live, o el kiosko) se une a esa misma room. Impresión funciona igual pero al revés (el backend emite, el bridge imprime).
- **`ConfiguracionPage.tsx` tiene DOS capas de navegación que no hay que confundir** (error real cometido esta sesión, ver más abajo): una barra de tabs de primer nivel (`configTab`: Tienda/Tickets/Módulos/Tienda en Línea/Mantenimiento/Licencias/Conf. Especial), y DENTRO del tab "Tienda" únicamente, un acordeón separado (`expandedSection`/`SectionHeader`) para configuración específica de una tienda seleccionada (Menu Digital, Báscula, Impresora, etc.). Antes de agregar un panel nuevo: ¿es config de una tienda específica, o global? Eso decide en cuál capa va.

---

## 3. Historial de sesiones

### Sesión 1 (2026-07-25 → 2026-07-27) — WhatsApp Fase 2, fix Menu Digital QR, módulo Báscula completo

Sesión larga, trabajo directo (sin agentes en paralelo). Empezó clonando el repo por primera vez a esta máquina.

**WhatsApp Fase 2 para logística + notificación de estatus en self-order (`19911c5`):**
- `logistica.service.ts` tenía un TODO literal desde Fase 1 (`notif_whatsapp_enabled` guardaba el log pero nunca enviaba nada). Implementado envío real vía **Twilio** (`common/utils/whatsapp.util.ts`), credenciales por empresa en `ConfigLogistica` (`notif_whatsapp_account_sid/token/numero`) — decisión del usuario: Twilio, sin cuenta global de respaldo (solo por empresa).
- Reusado para el flujo self-order (QR de mesa): al confirmar/marcar listo/cobrar/rechazar un pedido, si el cliente dejó teléfono, se le manda WhatsApp como respaldo del polling en pantalla (que se rompe si el cliente bloquea el celular).
- **Pendiente del usuario:** cada empresa que quiera esto debe capturar su propia cuenta Twilio en Configuración → Logística y activar el toggle.

**Fix: cliente de Menu Digital QR nunca recibía confirmación (`6e745dc`):**
- Causa raíz real: el flujo "Menú Digital" (`modo_menu: 'pedidos'`) era un callejón sin salida — `createOrder` guardaba el pedido pero nunca notificaba al personal, y **no existía ninguna pantalla admin** para verlos/gestionarlos (`ConfiguracionPage.tsx` solo usaba `menuDigitalApi` para config/publish).
- Se agregó: token por pedido para polling público de estatus, notificación en tiempo real al crear, y un panel nuevo "Pedidos pendientes" (Confirmar/Rechazar) en Configuración → Menú Digital QR.
- **Hallazgo de seguridad corregido de paso:** `getPendingOrders`/`updateOrderStatus` confiaban en un `x-api-key` que el frontend nunca enviaba, o en un `tienda_id` del body sin validar — cualquier JWT válido de cualquier tenant podía potencialmente tocar pedidos de otra tienda. Ahora usan `@TenantScope()` contra el `tenant_id` real.

**Módulo Báscula de autoservicio, iteración 1 (`ca901ac`, `6f8bc03`) — luego corregida (`ffec36f`, `69882d2`):**

El usuario pidió replicar el autoservicio de báscula de HEB (frutas/verduras: pesar, etiquetar, cobrar en caja). Se investigó el estándar real de la industria antes de construir (ver `~/.claude/plans/humble-beaming-book.md`, plan aprobado): **EAN-13 de peso variable** (GS1, prefijo interno "2") en vez del QR que el usuario sugirió originalmente — compatible con cualquier lector de barras ya existente en caja. Hardware recomendado: báscula con salida serial RS-232 (Torrey) + impresora de etiquetas **ZPL en red** (Zebra, puerto 9100 TCP crudo — evita drivers de Windows). Se le dio al usuario un listado completo de equipo (báscula, adaptador USB-serial, impresora, rollos de etiqueta, mini-PC, monitor táctil, red).

Construido: módulo backend `bascula` (`ConfigBascula`, `PesajeLog`, `BasculaGateway` namespace `/bascula`), utilidad `ean13.util.ts` (encode/decode con dígito verificador real), app `bascula-bridge/` (Electron, `serialport` para leer peso + TCP crudo para imprimir ZPL), pantalla pública `BasculaKioskoPage.tsx` (popup, `window.open`).

**Primer diseño (incorrecto, corregido después):** se metió un "modo autocobro" DENTRO del kiosko (pantalla de pago propia, un endpoint `POST /bascula/cobrar` que creaba una venta de un solo producto). El usuario corrigió: el autocobro real es un **cajero en el POS normal** cobrando un carrito mixto (productos normales + por kg), no una pantalla de pago aislada. Se revirtió por completo (`ffec36f`):
- `ConfigBascula` quedó con **dos toggles independientes**: `activo` (kiosko de autoservicio) y `usar_en_pos` (integración en POS).
- Kiosko = solo pesar + imprimir etiqueta (sin pago). Se le agregó además un **buscador con teclado en pantalla** (QWERTY táctil, sin dependencias externas) porque con catálogos grandes es difícil encontrar el producto a simple vista.
- POS (`POSPage.tsx`) = el autocobro real: si `usar_en_pos` está activo y el producto tiene `unidad==='kg'`, al hacer click se abre un modal de pesaje conectado en vivo al socket `/bascula` (con fallback manual si no hay báscula conectada); al confirmar se agrega al carrito con el precio calculado reusando `addToCart`+`updateItemPrice`+`updateItemNotes` (el mismo mecanismo que ya se usa para decodificar el escaneo de una etiqueta en caja). El cobro sigue el flujo 100% normal de POS (`PayModal`) — no hay endpoint de venta dedicado a báscula.

**Reordenamiento de Configuración (`69882d2`):** por pedido del usuario, "Mantenimiento" y "Licencias" dejaron de ser íconos del menú lateral (`MainLayout.tsx`) para reducirlo. **Error cometido y corregido en el mismo hilo:** el primer intento los puso como acordeón (`SectionHeader`/`expandedSection`) DENTRO del tab "Tienda" — mezclados con config específica de una tienda. El usuario lo señaló en mayúsculas; corregido para que sean tabs de primer nivel propios (`configTab === 'mantenimiento'|'licencias'`), al mismo nivel que Tienda/Tickets/Módulos. Licencias sigue restringido a superadmin.

---

### Sesión 2 (2026-08-02) — Diagnóstico: "las opciones de ecommerce de las tiendas no funcionan"

Sesión sin cambios de código — investigación pura, a petición del usuario ("ya lo habíamos revisado esto" — no se encontró registro de esa revisión previa ni en memoria ni en este archivo, así que se repitió desde cero).

**Auditoría de código (todo verificado correcto, no es la causa):**
- Panel admin `TiendaEnLineaPage.tsx` (tab "🛒 Tienda en Línea") — endpoints frontend↔backend (`ecommerceApi` en `endpoints.ts` vs `ecommerce.controller.ts`) coinciden exactamente, sin mismatch de rutas.
- `ecommerce.service.ts` — lógica de `getPublicInfo`/`getPublicProductos`/`getConfigBySubdominio` correcta (exige `activo:true`, 404 si no).
- `shop/next.config.mjs` tiene un `rewrites()` que reenvía `/api/*` al contenedor backend (`BACKEND_URL`, interno Docker) — esto cubre incluso el caso de que `NEXT_PUBLIC_API_URL` no quedara bien "horneado" en el build del cliente.
- **Nota de diseño (no bug, pero puede confundir):** `EcommerceConfig` tiene `@Index(['empresa_id'], {unique:true})` — el ecommerce es **por EMPRESA, no por tienda física**. Una empresa con varias tiendas solo puede tener UNA tienda en línea/subdominio. Si el usuario esperaba una tienda en línea por cada tienda física, esto no es un bug sino una limitación de diseño — aclarado con el usuario, el síntoma real terminó siendo otro (ver abajo).

**Síntoma real confirmado por el usuario:** la URL pública `https://{subdominio}.pos.iados.online` no carga — nada de código, es la conexión misma.

**Diagnóstico de infraestructura (probado con `curl`/`openssl s_client` directo, no solo teoría):**
```
pos.iados.online                        → DNS OK (74.208.149.7) → TLS OK → HTTP 200
{cualquier-subdominio}.pos.iados.online  → DNS OK (mismo wildcard, sí resuelve)
                                         → TLS falla: SSL alert 112 "unrecognized_name"
tienda.iados.online                     → NI SIQUIERA RESUELVE EN DNS (dominio fantasma,
                                            solo aparece en docker-compose.yml FRONTEND_URL,
                                            nunca se configuró de verdad — no es el dominio real)
```
`SSL alert 112 (unrecognized_name)` = el proxy que termina TLS en el VPS (`74.208.149.7`) **rechaza explícitamente** cualquier hostname para el que no tenga un Proxy Host/server block configurado — no es un problema de certificado vencido ni de DNS, es que el wildcard nunca se dio de alta en ese proxy.

**Causa raíz aislada:** el usuario ya había agregado el wildcard DNS + certificado **en el panel de IONOS** — pero confirmó que el proxy reverso que real y efectivamente termina TLS para `pos.iados.online` es un **Nginx Proxy Manager (o similar) corriendo DENTRO del VPS, vía Portainer — un sistema separado de IONOS**. IONOS solo maneja el registro del dominio/DNS; el NPM del VPS es el que decide a qué contenedor Docker mandar cada hostname, y ahí es donde falta la entrada.

**Pendiente de acción del usuario (no es código, no hay nada que Claude pueda pushear):**
1. En el Nginx Proxy Manager del VPS (Portainer → buscar el contenedor del proxy, admin normalmente en puerto `:81`): **Proxy Hosts → Add Proxy Host**, domain `*.pos.iados.online`, forward al contenedor `pos-iados-shop` puerto **3000** (interno, no el 3010 publicado).
2. En la pestaña SSL de esa entrada: o generar el certificado wildcard directamente ahí vía Let's Encrypt (reto DNS-01, requiere credenciales de API del proveedor DNS), o subir como certificado "Custom" el `.crt`/`.pem` + llave privada ya generados en IONOS (no basta con que "exista" en IONOS, hay que exportarlo e importarlo a NPM).
3. Sin confirmar aún cuál de las dos rutas de SSL siguió el usuario — retomar ahí en la próxima sesión si sigue sin resolver.

---

## 4. Pendiente / próximos pasos

1. **Pull & Redeploy en Portainer** — todo el trabajo de esta sesión vive en `main`/`69882d2` pero aún no se sabe si ya se desplegó a producción (confirmar con el usuario).
2. **Twilio**: cada empresa que quiera notificaciones WhatsApp (logística y/o self-order) debe capturar su propia cuenta (Account SID, Auth Token, número) en Configuración → Logística y activar el toggle. Sin eso no se envía nada — es esperado, no bug.
3. **Hardware de báscula nunca probado físicamente** (no hay báscula/impresora reales en este entorno). Antes de dar por bueno el módulo en producción:
   - Confirmar el protocolo serial exacto de la báscula comprada contra su manual — el parser en `bascula-bridge/main.js` es genérico (busca un decimal en el buffer), documentado para ajustarse en `bascula-bridge/LEEME.txt`.
   - Confirmar la IP fija de la impresora de etiquetas ZPL y capturarla en Configuración → Báscula.
   - Ver el listado de equipo recomendado (báscula Torrey con salida serial, adaptador USB-serial FTDI, impresora Zebra/GoDEX/TSC en red, mini-PC Windows, monitor táctil) dado al usuario en esta sesión si hace falta repetirlo.
4. **Menú Digital**: el panel "Pedidos pendientes" nuevo solo tiene acciones Confirmar/Rechazar (no hay progresión "completado" — se decidió así para no ampliar el alcance del fix). Si el negocio necesita más estados, es una extensión futura.
5. **`installer/version.json` (2.2.72) vs `APP_VERSION` en `docker-compose.yml` (2.4.1)**: investigado y descartado como bug — son dos productos de versionado independientes (instalador on-premise vs. instancia cloud), no deben coincidir.
6. **Ecommerce/subdominios de tienda no cargan** (Sesión 2) — causa raíz confirmada: falta configurar el wildcard `*.pos.iados.online` en el Nginx Proxy Manager del VPS (no basta con IONOS). Ver detalle y pasos exactos en la Sesión 2 arriba. No es código, es infraestructura del VPS — pendiente de que el usuario lo configure y confirme.
