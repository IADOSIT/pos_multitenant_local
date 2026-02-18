<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuditDatabase extends Command
{
    protected $signature = 'audit:db {--fix : Apply safe fixes}';
    protected $description = 'Audit database integrity: orphans, nulls, duplicates, missing indexes';

    protected $issues = [];
    protected $fixes = [];

    public function handle()
    {
        $this->info('=== EMC Abastos Database Audit ===');
        $this->newLine();

        $this->checkOrphanedRecords();
        $this->checkNullValues();
        $this->checkDuplicates();
        $this->checkMissingIndexes();
        $this->checkEmpresaScoping();

        $this->newLine();
        $this->printSummary();

        if ($this->option('fix') && count($this->fixes) > 0) {
            $this->applyFixes();
        }

        return count($this->issues) > 0 ? 1 : 0;
    }

    protected function checkOrphanedRecords()
    {
        $this->info('Checking orphaned records...');

        // Productos without valid empresa
        $orphanedProductos = DB::table('productos')
            ->leftJoin('empresas', 'productos.empresa_id', '=', 'empresas.id')
            ->whereNull('empresas.id')
            ->count();
        if ($orphanedProductos > 0) {
            $this->issues[] = "Productos without valid empresa: {$orphanedProductos}";
            $this->warn("  - {$orphanedProductos} productos without valid empresa");
        }

        // Categorias without valid empresa
        if (Schema::hasColumn('categorias', 'empresa_id')) {
            $orphanedCategorias = DB::table('categorias')
                ->leftJoin('empresas', 'categorias.empresa_id', '=', 'empresas.id')
                ->whereNull('empresas.id')
                ->count();
            if ($orphanedCategorias > 0) {
                $this->issues[] = "Categorias without valid empresa: {$orphanedCategorias}";
                $this->warn("  - {$orphanedCategorias} categorias without valid empresa");
            }
        }

        // Ordenes without valid empresa
        if (Schema::hasTable('ordenes')) {
            $orphanedOrdenes = DB::table('ordenes')
                ->leftJoin('empresas', 'ordenes.empresa_id', '=', 'empresas.id')
                ->whereNull('empresas.id')
                ->count();
            if ($orphanedOrdenes > 0) {
                $this->issues[] = "Ordenes without valid empresa: {$orphanedOrdenes}";
                $this->warn("  - {$orphanedOrdenes} ordenes without valid empresa");
            }
        }

        // Clientes without valid empresa
        if (Schema::hasTable('clientes')) {
            $orphanedClientes = DB::table('clientes')
                ->leftJoin('empresas', 'clientes.empresa_id', '=', 'empresas.id')
                ->whereNull('empresas.id')
                ->count();
            if ($orphanedClientes > 0) {
                $this->issues[] = "Clientes without valid empresa: {$orphanedClientes}";
                $this->warn("  - {$orphanedClientes} clientes without valid empresa");
            }
        }

        // empresa_usuario without valid usuario or empresa
        $orphanedPivot = DB::table('empresa_usuario')
            ->leftJoin('usuarios', 'empresa_usuario.usuario_id', '=', 'usuarios.id')
            ->leftJoin('empresas', 'empresa_usuario.empresa_id', '=', 'empresas.id')
            ->where(function($q) {
                $q->whereNull('usuarios.id')->orWhereNull('empresas.id');
            })
            ->count();
        if ($orphanedPivot > 0) {
            $this->issues[] = "empresa_usuario orphaned pivots: {$orphanedPivot}";
            $this->warn("  - {$orphanedPivot} orphaned empresa_usuario records");
            $this->fixes[] = ['type' => 'delete_orphan_pivot', 'count' => $orphanedPivot];
        }

        if (count($this->issues) === 0) {
            $this->line('  No orphaned records found.');
        }
    }

    protected function checkNullValues()
    {
        $this->info('Checking critical null values...');
        $nullIssues = 0;

        // Productos with null nombre
        $nullNombre = DB::table('productos')->whereNull('nombre')->orWhere('nombre', '')->count();
        if ($nullNombre > 0) {
            $this->issues[] = "Productos with null/empty nombre: {$nullNombre}";
            $this->warn("  - {$nullNombre} productos with null/empty nombre");
            $nullIssues++;
        }

        // Productos with null precio
        $nullPrecio = DB::table('productos')->whereNull('precio')->count();
        if ($nullPrecio > 0) {
            $this->issues[] = "Productos with null precio: {$nullPrecio}";
            $this->warn("  - {$nullPrecio} productos with null precio");
            $this->fixes[] = ['type' => 'set_default_precio', 'count' => $nullPrecio];
            $nullIssues++;
        }

        // Empresas with null nombre
        $nullEmpresa = DB::table('empresas')->whereNull('nombre')->orWhere('nombre', '')->count();
        if ($nullEmpresa > 0) {
            $this->issues[] = "Empresas with null/empty nombre: {$nullEmpresa}";
            $this->warn("  - {$nullEmpresa} empresas with null/empty nombre");
            $nullIssues++;
        }

        if ($nullIssues === 0) {
            $this->line('  No critical null values found.');
        }
    }

    protected function checkDuplicates()
    {
        $this->info('Checking duplicates...');
        $dupIssues = 0;

        // Duplicate emails in usuarios
        $dupEmails = DB::table('usuarios')
            ->select('email', DB::raw('COUNT(*) as cnt'))
            ->groupBy('email')
            ->havingRaw('COUNT(*) > 1')
            ->count();
        if ($dupEmails > 0) {
            $this->issues[] = "Duplicate emails in usuarios: {$dupEmails}";
            $this->warn("  - {$dupEmails} duplicate emails in usuarios");
            $dupIssues++;
        }

        // Duplicate slugs in empresas
        $dupSlugs = DB::table('empresas')
            ->select('slug', DB::raw('COUNT(*) as cnt'))
            ->whereNotNull('slug')
            ->groupBy('slug')
            ->havingRaw('COUNT(*) > 1')
            ->count();
        if ($dupSlugs > 0) {
            $this->issues[] = "Duplicate slugs in empresas: {$dupSlugs}";
            $this->warn("  - {$dupSlugs} duplicate slugs in empresas");
            $dupIssues++;
        }

        if ($dupIssues === 0) {
            $this->line('  No duplicates found.');
        }
    }

    protected function checkMissingIndexes()
    {
        $this->info('Checking recommended indexes...');

        $recommendedIndexes = [
            'ordenes' => ['empresa_id', 'created_at', 'status'],
            'productos' => ['empresa_id', 'activo'],
            'clientes' => ['empresa_id'],
            'categorias' => ['empresa_id'],
        ];

        foreach ($recommendedIndexes as $table => $columns) {
            if (!Schema::hasTable($table)) continue;

            foreach ($columns as $column) {
                if (!Schema::hasColumn($table, $column)) continue;

                // Check if index exists (simplified check)
                $indexName = "{$table}_{$column}_index";
                $indexes = DB::select("SELECT indexname FROM pg_indexes WHERE tablename = ? AND indexname LIKE ?", [$table, "%{$column}%"]);

                if (count($indexes) === 0) {
                    $this->line("  - Recommended index on {$table}.{$column}");
                }
            }
        }
    }

    protected function checkEmpresaScoping()
    {
        $this->info('Checking empresa scoping...');

        $tables = ['productos', 'categorias', 'clientes', 'ordenes'];
        $missingScope = [];

        foreach ($tables as $table) {
            if (!Schema::hasTable($table)) continue;
            if (!Schema::hasColumn($table, 'empresa_id')) {
                $missingScope[] = $table;
            }
        }

        if (count($missingScope) > 0) {
            $this->issues[] = "Tables missing empresa_id: " . implode(', ', $missingScope);
            $this->warn("  - Missing empresa_id: " . implode(', ', $missingScope));
        } else {
            $this->line('  All critical tables have empresa_id.');
        }
    }

    protected function printSummary()
    {
        $this->info('=== SUMMARY ===');

        if (count($this->issues) === 0) {
            $this->info('No issues found. Database is healthy.');
        } else {
            $this->warn('Found ' . count($this->issues) . ' issue(s):');
            foreach ($this->issues as $issue) {
                $this->line("  - {$issue}");
            }

            if (count($this->fixes) > 0) {
                $this->newLine();
                $this->line('Available fixes (run with --fix):');
                foreach ($this->fixes as $fix) {
                    $this->line("  - {$fix['type']}: {$fix['count']} records");
                }
            }
        }
    }

    protected function applyFixes()
    {
        $this->newLine();
        $this->info('Applying fixes...');

        foreach ($this->fixes as $fix) {
            switch ($fix['type']) {
                case 'delete_orphan_pivot':
                    DB::table('empresa_usuario')
                        ->leftJoin('usuarios', 'empresa_usuario.usuario_id', '=', 'usuarios.id')
                        ->leftJoin('empresas', 'empresa_usuario.empresa_id', '=', 'empresas.id')
                        ->where(function($q) {
                            $q->whereNull('usuarios.id')->orWhereNull('empresas.id');
                        })
                        ->delete();
                    $this->line("  - Deleted orphaned empresa_usuario records");
                    break;

                case 'set_default_precio':
                    DB::table('productos')->whereNull('precio')->update(['precio' => 0]);
                    $this->line("  - Set default precio=0 for null productos");
                    break;
            }
        }

        $this->info('Fixes applied.');
    }
}
