# POS-iaDoS - Sistema de Instalación

## Requisitos para compilar
- Windows 10/11 (64-bit)
- Node.js 18+ (para compilar)
- PowerShell 5.1+
- Conexión a internet (primera vez, para descargar runtimes)

## Generar Instalador Completo (primera vez)

```powershell
cd installer
powershell -ExecutionPolicy Bypass -File build.ps1
# Con ZIP:
powershell -ExecutionPolicy Bypass -File build.ps1 -CreateZip
```

Genera: `installer/output/POS-iaDoS-Setup-v1.0.0/`

### Instalar en equipo destino
1. Copiar carpeta `POS-iaDoS-Setup-v1.0.0` al equipo
2. Ejecutar `INSTALAR.bat` como administrador
3. Acceder a `http://localhost:3000`

## Generar Actualización

```powershell
cd installer
powershell -ExecutionPolicy Bypass -File build-update.ps1 -NewVersion "1.0.1"
# Con migración SQL:
powershell -ExecutionPolicy Bypass -File build-update.ps1 -NewVersion "1.0.1" -MigrationSQL ".\migrations\v1.0.1.sql"
# Con ZIP:
powershell -ExecutionPolicy Bypass -File build-update.ps1 -NewVersion "1.0.1" -CreateZip
```

Genera: `installer/output/POS-iaDoS-UPDATE-v1.0.1/`

### Aplicar actualización
1. Copiar carpeta `POS-iaDoS-UPDATE-v1.0.1` al equipo
2. Ejecutar `ACTUALIZAR.bat` como administrador

## Estructura del instalador generado

```
POS-iaDoS-Setup-v1.0.0/
  INSTALAR.bat              # Doble clic para instalar
  DESINSTALAR.bat           # Doble clic para desinstalar
  ACTUALIZAR.bat            # Para actualizaciones
  LICENSE.txt
  version.json
  setup/                    # Scripts PowerShell
  runtime/
    node/                   # Node.js 20 LTS portable
    mariadb/                # MariaDB 10.11 portable
    nssm.exe                # Gestor de servicios
  app/
    backend/                # dist/ + node_modules/ + public/
    database/               # SQL seeds
```

## Estructura instalada (C:\POS-iaDoS\)

```
C:\POS-iaDoS\
  version.json
  INICIAR.bat               # Iniciar servicios
  DETENER.bat               # Detener servicios
  ESTADO.bat                # Ver estado
  DESINSTALAR.bat           # Desinstalar
  node/                     # Node.js portable
  mariadb/                  # MariaDB + data/
  backend/                  # App + .env
  database/                 # SQL seeds
  tools/                    # nssm.exe + scripts .ps1
  logs/                     # Logs de servicios
  backups/                  # Backups de actualizaciones
```

## Servicios Windows instalados
- `PosIaDos-MariaDB` - Base de datos (puerto 3306, auto-start)
- `PosIaDos-Backend` - API + Frontend (puerto 3000, auto-start)

## Credenciales por defecto
- **SuperAdmin:** admin@iados.mx / admin123 / PIN: 0000
- **Admin:** admin2@iados.mx / admin123 / PIN: 1111
- **Cajero:** cajero@iados.mx / cajero123 / PIN: 1234
- **Mesero:** mesero@iados.mx / cajero123 / PIN: 5678

## Notas
- Los runtimes se descargan una sola vez y se cachean en `installer/.downloads/`
- Use `-SkipDownloads` para no re-descargar runtimes
- Use `-SkipCompile` para no re-compilar (usa la última compilación)
- El `version.json` del installer se actualiza automáticamente al generar updates
