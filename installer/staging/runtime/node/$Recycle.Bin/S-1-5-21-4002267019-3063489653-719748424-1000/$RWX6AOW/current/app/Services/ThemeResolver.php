<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\Theme;
use Illuminate\Support\Facades\Cache;

class ThemeResolver
{
    private ?Empresa $empresa;
    private ?Theme $theme;
    private array $config;

    // Accessible color combinations (WCAG AA compliant)
    public const ACCESSIBLE_COMBOS = [
        ['bg' => '#16a34a', 'text' => '#ffffff', 'name' => 'Verde Clásico'],
        ['bg' => '#1e293b', 'text' => '#f8fafc', 'name' => 'Oscuro Elegante'],
        ['bg' => '#7c3aed', 'text' => '#ffffff', 'name' => 'Violeta Vibrante'],
        ['bg' => '#dc2626', 'text' => '#ffffff', 'name' => 'Rojo Intenso'],
        ['bg' => '#0369a1', 'text' => '#ffffff', 'name' => 'Azul Profesional'],
        ['bg' => '#ca8a04', 'text' => '#1f2937', 'name' => 'Dorado Premium'],
        ['bg' => '#ffffff', 'text' => '#1f2937', 'name' => 'Blanco Minimalista'],
        ['bg' => '#f97316', 'text' => '#ffffff', 'name' => 'Naranja Energético'],
    ];

    // Default configuration
    private const DEFAULTS = [
        'colors' => [
            'primary' => '#16a34a',
            'secondary' => '#6b7280',
            'accent' => '#3b82f6',
            'background' => '#f9fafb',
            'surface' => '#ffffff',
            'text' => '#1f2937',
            'text_muted' => '#6b7280',
        ],
        'typography' => [
            'heading_font' => 'system-ui, -apple-system, sans-serif',
            'body_font' => 'system-ui, -apple-system, sans-serif',
            'heading_weight' => '700',
            'body_weight' => '400',
            'base_size' => '16px',
        ],
        'copy' => [
            'hero_title' => 'Bienvenido a nuestra tienda',
            'hero_subtitle' => 'Los mejores productos al mejor precio',
            'cta_primary' => 'Ver productos',
            'cta_secondary' => 'Contactar',
            'empty_cart' => 'Tu carrito está vacío',
            'footer_text' => 'Todos los derechos reservados',
        ],
        'banner' => [
            'style' => 'gradient',
            'bg_color' => '#16a34a',
            'text_color' => '#ffffff',
            'overlay' => 'gradient-dark',
            'height' => 'auto',
            'full_width' => true,
        ],
        'styles' => [
            '--bg-primary' => '#ffffff',
            '--bg-secondary' => '#f8fafc',
            '--bg-accent' => '#ecfdf5',
            '--text-primary' => '#1e293b',
            '--text-secondary' => '#64748b',
            '--text-inverse' => '#ffffff',
            '--border-color' => '#e2e8f0',
            '--border-radius' => '1rem',
            '--border-radius-lg' => '1.5rem',
            '--button-radius' => '0.75rem',
            '--shadow-color' => 'rgba(5, 150, 105, 0.1)',
        ],
    ];

    public function __construct(?Empresa $empresa = null)
    {
        $this->empresa = $empresa;
        $this->theme = $empresa?->theme;
        $this->config = $this->resolveConfig();
    }

    /**
     * Create resolver for empresa ID
     */
    public static function forEmpresa(?int $empresaId): self
    {
        if (!$empresaId) {
            return new self(null);
        }

        return Cache::remember("theme_resolver:{$empresaId}", 3600, function () use ($empresaId) {
            $empresa = Empresa::with('theme')->find($empresaId);
            return new self($empresa);
        });
    }

    /**
     * Clear cached resolver
     */
    public static function clearCache(int $empresaId): void
    {
        Cache::forget("theme_resolver:{$empresaId}");
    }

    /**
     * Resolve final configuration merging: defaults < theme < empresa overrides
     */
    private function resolveConfig(): array
    {
        $config = self::DEFAULTS;

        // Layer 1: Theme defaults
        if ($this->theme) {
            $config['colors'] = array_merge($config['colors'], [
                'primary' => $this->theme->primary_color ?? $config['colors']['primary'],
                'secondary' => $this->theme->secondary_color ?? $config['colors']['secondary'],
                'accent' => $this->theme->accent_color ?? $config['colors']['accent'],
            ]);

            if ($this->theme->typography) {
                $config['typography'] = array_merge($config['typography'], $this->theme->typography);
            }

            if ($this->theme->copy) {
                $config['copy'] = array_merge($config['copy'], $this->theme->copy);
            }

            if ($this->theme->banner_presets && is_array($this->theme->banner_presets)) {
                $firstPreset = $this->theme->banner_presets[0] ?? null;
                if ($firstPreset) {
                    $config['banner'] = array_merge($config['banner'], [
                        'bg_color' => $firstPreset['bg_color'] ?? $config['banner']['bg_color'],
                        'text_color' => $firstPreset['text_color'] ?? $config['banner']['text_color'],
                    ]);
                }
            }

            // Merge theme styles (V2 themes)
            if ($this->theme->styles && is_array($this->theme->styles)) {
                $config['styles'] = array_merge($config['styles'], $this->theme->styles);
            }
        }

        // Layer 2: Empresa settings (legacy support)
        if ($this->empresa) {
            $empresaSettings = $this->empresa->settings ?? [];

            if (!empty($empresaSettings['primary_color'])) {
                $config['colors']['primary'] = $empresaSettings['primary_color'];
            }
            if (!empty($empresaSettings['secondary_color'])) {
                $config['colors']['secondary'] = $empresaSettings['secondary_color'];
            }
            if (!empty($empresaSettings['accent_color'])) {
                $config['colors']['accent'] = $empresaSettings['accent_color'];
            }
        }

        // Layer 3: Empresa template_config overrides (highest priority)
        if ($this->empresa && $this->empresa->template_config) {
            $config = $this->deepMerge($config, $this->empresa->template_config);
        }

        return $config;
    }

