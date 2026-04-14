# PROMPT PARA CLAUDE CODE — POS-iaDoS: Módulo Perfiles de Negocio (Carbón + Hielo)

> Copia y pega todo esto en Claude Code. No omitas nada.

---

## CONTEXTO DEL PROYECTO

Eres un Senior Full-Stack Engineer trabajando sobre el sistema **POS-iaDoS** — un POS multitenant ya completamente desarrollado con la siguiente arquitectura:

- **Backend:** NestJS 10 + TypeORM + MySQL 8 + JWT/Passport — ubicado en `backend/`
- **Frontend:** React 18 + Vite + TailwindCSS + Zustand — ubicado en `frontend/`
- **Deploy:** Docker Compose (2 servicios: backend en puerto 3002, frontend/nginx en 8081)
- **Jerarquía multitenant:** `Tenant → Empresa → Tienda`
- **Scoping:** Todas las tablas usan `tenant_id`, `empresa_id`, `tienda_id`. El middleware `TenantScopeMiddleware` extrae estos valores del JWT y los inyecta como `scope` en cada request.
- **Roles existentes:** `superadmin`, `admin`, `manager`, `cajero`, `mesero`
- **Entidades clave ya existentes y funcionales (NO modificar su estructura core):**
  - `Producto` — tiene campos `controla_stock: boolean`, `stock_actual: decimal`, `stock_minimo: decimal`, `unidad: string`
  - `Categoria` — tiene campos `tenant_id`, `empresa_id`, `nombre`, `color`, `icono`, `es_seccion_especial`, `tipo_seccion`
  - `MovimientoInventario` — tabla de auditoría de stock completamente funcional
  - `User` — tiene `tenant_id`, `empresa_id`, `tienda_id`, `rol`
  - Módulo `inventario` — CRUD de stock ya implementado en `backend/src/modules/inventario/`
  - Módulo `productos` — CRUD completo en `backend/src/modules/productos/`
  - `InventarioPage.tsx` — página de inventario ya existente en `frontend/src/pages/inventario/`
  - `MainLayout.tsx` — sidebar con `navItems` array que controla la navegación por rol

## OBJETIVO

Implementar la **Opción C: Sistema de Perfiles de Negocio activable por configuración**, específicamente para el perfil **`carbon_hielo`** que habilita:

1. **Dos módulos separados** dentro de un mismo tenant: `carbon` y `hielo`
2. **Usuarios con módulo asignado:** usuario carbón ve solo productos de carbón, usuario hielo ve solo hielo
3. **Admin ve todo** sin restricción de módulo
4. **Inventario preciso con alertas de stock bajo** por módulo
5. **Panel de inventario especializado** con alertas visuales cuando stock ≤ stock_minimo
6. **Productos predefinidos del perfil** que se pueden cargar como seed al activar el perfil

## REGLAS OBLIGATORIAS — LEE ANTES DE ESCRIBIR UNA SOLA LÍNEA

1. **NO romper nada existente.** Todo el código actual (ventas, caja, dashboard, tickets, POS, etc.) debe seguir funcionando exactamente igual.
2. **NO modificar** las entidades `Producto`, `Categoria`, `MovimientoInventario`, `Venta`, `User`, `Caja` ni sus tablas en MySQL.
3. **SOLO agregar** columnas nuevas con `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — nunca DROP ni MODIFY en columnas existentes.
4. **SOLO agregar** nuevas tablas, nunca modificar las existentes.
5. **NO tocar** `docker-compose.yml`, `install.sh`, `install.bat`, ni los scripts SQL de `database/`.
6. **Patrón de scoping obligatorio:** Todos los nuevos endpoints del backend deben usar `@TenantScope() scope` igual que los módulos existentes.
7. **Patrón de guards obligatorio:** Todos los nuevos controllers deben usar `@UseGuards(AuthGuard('jwt'), RolesGuard)` igual que los existentes.
8. **Passwords:** Usar `bcryptjs` (NO `bcrypt` nativo) — ya está instalado.
9. **Frontend:** Usar `tailwind` clases existentes del proyecto (`bg-iados-surface`, `bg-iados-primary`, `border-slate-700`, etc.) — el proyecto ya tiene su design system configurado.
10. **Sin preguntar.** Ejecutar todo directamente.
11. **Sin romper imports.** Verificar que cualquier archivo nuevo se registre correctamente en su módulo NestJS correspondiente (`providers`, `imports`, `exports`).
12. **El campo `modulo` en User:** Agregar como columna nullable en la tabla `users` sin tocar la entidad existente — usar una nueva entidad extendida o simplemente el campo raw en queries. Preferir un enfoque que NO requiera modificar `user.entity.ts` para no romper el módulo de auth.

---

## IMPLEMENTACIÓN PASO A PASO

### PASO 1 — Migración de Base de Datos

Crear el archivo `database/05_perfil_carbon_hielo.sql` con el siguiente contenido EXACTO (usar `IF NOT EXISTS` en todo):

```sql
USE pos_iados;

