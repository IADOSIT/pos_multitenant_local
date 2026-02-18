param(
    [string]$Root = "C:\sites\emc_abastos\current"
)

Write-Host "== EMC FIX: bootstrap/cache permissions ==" -ForegroundColor Cyan

$CachePath = Join-Path $Root "bootstrap\cache"

# 1. Crear directorio si no existe
if (-Not (Test-Path $CachePath)) {
    Write-Host "Creating bootstrap/cache directory..."
    New-Item -ItemType Directory -Path $CachePath -Force | Out-Null
}

# 2. Quitar atributos raros (solo lectura, etc.)
Write-Host "Removing restrictive attributes..."
attrib -R "$CachePath\*" /S /D 2>$null

# 3. Resetear ACLs
Write-Host "Resetting ACLs..."
icacls $CachePath /reset /T /C | Out-Null

# 4. Identidades base
$Identities = @(
    "IIS_IUSRS",
    "IUSR",
    "Users"
)

foreach ($id in $Identities) {
    Write-Host "Granting Modify to $id"
    icacls $CachePath /grant "${id}:(OI)(CI)M" /T /C | Out-Null
}

# 5. Detectar AppPools y dar permisos
Import-Module WebAdministration -ErrorAction SilentlyContinue

if (Get-ChildItem IIS:\AppPools -ErrorAction SilentlyContinue) {
    foreach ($pool in Get-ChildItem IIS:\AppPools) {
        $poolIdentity = "IIS AppPool\" + $pool.Name
        Write-Host "Granting Modify to $poolIdentity"
        icacls $CachePath /grant "${poolIdentity}:(OI)(CI)M" /T /C | Out-Null
    }
}

# 6. Mostrar permisos finales
Write-Host ""
Write-Host "Final permissions on bootstrap/cache:" -ForegroundColor Yellow
icacls $CachePath

Write-Host ""
Write-Host "FIX COMPLETED. bootstrap/cache is writable." -ForegroundColor Green
