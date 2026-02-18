<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\StorePromotion;
use App\Models\Producto;
use Illuminate\Http\Request;

class StorePromotionsController extends Controller
{
    public function index(Request $request)
    {
        $empresaId = session('empresa_id');

        $query = StorePromotion::with(['empresa', 'producto'])
            ->orderBy('empresa_id')
            ->orderBy('sort_order')
            ->orderByDesc('created_at');

        // Filter by empresa if not superadmin viewing all
        if ($empresaId && !$request->has('all')) {
            $query->where('empresa_id', $empresaId);
        }

        $promotions = $query->paginate(20);
        $empresas = Empresa::where('activa', true)->orderBy('nombre')->get();

        return view('admin.promotions.index', compact('promotions', 'empresas'));
    }

    public function create()
    {
        $empresaId = session('empresa_id');
        $empresas = Empresa::where('activa', true)->orderBy('nombre')->get();
        $productos = Producto::where('empresa_id', $empresaId)->where('activo', true)->orderBy('nombre')->get();

        return view('admin.promotions.create', compact('empresas', 'productos', 'empresaId'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'producto_id' => 'nullable|exists:productos,id',
            'title' => 'required|string|max:200',
            'description' => 'nullable|string|max:500',
            'promo_price' => 'nullable|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'hero_image' => 'nullable|url|max:500',
            'badge_text' => 'nullable|string|max:50',
            'cta_text' => 'nullable|string|max:100',
            'cta_url' => 'nullable|url|max:500',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $promo = StorePromotion::create([
            'empresa_id' => $request->empresa_id,
            'producto_id' => $request->producto_id,
            'title' => $request->title,
            'description' => $request->description,
            'promo_price' => $request->promo_price,
            'original_price' => $request->original_price ?: ($request->producto_id ? Producto::find($request->producto_id)?->precio : null),
            'hero_image' => $request->hero_image,
            'badge_text' => $request->badge_text,
            'cta_text' => $request->cta_text ?: 'Ver oferta',
            'cta_url' => $request->cta_url,
            'starts_at' => $request->starts_at,
            'ends_at' => $request->ends_at,
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('admin.promotions.index')
            ->with('success', 'Promocion creada exitosamente.');
    }

    public function edit(StorePromotion $promotion)
    {
        $empresas = Empresa::where('activa', true)->orderBy('nombre')->get();
        $productos = Producto::where('empresa_id', $promotion->empresa_id)->where('activo', true)->orderBy('nombre')->get();

        return view('admin.promotions.edit', compact('promotion', 'empresas', 'productos'));
    }

    public function update(Request $request, StorePromotion $promotion)
    {
        $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'producto_id' => 'nullable|exists:productos,id',
            'title' => 'required|string|max:200',
            'description' => 'nullable|string|max:500',
            'promo_price' => 'nullable|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'hero_image' => 'nullable|url|max:500',
            'badge_text' => 'nullable|string|max:50',
            'cta_text' => 'nullable|string|max:100',
            'cta_url' => 'nullable|url|max:500',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $promotion->update([
            'empresa_id' => $request->empresa_id,
            'producto_id' => $request->producto_id,
            'title' => $request->title,
            'description' => $request->description,
            'promo_price' => $request->promo_price,
            'original_price' => $request->original_price,
            'hero_image' => $request->hero_image,
            'badge_text' => $request->badge_text,
            'cta_text' => $request->cta_text ?: 'Ver oferta',
            'cta_url' => $request->cta_url,
            'starts_at' => $request->starts_at,
            'ends_at' => $request->ends_at,
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->boolean('is_active'),
        ]);

        return redirect()->route('admin.promotions.index')
            ->with('success', 'Promocion actualizada.');
    }

    public function destroy(StorePromotion $promotion)
    {
        $promotion->delete();

        return redirect()->route('admin.promotions.index')
            ->with('success', 'Promocion eliminada.');
    }

    public function toggle(StorePromotion $promotion)
    {
        $promotion->update(['is_active' => !$promotion->is_active]);

        return redirect()->back()
            ->with('success', $promotion->is_active ? 'Promocion activada.' : 'Promocion desactivada.');
    }
}
