<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortalConfig;
use App\Models\Empresa;
use App\Models\Producto;
use Illuminate\Http\Request;

class PortalConfigController extends Controller
{
    public function index()
    {
        $config = PortalConfig::getAll();
        $defaults = PortalConfig::getDefaults();

        // Get empresas for featured selection
        $empresas = Empresa::where('activa', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'handle']);

        // Get products for flyer selection
        $productos = Producto::where('activo', true)
            ->whereHas('empresa', fn($q) => $q->where('activa', true))
            ->with('empresa:id,nombre')
            ->orderBy('nombre')
            ->limit(100)
            ->get(['id', 'nombre', 'empresa_id']);

        // Parse JSON fields
        $featuredStoreIds = $config['featured_store_ids'] ?? null;
        if (is_string($featuredStoreIds)) {
            $featuredStoreIds = json_decode($featuredStoreIds, true);
        }

        $flyerProductIds = $config['flyer_product_ids'] ?? null;
        if (is_string($flyerProductIds)) {
            $flyerProductIds = json_decode($flyerProductIds, true);
        }

        return view('admin.portal.config', compact('config', 'defaults', 'empresas', 'productos', 'featuredStoreIds', 'flyerProductIds'));
    }

    public function update(Request $request)
    {
        $request->validate([
            'portal_name' => 'required|string|max:200',
            'portal_tagline' => 'nullable|string|max:300',
            'portal_description' => 'nullable|string|max:1000',
            'hero_title' => 'nullable|string|max:200',
            'hero_subtitle' => 'nullable|string|max:300',
            'hero_cta_text' => 'nullable|string|max:50',
            'developer_name' => 'nullable|string|max:100',
            'developer_url' => 'nullable|url|max:255',
            'developer_email' => 'nullable|email|max:255',
            'developer_whatsapp' => 'nullable|string|max:20',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'fallback_domain' => 'nullable|string|max:255',
            'promos_per_store' => 'nullable|integer|min:1|max:10',
            'show_prices_in_portal' => 'nullable|boolean',
            // Flyer settings
            'flyer_enabled' => 'nullable|boolean',
            'flyer_title' => 'nullable|string|max:100',
            'flyer_subtitle' => 'nullable|string|max:200',
            'flyer_product_ids' => 'nullable|array',
            'flyer_product_count' => 'nullable|integer|min:1|max:12',
            'flyer_accent_color' => 'nullable|string|max:20',
            // Featured stores
            'featured_store_ids' => 'nullable|array',
            // AI Assistant
            'ai_assistant_enabled' => 'nullable|boolean',
            'ai_assistant_title' => 'nullable|string|max:50',
            'ai_assistant_welcome' => 'nullable|string|max:500',
            // Home redirect
            'home_redirect_path' => 'nullable|string|max:100',
        ]);

        $fields = [
            'portal_name', 'portal_tagline', 'portal_description',
            'hero_title', 'hero_subtitle', 'hero_cta_text',
            'developer_name', 'developer_url', 'developer_email', 'developer_whatsapp',
            'primary_color', 'secondary_color', 'fallback_domain',
            'flyer_title', 'flyer_subtitle', 'flyer_accent_color',
            'ai_assistant_title', 'ai_assistant_welcome',
            'home_redirect_path',
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                PortalConfig::set($field, $request->input($field));
            }
        }

        // Handle integer types
        if ($request->has('promos_per_store')) {
            PortalConfig::set('promos_per_store', (int)$request->input('promos_per_store'), 'integer');
        }
        if ($request->has('flyer_product_count')) {
            PortalConfig::set('flyer_product_count', (int)$request->input('flyer_product_count'), 'integer');
        }

        // Handle boolean types
        PortalConfig::set('show_prices_in_portal', $request->boolean('show_prices_in_portal'), 'boolean');
        PortalConfig::set('flyer_enabled', $request->boolean('flyer_enabled'), 'boolean');
        PortalConfig::set('ai_assistant_enabled', $request->boolean('ai_assistant_enabled'), 'boolean');

        // Handle JSON arrays
        $flyerProductIds = $request->input('flyer_product_ids', []);
        PortalConfig::set('flyer_product_ids', !empty($flyerProductIds) ? $flyerProductIds : null, 'json');

        $featuredStoreIds = $request->input('featured_store_ids', []);
        PortalConfig::set('featured_store_ids', !empty($featuredStoreIds) ? $featuredStoreIds : null, 'json');

        // Update empresas is_featured based on selection
        Empresa::where('is_featured', true)->update(['is_featured' => false]);
        if (!empty($featuredStoreIds)) {
            Empresa::whereIn('id', $featuredStoreIds)->update(['is_featured' => true]);
        }

        PortalConfig::clearCache();

        return redirect()->route('admin.portal.config')
            ->with('success', 'Configuracion del portal actualizada.');
    }
}
