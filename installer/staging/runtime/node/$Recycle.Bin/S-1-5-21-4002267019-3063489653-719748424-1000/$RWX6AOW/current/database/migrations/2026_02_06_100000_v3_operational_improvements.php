<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add settings JSON to empresas for branding, payments, catalog config
        if (!Schema::hasColumn('empresas', 'settings')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->jsonb('settings')->nullable()->after('config');
            });
        }

        // Add logo_path to empresas
        if (!Schema::hasColumn('empresas', 'logo_path')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->string('logo_path', 255)->nullable()->after('brand_color');
            });
        }

        // Create themes table for template presets
        if (!Schema::hasTable('themes')) {
            Schema::create('themes', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 100);
                $table->string('slug', 100)->unique();
                $table->string('primary_color', 20)->default('#16a34a');
                $table->string('secondary_color', 20)->default('#6b7280');
                $table->string('accent_color', 20)->default('#3b82f6');
                $table->string('mode', 20)->default('light'); // light, dark
                $table->jsonb('styles')->nullable(); // Additional CSS variables
                $table->text('description')->nullable();
                $table->boolean('is_default')->default(false);
                $table->boolean('activo')->default(true);
                $table->timestamps();
            });
        }

        // Add theme_id to empresas
        if (!Schema::hasColumn('empresas', 'theme_id')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->foreignId('theme_id')->nullable()->after('settings');
            });
        }

        // Create AI help logs table
        if (!Schema::hasTable('ai_help_logs')) {
            Schema::create('ai_help_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('empresa_id')->nullable();
                $table->foreignId('usuario_id')->nullable();
                $table->text('pregunta');
                $table->text('respuesta')->nullable();
                $table->string('modelo', 50)->nullable();
                $table->integer('tokens_input')->nullable();
                $table->integer('tokens_output')->nullable();
                $table->jsonb('meta')->nullable();
                $table->timestamps();
            });
        }

        // Add cliente_id to ordenes if not exists
        if (!Schema::hasColumn('ordenes', 'cliente_id')) {
            Schema::table('ordenes', function (Blueprint $table) {
                $table->foreignId('cliente_id')->nullable()->after('empresa_id');
            });
        }

        // Add provider fields to orden_pagos for MercadoPago
        if (!Schema::hasColumn('orden_pagos', 'provider')) {
            Schema::table('orden_pagos', function (Blueprint $table) {
                $table->string('provider', 50)->nullable()->after('metodo'); // mercadopago, stripe, etc
            });
        }
        if (!Schema::hasColumn('orden_pagos', 'provider_id')) {
            Schema::table('orden_pagos', function (Blueprint $table) {
                $table->string('provider_id', 255)->nullable()->after('provider'); // External payment ID
            });
        }
        if (!Schema::hasColumn('orden_pagos', 'provider_response')) {
            Schema::table('orden_pagos', function (Blueprint $table) {
                $table->jsonb('provider_response')->nullable()->after('provider_id');
            });
        }

        // Add activo field to usuarios if not exists
        if (!Schema::hasColumn('usuarios', 'activo')) {
            Schema::table('usuarios', function (Blueprint $table) {
                $table->boolean('activo')->default(true)->after('password');
            });
        }

        // Add imagen_url to productos if not exists
        if (!Schema::hasColumn('productos', 'imagen_url')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->string('imagen_url', 500)->nullable()->after('activo');
            });
        }

        // Add meta to productos for image source tracking
        if (!Schema::hasColumn('productos', 'meta')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->jsonb('meta')->nullable();
            });
        }

        // Ensure clientes table has proper structure
        if (!Schema::hasColumn('clientes', 'meta')) {
            Schema::table('clientes', function (Blueprint $table) {
                $table->jsonb('meta')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_help_logs');
        Schema::dropIfExists('themes');

        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn(['settings', 'logo_path', 'theme_id']);
        });

        Schema::table('orden_pagos', function (Blueprint $table) {
            $table->dropColumn(['provider', 'provider_id', 'provider_response']);
        });

        Schema::table('ordenes', function (Blueprint $table) {
            $table->dropColumn('cliente_id');
        });
    }
};
