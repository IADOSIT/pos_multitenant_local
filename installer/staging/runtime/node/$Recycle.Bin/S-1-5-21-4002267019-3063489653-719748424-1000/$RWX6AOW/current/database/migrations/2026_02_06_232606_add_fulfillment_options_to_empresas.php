<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            if (!Schema::hasColumn('empresas', 'enable_pickup')) {
                $table->boolean('enable_pickup')->default(true)->after('pickup_eta_hours');
            }
            if (!Schema::hasColumn('empresas', 'enable_delivery')) {
                $table->boolean('enable_delivery')->default(true)->after('enable_pickup');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            if (Schema::hasColumn('empresas', 'enable_pickup')) {
                $table->dropColumn('enable_pickup');
            }
            if (Schema::hasColumn('empresas', 'enable_delivery')) {
                $table->dropColumn('enable_delivery');
            }
        });
    }
};
