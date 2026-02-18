#!/usr/bin/env bash
set -euo pipefail

echo "== EMC publish pack: creating seeders, command, docs =="

mkdir -p database/seeders app/Console/Commands docs

cat > database/seeders/RolesSeeder.php <<'PHP'
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rol;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['slug'=>'superadmin','nombre'=>'Superadmin'],
            ['slug'=>'admin_empresa','nombre'=>'Admin Empresa'],
            ['slug'=>'operaciones','nombre'=>'Operaciones'],
            ['slug'=>'usuario','nombre'=>'Usuario'],
            ['slug'=>'repartidor','nombre'=>'Repartidor'],
        ];

        foreach ($roles as $r) {
            Rol::firstOrCreate(['slug'=>$r['slug']], ['nombre'=>$r['nombre']]);
        }
    }
}
PHP

cat > database/seeders/DemoSeeder.php <<'PHP'
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use App\Models\Empresa;
use App\Models\Producto;
use App\Models\Usuario;
use App\Models\Rol;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolesSeeder::class);

        $rolAdmin = Rol::where('slug','admin_empresa')->value('id');
        $rolOps = Rol::where('slug','operaciones')->value('id');
        $rolUser = Rol::where('slug','usuario')->value('id');
        $rolRep = Rol::where('slug','repartidor')->value('id');

        $e1 = Empresa::firstOrCreate(['slug'=>'abastos'], ['nombre'=>'Central de Abastos']);
        $e2 = Empresa::firstOrCreate(['slug'=>'tienda2'], ['nombre'=>'Tienda 2']);

        $admin = Usuario::firstOrCreate(['email'=>'admin@demo.com'], [
            'name' => 'Admin Demo',
            'password' => Hash::make('password'),
        ]);

        $ops = Usuario::firstOrCreate(['email'=>'ops@demo.com'], [
            'name' => 'Ops Demo',
            'password' => Hash::make('password'),
        ]);

        $rep = Usuario::firstOrCreate(['email'=>'rep@demo.com'], [
            'name' => 'Repartidor Demo',
            'password' => Hash::make('password'),
        ]);

        $buyer = Usuario::firstOrCreate(['email'=>'buyer@demo.com'], [
            'name' => 'Cliente Demo',
            'password' => Hash::make('password'),
        ]);

        if (Schema::hasColumn('usuarios','whatsapp')) {
            $buyer->whatsapp = $buyer->whatsapp ?: '5218111111111';
            $buyer->save();
        }

        $this->attachEmpresa($e1->id, $admin->id, $rolAdmin);
        $this->attachEmpresa($e1->id, $ops->id, $rolOps);
        $this->attachEmpresa($e1->id, $rep->id, $rolRep);
        $this->attachEmpresa($e1->id, $buyer->id, $rolUser);

        $this->attachEmpresa($e2->id, $ops->id, $rolOps);
        $this->attachEmpresa($e2->id, $buyer->id, $rolUser);

        $p1 = Producto::firstOrCreate(['empresa_id'=>$e1->id,'sku'=>'APL-1'], [
            'nombre'=>'Manzana', 'precio'=>25, 'activo'=>true
        ]);
        $p2 = Producto::firstOrCreate(['empresa_id'=>$e1->id,'sku'=>'BNA-1'], [
            'nombre'=>'Plátano', 'precio'=>18, 'activo'=>true
        ]);

        if (Schema::hasTable('inventarios')) {
            DB::table('inventarios')->updateOrInsert(
                ['empresa_id'=>$e1->id,'producto_id'=>$p1->id],
                ['stock'=>50,'updated_at'=>now(),'created_at'=>now()]
            );
            DB::table('inventarios')->updateOrInsert(
                ['empresa_id'=>$e1->id,'producto_id'=>$p2->id],
                ['stock'=>40,'updated_at'=>now(),'created_at'=>now()]
            );
        }

        if (Schema::hasTable('repartidores_perfil')) {
            DB::table('repartidores_perfil')->updateOrInsert(
                ['empresa_id'=>$e1->id,'usuario_id'=>$rep->id],
                ['activo'=>true,'zona'=>'Centro','telefono'=>'8111111111','updated_at'=>now(),'created_at'=>now()]
            );
        }
    }

    private function attachEmpresa(int $empresaId, int $userId, ?int $rolId): void
    {
        $payload = [
            'empresa_id' => $empresaId,
            'usuario_id' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (\Schema::hasColumn('empresa_usuario','rol_id') && $rolId) {
            $payload['rol_id'] = $rolId;
        }

        DB::table('empresa_usuario')->updateOrInsert(
            ['empresa_id'=>$empresaId,'usuario_id'=>$userId],
            $payload
        );
    }
}
PHP

cat > app/Console/Commands/EmcSmokeCheck.php <<'PHP'
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class EmcSmokeCheck extends Command
{
    protected $signature = 'emc:smoke-check';
    protected $description = 'Smoke checks for iados-EMC core modules';

    public function handle(): int
    {
        $this->info('EMC Smoke Check');

        $checks = [
            ['usuarios.whatsapp column', fn()=> Schema::hasColumn('usuarios','whatsapp')],
            ['empresa_usuario.rol_id column', fn()=> Schema::hasColumn('empresa_usuario','rol_id')],
            ['inventario_movimientos table', fn()=> Schema::hasTable('inventario_movimientos')],
            ['whatsapp_logs.skipped_reason', fn()=> Schema::hasColumn('whatsapp_logs','skipped_reason')],
            ['activity_logs table', fn()=> Schema::hasTable('activity_logs')],
            ['caja_movimientos table', fn()=> Schema::hasTable('caja_movimientos')],
        ];

        foreach ($checks as [$name, $fn]) {
            $ok = false;
            try { $ok = (bool)$fn(); } catch (\Throwable $e) { $ok = false; }
            $ok ? $this->line("✅ {$name}") : $this->warn("⚠️ {$name}");
        }

        $this->line('Done.');
        return self::SUCCESS;
    }
}
PHP

cat > docs/QA_SMOKE.md <<'MD'
# QA Smoke Test (iados-EMC)

## Seed + checks
```bash
php artisan migrate:fresh --seed
php artisan emc:smoke-check
```

## Credenciales demo
- admin@demo.com / password
- ops@demo.com / password
- rep@demo.com / password
- buyer@demo.com / password

## Flujo rápido
1) Ops: switch empresa (abastos / tienda2) y validar aislamiento.
2) Buyer en abastos: checkout pickup (Manzana x2).
3) Ops: abrir orden, registrar pagos parciales y completar.
4) Admin: Caja abrir turno, ver movimientos, hacer corte, ver history.
5) WhatsApp: cambiar status (confirmed -> ready_for_pickup) y revisar logs (skipped_reason si opt-out).
6) Entrega: crear desde orden, asignar repartidor, en_route, delivered, reenviar último evento.
7) Conciliación: verificar capturado vs pendiente y export CSV.
8) Repartidores: autocomplete + quick user (modal).
MD

echo "== Files created =="
echo "- database/seeders/RolesSeeder.php"
echo "- database/seeders/DemoSeeder.php"
echo "- app/Console/Commands/EmcSmokeCheck.php"
echo "- docs/QA_SMOKE.md"
echo ""
echo "NEXT: Update DatabaseSeeder + register command in Kernel if your app doesn't autodiscover."
