EMC Hotfix - Route [store.index] not defined

This fixes: RouteNotFoundException Route [store.index] not defined (View: resources/views/store/index.blade.php)

How to apply:
1) Unzip into C:\sites\emc_abastos\current (preserve paths)
2) Run:
   powershell -ExecutionPolicy Bypass -File C:\sites\emc_abastos\current\scripts\windows\05_hotfix_store_index_route.ps1 -Root "C:\sites\emc_abastos\current" -Php "C:\php\php.exe"
