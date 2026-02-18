<?php

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        if (class_exists(\Database\Seeders\DatabaseSeeder::class)) {
            $this->call(\Database\Seeders\DatabaseSeeder::class);
            return;
        }

        // Fallback: seed roles and demo if namespaced classes exist
        if (class_exists(\Database\Seeders\RolesSeeder::class)) {
            $this->call(\Database\Seeders\RolesSeeder::class);
        }
        if (class_exists(\Database\Seeders\DemoSeeder::class)) {
            $this->call(\Database\Seeders\DemoSeeder::class);
        }
    }
}
