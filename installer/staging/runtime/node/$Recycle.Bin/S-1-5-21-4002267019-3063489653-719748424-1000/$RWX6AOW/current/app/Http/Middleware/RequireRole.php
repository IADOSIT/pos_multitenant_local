<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class RequireRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = Auth::user();
        if (!$user) return redirect()->route('login');

        $empresaId = $request->session()->get('empresa_id');
        if (!$empresaId) return redirect()->route('login');

        // Check if user is a global superadmin (has superadmin role in ANY empresa)
        $isSuperAdmin = DB::table('empresa_usuario')
            ->join('roles', 'roles.id', '=', 'empresa_usuario.rol_id')
            ->where('empresa_usuario.usuario_id', $user->id)
            ->where('roles.slug', 'superadmin')
            ->exists();

        // Superadmin bypasses empresa-specific role check — they can access
        // any empresa context with any role requirement that includes superadmin
        if ($isSuperAdmin) {
            if (empty($roles) || in_array('superadmin', $roles, true)) {
                return $next($request);
            }
        }

        // Normal check: user must have one of the required roles for THIS empresa
        $row = DB::table('empresa_usuario')
            ->join('roles', 'roles.id', '=', 'empresa_usuario.rol_id')
            ->where('empresa_usuario.empresa_id', $empresaId)
            ->where('empresa_usuario.usuario_id', $user->id)
            ->select('roles.slug')
            ->first();

        $slug = $row?->slug;
        if (!$slug || (!empty($roles) && !in_array($slug, $roles, true))) {
            abort(403);
        }

        return $next($request);
    }
}