-- Tabla: perfiles_negocio
-- Define qué perfiles están disponibles en el sistema
CREATE TABLE IF NOT EXISTS perfiles_negocio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  config JSON NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tenant_perfiles
-- Qué perfiles tiene activados cada tenant
CREATE TABLE IF NOT EXISTS tenant_perfiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  perfil_clave VARCHAR(50) NOT NULL,
  config_override JSON NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tp_tenant (tenant_id),
  UNIQUE KEY uq_tenant_perfil (tenant_id, perfil_clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Columna modulo en users (nullable, no rompe nada existente)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS modulo VARCHAR(50) NULL DEFAULT NULL COMMENT 'Módulo del perfil asignado al usuario (carbon, hielo, null=todos)';

-- Columna modulo en categorias (nullable)
ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS modulo VARCHAR(50) NULL DEFAULT NULL COMMENT 'Módulo del perfil al que pertenece esta categoría';

-- Columna modulo en productos (nullable)
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS modulo VARCHAR(50) NULL DEFAULT NULL COMMENT 'Módulo del perfil al que pertenece este producto';

-- Seed: perfil carbon_hielo
INSERT IGNORE INTO perfiles_negocio (clave, nombre, descripcion, config) VALUES (
  'carbon_hielo',
  'Carbón + Hielo',
  'Perfil para negocios de venta de carbón y hielo con inventario dual por módulo',
  JSON_OBJECT(
    'modulos', JSON_ARRAY('carbon', 'hielo'),
    'modulos_config', JSON_OBJECT(
      'carbon', JSON_OBJECT('label', 'Carbón', 'color', '#374151', 'icono', 'Flame'),
      'hielo',  JSON_OBJECT('label', 'Hielo',  'color', '#0ea5e9', 'icono', 'Snowflake')
    ),
    'inventario_critico', true,
    'alertas_stock', true,
    'productos_base', JSON_ARRAY(
      JSON_OBJECT('modulo','carbon','sku','CARB-3KG', 'nombre','Carbón Bolsa 3kg',  'unidad','bolsa','precio',0,'costo',0,'controla_stock',true,'stock_minimo',20),
      JSON_OBJECT('modulo','carbon','sku','CARB-2.5KG','nombre','Carbón Bolsa 2.5kg','unidad','bolsa','precio',0,'costo',0,'controla_stock',true,'stock_minimo',20),
      JSON_OBJECT('modulo','carbon','sku','CARB-GRAN','nombre','Carbón Granel kg',  'unidad','kg',   'precio',0,'costo',0,'controla_stock',true,'stock_minimo',50),
      JSON_OBJECT('modulo','hielo', 'sku','HIEL-5KG', 'nombre','Hielo Bolsa 5kg',   'unidad','bolsa','precio',0,'costo',0,'controla_stock',true,'stock_minimo',30),
      JSON_OBJECT('modulo','hielo', 'sku','HIEL-20KG','nombre','Hielo Bolsa 20kg',  'unidad','bolsa','precio',0,'costo',0,'controla_stock',true,'stock_minimo',10),
      JSON_OBJECT('modulo','hielo', 'sku','HIEL-BARR','nombre','Hielo Barra',       'unidad','pieza','precio',0,'costo',0,'controla_stock',true,'stock_minimo',5)
    )
  )
);
```

### PASO 2 — Backend: Módulo `perfiles`

Crear el módulo completo en `backend/src/modules/perfiles/` con los siguientes archivos:

#### `backend/src/modules/perfiles/perfil-negocio.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('perfiles_negocio')
export class PerfilNegocio {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 50, unique: true }) clave: string;
  @Column({ length: 100 }) nombre: string;
  @Column({ type: 'text', nullable: true }) descripcion: string;
  @Column({ type: 'json', nullable: true }) config: any;
  @Column({ default: true }) activo: boolean;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
