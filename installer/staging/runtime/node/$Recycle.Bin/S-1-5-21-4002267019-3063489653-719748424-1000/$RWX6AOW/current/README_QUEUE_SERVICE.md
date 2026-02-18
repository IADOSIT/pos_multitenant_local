# EMC Queue Worker como servicio (Windows Server 2022)

## Problema
El comando `nssm` no existe en tu servidor (no está instalado o no está en PATH).

## Solución recomendada: NSSM (Non-Sucking Service Manager)
1) Descarga NSSM (ZIP) desde el sitio oficial.
2) Extrae `nssm.exe` a `C:\tools\nssm\win64\nssm.exe` (o donde prefieras).
3) Ejecuta el script 02 para crear el servicio.

## Opción alternativa (sin NSSM)
Usar Task Scheduler para mantener el worker vivo (menos robusto que NSSM).

---

## Paso A: Crear carpeta de tools
`C:\tools\nssm\`

## Paso B: Crear servicio (PowerShell Admin)
Ejecuta:
`powershell -ExecutionPolicy Bypass -File scripts\windows\02_create_queue_service.ps1 -Root "C:\sites\emc_abastos\current" -Php "C:\php\php.exe" -Nssm "C:\tools\nssm\win64\nssm.exe" -ServiceName "emc_abastos_queue"`

## Paso C: Ver estado
`sc query emc_abastos_queue`

## Paso D: Logs
El worker escribe logs en `storage\logs\laravel.log`.
