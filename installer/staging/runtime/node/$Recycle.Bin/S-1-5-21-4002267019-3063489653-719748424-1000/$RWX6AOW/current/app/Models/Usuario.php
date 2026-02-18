<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [
        'name',
        'email',
        'password',
        'whatsapp',
        'telefono',
        'activo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'email_verified_at' => 'datetime',
    ];

    public function empresas()
    {
        return $this->belongsToMany(Empresa::class, 'empresa_usuario', 'usuario_id', 'empresa_id')
            ->withPivot('rol_id', 'activo')
            ->withTimestamps();
    }

    public function roles()
    {
        return $this->belongsToMany(Rol::class, 'empresa_usuario', 'usuario_id', 'rol_id')
            ->withPivot('empresa_id', 'activo')
            ->withTimestamps();
    }

    public function getRolForEmpresa(int $empresaId): ?Rol
    {
        $pivot = \DB::table('empresa_usuario')
            ->where('usuario_id', $this->id)
            ->where('empresa_id', $empresaId)
            ->first();

        if ($pivot) {
            return Rol::find($pivot->rol_id);
        }

        return null;
    }

    public function hasRoleInEmpresa(string $rolSlug, int $empresaId): bool
    {
        return \DB::table('empresa_usuario')
            ->join('roles', 'empresa_usuario.rol_id', '=', 'roles.id')
            ->where('empresa_usuario.usuario_id', $this->id)
            ->where('empresa_usuario.empresa_id', $empresaId)
            ->where('roles.slug', $rolSlug)
            ->exists();
    }

    public function isSuperAdmin(): bool
    {
        // Cache per-request to avoid repeated queries
        if (isset($this->_isSuperAdminCache)) {
            return $this->_isSuperAdminCache;
        }

        return $this->_isSuperAdminCache = \DB::table('empresa_usuario')
            ->join('roles', 'empresa_usuario.rol_id', '=', 'roles.id')
            ->where('empresa_usuario.usuario_id', $this->id)
            ->where('roles.slug', 'superadmin')
            ->exists();
    }

    public function isActiveInEmpresa(int $empresaId): bool
    {
        return \DB::table('empresa_usuario')
            ->where('usuario_id', $this->id)
            ->where('empresa_id', $empresaId)
            ->where('activo', true)
            ->exists();
    }
}
