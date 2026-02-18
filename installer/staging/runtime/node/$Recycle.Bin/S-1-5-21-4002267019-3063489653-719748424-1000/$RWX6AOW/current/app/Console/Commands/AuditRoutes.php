<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;

class AuditRoutes extends Command
{
    protected $signature = 'audit:routes {--smoke : Run smoke tests on key routes}';
    protected $description = 'Audit routes for potential issues and optionally run smoke tests';

    protected $issues = [];

    public function handle()
    {
        $this->info('=== EMC Abastos Routes Audit ===');
        $this->newLine();

        $this->auditRouteDefinitions();

        if ($this->option('smoke')) {
            $this->runSmokeTests();
        }

        $this->newLine();
        $this->printSummary();

        return count($this->issues) > 0 ? 1 : 0;
    }

    protected function auditRouteDefinitions()
    {
        $this->info('Auditing route definitions...');

        $routes = Route::getRoutes();
        $missingControllers = [];
        $missingMethods = [];

        foreach ($routes as $route) {
            $action = $route->getAction();

            if (!isset($action['controller'])) {
                continue;
            }

            $controller = $action['controller'];

            // Parse controller@method format
            if (is_string($controller) && str_contains($controller, '@')) {
                [$class, $method] = explode('@', $controller);

                if (!class_exists($class)) {
                    $missingControllers[] = $class;
                } elseif (!method_exists($class, $method)) {
                    $missingMethods[] = "{$class}@{$method}";
                }
            }
        }

        $missingControllers = array_unique($missingControllers);
        $missingMethods = array_unique($missingMethods);

        if (count($missingControllers) > 0) {
            $this->warn('  Missing controllers:');
            foreach ($missingControllers as $c) {
                $this->line("    - {$c}");
                $this->issues[] = "Missing controller: {$c}";
            }
        }

        if (count($missingMethods) > 0) {
            $this->warn('  Missing methods:');
            foreach ($missingMethods as $m) {
                $this->line("    - {$m}");
                $this->issues[] = "Missing method: {$m}";
            }
        }

        if (count($missingControllers) === 0 && count($missingMethods) === 0) {
            $this->line('  All route controllers and methods exist.');
        }

        // Check for common route issues
        $this->checkCommonRouteIssues();
    }

    protected function checkCommonRouteIssues()
    {
        $this->info('Checking common route patterns...');

        $requiredRoutes = [
            'login' => 'Authentication',
            'logout' => 'Authentication',
            'admin.dashboard' => 'Admin Dashboard',
            'admin.productos.index' => 'Admin Products',
            'admin.clientes.index' => 'Admin Clients',
            'store.home' => 'Storefront',
        ];

        foreach ($requiredRoutes as $name => $description) {
            if (!Route::has($name)) {
                $this->warn("  - Missing route: {$name} ({$description})");
                $this->issues[] = "Missing required route: {$name}";
            }
        }
    }

    protected function runSmokeTests()
    {
        $this->newLine();
        $this->info('Running smoke tests...');

        $baseUrl = config('app.url', 'http://localhost');

        $publicRoutes = [
            '/' => 'Home',
            '/login' => 'Login',
            '/registro' => 'Register',
            '/portal/' => 'Portal',
        ];

        foreach ($publicRoutes as $path => $name) {
            try {
                $response = Http::timeout(5)->get($baseUrl . $path);
                $status = $response->status();

                if ($status >= 200 && $status < 400) {
                    $this->line("  [OK] {$name} ({$path}) - {$status}");
                } else {
                    $this->warn("  [WARN] {$name} ({$path}) - {$status}");
                    $this->issues[] = "Route {$path} returned status {$status}";
                }
            } catch (\Exception $e) {
                $this->error("  [FAIL] {$name} ({$path}) - " . $e->getMessage());
                $this->issues[] = "Route {$path} failed: " . $e->getMessage();
            }
        }
    }

    protected function printSummary()
    {
        $this->info('=== SUMMARY ===');

        if (count($this->issues) === 0) {
            $this->info('No route issues found.');
        } else {
            $this->warn('Found ' . count($this->issues) . ' issue(s):');
            foreach ($this->issues as $issue) {
                $this->line("  - {$issue}");
            }
        }
    }
}
