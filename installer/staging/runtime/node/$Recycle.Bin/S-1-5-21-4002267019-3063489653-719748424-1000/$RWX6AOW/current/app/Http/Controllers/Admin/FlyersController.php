<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Flyer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FlyersController extends Controller
{
    public function index(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $flyers = Flyer::where('empresa_id', $empresaId)
            ->orderBy('orden')
            ->orderByDesc('id')
            ->paginate(12);

        return view('admin.flyers.index', compact('flyers'));
    }

    public function create()
    {
        return view('admin.flyers.create');
    }

    public function store(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $request->validate([
            'titulo' => ['nullable', 'string', 'max:255'],
            'imagen' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'url', 'max:500'],
            'orden' => ['nullable', 'integer', 'min:0'],
        ]);

        $imagenUrl = null;
        if ($request->hasFile('imagen')) {
            $path = $request->file('imagen')->store("flyers/{$empresaId}", 'public');
            $imagenUrl = Storage::url($path);
        }

        Flyer::create([
            'empresa_id' => $empresaId,
            'titulo' => $request->titulo,
            'imagen_url' => $imagenUrl,
            'alt_text' => $request->alt_text ?? $request->titulo,
            'link_url' => $request->link_url,
            'orden' => $request->orden ?? 0,
            'activo' => true,
        ]);

        return redirect()->route('admin.flyers.index')->with('ok', 'Flyer creado correctamente.');
    }

    public function edit(Flyer $flyer, Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        abort_unless($flyer->empresa_id === $empresaId, 403);

        return view('admin.flyers.edit', compact('flyer'));
    }

    public function update(Request $request, Flyer $flyer)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        abort_unless($flyer->empresa_id === $empresaId, 403);

        $request->validate([
            'titulo' => ['nullable', 'string', 'max:255'],
            'imagen' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'url', 'max:500'],
            'orden' => ['nullable', 'integer', 'min:0'],
            'activo' => ['nullable'],
        ]);

        if ($request->hasFile('imagen')) {
            // Delete old image if exists
            if ($flyer->imagen_url && str_starts_with($flyer->imagen_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $flyer->imagen_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('imagen')->store("flyers/{$empresaId}", 'public');
            $flyer->imagen_url = Storage::url($path);
        }

        $flyer->titulo = $request->titulo;
        $flyer->alt_text = $request->alt_text ?? $request->titulo;
        $flyer->link_url = $request->link_url;
        $flyer->orden = $request->orden ?? 0;
        $flyer->activo = $request->has('activo');
        $flyer->save();

        return redirect()->route('admin.flyers.index')->with('ok', 'Flyer actualizado correctamente.');
    }

    public function destroy(Flyer $flyer, Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        abort_unless($flyer->empresa_id === $empresaId, 403);

        // Delete image
        if ($flyer->imagen_url && str_starts_with($flyer->imagen_url, '/storage/')) {
            $oldPath = str_replace('/storage/', '', $flyer->imagen_url);
            Storage::disk('public')->delete($oldPath);
        }

        $flyer->delete();

        return redirect()->route('admin.flyers.index')->with('ok', 'Flyer eliminado correctamente.');
    }

    public function reorder(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        foreach ($request->order as $index => $id) {
            Flyer::where('id', $id)
                ->where('empresa_id', $empresaId)
                ->update(['orden' => $index]);
        }

        return response()->json(['ok' => true]);
    }
}
