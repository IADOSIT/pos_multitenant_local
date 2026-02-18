@echo off
echo Cambiando a configuracion EXTERNA...
copy /Y backend\ext.env backend\.env >nul
copy /Y frontend\ext.env frontend\.env >nul
echo.
echo === Configuracion activa: EXTERNA ===
echo BD:       my.bodegadigital.com.mx:3306
echo API:      http://34.71.132.26:3000/api
echo Frontend: http://34.71.132.26:5173
echo.
echo Reinicia ambos servicios:
echo   Backend:  cd backend ^&^& npm run start:dev
echo   Frontend: cd frontend ^&^& npx vite --host 0.0.0.0
