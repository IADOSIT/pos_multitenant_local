<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategoriasSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $empresas = DB::table('empresas')->pluck('id', 'slug')->toArray();

        $categorias = [
            // Abastos MTY
            ['empresa' => 'abastos-mty', 'nombre' => 'Frutas', 'orden' => 1],
            ['empresa' => 'abastos-mty', 'nombre' => 'Verduras', 'orden' => 2],
            ['empresa' => 'abastos-mty', 'nombre' => 'Carnes', 'orden' => 3],
            ['empresa' => 'abastos-mty', 'nombre' => 'Lacteos', 'orden' => 4],
            ['empresa' => 'abastos-mty', 'nombre' => 'Abarrotes', 'orden' => 5],
            ['empresa' => 'abastos-mty', 'nombre' => 'Bebidas', 'orden' => 6],
            // FruVer Norte
            ['empresa' => 'fruver-norte', 'nombre' => 'Frutas Frescas', 'orden' => 1],
            ['empresa' => 'fruver-norte', 'nombre' => 'Verduras Organicas', 'orden' => 2],
            ['empresa' => 'fruver-norte', 'nombre' => 'Especias', 'orden' => 3],
            ['empresa' => 'fruver-norte', 'nombre' => 'Legumbres', 'orden' => 4],
        ];

        foreach ($categorias as $c) {
            $empresaId = $empresas[$c['empresa']] ?? null;
            if (!$empresaId) continue;

            DB::table('categorias')->updateOrInsert(
                ['empresa_id' => $empresaId, 'slug' => Str::slug($c['nombre'])],
                [
                    'nombre' => $c['nombre'],
                    'orden' => $c['orden'],
                    'activa' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
