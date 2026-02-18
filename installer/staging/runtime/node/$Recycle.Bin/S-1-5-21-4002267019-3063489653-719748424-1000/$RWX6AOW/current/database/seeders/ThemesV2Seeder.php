<?php

namespace Database\Seeders;

use App\Models\Theme;
use Illuminate\Database\Seeder;

class ThemesV2Seeder extends Seeder
{
    /**
     * Premium Themes V2 - 6 modern themes with AA contrast compliance
     * Each theme defines tokens for primary/secondary/accent colors,
     * typography, button styles, banner overlays, and border radius.
     */
    public function run(): void
    {
        $themes = [
            [
                'nombre' => 'Emerald Luxe',
                'slug' => 'emerald-luxe',
                'description' => 'Verde esmeralda elegante con charcoal y blanco. Ideal para mercados premium.',
                'primary_color' => '#059669',
                'secondary_color' => '#374151',
                'accent_color' => '#10B981',
                'mode' => 'light',
                'is_default' => true,
                'activo' => true,
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
                'typography' => [
                    'heading_font' => 'Manrope',
                    'body_font' => 'Inter',
                    'heading_weight' => '700',
                    'body_weight' => '400',
                ],
                'banner_presets' => [
                    'overlay_type' => 'dark',
                    'text_color' => '#ffffff',
                    'cta_style' => 'filled',
                ],
                'copy' => [
                    'hero_title' => 'Productos frescos cada dia',
                    'hero_subtitle' => 'Lo mejor del mercado directo a tu mesa',
                    'cta_button' => 'Ver Productos',
                ],
            ],
            [
                'nombre' => 'Minimal Platinum',
                'slug' => 'minimal-platinum',
                'description' => 'Gris claro minimalista con negro y acento verde. Sofisticado y moderno.',
                'primary_color' => '#18181b',
                'secondary_color' => '#71717a',
                'accent_color' => '#22c55e',
                'mode' => 'light',
                'is_default' => false,
                'activo' => true,
                'styles' => [
                    '--bg-primary' => '#fafafa',
                    '--bg-secondary' => '#f4f4f5',
                    '--bg-accent' => '#f0fdf4',
                    '--text-primary' => '#18181b',
                    '--text-secondary' => '#52525b',
                    '--text-inverse' => '#ffffff',
                    '--border-color' => '#e4e4e7',
                    '--border-radius' => '0.5rem',
                    '--border-radius-lg' => '1rem',
                    '--button-radius' => '0.375rem',
                    '--shadow-color' => 'rgba(0, 0, 0, 0.05)',
                ],
                'typography' => [
                    'heading_font' => 'Inter',
                    'body_font' => 'Inter',
                    'heading_weight' => '600',
                    'body_weight' => '400',
                ],
                'banner_presets' => [
                    'overlay_type' => 'light',
                    'text_color' => '#18181b',
                    'cta_style' => 'outline',
                ],
                'copy' => [
                    'hero_title' => 'Simplemente fresco',
                    'hero_subtitle' => 'Calidad sin complicaciones',
                    'cta_button' => 'Explorar',
                ],
            ],
            [
                'nombre' => 'Dark Market',
                'slug' => 'dark-market',
                'description' => 'Tema oscuro elegante con acento verde brillante. Premium y moderno.',
                'primary_color' => '#22c55e',
                'secondary_color' => '#a1a1aa',
                'accent_color' => '#4ade80',
                'mode' => 'dark',
                'is_default' => false,
                'activo' => true,
                'styles' => [
                    '--bg-primary' => '#18181b',
                    '--bg-secondary' => '#27272a',
                    '--bg-accent' => '#052e16',
                    '--text-primary' => '#fafafa',
                    '--text-secondary' => '#a1a1aa',
                    '--text-inverse' => '#18181b',
                    '--border-color' => '#3f3f46',
                    '--border-radius' => '1rem',
                    '--border-radius-lg' => '1.5rem',
                    '--button-radius' => '0.75rem',
                    '--shadow-color' => 'rgba(34, 197, 94, 0.15)',
                ],
                'typography' => [
                    'heading_font' => 'Manrope',
                    'body_font' => 'Inter',
                    'heading_weight' => '800',
                    'body_weight' => '400',
                ],
                'banner_presets' => [
                    'overlay_type' => 'brand',
                    'text_color' => '#ffffff',
                    'cta_style' => 'filled',
                ],
                'copy' => [
                    'hero_title' => 'El mercado del futuro',
                    'hero_subtitle' => 'Tecnologia y tradicion en un solo lugar',
                    'cta_button' => 'Descubrir',
                ],
            ],
            [
                'nombre' => 'Fresh Produce',
                'slug' => 'fresh-produce',
                'description' => 'Verde fresco con crema y gris. Organico y natural.',
                'primary_color' => '#16a34a',
                'secondary_color' => '#78716c',
                'accent_color' => '#84cc16',
                'mode' => 'light',
                'is_default' => false,
                'activo' => true,
                'styles' => [
                    '--bg-primary' => '#fefce8',
                    '--bg-secondary' => '#fef9c3',
                    '--bg-accent' => '#dcfce7',
                    '--text-primary' => '#1c1917',
                    '--text-secondary' => '#57534e',
                    '--text-inverse' => '#ffffff',
                    '--border-color' => '#d6d3d1',
                    '--border-radius' => '1.25rem',
                    '--border-radius-lg' => '2rem',
                    '--button-radius' => '9999px',
                    '--shadow-color' => 'rgba(22, 163, 74, 0.12)',
                ],
                'typography' => [
                    'heading_font' => 'Manrope',
                    'body_font' => 'Inter',
                    'heading_weight' => '700',
                    'body_weight' => '400',
                ],
                'banner_presets' => [
                    'overlay_type' => 'light',
                    'text_color' => '#1c1917',
                    'cta_style' => 'filled',
                ],
                'copy' => [
                    'hero_title' => 'Directo del campo',
                    'hero_subtitle' => 'Productos organicos y naturales',
                    'cta_button' => 'Ver Ofertas',
                ],
            ],
            [
                'nombre' => 'Modern Mono',
                'slug' => 'modern-mono',
                'description' => 'Blanco y negro con acento de color. Contrastante y profesional.',
                'primary_color' => '#0f172a',
                'secondary_color' => '#64748b',
                'accent_color' => '#3b82f6',
                'mode' => 'light',
                'is_default' => false,
                'activo' => true,
                'styles' => [
                    '--bg-primary' => '#ffffff',
                    '--bg-secondary' => '#f1f5f9',
                    '--bg-accent' => '#eff6ff',
                    '--text-primary' => '#0f172a',
                    '--text-secondary' => '#475569',
                    '--text-inverse' => '#ffffff',
                    '--border-color' => '#cbd5e1',
                    '--border-radius' => '0.75rem',
                    '--border-radius-lg' => '1.25rem',
                    '--button-radius' => '0.5rem',
                    '--shadow-color' => 'rgba(15, 23, 42, 0.08)',
                ],
                'typography' => [
                    'heading_font' => 'Inter',
                    'body_font' => 'Inter',
                    'heading_weight' => '700',
                    'body_weight' => '400',
                ],
                'banner_presets' => [
                    'overlay_type' => 'dark',
                    'text_color' => '#ffffff',
                    'cta_style' => 'outline',
                ],
                'copy' => [
                    'hero_title' => 'Tu mercado de confianza',
                    'hero_subtitle' => 'Calidad garantizada siempre',
                    'cta_button' => 'Comenzar',
                ],
            ],
            [
                'nombre' => 'Gold Accent',
                'slug' => 'gold-accent',
                'description' => 'Neutros elegantes con acento dorado sutil. Lujo accesible.',
                'primary_color' => '#78350f',
                'secondary_color' => '#78716c',
                'accent_color' => '#d97706',
                'mode' => 'light',
                'is_default' => false,
                'activo' => true,
                'styles' => [
                    '--bg-primary' => '#fffbeb',
                    '--bg-secondary' => '#fef3c7',
                    '--bg-accent' => '#fde68a',
                    '--text-primary' => '#1c1917',
                    '--text-secondary' => '#57534e',
                    '--text-inverse' => '#ffffff',
                    '--border-color' => '#d6d3d1',
                    '--border-radius' => '1rem',
                    '--border-radius-lg' => '1.5rem',
                    '--button-radius' => '0.75rem',
                    '--shadow-color' => 'rgba(217, 119, 6, 0.1)',
                ],
                'typography' => [
                    'heading_font' => 'Manrope',
                    'body_font' => 'Inter',
                    'heading_weight' => '700',
                    'body_weight' => '400',
                ],
                'banner_presets' => [
                    'overlay_type' => 'dark',
                    'text_color' => '#fef3c7',
                    'cta_style' => 'filled',
                ],
                'copy' => [
                    'hero_title' => 'Seleccion premium',
                    'hero_subtitle' => 'Los mejores productos al mejor precio',
                    'cta_button' => 'Ver Coleccion',
                ],
            ],
        ];

        foreach ($themes as $themeData) {
            Theme::updateOrCreate(
                ['slug' => $themeData['slug']],
                $themeData
            );
        }

        $this->command->info('Created/Updated 6 premium Themes V2');
    }
}
