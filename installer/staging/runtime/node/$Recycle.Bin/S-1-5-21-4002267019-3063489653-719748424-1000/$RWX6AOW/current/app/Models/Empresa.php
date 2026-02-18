<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Empresa extends Model
{
    protected $table = 'empresas';

    protected $fillable = [
        'nombre',
        'slug',
        'activa',
        'brand_nombre_publico',
        'brand_color',
        'support_email',
        'logo_path',
        'logo_url',
        'skin',
        'config',
        'settings',
        'theme_id',
        'public_id',
        'handle',
        'primary_domain',
        'description',
        'descripcion',
        'tags',
        'sort_order',
        'is_featured',
        'hora_atencion_inicio',
        'hora_atencion_fin',
        'pickup_eta_hours',
        'enable_pickup',
        'enable_delivery',
        'template_config',
    ];

    protected $casts = [
        'config' => 'array',
        'settings' => 'array',
        'tags' => 'array',
        'template_config' => 'array',
        'activa' => 'boolean',
        'is_featured' => 'boolean',
        'enable_pickup' => 'boolean',
        'enable_delivery' => 'boolean',
        'pickup_eta_hours' => 'decimal:1',
    ];

    /**
     * Get hora_atencion_inicio formatted for time input (HH:MM)
     */
    public function getHoraAtencionInicioAttribute($value): ?string
    {
        if (!$value) return null;
        return substr($value, 0, 5); // Take only HH:MM
    }

    /**
     * Get hora_atencion_fin formatted for time input (HH:MM)
     */
    public function getHoraAtencionFinAttribute($value): ?string
    {
        if (!$value) return null;
        return substr($value, 0, 5); // Take only HH:MM
    }

    // Relationships
    public function categorias()
    {
        return $this->hasMany(Categoria::class, 'empresa_id');
    }

    public function productos()
    {
        return $this->hasMany(Producto::class, 'empresa_id');
    }

    public function ordenes()
    {
        return $this->hasMany(Orden::class, 'empresa_id');
    }

    public function clientes()
    {
        return $this->hasMany(Cliente::class, 'empresa_id');
    }

    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'empresa_usuario', 'empresa_id', 'usuario_id')
            ->withPivot('rol_id', 'activo')
            ->withTimestamps();
    }

    public function theme()
    {
        return $this->belongsTo(Theme::class);
    }

    public function domains()
    {
        return $this->hasMany(StoreDomain::class, 'empresa_id');
    }

    public function promotions()
    {
        return $this->hasMany(StorePromotion::class, 'empresa_id');
    }

    // Multi-store helpers
    public static function findByHandle(string $handle): ?self
    {
        return self::where('handle', $handle)->where('activa', true)->first();
    }

    public static function findByDomain(string $domain): ?self
    {
        $storeDomain = StoreDomain::findByDomain($domain);
        return $storeDomain?->empresa;
    }

    public static function resolveStore(?string $domain = null, ?string $handle = null): ?self
    {
        if ($domain) {
            $store = self::findByDomain($domain);
            if ($store) return $store;
        }

        if ($handle) {
            return self::findByHandle($handle);
        }

        return null;
    }

    public function generateHandle(): string
    {
        if (!$this->public_id) {
            $this->public_id = self::generatePublicId();
        }
        return \Str::slug($this->nombre) . '-' . $this->public_id;
    }

    public static function generatePublicId(): string
    {
        do {
            $id = strtolower(\Str::random(8));
        } while (self::where('public_id', $id)->exists());
        return $id;
    }

    /**
     * Get the store path (e.g., "t/mi-tienda")
     * Uses store_domains.domain if available, otherwise fallback to handle
     */
    public function getStorePathAttribute(): string
    {
        // Check if there's a registered store_domain path
        $storeDomain = $this->domains()->where('is_active', true)->where('is_primary', true)->first();
        if ($storeDomain && $storeDomain->domain) {
            // If domain looks like a path (starts with t/ or doesn't contain dots)
            if (str_starts_with($storeDomain->domain, 't/') || !str_contains($storeDomain->domain, '.')) {
                return ltrim($storeDomain->domain, '/');
            }
        }

        // Fallback to handle-based path
        return 't/' . $this->handle;
    }

    /**
     * Get the full store URL using APP_URL + store path
     */
    public function getStoreUrlAttribute(): string
    {
        // If empresa has a custom full domain (external), use it
        if ($this->primary_domain && str_contains($this->primary_domain, '.')) {
            return "https://{$this->primary_domain}";
        }

        // Use APP_URL + store path
        $appUrl = rtrim(config('app.url'), '/');
        return $appUrl . '/' . $this->store_path;
    }

    public function getDisplayLogoAttribute(): ?string
    {
        return $this->logo_url ?? $this->getLogoUrl();
    }

    // Settings helpers
    public function getSetting(string $key, $default = null)
    {
        return data_get($this->settings, $key, $default);
    }

    public function setSetting(string $key, $value): self
    {
        $settings = $this->settings ?? [];
        data_set($settings, $key, $value);
        $this->settings = $settings;
        return $this;
    }

    // Branding helpers
    public function getAppName(): string
    {
        return $this->getSetting('app_name')
            ?? $this->brand_nombre_publico
            ?? $this->nombre
            ?? config('app.name', 'EMC Abastos');
    }

    public function getLogoUrl(): ?string
    {
        if ($this->logo_path) {
            return asset('storage/' . $this->logo_path);
        }
        return $this->getSetting('logo_url') ?? asset('storage/brand/logo-iados.png');
    }

    public function getPrimaryColor(): string
    {
        return $this->getSetting('primary_color') ?? $this->brand_color ?? '#16a34a';
    }

    public function getSecondaryColor(): string
    {
        return $this->getSetting('secondary_color') ?? '#6b7280';
    }

    public function getAccentColor(): string
    {
        return $this->getSetting('accent_color') ?? '#3b82f6';
    }

    // MercadoPago helpers
    public function getMpAccessToken(): ?string
    {
        return $this->getSetting('mp_access_token');
    }

    public function getMpPublicKey(): ?string
    {
        return $this->getSetting('mp_public_key');
    }

    public function hasMercadoPago(): bool
    {
        return !empty($this->getMpAccessToken()) && !empty($this->getMpPublicKey());
    }

    // Catalog helpers
    public function getDefaultProductImage(): string
    {
        return $this->getSetting('default_product_image_url')
            ?? asset('images/producto-default.svg');
    }

    // Fulfillment helpers
    public function isPickupEnabled(): bool
    {
        return $this->enable_pickup ?? true;
    }

    public function isDeliveryEnabled(): bool
    {
        return $this->enable_delivery ?? true;
    }

    public function getAvailableFulfillmentTypes(): array
    {
        $types = [];
        if ($this->isPickupEnabled()) {
            $types[] = 'pickup';
        }
        if ($this->isDeliveryEnabled()) {
            $types[] = 'delivery';
        }
        return $types;
    }

    public function getDefaultFulfillmentType(): string
    {
        if ($this->isPickupEnabled()) {
            return 'pickup';
        }
        if ($this->isDeliveryEnabled()) {
            return 'delivery';
        }
        return 'pickup'; // Fallback
    }
}
