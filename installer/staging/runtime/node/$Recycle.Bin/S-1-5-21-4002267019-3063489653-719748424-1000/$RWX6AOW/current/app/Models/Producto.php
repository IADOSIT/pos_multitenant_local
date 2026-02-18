<?php

namespace App\Models;

use App\Services\ProductImageService;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'productos';
    protected $guarded = [];
    protected $casts = [
        'meta' => 'array',
        'activo' => 'boolean',
        'use_auto_image' => 'boolean',
    ];

    protected $appends = ['display_image'];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function promotions()
    {
        return $this->hasMany(StorePromotion::class, 'producto_id');
    }

    /**
     * Get raw imagen_url from column or meta
     */
    public function getRawImagenUrlAttribute(): ?string
    {
        // First check direct column
        if (!empty($this->attributes['imagen_url'])) {
            return $this->attributes['imagen_url'];
        }

        // Then check meta
        return data_get($this->meta, 'imagen_url');
    }

    /**
     * Get imagen_url (for backward compatibility)
     */
    public function getImagenUrlAttribute(): ?string
    {
        return $this->raw_imagen_url;
    }

    /**
     * Get display image using ProductImageService
     * This handles priority: manual > auto > default
     */
    public function getDisplayImageAttribute(): string
    {
        $service = app(ProductImageService::class);
        return $service->getImageUrl($this);
    }

    /**
     * Scope for active products
     */
    public function scopeActive($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope for empresa
     */
    public function scopeForEmpresa($query, $empresaId)
    {
        return $query->where('empresa_id', $empresaId);
    }
}
