Set-Location 'C:\sites\pos_multitenant_local\installer'
& '.\build-exe.ps1' -Version '2.2.9' -Mode local -RuntimeSource 'v1.0.0'
Write-Host ''
Read-Host 'Build terminado. Presiona Enter para cerrar'
