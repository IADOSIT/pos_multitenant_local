Incluye fixes críticos (rutas, paginación) + sync de schema (migración additive) + hardening básico (CSRF en vaciar carrito, rate limit login, tracking sin PII) + demo seeder tolerante a columnas.

Instalar:
1) Descomprime sobre C:\sites\emc_abastos\current\
2) Ejecuta:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\APPLY_FIX_ALL.ps1
