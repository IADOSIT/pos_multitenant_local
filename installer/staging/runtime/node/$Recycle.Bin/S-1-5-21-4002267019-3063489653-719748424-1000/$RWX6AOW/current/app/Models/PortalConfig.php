<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PortalConfig extends Model
{
    protected $table = 'portal_config';
    protected $guarded = [];

    protected $casts = [
        'value' => 'string',
    ];

    // Default configuration
    private static array $defaults = [
        'portal_name' => 'Central de Abastos Nuevo Leon',
        'portal_tagline' => 'Tu mercado de abastos en linea',
        'portal_description' => 'Conectamos a los mejores proveedores del mercado de abastos con compradores de todo Nuevo Leon.',
        'developer_name' => 'iaDoS.mx',
        'developer_url' => 'https://iados.mx',
        'developer_email' => 'contacto@iados.mx',
        'developer_whatsapp' => '8318989580',
        'hero_title' => 'Compra directo del mercado de abastos',
        'hero_subtitle' => 'Los mejores precios, la mejor calidad, directo a tu negocio o domicilio',
        'hero_cta_text' => 'Explorar tiendas',
        'hero_image' => null,
        'promos_per_store' => 1,
        'show_prices_in_portal' => true,
        'primary_color' => '#16a34a',
        'secondary_color' => '#6b7280',
        'fallback_domain' => null, // Uses APP_URL by default
        // Flyer settings
        'flyer_enabled' => true,
        'flyer_title' => 'Productos destacados',
        'flyer_subtitle' => 'Del mercado de abastos a tu negocio',
        'flyer_product_ids' => null,
        'flyer_product_count' => 6,
        'flyer_accent_color' => null, // null = sin fondo de color, usa animación elegante
        // Featured stores
        'featured_store_ids' => null,
        // AI Assistant settings
        'ai_assistant_enabled' => true,
        'ai_assistant_title' => 'Asistente IA',
        'ai_assistant_welcome' => 'Hola! Soy tu asistente virtual. Puedo ayudarte a encontrar productos, tiendas y responder tus preguntas.',
        // Home redirect
        'home_redirect_path' => 'portal',
    ];

    public static function get(string $key, $default = null)
    {
        return Cache::remember("portal_config:{$key}", 3600, function () use ($key, $default) {
            $config = self::where('key', $key)->first();
            if (!$config) {
                return self::$defaults[$key] ?? $default;
            }
            return self::castValue($config->value, $config->type);
        });
    }

    public static function set(string $key, $value, string $type = 'string'): void
    {
        self::updateOrCreate(
            ['key' => $key],
            ['value' => is_array($value) ? json_encode($value) : (string)$value, 'type' => $type]
        );
        Cache::forget("portal_config:{$key}");
        Cache::forget('portal_config:all');
    }

    public static function getAll(): array
    {
        return Cache::remember('portal_config:all', 3600, function () {
            $configs = self::all()->pluck('value', 'key')->toArray();
            return array_merge(self::$defaults, $configs);
        });
    }

    public static function getDefaults(): array
    {
        return self::$defaults;
    }

    private static function castValue($value, string $type)
    {
        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    public static function clearCache(): void
    {
        Cache::forget('portal_config:all');
        foreach (array_keys(self::$defaults) as $key) {
            Cache::forget("portal_config:{$key}");
        }
    }
}
