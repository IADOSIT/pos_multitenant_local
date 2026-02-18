<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Producto;
use App\Models\StoreDomain;
use App\Models\StorePromotion;
use App\Models\PortalConfig;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class V4PortalSeeder extends Seeder
{
    public function run(): void
    {
        // Seed portal config defaults
        $this->seedPortalConfig();

        // Update empresas with handles and public_ids
        $this->updateEmpresas();

        // Create sample promotions
        $this->createPromotions();

        $this->command->info('V4 Portal data seeded successfully!');
    }

    private function seedPortalConfig(): void
    {
        $defaults = [
            'portal_name' => 'Central de Abastos Nuevo Leon',
            'portal_tagline' => 'Tu mercado de abastos en linea',
            'portal_description' => 'Conectamos a los mejores proveedores del mercado de abastos con compradores de todo Nuevo Leon. Frutas, verduras, abarrotes y mas, directo a tu negocio.',
            'hero_title' => 'Compra directo del mercado de abastos',
            'hero_subtitle' => 'Los mejores precios, la mejor calidad, directo a tu negocio o domicilio',
            'hero_cta_text' => 'Explorar tiendas',
            'developer_name' => 'iaDoS.mx',
            'developer_url' => 'https://iados.mx',
            'developer_email' => 'contacto@iados.mx',
            'developer_whatsapp' => '8318989580',
            'primary_color' => '#16a34a',
            'secondary_color' => '#6b7280',
            // fallback_domain removed - uses APP_URL by default
            'promos_per_store' => '1',
            'show_prices_in_portal' => '1',
        ];

        foreach ($defaults as $key => $value) {
            PortalConfig::firstOrCreate(['key' => $key], ['value' => $value]);
        }

        $this->command->info('Portal config seeded.');
    }

    private function updateEmpresas(): void
    {
        $empresas = Empresa::all();

        foreach ($empresas as $empresa) {
            if (!$empresa->public_id) {
                $empresa->public_id = Empresa::generatePublicId();
            }

            if (!$empresa->handle) {
                $empresa->handle = Str::slug($empresa->nombre) . '-' . $empresa->public_id;
            }

            if (!$empresa->description) {
                $empresa->description = "Productos frescos y de calidad de {$empresa->nombre}. Visita nuestra tienda en linea.";
            }

            $empresa->save();

            $this->command->info("Updated empresa: {$empresa->nombre} -> handle: {$empresa->handle}");
        }
    }

    private function createPromotions(): void
    {
        $empresas = Empresa::where('activa', true)->whereNotNull('handle')->get();

        foreach ($empresas as $empresa) {
            // Get a random product from this empresa
            $producto = Producto::where('empresa_id', $empresa->id)
                ->where('activo', true)
                ->inRandomOrder()
                ->first();

            if (!$producto) continue;

            StorePromotion::firstOrCreate([
                'empresa_id' => $empresa->id,
                'producto_id' => $producto->id,
            ], [
                'title' => "Oferta en {$producto->nombre}",
                'description' => "Aprovecha esta oferta especial en {$empresa->nombre}",
                'promo_price' => round($producto->precio * 0.85, 2), // 15% discount
                'original_price' => $producto->precio,
                'badge_text' => 'Oferta',
                'cta_text' => 'Ver oferta',
                'is_active' => true,
                'sort_order' => 0,
            ]);

            $this->command->info("Created promo for {$empresa->nombre}");
        }
    }
}
