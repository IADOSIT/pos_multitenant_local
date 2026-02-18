<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Producto;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FruteriaIadosSeeder extends Seeder
{
    public function run(): void
    {
        // Find the "iados" empresa by handle, slug, or name
        $empresa = Empresa::where('handle', 'like', '%iados%')
            ->orWhere('slug', 'like', '%iados%')
            ->orWhere('nombre', 'like', '%iados%')
            ->orWhere('brand_nombre_publico', 'like', '%iados%')
            ->first();

        if (!$empresa) {
            $this->command->error('No se encontro una empresa con "iados". Empresas disponibles:');
            Empresa::all()->each(fn($e) => $this->command->line("  ID:{$e->id} | slug:{$e->slug} | handle:{$e->handle} | nombre:{$e->nombre}"));
            return;
        }

        $this->command->info("Empresa encontrada: [{$empresa->id}] {$empresa->nombre} (handle: {$empresa->handle})");

        // Create categories
        $catTropicales = Categoria::firstOrCreate([
            'empresa_id' => $empresa->id,
            'slug' => 'frutas-tropicales',
        ], [
            'nombre' => 'Frutas Tropicales',
            'orden' => 1,
            'activa' => true,
        ]);

        $catTemporada = Categoria::firstOrCreate([
            'empresa_id' => $empresa->id,
            'slug' => 'frutas-de-temporada',
        ], [
            'nombre' => 'Frutas de Temporada',
            'orden' => 2,
            'activa' => true,
        ]);

        $this->command->info("Categorias creadas: {$catTropicales->nombre}, {$catTemporada->nombre}");

        // 10 fruit products with real Unsplash images
        $productos = [
            [
                'nombre' => 'Mango Ataulfo',
                'descripcion' => 'Mango Ataulfo premium de Chiapas. Pulpa suave, dulce y sin fibra. Ideal para postres, smoothies o para comer fresco. Temporada de marzo a julio.',
                'precio' => 45.00,
                'sku' => 'FRU-MANGO-001',
                'categoria_id' => $catTropicales->id,
                'imagen_url' => 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&h=600&fit=crop&q=80',
            ],
            [
                'nombre' => 'Fresa Orgánica',
                'descripcion' => 'Fresas orgánicas cultivadas en Irapuato, Guanajuato. Rojas, jugosas y llenas de sabor. Ricas en vitamina C y antioxidantes. Presentación por kilo.',
                'precio' => 65.00,
                'sku' => 'FRU-FRESA-002',
                'categoria_id' => $catTemporada->id,
                'imagen_url' => 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&h=600&fit=crop&q=80',
            ],
            [
                'nombre' => 'Piña Miel',
                'descripcion' => 'Piña miel de Veracruz, dulce y jugosa. Perfecta para aguas frescas, ensaladas de frutas o al natural. Peso aproximado 1.5-2 kg por pieza.',
                'precio' => 35.00,
                'sku' => 'FRU-PINA-003',
                'categoria_id' => $catTropicales->id,
                'imagen_url' => 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&h=600&fit=crop&q=80',
            ],
            [
                'nombre' => 'Sandía Rayada',
                'descripcion' => 'Sandía rayada de Sonora, refrescante y dulce. Pulpa roja, crujiente y con pocas semillas. Ideal para el calor. Precio por kilogramo.',
                'precio' => 15.00,
                'sku' => 'FRU-SANDIA-004',
                'categoria_id' => $catTropicales->id,
                'imagen_url' => 'https://images.unsplash.com/photo-1589984662646-e7b2e28d0a3c?w=600&h=600&fit=crop&q=80',
            ],
            [
                'nombre' => 'Papaya Maradol',
                'descripcion' => 'Papaya Maradol de Tabasco, pulpa naranja intenso, dulce y cremosa. Rica en enzimas digestivas y vitamina A. Peso aprox 2-3 kg por pieza.',
                'precio' => 28.00,
                'sku' => 'FRU-PAPAY-005',
                'categoria_id' => $catTropicales->id,
                'imagen_url' => 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=600&h=600&fit=crop&q=80',
            ],
            [
                'nombre' => 'Uva Red Globe',
                'descripcion' => 'Uva Red Globe importada, granos grandes y carnosos. Dulce con toque ácido. Ideal para mesa, lunch o decoración de postres. Precio por kilo.',
                'precio' => 55.00,
                'sku' => 'FRU-UVA-006',
                'categoria_id' => $catTemporada->id,
                'imagen_url' => 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&h=600&fit=crop&q=80',
            ],
            [
                'nombre' => 'Manzana Gala',
                'descripcion' => 'Manzana Gala de Chihuahua, crujiente y con un dulzor equilibrado. Perfecta para ensaladas, loncheras o snack saludable. Precio por kilogramo.',
                'precio' => 42.00,
                'sku' => 'FRU-MANZA-007',
                'categoria_id' => $catTemporada->id,
                'imagen_url' => 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&h=600&fit=crop&q=80',
            ],
            [
                'nombre' => 'Plátano Dominico',
                'descripcion' => 'Plátano Dominico de Tabasco, pequeño pero con sabor intenso y dulce. Ideal para postres, licuados o como snack rápido. Precio por kilo.',
                'precio' => 22.00,
                'sku' => 'FRU-PLAT-008',
                'categoria_id' => $catTropicales->id,
                'imagen_url' => 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&h=600&fit=crop&q=80',
            ],
            [
                'nombre' => 'Melón Chino',
                'descripcion' => 'Melón chino de Coahuila, pulpa verde clara, aromática y muy dulce. Refrescante y bajo en calorías. Peso aprox 1.5-2 kg por pieza.',
                'precio' => 25.00,
                'sku' => 'FRU-MELON-009',
                'categoria_id' => $catTemporada->id,
                'imagen_url' => 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=600&h=600&fit=crop&q=80',
            ],
            [
                'nombre' => 'Guayaba Rosa',
                'descripcion' => 'Guayaba rosa de Aguascalientes, aromática y rica en vitamina C. Ideal para ates, aguas frescas, mermeladas o comer fresca. Temporada otoño-invierno.',
                'precio' => 30.00,
                'sku' => 'FRU-GUAYA-010',
                'categoria_id' => $catTemporada->id,
                'imagen_url' => 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=600&h=600&fit=crop&q=80',
            ],
        ];

        foreach ($productos as $prod) {
            $producto = Producto::firstOrCreate([
                'empresa_id' => $empresa->id,
                'sku' => $prod['sku'],
            ], [
                'nombre' => $prod['nombre'],
                'descripcion' => $prod['descripcion'],
                'precio' => $prod['precio'],
                'categoria_id' => $prod['categoria_id'],
                'imagen_url' => $prod['imagen_url'],
                'image_source' => 'manual',
                'use_auto_image' => false,
                'activo' => true,
                'meta' => null,
            ]);

            // Create/update inventory with stock
            DB::table('inventarios')->updateOrInsert(
                ['empresa_id' => $empresa->id, 'producto_id' => $producto->id],
                [
                    'stock' => rand(20, 150),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $this->command->info("  + {$producto->nombre} - \${$prod['precio']} (stock: inventario creado)");
        }

        $this->command->info('');
        $this->command->info("10 productos de fruteria creados para {$empresa->nombre}");
        $this->command->info("Categorias: {$catTropicales->nombre} ({$catTropicales->productos()->count()} prods), {$catTemporada->nombre} ({$catTemporada->productos()->count()} prods)");
    }
}