```

#### `backend/src/modules/perfiles/tenant-perfil.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('tenant_perfiles')
@Index(['tenant_id'])
export class TenantPerfil {
  @PrimaryGeneratedColumn() id: number;
  @Column() tenant_id: number;
  @Column({ length: 50 }) perfil_clave: string;
  @Column({ type: 'json', nullable: true }) config_override: any;
  @Column({ default: true }) activo: boolean;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
```

#### `backend/src/modules/perfiles/perfiles.service.ts`

Implementar con los siguientes métodos públicos:

- `getPerfilActivo(tenant_id: number): Promise<any>` — retorna el perfil activo del tenant con su config mergeada. Si no tiene perfil activo retorna `null`.
- `activarPerfil(tenant_id: number, empresa_id: number, tienda_id: number, perfil_clave: string, scope: any): Promise<any>` — activa el perfil para el tenant. Si la clave es `carbon_hielo`, llama a `seedCarbonHielo(tenant_id, empresa_id, scope)`.
- `desactivarPerfil(tenant_id: number, perfil_clave: string): Promise<void>`
- `seedCarbonHielo(tenant_id: number, empresa_id: number, scope: any): Promise<any>` — lee los `productos_base` del perfil en BD y crea las categorías y productos si no existen (verificar por SKU). Las categorías a crear son: `"Carbón"` (modulo=`carbon`, color=`#374151`, icono=`Flame`) y `"Hielo"` (modulo=`hielo`, color=`#0ea5e9`, icono=`Snowflake`). Los productos base se asignan a su categoría correspondiente.
- `getAlertasStock(tenant_id: number, empresa_id: number, modulo?: string): Promise<any[]>` — retorna productos donde `controla_stock=true` AND `stock_actual <= stock_minimo`, filtrando por módulo si se especifica.
- `getResumenModulo(tenant_id: number, empresa_id: number, modulo: string): Promise<any>` — retorna `{ modulo, total_productos, alertas_criticas, stock_bajo }` para el dashboard de inventario.

Usar `@InjectRepository` para `PerfilNegocio`, `TenantPerfil`, `Producto` (del módulo productos), y `Categoria`.

#### `backend/src/modules/perfiles/perfiles.controller.ts`

Endpoints:
- `GET /perfiles/activo` — `@Roles('superadmin','admin','manager','cajero','mesero')` — retorna el perfil activo del tenant del usuario logueado
- `POST /perfiles/activar` — `@Roles('superadmin','admin')` — body: `{ perfil_clave: string }` — activa el perfil
- `DELETE /perfiles/desactivar/:clave` — `@Roles('superadmin','admin')` — desactiva perfil
- `GET /perfiles/alertas-stock` — `@Roles('superadmin','admin','manager')` — query param opcional `?modulo=carbon`
- `GET /perfiles/resumen/:modulo` — `@Roles('superadmin','admin','manager')` — resumen por módulo

Todos con `@UseGuards(AuthGuard('jwt'), RolesGuard)` y `@TenantScope() scope`.

#### `backend/src/modules/perfiles/perfiles.module.ts`

Registrar las entidades `PerfilNegocio`, `TenantPerfil`, y también importar `TypeOrmModule.forFeature([Producto, Categoria])` para poder hacer el seed.

### PASO 3 — Backend: Registrar el módulo en AppModule

En `backend/src/app.module.ts`, agregar `PerfilesModule` al array de imports. No tocar ningún otro módulo existente.

### PASO 4 — Backend: Extender endpoints existentes sin modificar controladores actuales

#### Extender `inventario.service.ts` — AGREGAR (no reemplazar) el siguiente método al final de la clase:

```typescript
async listStockPorModulo(scope: any, modulo?: string) {
  const where: any = { 
    tenant_id: scope.tenant_id, 
    empresa_id: scope.empresa_id, 
    activo: true 
  };
  if (modulo) where.modulo = modulo;
  return this.prodRepo.find({
    where,
    select: ['id', 'sku', 'nombre', 'stock_actual', 'stock_minimo', 'controla_stock', 'unidad', 'costo', 'precio', 'imagen_url', 'modulo' as any],
    order: { nombre: 'ASC' },
  });
}
```

#### Agregar endpoint en `inventario.controller.ts` — SOLO AGREGAR al final:

```typescript
@Get('stock-modulo')
listStockPorModulo(@TenantScope() scope, @Query('modulo') modulo?: string) {
  return this.service.listStockPorModulo(scope, modulo);
}
```

Agregar `Query` al import de `@nestjs/common` si no está.

### PASO 5 — Backend: Filtrado de productos en POS por módulo de usuario

En `backend/src/modules/productos/productos.service.ts`, encontrar el método que sirve los productos para el POS (probablemente `findForPOS` o similar que responde al endpoint `/productos/pos`). **SOLO agregar** al final del `where` de esa query: si el `scope` trae un campo `modulo` (que viene del JWT), agregar el filtro `modulo = scope.modulo` — pero SOLO si `scope.modulo` no es null/undefined. Si `scope.modulo` es null o el rol es `admin`/`superadmin`/`manager`, no filtrar.

En `backend/src/modules/auth/auth.service.ts` o donde se genera el JWT payload, **SOLO agregar** el campo `modulo: user.modulo || null` al payload. Buscar la línea donde se hace `return { id: user.id, email: user.email, rol: user.rol, ... }` y agregar `modulo: (user as any).modulo || null`.

En `backend/src/common/middleware/tenant-scope.middleware.ts`, **SOLO agregar** `modulo: user.modulo || null` al objeto `req.tenantScope`.

Actualizar la interfaz `TenantRequest`:
```typescript
req.tenantScope?: {
  tenant_id: number;
  empresa_id: number;
  tienda_id: number;
  rol: string;
  modulo?: string | null;  // AGREGAR
};
```

### PASO 6 — Frontend: API endpoints

En `frontend/src/api/endpoints.ts`, **SOLO AGREGAR** al final del archivo:

```typescript
// Perfiles de Negocio
export const perfilesApi = {
  getActivo:         ()                          => api.get('/perfiles/activo'),
  activar:           (perfil_clave: string)      => api.post('/perfiles/activar', { perfil_clave }),
  desactivar:        (clave: string)             => api.delete(`/perfiles/desactivar/${clave}`),
  alertasStock:      (modulo?: string)           => api.get('/perfiles/alertas-stock', { params: modulo ? { modulo } : {} }),
  resumenModulo:     (modulo: string)            => api.get(`/perfiles/resumen/${modulo}`),
  stockPorModulo:    (modulo?: string)           => api.get('/inventario/stock-modulo', { params: modulo ? { modulo } : {} }),
};
```

### PASO 7 — Frontend: Página de Inventario Dual (`InventarioDualPage.tsx`)

Crear `frontend/src/pages/inventario/InventarioDualPage.tsx`.

Esta es la página más importante del perfil `carbon_hielo`. Debe mostrar:

**Layout general:**
- Header con título "Inventario Carbón + Hielo" y un badge del perfil activo
- Dos columnas side-by-side (en mobile: tabs o acordeón): una para Carbón (tema gris oscuro `#374151`) y otra para Hielo (tema azul `#0ea5e9`)
- Botón "Registrar movimiento" accesible desde ambos módulos

**Cada columna muestra:**
- Contador total de productos del módulo
- Número de alertas activas (stock ≤ stock_minimo) con badge rojo pulsante si hay alertas
- Tabla/lista de productos con: nombre, SKU, stock_actual, stock_minimo, unidad
- Indicador visual por fila: verde = ok, amarillo = cerca del mínimo (≤ 2x stock_minimo), rojo = crítico (≤ stock_minimo)
- Botones inline "+" y "-" para registrar entradas/salidas rápidas (abrir modal)

**Banner de alerta global** (si hay cualquier producto crítico):
- Barra superior amarilla/roja con el texto "⚠ X productos con stock crítico — Ver detalle"
- Al hacer click muestra un modal con la lista completa de productos críticos de ambos módulos

**Modal de movimiento de stock:**
- Selector de módulo (carbón / hielo)
- Selector de producto (filtrado por módulo seleccionado)
- Tipo: entrada / salida / ajuste
- Cantidad
- Concepto (texto libre)
- Al guardar: llama `inventarioApi.registrarMovimiento()` existente, luego recarga

**Comportamiento según rol:**
- `admin`/`superadmin`/`manager`: ve ambas columnas completas
- `cajero` con `modulo='carbon'`: ve solo columna carbón (read-only, sin botones de movimiento)
- `cajero` con `modulo='hielo'`: ve solo columna hielo (read-only, sin botones de movimiento)

Usar los hooks y stores existentes: `useAuthStore`, `inventarioApi` existente, `perfilesApi` nuevo.

### PASO 8 — Frontend: Página de Configuración de Perfil (`PerfilNegocioPage.tsx`)

Crear `frontend/src/pages/admin/PerfilNegocioPage.tsx`.

Accesible solo para `superadmin` y `admin`. Muestra:
- Estado actual del perfil del tenant (activo / inactivo)
- Card del perfil `carbon_hielo` con su descripción
- Botón "Activar perfil" → llama `perfilesApi.activar('carbon_hielo')` → muestra toast de éxito con "Perfil activado. Se crearon las categorías y productos base."
- Botón "Desactivar" (solo si está activo)
- Sección "Módulos" — lista los módulos del perfil activo con sus colores e iconos
- Sección "Usuarios por módulo" — tabla simple que muestra los usuarios del tenant con su campo `modulo` y un selector inline para cambiarlo (llama `usersApi.update(id, { modulo })`)

### PASO 9 — Frontend: Componente de Alerta de Stock (`StockAlertBanner.tsx`)

Crear `frontend/src/components/ui/StockAlertBanner.tsx`.

- Se monta en `MainLayout.tsx` justo debajo del `<LicenciaBanner />` existente
- Solo se muestra si el perfil activo del tenant tiene `alertas_stock: true`
- Hace polling cada 60 segundos a `perfilesApi.alertasStock()`
- Si hay alertas: muestra barra amarilla `"⚠ {n} productos con stock bajo"` con botón "Ver" que navega a `/inventario-dual`
- Si no hay alertas: no renderiza nada (retorna null)
- No bloquea ni interfiere con ninguna funcionalidad existente

En `MainLayout.tsx`, importar y agregar `<StockAlertBanner />` **solo después** de `<LicenciaBanner />`. No tocar nada más del componente.

### PASO 10 — Frontend: Routing

En `frontend/src/App.tsx`:

1. Importar `InventarioDualPage` y `PerfilNegocioPage`
2. Agregar las siguientes rutas dentro del `<Route path="/" element={<PrivateRoute>...}>` existente:

```tsx
<Route path="inventario-dual" element={
  <PrivateRoute roles={['superadmin', 'admin', 'manager', 'cajero']}>
    <InventarioDualPage />
  </PrivateRoute>
} />
<Route path="admin/perfil-negocio" element={
  <PrivateRoute roles={['superadmin', 'admin']}>
    <PerfilNegocioPage />
  </PrivateRoute>
} />
```

En `MainLayout.tsx`, en el array `navItems` existente, **SOLO AGREGAR** (no reemplazar):

```typescript
{ to: '/inventario-dual',       icon: Boxes,    label: 'Inv. Dual',    roles: ['superadmin', 'admin', 'manager', 'cajero'] },
{ to: '/admin/perfil-negocio',  icon: Layers,   label: 'Perfil',       roles: ['superadmin', 'admin'] },
```

Importar `Boxes` y `Layers` de `lucide-react` si no están importados.

### PASO 11 — Frontend: Tipos TypeScript

En `frontend/src/types/index.ts`, **SOLO AGREGAR** al final:

```typescript
export interface PerfilNegocio {
  id: number;
  clave: string;
  nombre: string;
  descripcion?: string;
  config?: {
    modulos?: string[];
    modulos_config?: Record<string, { label: string; color: string; icono: string }>;
    inventario_critico?: boolean;
    alertas_stock?: boolean;
    productos_base?: any[];
  };
  activo: boolean;
}

export interface TenantPerfil {
  id: number;
  tenant_id: number;
  perfil_clave: string;
  config_override?: any;
  activo: boolean;
}

export interface AlertaStock {
  id: number;
  sku: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  unidad: string;
  modulo?: string;
  deficit: number; // stock_minimo - stock_actual
}
```

También agregar el campo `modulo?: string | null` a la interfaz `User` existente.

---

## VERIFICACIÓN FINAL OBLIGATORIA

Después de implementar todo, verificar:

1. **Backend:** `cd backend && npm run build` — debe compilar sin errores
2. **Frontend:** `cd frontend && npm run build` — debe compilar sin errores
3. **Módulo registrado:** Confirmar que `PerfilesModule` está en el array `imports` de `AppModule` con sus entidades en `TypeOrmModule.forFeature([...])`
4. **Sin imports rotos:** Todos los nuevos archivos deben estar importados en sus respectivos módulos NestJS
5. **SQL seguro:** El archivo `database/05_perfil_carbon_hielo.sql` debe poder ejecutarse múltiples veces sin error (idempotente gracias a `IF NOT EXISTS` e `INSERT IGNORE`)
6. **Columnas opcionales:** Las columnas `modulo` en `users`, `categorias` y `productos` son nullable — no deben romper ningún endpoint existente que no las use

---

## RESUMEN DE ARCHIVOS A CREAR/MODIFICAR

**CREAR (archivos nuevos):**
- `database/05_perfil_carbon_hielo.sql`
- `backend/src/modules/perfiles/perfil-negocio.entity.ts`
- `backend/src/modules/perfiles/tenant-perfil.entity.ts`
- `backend/src/modules/perfiles/perfiles.service.ts`
- `backend/src/modules/perfiles/perfiles.controller.ts`
- `backend/src/modules/perfiles/perfiles.module.ts`
- `frontend/src/pages/inventario/InventarioDualPage.tsx`
- `frontend/src/pages/admin/PerfilNegocioPage.tsx`
- `frontend/src/components/ui/StockAlertBanner.tsx`

**MODIFICAR (solo agregar, nunca eliminar ni reescribir):**
- `backend/src/app.module.ts` — agregar `PerfilesModule` al array imports
- `backend/src/modules/inventario/inventario.service.ts` — agregar método `listStockPorModulo`
- `backend/src/modules/inventario/inventario.controller.ts` — agregar endpoint `GET stock-modulo`
- `backend/src/modules/productos/productos.service.ts` — agregar filtro por `scope.modulo` en `findForPOS`
- `backend/src/modules/auth/auth.service.ts` — agregar campo `modulo` al JWT payload
- `backend/src/common/middleware/tenant-scope.middleware.ts` — agregar campo `modulo` al scope
- `frontend/src/api/endpoints.ts` — agregar `perfilesApi`
- `frontend/src/types/index.ts` — agregar interfaces y campo modulo en User
- `frontend/src/App.tsx` — agregar 2 rutas nuevas
- `frontend/src/components/layout/MainLayout.tsx` — agregar 2 items al navItems y el componente StockAlertBanner

---

**Ejecuta todo sin preguntar. Si encuentras algún conflicto de versiones o imports, resuélvelo por tu cuenta con la solución más conservadora posible. El sistema en producción no puede romperse.**
