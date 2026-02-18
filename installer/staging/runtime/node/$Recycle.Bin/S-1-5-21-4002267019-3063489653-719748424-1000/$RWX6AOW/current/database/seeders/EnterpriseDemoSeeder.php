<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EnterpriseDemoSeeder extends Seeder
{
    public function run(): void
    {
        // Empresa demo
        $empresaId = (int) DB::table('empresas')->orderBy('id')->value('id');
        if (!$empresaId) {
            $empresaId = DB::table('empresas')->insertGetId([
                'nombre' => 'Central de Abastos',
                'slug' => 'abastos',
                'created_at'=>now(), 'updated_at'=>now()
            ]);
        }

        // Usuario admin demo (si tabla usuarios tiene email/password)
        if (DB::getSchemaBuilder()->hasTable('usuarios')) {
            $exists = DB::table('usuarios')->where('email','admin@abastos.local')->exists();
            if (!$exists) {
                $uid = DB::table('usuarios')->insertGetId([
                    'nombre'=>'Admin Abastos',
                    'email'=>'admin@abastos.local',
                    'password'=>Hash::make('ChangeMe#2026'),
                    'whatsapp'=>'+520000000000',
                    'created_at'=>now(),'updated_at'=>now()
                ]);
                // vincular empresa_usuario si existe
                if (DB::getSchemaBuilder()->hasTable('empresa_usuario')) {
                    $rolId = (int) DB::table('roles')->where('slug','admin_empresa')->value('id');
                    DB::table('empresa_usuario')->insert([
                        'empresa_id'=>$empresaId,
                        'usuario_id'=>$uid,
                        'rol_id'=>$rolId ?: null,
                        'created_at'=>now(),'updated_at'=>now()
                    ]);
                }
            }
        }

        // Categorías base
        $cats = [
          ['Frutas','frutas',1],
          ['Verduras','verduras',2],
          ['Abarrotes','abarrotes',3],
          ['Lácteos','lacteos',4],
        ];
        foreach ($cats as [$n,$slug,$ord]) {
            $id = DB::table('categorias')->where('empresa_id',$empresaId)->where('slug',$slug)->value('id');
            $payload = [
              'empresa_id'=>$empresaId, 'nombre'=>$n, 'slug'=>$slug, 'orden'=>$ord, 'activa'=>true,
              'created_at'=>now(),'updated_at'=>now()
            ];
            if ($id) DB::table('categorias')->where('id',$id)->update($payload);
            else DB::table('categorias')->insert($payload);
        }
        $catMap = DB::table('categorias')->where('empresa_id',$empresaId)->pluck('id','slug')->all();

        // Productos demo
        $products = [
          ['Manzana roja','frutas',32.50],
          ['Plátano','frutas',24.00],
          ['Jitomate','verduras',28.90],
          ['Cebolla blanca','verduras',19.50],
          ['Arroz 1kg','abarrotes',34.90],
          ['Frijol 1kg','abarrotes',39.90],
          ['Leche 1L','lacteos',27.50],
          ['Queso panela 250g','lacteos',49.00],
        ];
        foreach ($products as [$name,$catSlug,$price]) {
            $id = DB::table('productos')->where('empresa_id',$empresaId)->where('nombre',$name)->value('id');
            $payload = [
              'empresa_id'=>$empresaId,
              'categoria_id'=>$catMap[$catSlug] ?? null,
              'nombre'=>$name,
              'precio'=>$price,
              'sku'=>Str::upper(Str::random(8)),
              'descripcion'=>'Producto demo para pruebas',
              'activo'=>true,
              'meta'=>json_encode(['demo'=>true]),
              'created_at'=>now(),'updated_at'=>now()
            ];
            if ($id) DB::table('productos')->where('id',$id)->update($payload);
            else DB::table('productos')->insert($payload);
        }

        // Vendedor WhatsApp demo
        if (DB::getSchemaBuilder()->hasTable('vendedor_whatsapps')) {
            $exists = DB::table('vendedor_whatsapps')->where('empresa_id',$empresaId)->where('whatsapp','+520000000001')->exists();
            if (!$exists) {
                DB::table('vendedor_whatsapps')->insert([
                    'empresa_id'=>$empresaId,
                    'whatsapp'=>'+520000000001',
                    'activo'=>true,
                    'created_at'=>now(),'updated_at'=>now()
                ]);
            }
        }
    }
}
