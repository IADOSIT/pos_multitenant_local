$staging = "C:\sites\pos_multitenant_local\installer\staging"
$downloads = "C:\sites\pos_multitenant_local\installer\.downloads"

# Extract nssm
Write-Host "Extrayendo nssm..."
$nssmTmp = "$downloads\nssm-tmp"
if (Test-Path $nssmTmp) { Remove-Item -Recurse -Force $nssmTmp }
Expand-Archive -Path "$downloads\nssm.zip" -DestinationPath $nssmTmp -Force
$exe = Get-ChildItem -Path $nssmTmp -Recurse -Filter "nssm.exe" | Where-Object { $_.Directory.Name -eq "win64" } | Select-Object -First 1
Copy-Item -Path $exe.FullName -Destination "$staging\runtime\nssm.exe" -Force
Remove-Item -Recurse -Force $nssmTmp
Write-Host "nssm OK: $((Get-Item "$staging\runtime\nssm.exe").Length / 1KB) KB"

# Extract Node.js
Write-Host "Extrayendo Node.js..."
$nodeTmp = "$downloads\node-tmp"
if (Test-Path $nodeTmp) { Remove-Item -Recurse -Force $nodeTmp }
Expand-Archive -Path "$downloads\node.zip" -DestinationPath $nodeTmp -Force
$nodeDir = Get-ChildItem $nodeTmp | Select-Object -First 1
Copy-Item -Path "$($nodeDir.FullName)\*" -Destination "$staging\runtime\node" -Recurse -Force
Remove-Item -Recurse -Force $nodeTmp
Write-Host "Node.js OK: $(Test-Path "$staging\runtime\node\node.exe")"
