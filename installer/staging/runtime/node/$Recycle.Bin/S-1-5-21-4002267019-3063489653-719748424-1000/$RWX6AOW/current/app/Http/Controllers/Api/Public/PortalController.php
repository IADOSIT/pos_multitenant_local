<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\PortalConfig;
use App\Models\Empresa;
use App\Models\StorePromotion;
use Illuminate\Http\Request;

class PortalController extends Controller
{
    /**
     * GET /api/public/portal-config
     */
    public function config()
    {
        $config = PortalConfig::getAll();

        return response()->json([
            'success' => true,
            'data' => [
                'portal_name' => $config['portal_name'] ?? 'Central de Abastos',
                'portal_tagline' => $config['portal_tagline'] ?? '',
                'portal_description' => $config['portal_description'] ?? '',
                'hero' => [
                    'title' => $config['hero_title'] ?? '',
                    'subtitle' => $config['hero_subtitle'] ?? '',
                    'cta_text' => $config['hero_cta_text'] ?? 'Explorar',
                    'image' => $config['hero_image'] ?? null,
                ],
                'developer' => [
                    'name' => $config['developer_name'] ?? 'iaDoS.mx',
                    'url' => $config['developer_url'] ?? 'https://iados.mx',
                    'email' => $config['developer_email'] ?? 'contacto@iados.mx',
                    'whatsapp' => $config['developer_whatsapp'] ?? '8318989580',
                ],
                'theme' => [
                    'primary_color' => $config['primary_color'] ?? '#16a34a',
                    'secondary_color' => $config['secondary_color'] ?? '#6b7280',
                ],
                'settings' => [
                    'show_prices' => (bool)($config['show_prices_in_portal'] ?? true),
                    'promos_per_store' => (int)($config['promos_per_store'] ?? 1),
                    'fallback_domain' => $config['fallback_domain'] ?? 'tiendas.emc.mx',
                    'ai_assistant_enabled' => filter_var($config['ai_assistant_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'ai_assistant_title' => $config['ai_assistant_title'] ?? 'Asistente IA',
                    'ai_assistant_welcome' => $config['ai_assistant_welcome'] ?? 'Hola! Puedo ayudarte a encontrar productos y tiendas.',
                ],
            ],
        ]);
    }

    /**
     * GET /api/public/stores
     */
    public function stores(Request $request)
    {
        $query = Empresa::where('activa', true)
            ->whereNotNull('handle')
            ->orderBy('is_featured', 'desc')
            ->orderBy('sort_order')
            ->orderBy('nombre');

        if ($request->has('featured')) {
            $query->where('is_featured', true);
        }

        $stores = $query->get()->map(fn($store) => $this->formatStore($store));

        return response()->json([
            'success' => true,
            'data' => $stores,
        ]);
    }

    /**
     * GET /api/public/stores/{handle}
     */
    public function store(string $handle)
    {
        $store = Empresa::findByHandle($handle);

        if (!$store) {
            return response()->json([
                'success' => false,
                'error' => 'store_not_found',
                'message' => 'Tienda no encontrada',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatStore($store, true),
        ]);
    }

    /**
     * GET /api/public/stores/{handle}/products
     */
    public function storeProducts(string $handle, Request $request)
    {
        $store = Empresa::findByHandle($handle);

        if (!$store) {
            return response()->json([
                'success' => false,
                'error' => 'store_not_found',
            ], 404);
        }

        $products = $store->productos()
            ->where('activo', true)
            ->with('categoria')
            ->orderBy('nombre')
            ->paginate($request->get('per_page', 20));

        // Format products with display_image
        $formattedProducts = collect($products->items())->map(fn($p) => [
            'id' => $p->id,
            'nombre' => $p->nombre,
            'descripcion' => $p->descripcion,
            'precio' => (float) $p->precio,
            'imagen_url' => $p->imagen_url,
            'display_image' => $p->display_image,
            'categoria' => $p->categoria ? [
                'id' => $p->categoria->id,
                'nombre' => $p->categoria->nombre,
            ] : null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $formattedProducts,
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * GET /api/public/stores/{handle}/products/{productId}
     */
    public function storeProduct(string $handle, $productId)
    {
        $store = Empresa::findByHandle($handle);

        if (!$store) {
            return response()->json([
                'success' => false,
                'error' => 'store_not_found',
            ], 404);
        }

        $product = $store->productos()
            ->where('activo', true)
            ->with('categoria')
            ->find($productId);

        if (!$product) {
            return response()->json([
                'success' => false,
                'error' => 'product_not_found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $product->id,
                'nombre' => $product->nombre,
                'descripcion' => $product->descripcion,
                'precio' => (float) $product->precio,
                'imagen_url' => $product->imagen_url,
                'categoria' => $product->categoria ? [
                    'id' => $product->categoria->id,
                    'nombre' => $product->categoria->nombre,
                    'slug' => $product->categoria->slug,
                ] : null,
                'store' => $this->formatStore($store),
            ],
        ]);
    }

    /**
     * GET /api/public/products
     * All products from all stores for the portal catalog
     */
    public function products(Request $request)
    {
        $query = \App\Models\Producto::where('activo', true)
            ->whereHas('empresa', fn($q) => $q->where('activa', true)->whereNotNull('handle'))
            ->with(['empresa', 'categoria']);

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('nombre', 'ilike', "%{$search}%")
                  ->orWhere('descripcion', 'ilike', "%{$search}%");
            });
        }

        // Category filter
        if ($request->has('categoria')) {
            $query->where('categoria_id', $request->get('categoria'));
        }

        // Store filter
        if ($request->has('tienda')) {
            $store = Empresa::findByHandle($request->get('tienda'));
            if ($store) {
                $query->where('empresa_id', $store->id);
            }
        }

        $products = $query->orderBy('nombre')->paginate($request->get('per_page', 24));

        $formattedProducts = collect($products->items())->map(fn($p) => [
            'id' => $p->id,
            'nombre' => $p->nombre,
            'descripcion' => $p->descripcion,
            'precio' => (float) $p->precio,
            'imagen_url' => $p->imagen_url,
            'display_image' => $p->display_image,
            'categoria' => $p->categoria ? [
                'id' => $p->categoria->id,
                'nombre' => $p->categoria->nombre,
            ] : null,
            'store' => $p->empresa ? [
                'id' => $p->empresa->id,
                'handle' => $p->empresa->handle,
                'nombre' => $p->empresa->nombre,
                'logo_url' => $p->empresa->display_logo,
                'store_url' => $p->empresa->store_url,
            ] : null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $formattedProducts,
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * GET /api/public/flyer
     * Products for the flyer/banner section
     */
    public function flyer()
    {
        $config = PortalConfig::getAll();
        $flyerEnabled = filter_var($config['flyer_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN);

        if (!$flyerEnabled) {
            return response()->json([
                'success' => true,
                'data' => [
                    'enabled' => false,
                    'products' => [],
                ],
            ]);
        }

        $flyerProductIds = $config['flyer_product_ids'] ?? null;
        $flyerCount = (int) ($config['flyer_product_count'] ?? 6);

        if ($flyerProductIds) {
            // Use configured products
            $ids = is_array($flyerProductIds) ? $flyerProductIds : json_decode($flyerProductIds, true);
            $products = \App\Models\Producto::whereIn('id', $ids ?: [])
                ->where('activo', true)
                ->whereHas('empresa', fn($q) => $q->where('activa', true))
                ->with(['empresa'])
                ->get();
        } else {
            // Get random products from featured stores
            $products = \App\Models\Producto::where('activo', true)
                ->whereHas('empresa', fn($q) => $q->where('activa', true)->whereNotNull('handle'))
                ->with(['empresa'])
                ->inRandomOrder()
                ->limit($flyerCount)
                ->get();
        }

        $formattedProducts = $products->map(fn($p) => [
            'id' => $p->id,
            'nombre' => $p->nombre,
            'precio' => (float) $p->precio,
            'display_image' => $p->display_image,
            'store' => $p->empresa ? [
                'handle' => $p->empresa->handle,
                'nombre' => $p->empresa->nombre,
                'store_url' => $p->empresa->store_url,
            ] : null,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'enabled' => true,
                'title' => $config['flyer_title'] ?? 'Productos destacados',
                'subtitle' => $config['flyer_subtitle'] ?? 'Del mercado de abastos a tu negocio',
                'products' => $formattedProducts,
            ],
        ]);
    }

    /**
     * GET /api/public/promotions
     */
    public function promotions(Request $request)
    {
        $perStore = (int) $request->get('per_store', PortalConfig::get('promos_per_store', 1));

        // Get active promotions grouped by store
        $promotions = StorePromotion::active()
            ->with(['empresa', 'producto'])
            ->whereHas('empresa', fn($q) => $q->where('activa', true)->whereNotNull('handle'))
            ->orderBy('empresa_id')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('empresa_id')
            ->map(fn($group) => $group->take($perStore))
            ->flatten()
            ->map(fn($promo) => $this->formatPromotion($promo));

        return response()->json([
            'success' => true,
            'data' => $promotions->values(),
        ]);
    }

    private function formatStore(Empresa $store, bool $detailed = false): array
    {
        $data = [
            'id' => $store->id,
            'handle' => $store->handle,
            'nombre' => $store->nombre,
            'descripcion' => $store->descripcion,
            'logo_url' => $store->display_logo,
            'primary_domain' => $store->primary_domain,
            'store_url' => $store->store_url,
            'is_featured' => $store->is_featured,
            'tags' => $store->tags ?? [],
            'brand_color' => $store->brand_color ?? $store->getPrimaryColor(),
        ];

        if ($detailed) {
            $data['productos_count'] = $store->productos()->where('activo', true)->count();
            $data['categorias'] = $store->categorias()
                ->where('activa', true)
                ->get(['id', 'nombre', 'slug']);
        }

        return $data;
    }

    private function formatPromotion(StorePromotion $promo): array
    {
        return [
            'id' => $promo->id,
            'title' => $promo->title,
            'description' => $promo->description,
            'promo_price' => $promo->promo_price ? (float) $promo->promo_price : null,
            'original_price' => $promo->original_price ? (float) $promo->original_price : null,
            'discount_percent' => $promo->discount_percent,
            'hero_image' => $promo->hero_image,
            'badge_text' => $promo->badge_text,
            'cta_text' => $promo->cta_text,
            'target_url' => $promo->target_url,
            'store' => $promo->empresa ? [
                'handle' => $promo->empresa->handle,
                'nombre' => $promo->empresa->nombre,
                'logo_url' => $promo->empresa->display_logo,
            ] : null,
            'producto' => $promo->producto ? [
                'id' => $promo->producto->id,
                'nombre' => $promo->producto->nombre,
                'imagen_url' => $promo->producto->imagen_url,
                'display_image' => $promo->producto->display_image,
            ] : null,
        ];
    }
}

