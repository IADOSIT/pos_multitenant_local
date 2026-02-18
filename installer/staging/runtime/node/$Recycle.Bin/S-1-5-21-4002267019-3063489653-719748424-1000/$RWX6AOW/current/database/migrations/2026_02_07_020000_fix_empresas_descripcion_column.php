<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Check if 'description' exists and 'descripcion' doesn't
        $hasDescription = DB::selectOne("SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'description'");
        $hasDescripcion = DB::selectOne("SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'descripcion'");

        if ($hasDescription && !$hasDescripcion) {
            DB::statement('ALTER TABLE empresas RENAME COLUMN description TO descripcion');
        }
    }

    public function down(): void
    {
        $hasDescripcion = DB::selectOne("SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'descripcion'");
        if ($hasDescripcion) {
            DB::statement('ALTER TABLE empresas RENAME COLUMN descripcion TO description');
        }
    }
};
