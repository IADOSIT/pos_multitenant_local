@echo off
echo Iniciando POS-iaDoS...
docker compose up -d
echo.
echo POS:     http://localhost
echo Kiosco:  http://localhost/kiosco
echo API:     http://localhost:3000/api/health
pause
