<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmpresasSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $empresas = [
            [
                'nombre' => 'Central de Abastos Monterrey',
                'slug' => 'abastos-mty',
                'activa' => true,
                'brand_nombre_publico' => 'Abastos MTY',
                'brand_color' => '#16a34a',
                'skin' => 'emc',
                'config' => json_encode([
                    'contacto' => 'Juan Perez',
                    'whatsapp' => '528311234567',
                    'email' => 'ventas@abastosemty.com',
                    'impuestos' => ['iva' => 16],
                    'envio' => ['costo_base' => 50, 'gratis_desde' => 500],
                ]),
            ],
            [
                'nombre' => 'Frutas y Verduras del Norte',
                'slug' => 'fruver-norte',
                'activa' => true,
                'brand_nombre_publico' => 'FruVer Norte',
                'brand_color' => '#ea580c',
                'skin' => 'emc',
                'config' => json_encode([
                    'contacto' => 'Maria Garcia',
                    'whatsapp' => '528319876543',
                    'email' => 'contacto@fruvernorte.com',
                    'impuestos' => ['iva' => 16],
                    'envio' => ['costo_base' => 40, 'gratis_desde' => 400],
                ]),
            ],
        ];

        foreach ($empresas as $e) {
            DB::table('empresas')->updateOrInsert(
                ['slug' => $e['slug']],
                array_merge($e, ['created_at' => $now, 'updated_at' => $now])
            );
        }
    }
}
