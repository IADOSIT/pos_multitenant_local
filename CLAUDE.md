# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**POS-iaDoS** — multitenant point-of-sale SaaS by iaDoS (iados.mx). Hierarchy is **Tenant → Empresa → Tienda**, using shared tables scoped by `tenant_id`/`empresa_id`/`tienda_id` (not a DB-per-client model). The product is sold to multiple clients under a licensing system (`licencias` module) and is dual-deployed: a cloud instance (`pos.iados.online`) and a standalone Windows on-premise installer for a client's own PC (`installer/`, Inno Setup).

Sub-projects in this repo:
- `backend/` — NestJS 10 API (MySQL via TypeORM)
- `frontend/` — React 18 + Vite admin/POS SPA
- `shop/` — Next.js 14 customer-facing ecommerce storefront
- `reader-bridge/` — local Node/Electron bridge app for HID DigitalPersona fingerprint readers (employee attendance)
- `cloudflare-worker/` — auxiliary Cloudflare Worker
- `installer/` — Windows installer build (Inno Setup `setup.iss`) for on-premise deployments

## Commands

Backend (`backend/`):
```
npm run start:dev          # nest start --watch
npm run build               # nest build → dist/
npm run migration:generate   # generate TypeORM migration
npm run migration:run
npm run seed                 # ts-node src/database/seeds/run-seed.ts
```

Frontend (`frontend/`):
```
npm run dev      # vite dev server, proxies /api → localhost:3000
npm run build    # tsc && vite build → outputs to dist-prod/ (see gotcha below)
```

Shop (`shop/`):
```
npm run dev      # next dev -p 3010
npm run build    # next build → .next/standalone + .next/static
npm run lint      # next lint
```

There is **no automated test suite** in any of the three sub-projects (no jest/vitest config, no `test` script) — verification is manual/via the installer's 30+ smoke checks (`install.sh`/`install.bat`).

## Deployment model — compile locally, Docker only copies artifacts

**Never let Docker compile on the VPS.** The VPS runs other applications too; an OOM'd build or a failed `npm ci` there can take down the whole stack. All three Dockerfiles copy pre-built output instead of running a build:

| Service | Local build command | Folder committed to git | Dockerfile does |
|---|---|---|---|
| `backend` | `cd backend && npm run build` | `backend/dist/` | `COPY dist ./dist` |
| `frontend` | see gotcha below | `frontend/dist-vps/` | `COPY dist-vps /usr/share/nginx/html` |
| `shop` | `cd shop && npm run build` | `shop/.next/standalone/` + `shop/.next/static/` | `COPY .next/standalone ./` |

Full flow for every change: edit locally (Windows) → build locally → verify the build succeeds (a local failure = a VPS failure) → `git add` including the build output folders (`.gitignore` explicitly un-ignores `backend/dist/`, `frontend/dist-prod/`, `frontend/dist-vps/`, and `shop/.next/standalone/node_modules/`) → commit + push → the user does **Pull & Redeploy in Portainer** on the VPS.

### Frontend build gotcha: `dist-prod` vs `dist-vps`

`frontend/vite.config.ts` hardcodes `build.outDir: 'dist-prod'` — that output is for the **on-premise/offline installer** mode, where the NestJS backend serves the SPA directly via `ServeStaticModule` (see `app.module.ts`: it checks `existsSync(frontend/dist-prod)` and falls back to `backend/public` if absent, e.g. in the VPS container where that folder is never copied).

The VPS **Docker frontend container instead needs `frontend/dist-vps/`**, which nginx serves (`frontend/Dockerfile`). Nothing in `package.json` builds `dist-vps` automatically — it has to be produced as a separate step (e.g. `vite build --outDir dist-vps`) before committing. Don't assume a plain `npm run build` is enough for a VPS deploy; confirm `dist-vps/` was actually regenerated.

### Docker build cache-busting

`docker-compose.yml` uses a `CACHE_BUST` build arg on `backend` and `frontend` (a date+description string) to invalidate the `COPY dist`/`COPY dist-vps` layer — bump it when pushing a build whose Docker layer might otherwise be cached stale.

