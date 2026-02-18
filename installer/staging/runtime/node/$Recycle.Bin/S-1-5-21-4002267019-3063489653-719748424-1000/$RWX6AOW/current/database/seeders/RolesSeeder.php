<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $roles = [
            ['slug' => 'superadmin', 'nombre' => 'Superadmin'],
            ['slug' => 'admin_empresa', 'nombre' => 'Admin Empresa'],
            ['slug' => 'operaciones', 'nombre' => 'Operaciones'],
            ['slug' => 'cajero', 'nombre' => 'Cajero'],
            ['slug' => 'repartidor', 'nombre' => 'Repartidor'],
        ];

        foreach ($roles as $r) {
            DB::table('roles')->updateOrInsert(
                ['slug' => $r['slug']],
                ['nombre' => $r['nombre'], 'updated_at' => $now, 'created_at' => $now]
            );
        }
    }
}
