<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncSuperadminEmpresas extends Command
{
    protected $signature = 'emc:sync-superadmin-empresas';
    protected $description = 'Ensure all superadmin users have pivot rows for every active empresa';

    public function handle(): int
    {
        $superadminRolId = DB::table('roles')->where('slug', 'superadmin')->value('id');
        if (!$superadminRolId) {
            $this->error('Superadmin role not found.');
            return 1;
        }

        // All distinct superadmin user IDs
        $superadminUserIds = DB::table('empresa_usuario')
            ->where('rol_id', $superadminRolId)
            ->distinct()
            ->pluck('usuario_id');

        if ($superadminUserIds->isEmpty()) {
            $this->info('No superadmin users found.');
            return 0;
        }

        $empresas = Empresa::where('activa', true)->pluck('id');
        $inserted = 0;

        foreach ($superadminUserIds as $userId) {
            $existing = DB::table('empresa_usuario')
                ->where('usuario_id', $userId)
                ->pluck('empresa_id');

            $missing = $empresas->diff($existing);

            foreach ($missing as $empresaId) {
                DB::table('empresa_usuario')->insert([
                    'empresa_id' => $empresaId,
                    'usuario_id' => $userId,
                    'rol_id' => $superadminRolId,
                    'activo' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $inserted++;
            }
        }

        $this->info("Synced {$superadminUserIds->count()} superadmin(s) across {$empresas->count()} empresas. Created {$inserted} new assignments.");
        return 0;
    }
}
