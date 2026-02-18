# EMC Abastos - Guia de Desarrollo

## Stack Tecnologico

- **Backend:** Laravel 11 + PHP 8.2+
- **Frontend Admin:** Livewire 3 + Tailwind CSS + DaisyUI
- **Frontend Store:** Blade + Alpine.js + Tailwind CDN
- **Base de Datos:** PostgreSQL
- **Assets:** Vite

## Requisitos

- PHP 8.2+ con extensiones: pdo_pgsql, mbstring, openssl, tokenizer, xml, ctype, json
- Composer 2.x
- Node.js 18+ y NPM
- PostgreSQL 15+

## Instalacion Rapida (Windows)

```powershell
# 1. Clonar el repositorio
git clone <repo> emc_abastos
cd emc_abastos

# 2. Copiar configuracion
copy .env.example .env

# 3. Instalar dependencias y compilar
.\scripts\windows\INSTALL_LIVEWIRE_MARY.ps1

# 4. Cargar datos demo
.\scripts\windows\SEED_DEMO.ps1

# 5. Iniciar servidor
php artisan serve
```

## Configuracion Manual

### 1. Instalar dependencias PHP
```bash
composer install
```

### 2. Instalar dependencias NPM
```bash
npm install
```

### 3. Compilar assets
```bash
npm run build
# o para desarrollo:
npm run dev
```

### 4. Configurar base de datos
Editar `.env`:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=emc_abastos
DB_USERNAME=postgres
DB_PASSWORD=secret
```

### 5. Ejecutar migraciones y seeders
```bash
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
```

## Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@emc.test | password | Superadmin |
| admin@abastosmty.test | password | Admin Empresa |
| ops@abastosmty.test | password | Operaciones |
| cajero@abastosmty.test | password | Cajero |
| repartidor@abastosmty.test | password | Repartidor |
| admin@fruvernorte.test | password | Admin Empresa (2da empresa) |

## Estructura del Proyecto

```
app/
  Http/Controllers/
    Admin/          # Controladores tradicionales
    Operaciones/    # Controladores de ops
  Livewire/
    Admin/          # Componentes Livewire Admin
      Dashboard.php
      Empresas.php
      Categorias.php
      Productos.php
      Usuarios.php
    Ops/
      Ordenes.php
  Models/           # Modelos Eloquent

resources/
  views/
    components/
      layouts/
        app.blade.php   # Layout principal Livewire
    layouts/
      admin.blade.php   # Layout tradicional
      store.blade.php   # Layout storefront
    livewire/
      admin/            # Vistas de componentes Livewire
      ops/

database/
  migrations/
  seeders/
    DatabaseSeeder.php
    RolesSeeder.php
    EmpresasSeeder.php
    UsersSeeder.php
    CategoriasSeeder.php
    ProductosSeeder.php
    InventarioSeeder.php
    OrdenesSeeder.php
    CajaSeeder.php
    WhatsappLogsSeeder.php

scripts/
  windows/
    INSTALL_LIVEWIRE_MARY.ps1
    SEED_DEMO.ps1
    RESET_DEMO.ps1
    APPLY_ADMIN_OPS_LIVEWIRE.ps1
```

## Rutas Principales

### Admin (requiere auth + rol admin_empresa o superadmin)
- `/admin` - Dashboard
- `/admin/empresas` - CRUD Empresas (solo superadmin)
- `/admin/categorias` - CRUD Categorias
- `/admin/productos` - CRUD Productos
- `/admin/usuarios` - CRUD Usuarios
- `/admin/caja` - Gestion de caja
- `/admin/inventarios` - Control de inventario
- `/admin/flyers` - Gestion de flyers

### Operaciones (requiere auth + rol operaciones o superior)
- `/ops` - Hub de operaciones
- `/ops/ordenes` - Lista de ordenes
- `/ops/ordenes/{id}` - Detalle de orden
- `/ops/whatsapp` - Logs de WhatsApp

### Storefront (publico)
- `/` - Tienda principal
- `/producto/{id}` - Detalle de producto
- `/carrito` - Carrito de compras
- `/checkout` - Proceso de pago
- `/pedido/{folio}` - Seguimiento de pedido

## Multi-tenant

El sistema usa `session('empresa_id')` para filtrar datos por empresa.

- El middleware `empresa` establece la empresa activa
- Todos los modelos filtran por `empresa_id` donde aplique
- Superadmin puede ver/editar todas las empresas

## Comandos Utiles

```bash
# Limpiar cache
php artisan optimize:clear

# Ver rutas
php artisan route:list

# Resetear base de datos
php artisan migrate:fresh --seed

# Compilar assets en modo watch
npm run dev
```

## Desarrollo

### Crear nuevo componente Livewire
```bash
php artisan make:livewire Admin/NuevoComponente
```

### Agregar nueva migracion
```bash
php artisan make:migration create_nueva_tabla
```

---

Desarrollado por [iaDoS.mx](https://iados.mx) - WhatsApp: 8318989580
