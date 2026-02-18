# Hotfix: StoreController missing

This pack adds:
- app/Http/Controllers/StoreController.php

Fixes 500:
Target class [App\Http\Controllers\StoreController] does not exist.

Apply by extracting on top of project root:
C:\sites\emc_abastos\current

Then clear caches:
C:\php\php.exe artisan optimize:clear
