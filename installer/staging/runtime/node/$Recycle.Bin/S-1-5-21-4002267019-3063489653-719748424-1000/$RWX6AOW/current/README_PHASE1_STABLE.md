Este pack NO intenta "terminar enterprise"; su objetivo es:
- Dejar migraciones + tablas infra (cache, jobs, password_reset_tokens) funcionando en PostgreSQL
- Crear tablas faltantes de inventario_movimientos y orden_status_histories
- Completar modelos base que el código usa

Instalación:
1) Descomprime sobre C:\sites\emc_abastos\current\
2) Ejecuta:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\APPLY_PHASE1_STABLE.ps1
