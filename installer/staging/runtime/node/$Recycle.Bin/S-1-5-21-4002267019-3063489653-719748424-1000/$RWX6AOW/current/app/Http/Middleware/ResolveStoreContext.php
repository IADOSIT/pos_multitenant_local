<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Empresa;
use App\Models\PortalConfig;

class ResolveStoreContext
{
    public function handle(Request $request, Closure $next)
    {
        $store = null;

        // 1. Try to resolve by custom domain
        $host = $request->getHost();
        $fallbackDomain = PortalConfig::get('fallback_domain') ?? parse_url(config('app.url'), PHP_URL_HOST);

        // Skip if it's the fallback domain itself (handled by route)
        if ($host !== $fallbackDomain && !$this->isMainAppDomain($host)) {
            $store = Empresa::findByDomain($host);
        }

        // 2. Try to resolve by handle from route parameter
        if (!$store && $request->route('handle')) {
            $store = Empresa::findByHandle($request->route('handle'));
        }

        // 3. Fallback to session empresa_id (backward compatibility)
        if (!$store && session('empresa_id')) {
            $store = Empresa::find(session('empresa_id'));
        }

        // Set store context
        if ($store) {
            $request->attributes->set('store', $store);
            $request->attributes->set('store_id', $store->id);

            // Also set in session for backward compatibility
            session(['empresa_id' => $store->id]);
            session(['empresa_nombre' => $store->nombre]);

            // Share with views
            view()->share('currentStore', $store);
            view()->share('storeContext', true);
        }

        return $next($request);
    }

    private function isMainAppDomain(string $host): bool
    {
        $appDomains = [
            'localhost',
            '127.0.0.1',
            parse_url(config('app.url'), PHP_URL_HOST),
        ];

        return in_array($host, $appDomains);
    }
}
