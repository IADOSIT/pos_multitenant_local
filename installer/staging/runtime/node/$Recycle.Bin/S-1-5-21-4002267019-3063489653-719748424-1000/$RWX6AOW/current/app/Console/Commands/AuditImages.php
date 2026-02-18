<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Producto;
use App\Models\Empresa;
use Illuminate\Support\Facades\Storage;

class AuditImages extends Command
{
    protected $signature = 'audit:images {--fix : Apply fixes (set default images)}';
    protected $description = 'Audit product and store images for broken/missing files';

    protected $broken = [];
    protected $missing = [];

    public function handle()
    {
        $this->info('=== EMC Abastos Image Audit ===');
        $this->newLine();

        $this->auditProductImages();
        $this->auditEmpresaLogos();

        $this->newLine();
        $this->printSummary();

        if ($this->option('fix')) {
            $this->applyFixes();
        }

        return (count($this->broken) + count($this->missing)) > 0 ? 1 : 0;
    }

    protected function auditProductImages()
    {
        $this->info('Auditing product images...');

        $productos = Producto::select('id', 'nombre', 'imagen_url', 'image_source', 'empresa_id')->get();
        $total = $productos->count();
        $withImage = 0;
        $withDefault = 0;
        $withBroken = 0;

        foreach ($productos as $p) {
            if (empty($p->imagen_url)) {
                $withDefault++;
                continue;
            }

            // Check if it's a local file
            if (str_starts_with($p->imagen_url, '/storage/') || str_starts_with($p->imagen_url, 'storage/')) {
                $path = str_replace('/storage/', '', $p->imagen_url);
                $path = str_replace('storage/', '', $path);

                if (!Storage::disk('public')->exists($path)) {
                    $this->broken[] = ['type' => 'producto', 'id' => $p->id, 'nombre' => $p->nombre, 'url' => $p->imagen_url];
                    $withBroken++;
                } else {
                    $withImage++;
                }
            } else {
                // External URL - assume valid
                $withImage++;
            }
        }

        $this->line("  Total productos: {$total}");
        $this->line("  With valid image: {$withImage}");
        $this->line("  Using default: {$withDefault}");
        if ($withBroken > 0) {
            $this->warn("  With broken image: {$withBroken}");
        }
    }

    protected function auditEmpresaLogos()
    {
        $this->info('Auditing empresa logos...');

        $empresas = Empresa::select('id', 'nombre', 'logo_path', 'logo_url')->get();
        $total = $empresas->count();
        $withLogo = 0;
        $withBroken = 0;

        foreach ($empresas as $e) {
            $logoPath = $e->logo_path ?? $e->logo_url;

            if (empty($logoPath)) {
                continue;
            }

            if (str_starts_with($logoPath, '/storage/') || str_starts_with($logoPath, 'storage/') || str_starts_with($logoPath, 'empresas/')) {
                $path = str_replace('/storage/', '', $logoPath);
                $path = str_replace('storage/', '', $path);

                if (!Storage::disk('public')->exists($path)) {
                    $this->broken[] = ['type' => 'empresa', 'id' => $e->id, 'nombre' => $e->nombre, 'url' => $logoPath];
                    $withBroken++;
                } else {
                    $withLogo++;
                }
            } else {
                $withLogo++;
            }
        }

        $this->line("  Total empresas: {$total}");
        $this->line("  With valid logo: {$withLogo}");
        if ($withBroken > 0) {
            $this->warn("  With broken logo: {$withBroken}");
        }
    }

    protected function printSummary()
    {
        $this->info('=== SUMMARY ===');

        $totalBroken = count($this->broken);

        if ($totalBroken === 0) {
            $this->info('No broken images found.');
        } else {
            $this->warn("Found {$totalBroken} broken image(s):");
            foreach ($this->broken as $item) {
                $this->line("  - [{$item['type']}] ID:{$item['id']} {$item['nombre']} -> {$item['url']}");
            }
            $this->newLine();
            $this->line('Run with --fix to clear broken image references.');
        }
    }

    protected function applyFixes()
    {
        $this->newLine();
        $this->info('Applying fixes...');

        $fixedProducts = 0;
        $fixedEmpresas = 0;

        foreach ($this->broken as $item) {
            if ($item['type'] === 'producto') {
                Producto::where('id', $item['id'])->update([
                    'imagen_url' => null,
                    'image_source' => 'default'
                ]);
                $fixedProducts++;
            } elseif ($item['type'] === 'empresa') {
                Empresa::where('id', $item['id'])->update([
                    'logo_path' => null,
                    'logo_url' => null
                ]);
                $fixedEmpresas++;
            }
        }

        $this->line("  - Fixed {$fixedProducts} producto(s)");
        $this->line("  - Fixed {$fixedEmpresas} empresa(s)");
        $this->info('Fixes applied. Images will now use fallback.');
    }
}
