<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Check if an index exists in PostgreSQL
     */
    private function indexExists(string $indexName): bool
    {
        $result = DB::select("SELECT 1 FROM pg_indexes WHERE indexname = ?", [$indexName]);
        return count($result) > 0;
    }

    public function up(): void
    {
        // Ordenes - composite index for common queries
        if (Schema::hasTable('ordenes')) {
            if (!$this->indexExists('ordenes_empresa_status_created_index')) {
                Schema::table('ordenes', function (Blueprint $table) {
                    $table->index(['empresa_id', 'status', 'created_at'], 'ordenes_empresa_status_created_index');
                });
            }
        }

        // Productos - index for listing queries
        if (Schema::hasTable('productos')) {
            if (!$this->indexExists('productos_empresa_activo_index')) {
                Schema::table('productos', function (Blueprint $table) {
                    $table->index(['empresa_id', 'activo'], 'productos_empresa_activo_index');
                });
            }

            if (!$this->indexExists('productos_is_featured_index') && Schema::hasColumn('productos', 'is_featured')) {
                Schema::table('productos', function (Blueprint $table) {
                    $table->index(['is_featured'], 'productos_is_featured_index');
                });
            }
        }

        // Clientes - index for empresa scoping
        if (Schema::hasTable('clientes')) {
            if (!$this->indexExists('clientes_empresa_id_index')) {
                Schema::table('clientes', function (Blueprint $table) {
                    $table->index(['empresa_id'], 'clientes_empresa_id_index');
                });
            }
        }

        // Categorias - index for empresa scoping
        if (Schema::hasTable('categorias') && Schema::hasColumn('categorias', 'empresa_id')) {
            if (!$this->indexExists('categorias_empresa_id_index')) {
                Schema::table('categorias', function (Blueprint $table) {
                    $table->index(['empresa_id'], 'categorias_empresa_id_index');
                });
            }
        }

        // Store promotions - index for active queries
        if (Schema::hasTable('store_promotions')) {
            if (!$this->indexExists('store_promotions_active_index')) {
                Schema::table('store_promotions', function (Blueprint $table) {
                    $table->index(['empresa_id', 'is_active', 'starts_at', 'ends_at'], 'store_promotions_active_index');
                });
            }
        }
    }

    public function down(): void
    {
        if ($this->indexExists('ordenes_empresa_status_created_index')) {
            Schema::table('ordenes', function (Blueprint $table) {
                $table->dropIndex('ordenes_empresa_status_created_index');
            });
        }

        if ($this->indexExists('productos_empresa_activo_index')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->dropIndex('productos_empresa_activo_index');
            });
        }

        if ($this->indexExists('productos_is_featured_index')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->dropIndex('productos_is_featured_index');
            });
        }

        if ($this->indexExists('clientes_empresa_id_index')) {
            Schema::table('clientes', function (Blueprint $table) {
                $table->dropIndex('clientes_empresa_id_index');
            });
        }

        if ($this->indexExists('categorias_empresa_id_index')) {
            Schema::table('categorias', function (Blueprint $table) {
                $table->dropIndex('categorias_empresa_id_index');
            });
        }

        if ($this->indexExists('store_promotions_active_index')) {
            Schema::table('store_promotions', function (Blueprint $table) {
                $table->dropIndex('store_promotions_active_index');
            });
        }
    }
};
