# EMC iados-EMC Deployment Pack (Windows Server 2022)

Este paquete incluye:
- Scripts y docs para QA / seed / smoke check (sin tocar tu código existente)
- TXT con comandos para Claude Code (staging y producción)
- SQL para PostgreSQL (índices recomendados + verificación)

## Dónde instalar (Windows Server 2022)

Recomendación EMC (robusta y simple):
1) Instalar Docker Desktop/Engine (si está permitido) y correr:
   - Nginx (reverse proxy) o IIS como reverse proxy
   - PHP 8.3 (FPM) + Composer
   - PostgreSQL (si no existe) o usar tu PostgreSQL existente
   - Redis (opcional) para colas/cache

Alternativa sin Docker (clásico):
- IIS + PHP (FastCGI) + URL Rewrite
- Composer instalado
- Node (si compilas assets)
- PostgreSQL instalado (o remoto)

Ubicación recomendada del proyecto:
- `D:\sites\iados-emc\current`
y mantener releases:
- `D:\sites\iados-emc\releases\YYYYMMDDHHMMSS`
y un symlink/junction `current` apuntando al release.

## Variables y permisos
- Asegura permisos de escritura en:
  - `storage\`
  - `bootstrap\cache\`
- Configura `.env` y `APP_KEY`
- Configura el pool / worker de cola (Windows Task Scheduler o servicio) si usas colas:
  - `php artisan queue:work --sleep=1 --tries=3`

## Qué hace este pack
- Agrega seeders demo y comando `emc:smoke-check`
- Agrega guía QA (docs/QA_SMOKE.md)
- Agrega SQL de índices para performance

> Este pack NO reemplaza tus migraciones Laravel. En producción lo normal es: `php artisan migrate --force`.
