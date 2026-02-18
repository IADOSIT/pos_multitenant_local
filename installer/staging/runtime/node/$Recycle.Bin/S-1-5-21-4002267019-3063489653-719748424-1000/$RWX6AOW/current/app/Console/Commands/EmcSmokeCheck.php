<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class EmcSmokeCheck extends Command
{
    protected $signature = 'emc:smoke-check';
    protected $description = 'EMC smoke check (DB + core tables)';

    public function handle(): int
    {
        $this->info('Checking DB connection...');
        try {
            DB::select('select 1 as ok');
            $this->info('DB OK');
        } catch (\Throwable $e) {
            $this->error('DB FAIL: ' . $e->getMessage());
            return self::FAILURE;
        }

        $tables = ['empresas','usuarios','roles','empresa_usuario','categorias','productos','ordenes','orden_items','orden_pagos','inventarios','caja_turnos','caja_movimientos','whatsapp_logs'];
        foreach ($tables as $t) {
            $exists = DB::selectOne("select to_regclass('public." . $t . "') as reg");
            if (!$exists || !$exists->reg) {
                $this->error("Missing table: {$t}");
                return self::FAILURE;
            }
        }

        $this->info('Core tables OK');
        $this->info('Smoke check OK');
        return self::SUCCESS;
    }
}
