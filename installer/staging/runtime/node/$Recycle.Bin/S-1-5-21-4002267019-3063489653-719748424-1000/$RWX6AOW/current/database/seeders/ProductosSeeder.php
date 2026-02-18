<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductosSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Get empresas
        $empresas = DB::table('empresas')->pluck('id', 'slug')->toArray();

        // Get categorias by empresa and nombre
        $categorias = DB::table('categorias')
            ->get()
            ->groupBy('empresa_id')
            ->map(fn($items) => $items->pluck('id', 'nombre')->toArray())
            ->toArray();

        $productos = [
            // Abastos MTY - Frutas
            ['empresa' => 'abastos-mty', 'categoria' => 'Frutas', 'sku' => 'FRU-001', 'nombre' => 'Manzana Roja', 'precio' => 35.00, 'descripcion' => 'Manzana roja de temporada, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Frutas', 'sku' => 'FRU-002', 'nombre' => 'Platano Tabasco', 'precio' => 18.00, 'descripcion' => 'Platano de Tabasco, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Frutas', 'sku' => 'FRU-003', 'nombre' => 'Naranja Valencia', 'precio' => 22.00, 'descripcion' => 'Naranja para jugo, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Frutas', 'sku' => 'FRU-004', 'nombre' => 'Limon sin semilla', 'precio' => 28.00, 'descripcion' => 'Limon verde sin semilla, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Frutas', 'sku' => 'FRU-005', 'nombre' => 'Papaya Maradol', 'precio' => 32.00, 'descripcion' => 'Papaya maradol fresca, por kilogramo'],

            // Abastos MTY - Verduras
            ['empresa' => 'abastos-mty', 'categoria' => 'Verduras', 'sku' => 'VER-001', 'nombre' => 'Tomate Bola', 'precio' => 25.00, 'descripcion' => 'Tomate bola rojo, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Verduras', 'sku' => 'VER-002', 'nombre' => 'Cebolla Blanca', 'precio' => 18.00, 'descripcion' => 'Cebolla blanca mediana, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Verduras', 'sku' => 'VER-003', 'nombre' => 'Chile Serrano', 'precio' => 45.00, 'descripcion' => 'Chile serrano verde, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Verduras', 'sku' => 'VER-004', 'nombre' => 'Zanahoria', 'precio' => 15.00, 'descripcion' => 'Zanahoria fresca, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Verduras', 'sku' => 'VER-005', 'nombre' => 'Papa Alpha', 'precio' => 20.00, 'descripcion' => 'Papa alpha lavada, por kilogramo'],

            // Abastos MTY - Carnes
            ['empresa' => 'abastos-mty', 'categoria' => 'Carnes', 'sku' => 'CAR-001', 'nombre' => 'Pechuga de Pollo', 'precio' => 89.00, 'descripcion' => 'Pechuga de pollo fresca, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Carnes', 'sku' => 'CAR-002', 'nombre' => 'Bistec de Res', 'precio' => 165.00, 'descripcion' => 'Bistec de res suave, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Carnes', 'sku' => 'CAR-003', 'nombre' => 'Costilla de Cerdo', 'precio' => 95.00, 'descripcion' => 'Costilla de cerdo fresca, por kilogramo'],

            // Abastos MTY - Lacteos
            ['empresa' => 'abastos-mty', 'categoria' => 'Lacteos', 'sku' => 'LAC-001', 'nombre' => 'Leche Entera 1L', 'precio' => 28.00, 'descripcion' => 'Leche entera pasteurizada, 1 litro'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Lacteos', 'sku' => 'LAC-002', 'nombre' => 'Queso Panela', 'precio' => 85.00, 'descripcion' => 'Queso panela fresco, por kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Lacteos', 'sku' => 'LAC-003', 'nombre' => 'Crema Acida', 'precio' => 45.00, 'descripcion' => 'Crema acida, 500ml'],

            // Abastos MTY - Abarrotes
            ['empresa' => 'abastos-mty', 'categoria' => 'Abarrotes', 'sku' => 'ABA-001', 'nombre' => 'Arroz Morelos 1kg', 'precio' => 32.00, 'descripcion' => 'Arroz grano largo, 1 kilogramo'],
            ['empresa' => 'abastos-mty', 'categoria' => 'Abarrotes', 'sku' => 'ABA-002', 'nombre' => 'Frijol Negro 1kg', 'precio' => 38.00, 'descripcion' => 'Frijol negro, 1 kilogramo'],

            // FruVer Norte - Frutas Frescas
            ['empresa' => 'fruver-norte', 'categoria' => 'Frutas Frescas', 'sku' => 'FF-001', 'nombre' => 'Mango Ataulfo', 'precio' => 45.00, 'descripcion' => 'Mango ataulfo premium, por kilogramo'],
            ['empresa' => 'fruver-norte', 'categoria' => 'Frutas Frescas', 'sku' => 'FF-002', 'nombre' => 'Fresa Premium', 'precio' => 65.00, 'descripcion' => 'Fresa organica premium, por kilogramo'],
            ['empresa' => 'fruver-norte', 'categoria' => 'Frutas Frescas', 'sku' => 'FF-003', 'nombre' => 'Arandano Organico', 'precio' => 120.00, 'descripcion' => 'Arandano organico, 250g'],

            // FruVer Norte - Verduras Organicas
            ['empresa' => 'fruver-norte', 'categoria' => 'Verduras Organicas', 'sku' => 'VO-001', 'nombre' => 'Lechuga Romana Org', 'precio' => 28.00, 'descripcion' => 'Lechuga romana organica, pieza'],
            ['empresa' => 'fruver-norte', 'categoria' => 'Verduras Organicas', 'sku' => 'VO-002', 'nombre' => 'Espinaca Organica', 'precio' => 35.00, 'descripcion' => 'Espinaca baby organica, 200g'],
            ['empresa' => 'fruver-norte', 'categoria' => 'Verduras Organicas', 'sku' => 'VO-003', 'nombre' => 'Brocoli Organico', 'precio' => 42.00, 'descripcion' => 'Brocoli organico, pieza'],
        ];

        foreach ($productos as $p) {
            $empresaId = $empresas[$p['empresa']] ?? null;
            if (!$empresaId) continue;

            $categoriaId = $categorias[$empresaId][$p['categoria']] ?? null;
            if (!$categoriaId) continue;

            DB::table('productos')->updateOrInsert(
                ['empresa_id' => $empresaId, 'sku' => $p['sku']],
                [
                    'categoria_id' => $categoriaId,
                    'nombre' => $p['nombre'],
                    'descripcion' => $p['descripcion'],
                    'precio' => $p['precio'],
                    'activo' => true,
                    'meta' => json_encode(['imagen_url' => null]),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
