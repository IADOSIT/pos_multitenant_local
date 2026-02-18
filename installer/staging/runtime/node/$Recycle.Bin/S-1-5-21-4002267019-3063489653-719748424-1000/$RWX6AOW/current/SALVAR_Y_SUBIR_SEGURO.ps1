# =========================================================
# EMC Abastos - SALVAR Y SUBIR CAMBIOS (SEGURO)
# - Crea rama de backup
# - Agrega TODOS los cambios
# - Commit
# - Push a GitHub
# - NO toca main
# =========================================================

$ErrorActionPreference = Stop
Set-StrictMode -Version Latest

$RepoRoot = Csitesemc_abastos

Write-Host == Entrando al repo == -ForegroundColor Cyan
Set-Location $RepoRoot

Write-Host == Rama actual == -ForegroundColor Cyan
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host Actual $branch

if ($branch -eq main) {
  $newBranch = backupwip- + (Get-Date -Format yyyyMMdd-HHmmss)
  Write-Host Estas en main. Creando rama segura $newBranch -ForegroundColor Yellow
  git checkout -b $newBranch  Out-Host
  $branch = $newBranch
}

Write-Host == Estado actual == -ForegroundColor Cyan
git status  Out-Host

Write-Host == Agregando TODOS los cambios == -ForegroundColor Cyan
git add -A  Out-Host

Write-Host == Verificando staged == -ForegroundColor Cyan
git status  Out-Host

Write-Host == Commit == -ForegroundColor Cyan
try {
  git commit -m backup WIP portal v4v5 y cambios locales  Out-Host
} catch {
  Write-Host No hubo nada nuevo que commitear (quizas ya estaba commiteado). -ForegroundColor Yellow
}

Write-Host == Push a GitHub (rama de backup) == -ForegroundColor Green
git push -u origin $branch  Out-Host

Write-Host 
Write-Host ✅ TODO SALVADO Y SUBIDO CON EXITO -ForegroundColor Green
Write-Host Rama $branch -ForegroundColor Green
Write-Host Main NO fue tocada. -ForegroundColor Green
