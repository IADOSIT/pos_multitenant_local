<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes', function (Blueprint $table) {
            if (!Schema::hasColumn('ordenes', 'fulfillment_type')) {
                $table->string('fulfillment_type', 20)->nullable()->default('pickup');
            }
            if (!Schema::hasColumn('ordenes', 'estimated_ready_at')) {
                $table->timestamp('estimated_ready_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('ordenes', function (Blueprint $table) {
            $table->dropColumn(['fulfillment_type', 'estimated_ready_at']);
        });
    }
};
