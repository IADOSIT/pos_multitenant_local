# =============================================================================
# OBSOLETO - NO USAR
#
# Este actualizador no respaldaba nada antes de sobrescribir y verificaba
# frontend\dist\index.html, carpeta que vite ya no genera (ahora es dist-prod),
# asi que fallaba la verificacion incluso cuando el parche estaba bien.
#
# El actualizador vigente es installer\staging\setup\actualizar.ps1: respalda
# base de datos, imagenes, Excel y ajustes antes de tocar nada, y si la version
# nueva no arranca regresa sola a la anterior.
#
# Se deja el archivo solo para no romper una referencia vieja; si se ejecuta,
# avisa y no hace nada.
# =============================================================================
Write-Host ""
Write-Host "  Este actualizador esta obsoleto y no se debe usar." -ForegroundColor Red
Write-Host "  Usa ACTUALIZAR.bat, que llama a setup\actualizar.ps1:" -ForegroundColor Yellow
Write-Host "  ese si respalda todo antes y puede revertirse." -ForegroundColor Yellow
Write-Host ""
exit 1