## Backend architecture

- `app.module.ts` wires 27 modules (`auth`, `users`, `tenants`, `empresas`, `tiendas`, `productos`, `categorias`, `ventas`, `caja`, `dashboard`, `tickets`, `print`, `health`, `backup`, `devoluciones`, `ecommerce`, `empleados`, `encuestas`, `inventario`, `licencias`, `logistica`, `materia-prima`, `menu-digital`, `mesas`, `notificaciones`, `pagos-gateway`, `pedidos`, `perfiles`, `self-order`).
- **Tenant scoping**: `TenantScopeMiddleware` (`common/middleware/tenant-scope.middleware.ts`) runs on every route, reading `tenant_id`/`empresa_id`/`tienda_id`/`rol` off the JWT-decoded `req.user` and attaching it as `req.tenantScope`. Controllers pull it via the `@TenantScope()` param decorator (`common/decorators/tenant.decorator.ts`); role checks go through `@Roles()` + `RolesGuard`.
- **License enforcement**: `LicenciaGuard` (`common/guards/licencia.guard.ts`) is registered as a **global guard** in `main.ts` (not via `app.useGlobalGuards` in a module — it's manually instantiated with `app.get(LicenciasService)`). Superadmin and a fixed `BYPASS_PATHS` list (auth, licencias, health, notificaciones, uploads, public menu-digital/logistica/biometrico) skip the check; an expired/blocked license downgrades non-superadmin users to GET-only.
- **TypeORM `synchronize: true`** is enabled everywhere (`config/typeorm.config.ts`) — the app auto-migrates schema on every boot instead of running discrete migrations in production. This means a bad entity change (e.g. duplicate unique constraints — see below) can break `DataSource.initialize()` and take the whole backend down on deploy.
  - Known failure mode: never combine `@Column({ unique: true })` **and** a class-level `@Index([...], { unique: true })` on the same column — TypeORM can attempt two UNIQUE constraints during synchronize and fail to boot. Use only the class-level `@Index`.
  - When the backend fails to boot this way, the frontend's login screen misreports it as "Credenciales inválidas" if the auth `catch` block is generic — always branch on `err.response?.status` (401 vs. no-status/`ECONNABORTED`/`ERR_NETWORK` vs. other) instead of a bare `catch {}`.
- **Static asset serving is dual-mode**: `app.module.ts` conditionally registers `ServeStaticModule` only if a static root exists (checks `frontend/dist-prod` first, else `backend/public`), so the same backend image works both as an all-in-one offline install and as a pure API behind the VPS's separate nginx frontend container — don't add unconditional static serving here or it'll intercept `/api/*` on the VPS.
- Uploads are served from two static roots layered in `main.ts`: `uploads/` (bind-mounted, authoritative) then `uploads-builtin/` (image fallback baked into the image).

## Frontend architecture

- Zustand stores in `src/store/`: `auth.store.ts` (JWT + localStorage), `pos.store.ts` (cart/subtotal/IVA/total), `offline.store.ts` (Dexie/IndexedDB offline queue).
- Offline-first via Dexie: POS sales must keep working without a network connection; queued transactions sync when connectivity returns.
- PWA via `vite-plugin-pwa` (see `vite.config.ts` manifest) — installable on Android/iOS, branded as "POS-iaDoS".
- `src/pages/public/` holds unauthenticated customer-facing views (self-order, digital menu, delivery tracking, live biometric screen) as opposed to `src/pages/admin|superadmin|pos|caja|...` which require auth.

## Multi-client operations tooling

- `crear-cliente.js` — interactive CLI wizard to onboard a new client (creates tenant/empresa/tienda/user, hashes password with the same `bcryptjs` as the backend).
- `installer/` — builds the Windows on-premise installer (Inno Setup); `entorno.bat`/`generar-parche.ps1` produce incremental patches (`dist_new` backend builds) for existing on-premise installs without a full reinstall.
- `sincronizar-vps.ps1` / `SINCRONIZAR-VPS.bat` — sync helpers for the VPS deployment path.
