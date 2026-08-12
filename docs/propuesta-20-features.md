# Propuesta — 20 features candidatas

Documento para revisión. **No define orden ni compromiso**: es un catálogo para decidir
qué integrar y en qué prioridad. Cada feature incluye: qué es, valor, alcance estimado
(S = pequeño, M = mediano, L = grande) y dependencias/notas.

Leyenda de esfuerzo: **S** ≈ horas · **M** ≈ 1–3 días · **L** ≈ 1+ semana.

---

## A. POS / Modo Retail (caja rápida)

### 1. Cobro en efectivo 100% por teclado (billetes + exacto)
- **Qué:** en el paso de importe, teclas para sumar denominaciones ($500/$200/$100…) y una tecla "E" = importe exacto, sin mouse.
- **Valor:** cierra el flujo keyboard‑first; cobros más veloces en hora pico.
- **Alcance:** S. **Notas:** se apoya en el flujo de método/monto ya existente.

### 2. Cambio de ticket por teclado (Alt+1…9 / Alt+←→)
- **Qué:** saltar directo a un ticket por número o ciclar entre tickets abiertos.
- **Valor:** manejar varias ventas simultáneas sin tocar el mouse.
- **Alcance:** S. **Depende:** multi‑ticket (ya implementado).

### 3. Descuentos por línea y por ticket (con permiso)
- **Qué:** aplicar % o monto fijo a un producto o a toda la venta; requiere rol/PIN.
- **Valor:** promociones y ajustes en caja; muy pedido en retail.
- **Alcance:** M. **Notas:** impacta totales, ticket impreso y reportes.

### 4. Teclas rápidas / favoritos de productos (PLU)
- **Qué:** cuadrícula o teclas para productos sin código de barras (a granel, servicios).
- **Valor:** agiliza artículos frecuentes; útil para no‑escaneables.
- **Alcance:** M. **Depende:** catálogo de productos.

### 5. Suspender y recuperar ventas con folio
- **Qué:** "guardar para después" una venta y recuperarla luego por folio (además del multi‑ticket volátil).
- **Valor:** interrupciones largas, apartados, esperas de cliente.
- **Alcance:** M. **Notas:** persistencia en backend (no solo localStorage).

### 6. Devoluciones / nota de crédito en Retail
- **Qué:** integrar el flujo de devolución existente al layout retail (buscar venta, devolver por artículo).
- **Valor:** operación completa de tienda; ya existe el módulo en el POS actual.
- **Alcance:** M. **Depende:** módulo `devoluciones` existente.

### 7. Arqueo de caja y corte X/Z con conteo de billetes
- **Qué:** apertura/cierre con conteo por denominación, diferencia, y corte parcial (X) y final (Z) imprimibles.
- **Valor:** control de efectivo y cuadre; estándar en retail.
- **Alcance:** M/L. **Depende:** módulo `caja`.

### 8. Báscula por peso en Retail (EAN‑13 variable)
- **Qué:** reutilizar el módulo báscula para vender por peso en el layout retail (leer etiqueta de peso variable).
- **Valor:** abarrotes/fruver con el mismo POS.
- **Alcance:** M. **Depende:** módulo `bascula` + `ean13.util` existentes.

---

## B. Clientes y fidelización

### 9. Cliente en el ticket + crédito/cuenta
- **Qué:** asignar un cliente a la venta, ver su historial y manejar saldo/crédito.
- **Valor:** ventas a crédito, seguimiento, CRM básico.
- **Alcance:** L. **Notas:** nuevas tablas cliente/saldos scoped por tenant.

### 10. Programa de puntos / monedero
- **Qué:** acumular y canjear puntos por compras, configurable por tienda.
- **Valor:** recurrencia y ticket promedio.
- **Alcance:** L. **Depende:** #9 (cliente).

---

## C. Tienda en línea (ecommerce)

### 11. Cupones y códigos de descuento por tienda
- **Qué:** crear cupones (%, monto, mínimo, vigencia, usos) aplicables en checkout.
- **Valor:** campañas de marketing; conversión.
- **Alcance:** M. **Notas:** validación en el `POS_STORE_API`.

