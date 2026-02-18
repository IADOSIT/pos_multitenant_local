<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Get roles
        $roles = DB::table('roles')->pluck('id', 'slug')->toArray();

        // Get empresas
        $empresas = DB::table('empresas')->pluck('id', 'slug')->toArray();

        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'admin@emc.test',
                'password' => Hash::make('password'),
                'whatsapp' => '528311111111',
                'telefono' => '8311111111',
            ],
            [
                'name' => 'Admin Abastos MTY',
                'email' => 'admin@abastosmty.test',
                'password' => Hash::make('password'),
                'whatsapp' => '528312222222',
                'telefono' => '8312222222',
            ],
            [
                'name' => 'Operador MTY',
                'email' => 'ops@abastosmty.test',
                'password' => Hash::make('password'),
                'whatsapp' => '528313333333',
                'telefono' => '8313333333',
            ],
            [
                'name' => 'Cajero MTY',
                'email' => 'cajero@abastosmty.test',
                'password' => Hash::make('password'),
                'whatsapp' => '528314444444',
                'telefono' => '8314444444',
            ],
            [
                'name' => 'Repartidor MTY',
                'email' => 'repartidor@abastosmty.test',
                'password' => Hash::make('password'),
                'whatsapp' => '528315555555',
                'telefono' => '8315555555',
            ],
            [
                'name' => 'Admin FruVer',
                'email' => 'admin@fruvernorte.test',
                'password' => Hash::make('password'),
                'whatsapp' => '528316666666',
                'telefono' => '8316666666',
            ],
        ];

        foreach ($users as $u) {
            $userId = DB::table('usuarios')->updateOrInsert(
                ['email' => $u['email']],
                array_merge($u, ['created_at' => $now, 'updated_at' => $now])
            );
        }

        // Get user IDs
        $userIds = DB::table('usuarios')->pluck('id', 'email')->toArray();

        // Assign roles
        $assignments = [
            // Superadmin goes to all empresas
            ['email' => 'admin@emc.test', 'empresa' => 'abastos-mty', 'rol' => 'superadmin'],
            ['email' => 'admin@emc.test', 'empresa' => 'fruver-norte', 'rol' => 'superadmin'],
            // Admin empresa MTY
            ['email' => 'admin@abastosmty.test', 'empresa' => 'abastos-mty', 'rol' => 'admin_empresa'],
            // Ops MTY
            ['email' => 'ops@abastosmty.test', 'empresa' => 'abastos-mty', 'rol' => 'operaciones'],
            // Cajero MTY
            ['email' => 'cajero@abastosmty.test', 'empresa' => 'abastos-mty', 'rol' => 'cajero'],
            // Repartidor MTY
            ['email' => 'repartidor@abastosmty.test', 'empresa' => 'abastos-mty', 'rol' => 'repartidor'],
            // Admin FruVer
            ['email' => 'admin@fruvernorte.test', 'empresa' => 'fruver-norte', 'rol' => 'admin_empresa'],
        ];

        foreach ($assignments as $a) {
            $userId = $userIds[$a['email']] ?? null;
            $empresaId = $empresas[$a['empresa']] ?? null;
            $rolId = $roles[$a['rol']] ?? null;

            if ($userId && $empresaId && $rolId) {
                DB::table('empresa_usuario')->updateOrInsert(
                    ['empresa_id' => $empresaId, 'usuario_id' => $userId],
                    ['rol_id' => $rolId, 'activo' => true, 'created_at' => $now, 'updated_at' => $now]
                );
            }
        }
    }
}
