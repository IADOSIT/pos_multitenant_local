# EMC Full Missing App Pack (Core)

Este pack llena los faltantes críticos para que el proyecto sea una app funcional:
- config/* mínimo
- app/Providers/*
- Modelos faltantes + relaciones base
- Middleware de empresa y rol
- Rutas completas para: login, dashboard, switch empresa, admin productos, ops ordenes (lista del día)
- Layout y vistas básicas (mobile-first simple)
- storage folders placeholders
- Script para aplicar y registrar middleware aliases

## Instalación
1) Descomprime sobre tu proyecto:
   C:\sites\emc_abastos\current\

2) PowerShell admin:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\06_apply_full_pack.ps1

3) Flujo:
   - Abre /login
   - Entra con admin@abastos.local (password de seed)
   - Ve a /empresa y selecciona empresa
   - /admin/productos
   - /ops/ordenes
