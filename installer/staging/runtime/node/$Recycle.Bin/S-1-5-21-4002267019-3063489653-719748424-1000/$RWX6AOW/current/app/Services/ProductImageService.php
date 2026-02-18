<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageService
{
    protected array $config;

    public function __construct()
    {
        $this->config = [
            'enabled' => config('images.auto_fetch', true),
            'source' => config('images.source', 'unsplash'),
            'default_image' => config('images.default', '/images/producto-default.svg'),
            'cache_hours' => 24,
        ];
    }

    /**
     * Get image URL for a product
     * Priority: manual > auto > default
     */
    public function getImageUrl($product): string
    {
        // 1. Manual image
        if (!empty($product->imagen_url) && $product->image_source === 'manual') {
            return $this->ensureFullUrl($product->imagen_url);
        }

        // 2. Auto image (cached)
        if ($this->config['enabled'] && $product->use_auto_image) {
            $autoImage = $this->getAutoImage($product->nombre, $product->id);
            if ($autoImage) {
                return $autoImage;
            }
        }

        // 3. Product has any imagen_url
        if (!empty($product->imagen_url)) {
            return $this->ensureFullUrl($product->imagen_url);
        }

        // 4. Default
        return $this->getDefaultImage();
    }

    /**
     * Get auto-generated image based on product name
     */
    public function getAutoImage(string $productName, int $productId): ?string
    {
        $cacheKey = "product_image_{$productId}";

        return Cache::remember($cacheKey, now()->addHours($this->config['cache_hours']), function () use ($productName, $productId) {
            return $this->fetchImageFromSource($productName, $productId);
        });
    }

    /**
     * Fetch image from configured source
     */
    protected function fetchImageFromSource(string $productName, int $productId): ?string
    {
        $searchTerm = $this->normalizeSearchTerm($productName);

        switch ($this->config['source']) {
            case 'unsplash':
                return $this->fetchFromUnsplash($searchTerm, $productId);
            case 'pexels':
                return $this->fetchFromPexels($searchTerm);
            default:
                return $this->getPlaceholderImage($searchTerm, $productId);
        }
    }

    /**
     * Use Unsplash Source (no API key needed)
     */
    protected function fetchFromUnsplash(string $searchTerm, int $productId): string
    {
        // Use Unsplash Source for reliable, free images
        // The seed ensures same product always gets same image
        $seed = md5($searchTerm . $productId);
        return "https://source.unsplash.com/400x300/?{$searchTerm},food&sig={$seed}";
    }

    /**
     * Fetch from Pexels API
     */
    protected function fetchFromPexels(string $searchTerm): ?string
    {
        $apiKey = config('services.pexels.key');
        if (!$apiKey) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $apiKey,
            ])->get('https://api.pexels.com/v1/search', [
                'query' => $searchTerm . ' food',
                'per_page' => 1,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['photos'][0]['src']['medium'] ?? null;
            }
        } catch (\Exception $e) {
            \Log::warning("Pexels API error: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Generate placeholder image URL
     */
    protected function getPlaceholderImage(string $searchTerm, int $productId): string
    {
        // Use placeholder service with product-specific colors
        $colors = ['4ade80', '22c55e', '16a34a', '15803d', '166534'];
        $color = $colors[$productId % count($colors)];
        $text = urlencode(Str::limit($searchTerm, 15));

        return "https://via.placeholder.com/400x300/{$color}/ffffff?text={$text}";
    }

    /**
     * Normalize product name for image search
     */
    protected function normalizeSearchTerm(string $name): string
    {
        // Remove common suffixes and clean up
        $name = preg_replace('/\s*(kg|kilo|gr|gramo|lb|libra|pza|pieza|bolsa|caja|grande|chico|mediano)\s*/i', ' ', $name);
        $name = preg_replace('/\s+/', ' ', trim($name));
        $name = Str::slug($name, ',');

        return $name;
    }

    /**
     * Get default image URL
     */
    public function getDefaultImage(): string
    {
        return asset($this->config['default_image']);
    }

    /**
     * Ensure URL is absolute
     */
    protected function ensureFullUrl(string $url): string
    {
        if (Str::startsWith($url, ['http://', 'https://'])) {
            return $url;
        }

        if (Str::startsWith($url, '/storage/')) {
            return asset($url);
        }

        if (Str::startsWith($url, 'storage/')) {
            return asset('/' . $url);
        }

        return asset('/storage/' . ltrim($url, '/'));
    }

    /**
     * Upload product image
     */
    public function uploadImage($file, int $empresaId, int $productId): string
    {
        $filename = "producto_{$productId}_" . time() . '.' . $file->getClientOriginalExtension();
        $path = "productos/{$empresaId}";

        $file->storeAs($path, $filename, 'public');

        return "/storage/{$path}/{$filename}";
    }

    /**
     * Clear cached image for a product
     */
    public function clearCache(int $productId): void
    {
        Cache::forget("product_image_{$productId}");
    }
}
