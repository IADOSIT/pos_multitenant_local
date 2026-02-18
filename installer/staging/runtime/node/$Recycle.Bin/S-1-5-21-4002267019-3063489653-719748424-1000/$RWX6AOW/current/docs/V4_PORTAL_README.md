# EMC Abastos V4 - Portal Central Multi-Tienda

## Descripcion

V4 introduce la arquitectura multi-tienda con Portal Central React:

- **Portal Central**: Landing page React con directorio de tiendas
- **Multi-dominio**: Cada tienda puede tener su propio dominio
- **Handles de tienda**: URLs amigables tipo `/t/{slug}-{public_id}`
- **Sistema de promociones**: Publicidad de tiendas en el portal
- **API Publica**: Endpoints REST para consumo del portal

## Estructura de URLs

```
/                          -> Portal Central (React)
/portal/                   -> Portal Central (static build)
/t/{handle}               -> Tienda por handle (ej: /t/frutas-guadalupe-abc123)
/tienda.com               -> Tienda por dominio personalizado
/admin                    -> Panel de administracion
```

## Nuevas Tablas (V4)

### portal_config
Configuracion singleton del portal central.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| key | string | Clave de configuracion |
| value | json | Valor (puede ser objeto) |

### store_domains
Dominios personalizados por tienda.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| empresa_id | FK | Tienda propietaria |
| domain | string | Dominio (ej: mitienda.com) |
| is_primary | bool | Si es dominio principal |
| ssl_status | enum | Estado SSL (pending/active/failed) |

### store_promotions
Promociones para el portal central.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| empresa_id | FK | Tienda anunciante |
| producto_id | FK | Producto promocionado (opcional) |
| title | string | Titulo de la promocion |
| promo_price | decimal | Precio promocional |
| original_price | decimal | Precio original |
| badge_text | string | Texto de badge (ej: "NUEVO") |
| hero_image | string | Imagen de promocion |
| starts_at | datetime | Inicio de vigencia |
| ends_at | datetime | Fin de vigencia |

### Campos nuevos en empresas

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| public_id | string(8) | ID publico no secuencial |
| handle | string | Slug unico para URLs |
| primary_domain | string | Dominio principal |
| logo_url | string | URL del logo |
| descripcion | text | Descripcion para portal |
| tags | json | Etiquetas de categoria |
| sort_order | int | Orden en listados |
| is_featured | bool | Tienda destacada |

## API Publica

### GET /api/public/portal-config
Retorna configuracion del portal.

```json
{
  "success": true,
  "data": {
    "portal_name": "Central de Abastos",
    "hero": { "title": "...", "subtitle": "..." },
    "developer": { "name": "...", "email": "..." }
  }
}
```

### GET /api/public/stores
Lista tiendas activas para el directorio.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Frutas Guadalupe",
      "handle": "frutas-guadalupe-abc123",
      "descripcion": "...",
      "logo_url": "...",
      "tags": ["frutas", "verduras"],
      "is_featured": true,
      "store_url": "/t/frutas-guadalupe-abc123",
      "producto_count": 25
    }
  ]
}
```

### GET /api/public/stores/{handle}
Detalle de una tienda.

### GET /api/public/stores/{handle}/products
Productos de una tienda.

### GET /api/public/promotions
Promociones activas para el portal.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Manzanas en oferta",
      "promo_price": 25.00,
      "original_price": 35.00,
      "discount_percent": 29,
      "badge_text": "OFERTA",
      "hero_image": "...",
      "store": { "nombre": "...", "handle": "..." },
      "target_url": "/t/frutas-guadalupe-abc123/producto/1"
    }
  ]
}
```

## Portal React

### Estructura

```
portal/
├── src/
│   ├── App.jsx           # Router principal
│   ├── main.jsx          # Entry point
│   ├── index.css         # Tailwind + custom
│   ├── hooks/
│   │   └── useApi.js     # Hooks para API
│   ├── components/
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   └── pages/
│       ├── Home.jsx      # Landing page
│       └── Stores.jsx    # Directorio
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env
```

### Variables de entorno

```env
VITE_API_URL=/api          # Base URL de la API
```

### Comandos

```bash
cd portal
npm install               # Instalar dependencias
npm run dev               # Desarrollo (puerto 3000)
npm run build             # Build produccion
```

## Deployment

### Rapido (PowerShell)

```powershell
.\scripts\windows\DEPLOY_V4_PORTAL.ps1
```

### Manual

1. Ejecutar migracion V4:
```bash
php artisan migrate
```

2. Sembrar datos del portal:
```bash
php artisan db:seed --class=V4PortalSeeder
```

3. Build del portal React:
```bash
cd portal
npm install
npm run build
```

4. Copiar build a public:
```bash
cp -r portal/dist public/portal
```

5. Configurar IIS para servir `/portal/` como SPA (rewrite a index.html)

### IIS web.config para /public/portal/

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## Admin Panel

### Portal Config (/admin/portal)
- Configuracion general del portal
- Textos del hero
- Colores del tema
- Informacion del desarrollador

### Promotions (/admin/promotions)
- CRUD de promociones
- Asignar producto o crear promo libre
- Definir vigencia
- Badge y precios

### Store Domains (/admin/empresa/{id}/domains)
- Administrar dominios por tienda
- Verificar SSL

## Resolucion de Tienda (Middleware)

El middleware `ResolveStoreContext` resuelve la tienda en este orden:

1. **Por dominio**: Si el host no es el dominio principal, busca en store_domains
2. **Por handle**: Si la URL contiene `/t/{handle}`, extrae y busca la tienda
3. **Por sesion**: Si hay empresa_id en sesion (admin logueado)

## Testing

```bash
# Test API
curl http://localhost/api/public/portal-config
curl http://localhost/api/public/stores
curl http://localhost/api/public/promotions

# Test tienda por handle
curl http://localhost/t/frutas-guadalupe-abc123
```

## Notas de Implementacion

- Los handles son inmutables una vez creados
- El public_id usa 8 caracteres alfanumericos aleatorios
- Las promociones expiran automaticamente (ends_at)
- El cache de dominios dura 1 hora
- El portal React usa proxy en desarrollo para evitar CORS
