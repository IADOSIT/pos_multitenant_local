<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add template_config to empresas for storing overrides
        if (!Schema::hasColumn('empresas', 'template_config')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->jsonb('template_config')->nullable()->after('settings');
            });
        }

        // Enhance themes table with typography and copy
        if (!Schema::hasColumn('themes', 'typography')) {
            Schema::table('themes', function (Blueprint $table) {
                $table->jsonb('typography')->nullable()->after('styles');
                $table->jsonb('copy')->nullable()->after('typography');
                $table->jsonb('banner_presets')->nullable()->after('copy');
            });
        }

        // Seed default banner presets into existing themes
        $presets = [
            [
                'name' => 'Clásico',
                'bg_color' => '#16a34a',
                'text_color' => '#ffffff',
                'overlay' => 'none',
            ],
            [
                'name' => 'Oscuro',
                'bg_color' => '#1e293b',
                'text_color' => '#f8fafc',
                'overlay' => 'gradient-dark',
            ],
            [
                'name' => 'Vibrante',
                'bg_color' => '#7c3aed',
                'text_color' => '#ffffff',
                'overlay' => 'gradient-radial',
            ],
        ];

        DB::table('themes')->whereNull('banner_presets')->update([
            'banner_presets' => json_encode($presets),
            'typography' => json_encode([
                'heading_font' => 'system-ui',
                'body_font' => 'system-ui',
                'heading_weight' => '700',
                'body_weight' => '400',
            ]),
            'copy' => json_encode([
                'hero_title' => 'Bienvenido a nuestra tienda',
                'hero_subtitle' => 'Los mejores productos al mejor precio',
                'cta_primary' => 'Ver productos',
                'cta_secondary' => 'Contactar',
            ]),
        ]);
    }

    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn('template_config');
        });

        Schema::table('themes', function (Blueprint $table) {
            $table->dropColumn(['typography', 'copy', 'banner_presets']);
        });
    }
};
