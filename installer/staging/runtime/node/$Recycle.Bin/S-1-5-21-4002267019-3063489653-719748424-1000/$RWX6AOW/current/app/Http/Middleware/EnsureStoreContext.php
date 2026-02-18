<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\PortalConfig;

class EnsureStoreContext
{
    public function handle(Request $request, Closure $next)
    {
        $store = $request->attributes->get('store');

        if (!$store) {
            // For API requests, return JSON error
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'error' => 'store_not_found',
                    'message' => 'No se encontro la tienda especificada.',
                ], 404);
            }

            // For web requests, redirect to portal or show 404
            $portalUrl = PortalConfig::get('portal_url');
            if ($portalUrl) {
                return redirect($portalUrl);
            }

            abort(404, 'Tienda no encontrada');
        }

        // Check if store is active
        if (!$store->activa) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'error' => 'store_inactive',
                    'message' => 'Esta tienda no esta disponible actualmente.',
                ], 403);
            }

            abort(403, 'Esta tienda no esta disponible actualmente.');
        }

        return $next($request);
    }
}
