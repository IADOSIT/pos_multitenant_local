<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Empresa;

class EnsureEmpresaSelected
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->session()->has('empresa_id')) {
            return $next($request);
        }

        // Auto-recover for authenticated users
        $user = Auth::user();
        if ($user) {
            $empresa = $this->resolveDefaultEmpresa($user);
            if ($empresa) {
                $request->session()->put('empresa_id', $empresa->id);
                $request->session()->put('empresa_nombre', $empresa->nombre);
                return $next($request);
            }
        }

        return redirect()->route('login')->with('error', 'Selecciona una empresa.');
    }

    /**
     * Find a default empresa for the user.
     * Superadmins get the first active empresa if they have no direct assignment.
     */
    private function resolveDefaultEmpresa($user): ?Empresa
    {
        // First try: user's directly assigned empresas
        $empresaId = DB::table('empresa_usuario')
            ->where('usuario_id', $user->id)
            ->where('activo', true)
            ->value('empresa_id');

        if ($empresaId) {
            return Empresa::find($empresaId);
        }

        // Superadmin fallback: pick first active empresa
        $isSuperAdmin = DB::table('empresa_usuario')
            ->join('roles', 'roles.id', '=', 'empresa_usuario.rol_id')
            ->where('empresa_usuario.usuario_id', $user->id)
            ->where('roles.slug', 'superadmin')
            ->exists();

        if ($isSuperAdmin) {
            return Empresa::where('activa', true)->orderBy('id')->first();
        }

        return null;
    }
}
