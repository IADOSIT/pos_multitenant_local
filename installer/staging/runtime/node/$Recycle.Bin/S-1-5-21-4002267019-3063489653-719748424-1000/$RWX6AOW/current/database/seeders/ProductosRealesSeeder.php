<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Database\Seeder;

class ProductosRealesSeeder extends Seeder
{
    public function run(): void
    {
        $empresas = Empresa::all();

        if ($empresas->isEmpty()) {
            $this->command->error('No hay empresas. Ejecuta V3DemoSeeder primero.');
            return;
        }

        foreach ($empresas as $empresa) {
            // Crear categorias
            $catFrutas = Categoria::firstOrCreate([
                'empresa_id' => $empresa->id,
                'slug' => 'frutas',
            ], [
                'nombre' => 'Frutas',
                'activa' => true,
            ]);

            $catVerduras = Categoria::firstOrCreate([
                'empresa_id' => $empresa->id,
                'slug' => 'verduras',
            ], [
                'nombre' => 'Verduras',
                'activa' => true,
            ]);

            $catAbarrotes = Categoria::firstOrCreate([
                'empresa_id' => $empresa->id,
                'slug' => 'abarrotes',
            ], [
                'nombre' => 'Abarrotes',
                'activa' => true,
            ]);

            // 10 productos reales con fotos de Unsplash
            $productos = [
                [
                    'nombre' => 'Manzana Gala Premium',
                    'descripcion' => 'Manzanas Gala frescas importadas de Washington. Dulces y crujientes, perfectas para consumo directo o ensaladas.',
                    'precio' => 45.00,
                    'categoria_id' => $catFrutas->id,
                    'imagen_url' => 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop',
                ],
                [
                    'nombre' => 'Aguacate Hass Michoacan',
                    'descripcion' => 'Aguacate Hass de Michoacan, el mejor del mundo. Cremoso, con sabor intenso. Ideal para guacamole.',
                    'precio' => 89.00,
                    'categoria_id' => $catFrutas->id,
                    'imagen_url' => 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=400&fit=crop',
                ],
                [
                    'nombre' => 'Platano Tabasco',
                    'descripcion' => 'Platano macho de Tabasco, ideal para freir o preparar platanos machos. Dulce y firme.',
                    'precio' => 28.00,
                    'categoria_id' => $catFrutas->id,
                    'imagen_url' => 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop',
                ],
                [
                    'nombre' => 'Naranja Valencia para Jugo',
                    'descripcion' => 'Naranjas Valencia jugosas y dulces. Perfectas para hacer jugo fresco natural por las mananas.',
                    'precio' => 32.00,
                    'categoria_id' => $catFrutas->id,
                    'imagen_url' => 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=400&fit=crop',
                ],
                [
                    'nombre' => 'Tomate Saladette Rojo',
                    'descripcion' => 'Tomate saladette rojo maduro. Ideal para salsas, ensaladas y guisados. Cultivado en invernadero.',
                    'precio' => 35.00,
                    'categoria_id' => $catVerduras->id,
                    'imagen_url' => 'https://images.unsplash.com/photo-1546470427-227c7369a9b5?w=400&h=400&fit=crop',
                ],
                [
                    'nombre' => 'Cebolla Blanca Grande',
                    'descripcion' => 'Cebolla blanca grande seleccionada. Base esencial de la cocina mexicana. Fresca y crujiente.',
                    'precio' => 25.00,
                    'categoria_id' => $catVerduras->id,
                    'imagen_url' => 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop',
                ],
                [
                    'nombre' => 'Chile Serrano Verde',
                    'descripcion' => 'Chile serrano verde fresco. Picante medio, ideal para salsas verdes y guisados tradicionales.',
                    'precio' => 55.00,
                    'categoria_id' => $catVerduras->id,
                    'imagen_url' => 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&h=400&fit=crop',
                ],
                [
                    'nombre' => 'Limon sin Semilla',
                    'descripcion' => 'Limon persa sin semilla, jugoso y acido. Indispensable en la cocina mexicana y para bebidas.',
                    'precio' => 48.00,
                    'categoria_id' => $catFrutas->id,
                    'imagen_url' => 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&h=400&fit=crop',
                ],
                [
                    'nombre' => 'Papa Alpha Lavada',
                    'descripcion' => 'Papa alpha lavada y seleccionada. Textura firme, ideal para freir, hornear o preparar pure.',
                    'precio' => 30.00,
                    'categoria_id' => $catVerduras->id,
                    'imagen_url' => 'https://images.unsplash.com/photo-1518977676601-b53f82ber51?w=400&h=400&fit=crop',
                ],
                [
                    'nombre' => 'Arroz Morelos Premium 1kg',
                    'descripcion' => 'Arroz grano largo de Morelos. Rinde mas, queda suelto y esponjoso. Bolsa de 1 kilogramo.',
                    'precio' => 38.00,
                    'categoria_id' => $catAbarrotes->id,
                    'imagen_url' => 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
                ],
            ];

            foreach ($productos as $prod) {
                Producto::updateOrCreate([
                    'empresa_id' => $empresa->id,
                    'nombre' => $prod['nombre'],
                ], [
                    'categoria_id' => $prod['categoria_id'],
                    'descripcion' => $prod['descripcion'],
                    'precio' => $prod['precio'],
                    'activo' => true,
                    'imagen_url' => $prod['imagen_url'],
                ]);
            }

            $this->command->info("10 productos creados para: {$empresa->nombre}");
        }
    }
}
