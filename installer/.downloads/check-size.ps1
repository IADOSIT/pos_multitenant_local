$staging = "C:\sites\pos_multitenant_local\installer\staging"
$dirs = @("runtime\node","runtime\mariadb","app\backend\dist","app\backend\node_modules","app\backend\public","app\database","setup")
$total = 0
foreach ($d in $dirs) {
    $path = Join-Path $staging $d
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $mb = [math]::Round($size / 1MB, 1)
        $total += $size
        Write-Host "$d : $mb MB"
    }
}
Write-Host "---"
Write-Host "TOTAL: $([math]::Round($total / 1MB, 1)) MB"
