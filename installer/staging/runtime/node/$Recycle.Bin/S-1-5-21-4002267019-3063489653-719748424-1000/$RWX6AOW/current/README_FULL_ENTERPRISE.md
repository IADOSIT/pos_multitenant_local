Este pack agrega/termina módulos base:
- Storefront completo: listado + detalle producto + carrito + checkout + tracking
- Admin: dashboard, productos CRUD completo, categorías CRUD, clientes maestro + opt-out, WhatsApp maestro, inventarios (kardex + ajuste), caja (turno + movimientos + history)
- Operaciones: hub, lista del día, órdenes (listar+detalle+cambiar estatus), pagos en orden (store) y conciliación con caja, WhatsApp retry + opt-out (skipped_reason)
- Servicios: InventarioService, WhatsApp Sender/Notifier (mock provider listo para reemplazar)

Instalar:
1) Descomprime sobre C:\sites\emc_abastos\current\
2) Ejecuta:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\APPLY_FULL_ENTERPRISE.ps1
