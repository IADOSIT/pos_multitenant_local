@echo off
echo Cambiando a configuracion LOCAL...
copy /Y backend\loc.env backend\.env >nul
copy /Y frontend\loc.env frontend\.env >nul
echo.
echo === Configuracion activa: LOCAL ===
echo BD:       localhost:3306
echo API:      http://localhost:3000/api
echo Frontend: http://localhost:5173
echo.
echo Reinicia ambos servicios:
echo   Backend:  cd backend ^&^& npm run start:dev
echo   Frontend: cd frontend ^&^& npx vite --host 0.0.0.0
