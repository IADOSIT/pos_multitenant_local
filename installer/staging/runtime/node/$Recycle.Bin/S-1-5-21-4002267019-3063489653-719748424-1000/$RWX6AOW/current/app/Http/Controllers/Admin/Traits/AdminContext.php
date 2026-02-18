<?php

namespace App\Http\Controllers\Admin\Traits;

use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Provides empresa-aware helpers for admin controllers.
 *
 * - resolveEmpresaId(): returns empresa_id from session, but superadmin
 *   can override via ?empresa_id= query param.
 * - isSuperAdmin(): checks if current user has superadmin role anywhere.
 * - getEmpresasForUser(): returns empresa list for superadmin (for dropdowns),
 *   null for regular users.
 */
trait AdminContext
{
    /**
     * Resolve the active empresa_id.
     * Superadmin can override via ?empresa_id= query parameter.
     */
    protected function resolveEmpresaId(Request $request): int
    {
        $sessionId = (int) $request->session()->get('empresa_id');

        if ($this->isSuperAdmin() && $request->filled('empresa_id')) {
            $override = (int) $request->input('empresa_id');
            // Validate the empresa exists
            if (Empresa::where('id', $override)->exists()) {
                return $override;
            }
        }

        return $sessionId;
    }

    /**
     * Check if the current authenticated user is a superadmin.
     */
    protected function isSuperAdmin(): bool
    {
        $user = auth()->user();
        if (!$user) return false;

        return DB::table('empresa_usuario')
            ->join('roles', 'roles.id', '=', 'empresa_usuario.rol_id')
            ->where('empresa_usuario.usuario_id', $user->id)
            ->where('roles.slug', 'superadmin')
            ->exists();
    }

    /**
     * Get all active empresas for dropdown (superadmin only).
     * Returns null for non-superadmin users.
     */
    protected function getEmpresasForUser(): ?object
    {
        if (!$this->isSuperAdmin()) {
            return null;
        }

        return Empresa::where('activa', true)->orderBy('nombre')->get();
    }

    /**
     * Get the current user's role slug for the active empresa.
     */
    protected function getCurrentRoleSlug(Request $request): ?string
    {
        $user = auth()->user();
        if (!$user) return null;

        if ($this->isSuperAdmin()) {
            return 'superadmin';
        }

        $empresaId = (int) $request->session()->get('empresa_id');

        $row = DB::table('empresa_usuario')
            ->join('roles', 'roles.id', '=', 'empresa_usuario.rol_id')
            ->where('empresa_usuario.empresa_id', $empresaId)
            ->where('empresa_usuario.usuario_id', $user->id)
            ->select('roles.slug')
            ->first();

        return $row?->slug;
    }
}