### 12. Pasarela de pago en línea (MercadoPago / Stripe)
- **Qué:** cobro real en el checkout de la tienda (hoy es pedido diferido).
- **Valor:** vender en línea de verdad, no solo levantar pedido.
- **Alcance:** L. **Notas:** ya hay `pagos-gateway` en el POS a reutilizar; requiere llaves del cliente.

### 13. Notificaciones de estado de pedido (WhatsApp / correo)
- **Qué:** avisar al cliente cambios de estado (confirmado, en preparación, enviado, entregado).
- **Valor:** experiencia y menos llamadas de "¿dónde va mi pedido?".
- **Alcance:** M. **Depende:** SMTP (ya hay base) y/o WhatsApp API.

### 14. Reseñas y calificaciones reales de productos
- **Qué:** que los clientes califiquen; mostrar promedio real (hoy es placeholder determinístico).
- **Valor:** confianza y SEO.
- **Alcance:** M. **Notas:** nueva tabla propia (evitar tocar esquema del POS).

### 15. Inventario en vivo en la tienda
- **Qué:** ocultar/marcar "agotado" según stock real y descontar al confirmar.
- **Valor:** evita vender lo que no hay.
- **Alcance:** M. **Depende:** stock de productos + reglas por tienda.

---

## D. Operación, datos y plataforma

### 16. Reportes / dashboard de ventas con exportación
- **Qué:** ventas por día/producto/cajero/tienda, con export a Excel/PDF.
- **Valor:** decisiones de negocio; cierre contable.
- **Alcance:** M/L. **Depende:** módulos `ventas`/`reportes`.

### 17. Multi‑sucursal: traspasos de inventario
- **Qué:** mover stock entre tiendas de una empresa, con folio y confirmación de recepción.
- **Valor:** cadenas con varias sucursales.
- **Alcance:** L. **Depende:** `inventario` + jerarquía empresa→tienda.

### 18. Roles y permisos granulares (matriz por módulo/acción)
- **Qué:** definir qué puede ver/hacer cada rol por módulo (más allá de los roles actuales).
- **Valor:** seguridad y control operativo.
- **Alcance:** L. **Notas:** afecta guards del backend y UI.

### 19. Modo offline robusto + sincronización de ventas
- **Qué:** endurecer la cola offline (Dexie) para operar sin internet y sincronizar al reconectar, con manejo de conflictos.
- **Valor:** continuidad ante caídas de red (crítico en punto de venta).
- **Alcance:** L. **Depende:** `offline.store` existente.

### 20. Auditoría / bitácora de acciones
- **Qué:** registro de quién hizo qué y cuándo (ventas anuladas, descuentos, cambios de config, cortes).
- **Valor:** control interno y trazabilidad.
- **Alcance:** M. **Notas:** tabla de log scoped por tenant + visor.

---

## Resumen rápido (para priorizar)

| # | Feature | Área | Esfuerzo |
|---|---------|------|----------|
| 1 | Cobro efectivo por teclado (billetes/exacto) | Retail | S |
| 2 | Cambio de ticket por teclado | Retail | S |
| 3 | Descuentos por línea/ticket | Retail | M |
| 4 | Teclas rápidas / favoritos (PLU) | Retail | M |
| 5 | Suspender/recuperar ventas con folio | Retail | M |
| 6 | Devoluciones en Retail | Retail | M |
| 7 | Arqueo de caja + corte X/Z | Caja | M/L |
| 8 | Báscula por peso en Retail | Retail | M |
| 9 | Cliente en ticket + crédito | Clientes | L |
| 10 | Puntos / monedero | Clientes | L |
| 11 | Cupones de descuento | Tienda | M |
| 12 | Pasarela de pago en línea | Tienda | L |
| 13 | Notificaciones de pedido | Tienda | M |
| 14 | Reseñas reales | Tienda | M |
| 15 | Inventario en vivo | Tienda | M |
| 16 | Reportes + exportación | Datos | M/L |
| 17 | Multi‑sucursal / traspasos | Plataforma | L |
| 18 | Permisos granulares | Plataforma | L |
| 19 | Offline robusto + sync | Plataforma | L |
| 20 | Auditoría / bitácora | Plataforma | M |

**Quick wins sugeridos (S/M, alto impacto inmediato):** 1, 2, 5, 3, 11, 13.
