$tmp = "C:\sites\pos_multitenant_local\installer\.downloads\nssm-tmp"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
Expand-Archive -Path "C:\sites\pos_multitenant_local\installer\.downloads\nssm.zip" -DestinationPath $tmp -Force
$exe = Get-ChildItem -Path $tmp -Recurse -Filter "nssm.exe" | Where-Object { $_.Directory.Name -eq "win64" } | Select-Object -First 1
Copy-Item -Path $exe.FullName -Destination "C:\sites\pos_multitenant_local\installer\staging\runtime\nssm.exe" -Force
Remove-Item -Recurse -Force $tmp
Write-Host "nssm extraido OK"
