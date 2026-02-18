# Hotfix: categorias.orden no existe

Tu tabla categorias NO tiene columna 'orden'. Este hotfix:
- Hace DemoStoreSeeder tolerante a columnas (detecta schema)
- Remueve dependencias a 'orden' en Categoria/StorefrontController
- Re-seedea solo DemoStoreSeeder

Instalar:
1) Descomprime sobre C:\sites\emc_abastos\current\
2) Ejecuta:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\09_hotfix_categorias_orden.ps1
