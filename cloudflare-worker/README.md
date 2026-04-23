# POS-iaDoS Relay — Cloudflare Worker

Relay gratuito entre el POS local (offline/LAN) e internet.
Permite que clientes accedan al menú y hagan pedidos desde cualquier red.

## Setup (una sola vez por restaurante)

### 1. Instalar Wrangler
```bash
npm install -g wrangler
wrangler login
```

### 2. Crear el namespace KV
```bash
wrangler kv:namespace create POS_RELAY
```
Copia el `id` que imprime y pégalo en `wrangler.toml`.

### 3. Desplegar
```bash
wrangler deploy
```
El Worker queda en: `https://pos-iados-relay.TU_SUBDOMINIO.workers.dev`

### 4. Configurar en el POS
En **Configuración → Menú Digital**:
- **Worker URL**: `https://pos-iados-relay.TU_SUBDOMINIO.workers.dev`

En **Configuración → POS → URL base para QR de mesas**:
- La misma URL del Worker

## URLs resultantes
- Menú digital: `https://pos-iados-relay.workers.dev/menu/SLUG`
- Self-order mesa 3: `https://pos-iados-relay.workers.dev/s/SLUG/3`

## Dominio propio (opcional, gratis)
En el dashboard de Cloudflare → Workers → tu worker → Settings → Domains & Routes → Add Custom Domain.
Ejemplo: `pos.mirestaurante.mx`

## Notas
- Free tier: 100k requests/día — más que suficiente para un restaurante
- Los pedidos expiran en 24h si el POS no los recoge
- El snapshot del menú expira en 30 días (se renueva al publicar)
