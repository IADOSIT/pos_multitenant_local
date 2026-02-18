<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->time('hora_atencion_inicio')->nullable()->default('08:00');
            $table->time('hora_atencion_fin')->nullable()->default('18:00');
            $table->decimal('pickup_eta_hours', 4, 1)->nullable()->default(2.0);
        });
    }

    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn(['hora_atencion_inicio', 'hora_atencion_fin', 'pickup_eta_hours']);
        });
    }
};
