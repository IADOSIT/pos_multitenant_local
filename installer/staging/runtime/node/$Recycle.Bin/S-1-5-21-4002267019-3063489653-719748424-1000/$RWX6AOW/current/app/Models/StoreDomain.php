<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class StoreDomain extends Model
{
    protected $table = 'store_domains';
    protected $guarded = [];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
        'ssl_enabled' => 'boolean',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function store()
    {
        return $this->empresa();
    }

    /**
     * Find by domain or path
     * Supports both full domains (tienda.example.com) and paths (t/mi-tienda)
     */
    public static function findByDomain(string $domain): ?self
    {
        $domain = strtolower(trim($domain));

        return Cache::remember("store_domain:{$domain}", 3600, function () use ($domain) {
            return self::where('domain', $domain)
                ->where('is_active', true)
                ->with('empresa')
                ->first();
        });
    }

    /**
     * Find by store path (e.g., "t/mi-tienda" or just "mi-tienda")
     */
    public static function findByPath(string $path): ?self
    {
        $path = strtolower(trim($path, '/'));

        // Try with t/ prefix first
        if (!str_starts_with($path, 't/')) {
            $pathWithPrefix = 't/' . $path;
        } else {
            $pathWithPrefix = $path;
        }

        return Cache::remember("store_path:{$pathWithPrefix}", 3600, function () use ($pathWithPrefix, $path) {
            return self::where('domain', $pathWithPrefix)
                ->orWhere('domain', $path)
                ->where('is_active', true)
                ->with('empresa')
                ->first();
        });
    }

    public static function clearCache(string $domain = null): void
    {
        if ($domain) {
            Cache::forget("store_domain:{$domain}");
        }
    }

    /**
     * Check if this domain entry is a path (not a full domain)
     */
    public function isPath(): bool
    {
        return str_starts_with($this->domain, 't/') || !str_contains($this->domain, '.');
    }

    /**
     * Get the full URL for this domain/path
     */
    public function getFullUrlAttribute(): string
    {
        // If it's a path, use APP_URL
        if ($this->isPath()) {
            $appUrl = rtrim(config('app.url'), '/');
            return $appUrl . '/' . ltrim($this->domain, '/');
        }

        // It's a full domain
        $protocol = $this->ssl_enabled ? 'https' : 'http';
        return "{$protocol}://{$this->domain}";
    }
}