    /**
     * Deep merge arrays
     */
    private function deepMerge(array $base, array $override): array
    {
        foreach ($override as $key => $value) {
            if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
                $base[$key] = $this->deepMerge($base[$key], $value);
            } else {
                $base[$key] = $value;
            }
        }
        return $base;
    }

    // Getters
    public function colors(): array
    {
        return $this->config['colors'];
    }

    public function color(string $key, ?string $default = null): string
    {
        return $this->config['colors'][$key] ?? $default ?? '#000000';
    }

    public function typography(): array
    {
        return $this->config['typography'];
    }

    public function copy(): array
    {
        return $this->config['copy'];
    }

    public function text(string $key, ?string $default = null): string
    {
        return $this->config['copy'][$key] ?? $default ?? '';
    }

    public function banner(): array
    {
        return $this->config['banner'];
    }

    public function styles(): array
    {
        return $this->config['styles'] ?? [];
    }

    public function style(string $key, ?string $default = null): string
    {
        return $this->config['styles'][$key] ?? $default ?? '';
    }

    public function isDarkMode(): bool
    {
        return ($this->theme?->mode ?? 'light') === 'dark';
    }

    public function all(): array
    {
        return $this->config;
    }

    /**
     * Get CSS variables string
     */
    public function cssVariables(): string
    {
        $vars = [];

        foreach ($this->config['colors'] as $key => $value) {
            $vars[] = "--color-{$key}: {$value}";
        }

        $vars[] = "--font-heading: {$this->config['typography']['heading_font']}";
        $vars[] = "--font-body: {$this->config['typography']['body_font']}";
        $vars[] = "--font-weight-heading: {$this->config['typography']['heading_weight']}";
        $vars[] = "--font-weight-body: {$this->config['typography']['body_weight']}";

        return implode('; ', $vars);
    }

    /**
     * Generate Tailwind config object for inline script
     */
    public function tailwindConfig(): array
    {
        $primary = $this->color('primary');
        $secondary = $this->color('secondary');
        $accent = $this->color('accent');

        return [
            'theme' => [
                'extend' => [
                    'colors' => [
                        'primary' => [
                            '50' => $this->lighten($primary, 0.95),
                            '100' => $this->lighten($primary, 0.9),
                            '200' => $this->lighten($primary, 0.75),
                            '300' => $this->lighten($primary, 0.6),
                            '400' => $this->lighten($primary, 0.4),
                            '500' => $primary,
                            '600' => $primary,
                            '700' => $this->darken($primary, 0.15),
                            '800' => $this->darken($primary, 0.3),
                            '900' => $this->darken($primary, 0.45),
                        ],
                        'secondary' => [
                            '500' => $secondary,
                            '600' => $this->darken($secondary, 0.1),
                        ],
                        'accent' => [
                            '500' => $accent,
                            '600' => $this->darken($accent, 0.1),
                        ],
                    ],
                    'fontFamily' => [
                        'heading' => [$this->config['typography']['heading_font']],
                        'body' => [$this->config['typography']['body_font']],
                    ],
                ],
            ],
        ];
    }

    /**
     * Lighten a hex color
     */
    private function lighten(string $hex, float $percent): string
    {
        return $this->adjustBrightness($hex, $percent);
    }

    /**
     * Darken a hex color
     */
    private function darken(string $hex, float $percent): string
    {
        return $this->adjustBrightness($hex, -$percent);
    }

    /**
     * Adjust color brightness
     */
    private function adjustBrightness(string $hex, float $percent): string
    {
        $hex = ltrim($hex, '#');

        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }

        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));

        if ($percent > 0) {
            // Lighten
            $r = $r + (255 - $r) * $percent;
            $g = $g + (255 - $g) * $percent;
            $b = $b + (255 - $b) * $percent;
        } else {
            // Darken
            $r = $r * (1 + $percent);
            $g = $g * (1 + $percent);
            $b = $b * (1 + $percent);
        }

        $r = max(0, min(255, round($r)));
        $g = max(0, min(255, round($g)));
        $b = max(0, min(255, round($b)));

        return sprintf('#%02x%02x%02x', $r, $g, $b);
    }

    /**
     * Check if color combination meets WCAG AA contrast
     */
    public static function isAccessible(string $bgColor, string $textColor): bool
    {
        $bgLum = self::relativeLuminance($bgColor);
        $textLum = self::relativeLuminance($textColor);

        $lighter = max($bgLum, $textLum);
        $darker = min($bgLum, $textLum);

        $contrast = ($lighter + 0.05) / ($darker + 0.05);

        return $contrast >= 4.5; // WCAG AA for normal text
    }

    /**
     * Calculate relative luminance
     */
    private static function relativeLuminance(string $hex): float
    {
        $hex = ltrim($hex, '#');

        $r = hexdec(substr($hex, 0, 2)) / 255;
        $g = hexdec(substr($hex, 2, 2)) / 255;
        $b = hexdec(substr($hex, 4, 2)) / 255;

        $r = $r <= 0.03928 ? $r / 12.92 : pow(($r + 0.055) / 1.055, 2.4);
        $g = $g <= 0.03928 ? $g / 12.92 : pow(($g + 0.055) / 1.055, 2.4);
        $b = $b <= 0.03928 ? $b / 12.92 : pow(($b + 0.055) / 1.055, 2.4);

        return 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;
    }
}
