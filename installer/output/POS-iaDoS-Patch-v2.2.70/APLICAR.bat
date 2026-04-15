@echo off
echo.
echo  POS-iaDoS - Parche v2.2.70
echo  Actualizacion segura - NO borra base de datos ni configuracion
echo.
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  Solicitando permisos de administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c cd /d ""%~dp0"" && APLICAR.bat' -Verb RunAs"
    exit /b
)
powershell -ExecutionPolicy Bypass -File "%~dp0aplicar-parche.ps1"
