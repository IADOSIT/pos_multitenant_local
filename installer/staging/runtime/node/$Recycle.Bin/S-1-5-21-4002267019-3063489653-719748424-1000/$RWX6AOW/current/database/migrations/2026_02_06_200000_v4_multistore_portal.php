<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Portal Config (singleton settings)
        if (!Schema::hasTable('portal_config')) {
            Schema::create('portal_config', function (Blueprint $table) {
                $table->id();
                $table->string('key', 100)->unique();
                $table->text('value')->nullable();
                $table->string('type', 20)->default('string'); // string, json, boolean, integer
                $table->timestamps();
            });
        }

        // Add multi-store fields to empresas (stores)
        if (!Schema::hasColumn('empresas', 'public_id')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->string('public_id', 12)->nullable()->unique()->after('id');
                $table->string('handle', 100)->nullable()->unique()->after('slug');
                $table->string('primary_domain', 255)->nullable()->after('handle');
                $table->string('logo_url', 500)->nullable()->after('logo_path');
                $table->text('description')->nullable()->after('nombre');
                $table->jsonb('tags')->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_featured')->default(false);
            });
        }

        // Store domains for multi-domain resolution
        if (!Schema::hasTable('store_domains')) {
            Schema::create('store_domains', function (Blueprint $table) {
                $table->id();
                $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
                $table->string('domain', 255)->unique();
                $table->boolean('is_primary')->default(false);
                $table->boolean('is_active')->default(true);
                $table->boolean('ssl_enabled')->default(true);
                $table->timestamps();

                $table->index(['domain', 'is_active']);
            });
        }

        // Store promotions for portal advertising
        if (!Schema::hasTable('store_promotions')) {
            Schema::create('store_promotions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
                $table->foreignId('producto_id')->nullable()->constrained('productos')->onDelete('set null');
                $table->string('title', 200);
                $table->text('description')->nullable();
                $table->decimal('promo_price', 12, 2)->nullable();
                $table->decimal('original_price', 12, 2)->nullable();
                $table->string('hero_image', 500)->nullable();
                $table->string('badge_text', 50)->nullable(); // "Promo", "Imperdible", "Oferta"
                $table->string('cta_text', 100)->default('Ver oferta');
                $table->string('cta_url', 500)->nullable();
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->index(['empresa_id', 'is_active', 'sort_order']);
                $table->index(['starts_at', 'ends_at', 'is_active']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('store_promotions');
        Schema::dropIfExists('store_domains');
        Schema::dropIfExists('portal_config');

        if (Schema::hasColumn('empresas', 'public_id')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->dropColumn(['public_id', 'handle', 'primary_domain', 'logo_url', 'description', 'tags', 'sort_order', 'is_featured']);
            });
        }
    }
};
