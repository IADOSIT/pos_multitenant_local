<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesSeeder::class,
            EmpresasSeeder::class,
            UsersSeeder::class,
            CategoriasSeeder::class,
            ProductosSeeder::class,
            InventarioSeeder::class,
            OrdenesSeeder::class,
            CajaSeeder::class,
            WhatsappLogsSeeder::class,
        ]);
    }
}
