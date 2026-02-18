<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Usuario;
use App\Models\Rol;
use App\Models\Categoria;
use App\Models\Producto;
use App\Models\Cliente;
use App\Models\Orden;
use App\Models\OrdenItem;
use App\Models\OrdenPago;
use App\Models\Theme;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class V3DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Create themes
        $this->createThemes();

        // Create roles if not exist
        $this->createRoles();

        // Create 2 empresas with different branding
        $empresas = $this->createEmpresas();

        // Create users
        $this->createUsers($empresas);

        // Create productos without images for auto-fetch testing
        $this->createProductos($empresas);

        // Create clientes
        $this->createClientes($empresas);

        // Create ordenes with different payment statuses
        $this->createOrdenes($empresas);
    }

    private function createThemes(): void
    {
        Theme::firstOrCreate(['slug' => 'abastos'], [
            'nombre' => 'Abastos Verde',
            'primary_color' => '#16a34a',
            'secondary_color' => '#6b7280',
            'accent_color' => '#3b82f6',
            'mode' => 'light',
            'description' => 'Tema verde tradicional del mercado de abastos',
            'is_default' => true,
            'activo' => true,
        ]);

        Theme::firstOrCreate(['slug' => 'minimal'], [
            'nombre' => 'Minimal Azul',
            'primary_color' => '#2563eb',
            'secondary_color' => '#64748b',
            'accent_color' => '#f59e0b',
            'mode' => 'light',
            'description' => 'Tema minimalista en tonos azules',
            'is_default' => false,
            'activo' => true,
        ]);

        Theme::firstOrCreate(['slug' => 'corporate'], [
            'nombre' => 'Corporate Oscuro',
            'primary_color' => '#1e293b',
            'secondary_color' => '#475569',
            'accent_color' => '#22c55e',
            'mode' => 'dark',
            'description' => 'Tema corporativo oscuro profesional',
            'is_default' => false,
            'activo' => true,
        ]);
    }

    private function createRoles(): void
    {
        $roles = [
            ['slug' => 'superadmin', 'nombre' => 'Super Administrador'],
            ['slug' => 'admin_empresa', 'nombre' => 'Administrador de Empresa'],
            ['slug' => 'operaciones', 'nombre' => 'Operaciones'],
            ['slug' => 'cliente', 'nombre' => 'Cliente'],
        ];

        foreach ($roles as $rol) {
            Rol::firstOrCreate(['slug' => $rol['slug']], $rol);
        }
    }

    private function createEmpresas(): array
    {
        $themeAbastos = Theme::where('slug', 'abastos')->first();
        $themeMinimal = Theme::where('slug', 'minimal')->first();

        $empresa1 = Empresa::firstOrCreate(['slug' => 'abastos-guadalupe'], [
            'nombre' => 'Mercado Guadalupe',
            'brand_nombre_publico' => 'Mercado De Abastos - Guadalupe',
            'brand_color' => '#16a34a',
            'activa' => true,
            'theme_id' => $themeAbastos?->id,
            'settings' => [
                'app_name' => 'Mercado De Abastos - Guadalupe',
                'primary_color' => '#16a34a',
                'secondary_color' => '#6b7280',
                'accent_color' => '#3b82f6',
                // MercadoPago sandbox credentials (for testing)
                'mp_public_key' => 'TEST-00000000-0000-0000-0000-000000000000',
                'mp_access_token' => 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000',
            ],
        ]);

        $empresa2 = Empresa::firstOrCreate(['slug' => 'abastos-sannicolas'], [
            'nombre' => 'Mercado San Nicolas',
            'brand_nombre_publico' => 'Mercado De Abastos - San Nicolas',
            'brand_color' => '#2563eb',
            'activa' => true,
            'theme_id' => $themeMinimal?->id,
            'settings' => [
                'app_name' => 'Mercado San Nicolas Online',
                'primary_color' => '#2563eb',
                'secondary_color' => '#64748b',
                'accent_color' => '#f59e0b',
            ],
        ]);

        return [$empresa1, $empresa2];
    }

    private function createUsers(array $empresas): void
    {
        $superadminRol = Rol::where('slug', 'superadmin')->first();
        $adminRol = Rol::where('slug', 'admin_empresa')->first();
        $opsRol = Rol::where('slug', 'operaciones')->first();

        // Superadmin
        $superadmin = Usuario::firstOrCreate(['email' => 'admin@iados.mx'], [
            'name' => 'Super Admin',
            'password' => Hash::make('password'),
            'whatsapp' => '8318989580',
            'activo' => true,
        ]);

        // Assign superadmin to all empresas
        foreach ($empresas as $empresa) {
            DB::table('empresa_usuario')->insertOrIgnore([
                'empresa_id' => $empresa->id,
                'usuario_id' => $superadmin->id,
                'rol_id' => $superadminRol->id,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Admin for empresa 1
        $admin1 = Usuario::firstOrCreate(['email' => 'admin.guadalupe@demo.com'], [
            'name' => 'Admin Guadalupe',
            'password' => Hash::make('password'),
            'whatsapp' => '8112345678',
            'activo' => true,
        ]);

        DB::table('empresa_usuario')->insertOrIgnore([
            'empresa_id' => $empresas[0]->id,
            'usuario_id' => $admin1->id,
            'rol_id' => $adminRol->id,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Operador for empresa 1
        $ops1 = Usuario::firstOrCreate(['email' => 'operador@demo.com'], [
            'name' => 'Operador Demo',
            'password' => Hash::make('password'),
            'whatsapp' => '8198765432',
            'activo' => true,
        ]);

        DB::table('empresa_usuario')->insertOrIgnore([
            'empresa_id' => $empresas[0]->id,
            'usuario_id' => $ops1->id,
            'rol_id' => $opsRol->id,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createProductos(array $empresas): void
    {
        foreach ($empresas as $empresa) {
            // Create category
            $categoria = Categoria::firstOrCreate([
                'empresa_id' => $empresa->id,
                'slug' => 'frutas-verduras',
            ], [
                'nombre' => 'Frutas y Verduras',
                'activa' => true,
            ]);

            // Products without images (for auto-fetch testing)
            $productos = [
                ['nombre' => 'Manzana Roja', 'precio' => 35.00],
                ['nombre' => 'Platano Tabasco', 'precio' => 25.00],
                ['nombre' => 'Naranja Valencia', 'precio' => 28.00],
                ['nombre' => 'Aguacate Hass', 'precio' => 89.00],
                ['nombre' => 'Tomate Saladette', 'precio' => 32.00],
                ['nombre' => 'Cebolla Blanca', 'precio' => 22.00],
                ['nombre' => 'Papa Alpha', 'precio' => 28.00],
                ['nombre' => 'Limon sin semilla', 'precio' => 45.00],
            ];

            foreach ($productos as $prod) {
                Producto::firstOrCreate([
                    'empresa_id' => $empresa->id,
                    'nombre' => $prod['nombre'],
                ], [
                    'categoria_id' => $categoria->id,
                    'descripcion' => 'Producto fresco de la mejor calidad',
                    'precio' => $prod['precio'],
                    'activo' => true,
                    'imagen_url' => null, // No image for auto-fetch testing
                    'meta' => ['auto_fetch_image' => true],
                ]);
            }
        }
    }

    private function createClientes(array $empresas): void
    {
        $clientes = [
            ['nombre' => 'Maria Garcia', 'whatsapp' => '8112223333', 'email' => 'maria@demo.com'],
            ['nombre' => 'Juan Perez', 'whatsapp' => '8114445555', 'email' => 'juan@demo.com'],
            ['nombre' => 'Ana Martinez', 'whatsapp' => '8116667777', 'email' => 'ana@demo.com'],
        ];

        foreach ($empresas as $empresa) {
            foreach ($clientes as $cli) {
                Cliente::firstOrCreate([
                    'empresa_id' => $empresa->id,
                    'whatsapp' => $cli['whatsapp'],
                ], [
                    'nombre' => $cli['nombre'],
                    'email' => $cli['email'],
                    'enviar_estatus' => true,
                ]);
            }
        }
    }

    private function createOrdenes(array $empresas): void
    {
        $statuses = ['paid', 'pending', 'failed'];

        foreach ($empresas as $empresa) {
            $clientes = Cliente::where('empresa_id', $empresa->id)->get();
            $productos = Producto::where('empresa_id', $empresa->id)->limit(4)->get();

            if ($clientes->isEmpty() || $productos->isEmpty()) continue;

            foreach ($statuses as $index => $status) {
                $cliente = $clientes[$index % $clientes->count()];
                $folio = 'EMC-' . strtoupper(Str::random(10));

                $orden = Orden::firstOrCreate(['folio' => $folio], [
                    'empresa_id' => $empresa->id,
                    'cliente_id' => $cliente->id,
                    'status' => $status === 'paid' ? 'confirmada' : 'creada',
                    'tipo_entrega' => 'pickup',
                    'comprador_nombre' => $cliente->nombre,
                    'comprador_whatsapp' => $cliente->whatsapp,
                    'comprador_email' => $cliente->email,
                    'subtotal' => 0,
                    'descuento' => 0,
                    'envio' => 0,
                    'total' => 0,
                    'meta' => ['metodo_pago_preferido' => 'mercadopago'],
                ]);

                $total = 0;
                foreach ($productos->take(2) as $producto) {
                    $qty = rand(1, 3);
                    $precio = $producto->precio;
                    $itemTotal = $precio * $qty;
                    $total += $itemTotal;

                    OrdenItem::firstOrCreate([
                        'orden_id' => $orden->id,
                        'producto_id' => $producto->id,
                    ], [
                        'precio' => $precio,
                        'cantidad' => $qty,
                    ]);
                }

                $orden->update([
                    'subtotal' => $total,
                    'total' => $total,
                ]);

                // Create payment record
                OrdenPago::firstOrCreate([
                    'orden_id' => $orden->id,
                    'metodo' => 'mercadopago',
                ], [
                    'monto' => $total,
                    'status' => $status,
                    'provider' => 'mercadopago',
                    'provider_id' => 'MP-' . strtoupper(Str::random(12)),
                ]);
            }
        }
    }
}
