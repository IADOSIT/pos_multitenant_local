<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class StorePromotion extends Model
{
    protected $table = 'store_promotions';
    protected $guarded = [];

    protected $casts = [
        'promo_price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function store()
    {
        return $this->empresa();
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            });
    }

    public function scopeForPortal(Builder $query, int $perStore = 1): Builder
    {
        return $query->active()
            ->with(['empresa', 'producto'])
            ->whereHas('empresa', fn($q) => $q->where('activa', true))
            ->orderBy('sort_order')
            ->orderByDesc('created_at');
    }

    public function isCurrentlyActive(): bool
    {
        if (!$this->is_active) return false;
        $now = now();
        if ($this->starts_at && $this->starts_at > $now) return false;
        if ($this->ends_at && $this->ends_at < $now) return false;
        return true;
    }

    public function getDisplayPriceAttribute(): ?float
    {
        return $this->promo_price ?? $this->producto?->precio ?? $this->original_price;
    }

    public function getDiscountPercentAttribute(): ?int
    {
        if (!$this->promo_price || !$this->original_price || $this->original_price <= 0) {
            return null;
        }
        return (int) round((1 - ($this->promo_price / $this->original_price)) * 100);
    }

    public function getTargetUrlAttribute(): string
    {
        $empresa = $this->empresa;

        if ($this->cta_url) {
            return $this->cta_url;
        }

        $baseUrl = $empresa->primary_domain
            ? "https://{$empresa->primary_domain}"
            : "/t/{$empresa->handle}";

        if ($this->producto) {
            return "{$baseUrl}/producto/{$this->producto->id}";
        }

        return $baseUrl;
    }
}
