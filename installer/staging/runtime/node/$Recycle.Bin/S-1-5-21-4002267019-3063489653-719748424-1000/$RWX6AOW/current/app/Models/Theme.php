<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Theme extends Model
{
    protected $table = 'themes';

    protected $fillable = [
        'nombre',
        'slug',
        'primary_color',
        'secondary_color',
        'accent_color',
        'mode',
        'styles',
        'typography',
        'copy',
        'banner_presets',
        'description',
        'is_default',
        'activo',
    ];

    protected $casts = [
        'styles' => 'array',
        'typography' => 'array',
        'copy' => 'array',
        'banner_presets' => 'array',
        'is_default' => 'boolean',
        'activo' => 'boolean',
    ];

    public function empresas()
    {
        return $this->hasMany(Empresa::class);
    }

    public static function getDefault(): ?self
    {
        return static::where('is_default', true)->where('activo', true)->first()
            ?? static::where('activo', true)->first();
    }

    public function getCssVariables(): array
    {
        return array_merge([
            '--primary-color' => $this->primary_color,
            '--secondary-color' => $this->secondary_color,
            '--accent-color' => $this->accent_color,
        ], $this->styles ?? []);
    }
}
