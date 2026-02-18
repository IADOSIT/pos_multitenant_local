<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DemoStoreSeeder extends Seeder
{
    public function run(): void
    {
        $empresaId = (int) DB::table('empresas')->orderBy('id')->value('id');
        if (!$empresaId) return;

        $catHasOrden = Schema::hasColumn('categorias', 'orden');
        $catHasActiva = Schema::hasColumn('categorias', 'activa');

        $cats = [
            ['Frutas','frutas'],
            ['Verduras','verduras'],
            ['Abarrotes','abarrotes'],
            ['Lácteos','lacteos'],
        ];

        foreach ($cats as $i => [$name,$slug]) {
            $data = [
                'empresa_id' => $empresaId,
                'slug' => $slug,
                'nombre' => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if ($catHasActiva) $data['activa'] = true;
            if ($catHasOrden) $data['orden'] = $i + 1;

            $exists = DB::table('categorias')->where('empresa_id',$empresaId)->where('slug',$slug)->exists();
            if ($exists) {
                DB::table('categorias')->where('empresa_id',$empresaId)->where('slug',$slug)->update($data);
            } else {
                DB::table('categorias')->insert($data);
            }
        }

        $catQuery = DB::table('categorias')->where('empresa_id',$empresaId);
        $catMap = [];
        if (Schema::hasColumn('categorias','slug')) {
            $catMap = $catQuery->pluck('id','slug')->all();
        } else {
            foreach ($catQuery->get(['id','nombre']) as $row) {
                $catMap[Str::slug($row->nombre)] = $row->id;
            }
        }

        $prodHasCategoriaId = Schema::hasColumn('productos', 'categoria_id');
        $prodHasSku = Schema::hasColumn('productos', 'sku');
        $prodHasDescripcion = Schema::hasColumn('productos', 'descripcion');
        $prodHasActivo = Schema::hasColumn('productos', 'activo');
        $prodHasMeta = Schema::hasColumn('productos', 'meta');

        $products = [
            ['Manzana roja', 'frutas', 32.50],
            ['Plátano', 'frutas', 24.00],
            ['Jitomate', 'verduras', 28.90],
            ['Cebolla blanca', 'verduras', 19.50],
            ['Arroz 1kg', 'abarrotes', 34.90],
            ['Frijol 1kg', 'abarrotes', 39.90],
            ['Leche 1L', 'lacteos', 27.50],
            ['Queso panela 250g', 'lacteos', 49.00],
        ];

        foreach ($products as [$name,$catSlug,$price]) {
            $data = [
                'empresa_id' => $empresaId,
                'nombre' => $name,
                'precio' => $price,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if ($prodHasCategoriaId) $data['categoria_id'] = $catMap[$catSlug] ?? null;
            if ($prodHasSku) $data['sku'] = Str::upper(Str::random(8));
            if ($prodHasDescripcion) $data['descripcion'] = 'Producto demo para pruebas';
            if ($prodHasActivo) $data['activo'] = true;
            if ($prodHasMeta) $data['meta'] = json_encode(['demo'=>true]);

            $exists = DB::table('productos')->where('empresa_id',$empresaId)->where('nombre',$name)->exists();
            if ($exists) {
                DB::table('productos')->where('empresa_id',$empresaId)->where('nombre',$name)->update($data);
            } else {
                DB::table('productos')->insert($data);
            }
        }
    }
}
