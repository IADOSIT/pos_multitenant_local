# EMC Enterprise Demo Pack (Storefront + Admin + Ops)

Incluye:
- Tienda online: catálogo, categorías, búsqueda
- Carrito (session)
- Checkout (pickup/delivery) con WhatsApp requerido
- Crea orden + items
- Seguimiento por folio
- Admin dashboard (ventas hoy, órdenes hoy, productos)
- Admin productos (UI Tailwind)
- Operaciones: lista del día + detalle + cambio de estatus
- Seeder: DemoStoreSeeder (categorías y productos demo)

Instalación:
1) Descomprime sobre:
   C:\sites\emc_abastos\current\

2) Ejecuta:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\08_apply_enterprise_demo_pack.ps1

URLs:
- /  (tienda)
- /carrito
- /checkout
- /pedido/{folio}
- /login (panel)
- /empresa
- /admin
- /ops/ordenes
