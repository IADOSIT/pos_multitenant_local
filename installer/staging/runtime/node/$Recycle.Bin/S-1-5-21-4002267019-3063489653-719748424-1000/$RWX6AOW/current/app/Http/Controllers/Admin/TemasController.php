<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Theme;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TemasController extends Controller
{
    public function index()
    {
        $themes = Theme::orderBy('nombre')->get();
        return view('admin.temas.index', compact('themes'));
    }

    public function create()
    {
        return view('admin.temas.create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:themes,slug',
            'primary_color' => 'required|string|max:20',
            'secondary_color' => 'required|string|max:20',
            'accent_color' => 'required|string|max:20',
            'mode' => 'required|in:light,dark',
            'description' => 'nullable|string|max:500',
            'is_default' => 'boolean',
            'activo' => 'boolean',
        ]);

        $slug = $data['slug'] ?? Str::slug($data['nombre']);

        // If setting as default, unset other defaults
        if ($request->boolean('is_default')) {
            Theme::where('is_default', true)->update(['is_default' => false]);
        }

        Theme::create([
            'nombre' => $data['nombre'],
            'slug' => $slug,
            'primary_color' => $data['primary_color'],
            'secondary_color' => $data['secondary_color'],
            'accent_color' => $data['accent_color'],
            'mode' => $data['mode'],
            'description' => $data['description'] ?? null,
            'is_default' => $data['is_default'] ?? false,
            'activo' => $data['activo'] ?? true,
        ]);

        return redirect()->route('admin.temas.index')->with('ok', 'Tema creado correctamente');
    }

    public function edit(int $id)
    {
        $theme = Theme::findOrFail($id);
        return view('admin.temas.edit', compact('theme'));
    }

    public function update(Request $request, int $id)
    {
        $theme = Theme::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:themes,slug,' . $id,
            'primary_color' => 'required|string|max:20',
            'secondary_color' => 'required|string|max:20',
            'accent_color' => 'required|string|max:20',
            'mode' => 'required|in:light,dark',
            'description' => 'nullable|string|max:500',
            'is_default' => 'boolean',
            'activo' => 'boolean',
        ]);

        // If setting as default, unset other defaults
        if ($request->boolean('is_default') && !$theme->is_default) {
            Theme::where('is_default', true)->update(['is_default' => false]);
        }

        $theme->update([
            'nombre' => $data['nombre'],
            'slug' => $data['slug'] ?? $theme->slug,
            'primary_color' => $data['primary_color'],
            'secondary_color' => $data['secondary_color'],
            'accent_color' => $data['accent_color'],
            'mode' => $data['mode'],
            'description' => $data['description'] ?? null,
            'is_default' => $data['is_default'] ?? false,
            'activo' => $data['activo'] ?? true,
        ]);

        return redirect()->route('admin.temas.index')->with('ok', 'Tema actualizado correctamente');
    }

    public function destroy(int $id)
    {
        $theme = Theme::findOrFail($id);

        // Check if theme is in use
        if ($theme->empresas()->exists()) {
            return back()->with('error', 'No se puede eliminar un tema que esta en uso');
        }

        $theme->delete();

        return redirect()->route('admin.temas.index')->with('ok', 'Tema eliminado correctamente');
    }

    public function preview(int $id)
    {
        $theme = Theme::findOrFail($id);
        return view('admin.temas.preview', compact('theme'));
    }
}
