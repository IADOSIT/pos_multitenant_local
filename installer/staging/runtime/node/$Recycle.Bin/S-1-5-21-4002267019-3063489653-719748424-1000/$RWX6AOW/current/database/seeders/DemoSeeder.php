<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Empresa demo
        $empresaId = DB::table('empresas')->updateOrInsert(
            ['slug' => 'abastos'],
            [
                'nombre' => 'EMC Abastos',
                'brand_nombre_publico' => 'Central de Abastos',
                'activa' => true,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        // updateOrInsert returns bool, so fetch id
        $empresa = DB::table('empresas')->where('slug', 'abastos')->first();
        $empresaId = $empresa->id;

        // Roles
        $superRole = DB::table('roles')->where('slug', 'superadmin')->first();
        $adminRole = DB::table('roles')->where('slug', 'admin_empresa')->first();
        $opsRole   = DB::table('roles')->where('slug', 'operaciones')->first();

        // Usuarios demo
        $superEmail = 'superadmin@emc.local';
        DB::table('usuarios')->updateOrInsert(
            ['email' => $superEmail],
            [
                'name' => 'Superadmin',
                'password' => Hash::make('22'),
                'whatsapp' => null,
                'remember_token' => Str::random(10),
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );
        $super = DB::table('usuarios')->where('email', $superEmail)->first();

        $adminEmail = 'admin@abastos.local';
        DB::table('usuarios')->updateOrInsert(
            ['email' => $adminEmail],
            [
                'name' => 'Admin Abastos',
                'password' => Hash::make('ChangeMe#2026'),
                'whatsapp' => null,
                'remember_token' => Str::random(10),
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );
        $admin = DB::table('usuarios')->where('email', $adminEmail)->first();

        $opsEmail = 'ops@abastos.local';
        DB::table('usuarios')->updateOrInsert(
            ['email' => $opsEmail],
            [
                'name' => 'Operaciones Abastos',
                'password' => Hash::make('ChangeMe#2026'),
                'whatsapp' => null,
                'remember_token' => Str::random(10),
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );
        $ops = DB::table('usuarios')->where('email', $opsEmail)->first();

        // Pivotes empresa_usuario (rol_id requerido)
        DB::table('empresa_usuario')->updateOrInsert(
            ['empresa_id' => $empresaId, 'usuario_id' => $admin->id],
            ['rol_id' => $adminRole?->id ?? $superRole->id, 'activo' => true, 'updated_at' => $now, 'created_at' => $now]
        );
        DB::table('empresa_usuario')->updateOrInsert(
            ['empresa_id' => $empresaId, 'usuario_id' => $ops->id],
            ['rol_id' => $opsRole?->id ?? $adminRole->id, 'activo' => true, 'updated_at' => $now, 'created_at' => $now]
        );

        // Superadmin: se liga a empresa para pruebas (opcional)
        DB::table('empresa_usuario')->updateOrInsert(
            ['empresa_id' => $empresaId, 'usuario_id' => $super->id],
            ['rol_id' => $superRole->id, 'activo' => true, 'updated_at' => $now, 'created_at' => $now]
        );
    }
}
