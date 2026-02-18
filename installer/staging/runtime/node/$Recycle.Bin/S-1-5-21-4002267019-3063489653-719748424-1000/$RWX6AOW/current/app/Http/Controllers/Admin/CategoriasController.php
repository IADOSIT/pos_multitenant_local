<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\Traits\AdminContext;
use App\Models\Categoria;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoriasController extends Controller
{
    use AdminContext;

    public function index(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);

        $q = Categoria::orderByRaw('orden NULLS LAST')->orderBy('id');

        if ($this->isSuperAdmin() && !$request->filled('empresa_id')) {
            $q->with('empresa');
        } else {
            $q->where('empresa_id', $empresaId);
        }

        $categorias = $q->get();
        $empresas = $this->getEmpresasForUser();

        return view('admin.categorias.index', compact('categorias', 'empresas', 'empresaId'));
    }

    public function create()
    {
        return view('admin.categorias.create');
    }

    public function store(Request $request)
    {
        $empresaId = $this->resolveEmpresaId($request);

        $data = $request->validate([
            'nombre'=>'required|string|max:180',
            'slug'=>'nullable|string|max:190',
            'orden'=>'nullable|integer',
            'activa'=>'required|boolean',
        ]);

        $data['empresa_id'] = $empresaId;
        if (empty($data['slug'])) $data['slug'] = Str::slug($data['nombre']);

        Categoria::create($data);
        return redirect()->route('admin.categorias.index')->with('ok','Categoría creada');
    }

    public function edit(Request $request, int $id)
    {
        $empresaId = $this->resolveEmpresaId($request);
        $categoria = Categoria::where('empresa_id',$empresaId)->findOrFail($id);
        return view('admin.categorias.edit', compact('categoria'));
    }

    public function update(Request $request, int $id)
    {
        $empresaId = $this->resolveEmpresaId($request);
        $categoria = Categoria::where('empresa_id',$empresaId)->findOrFail($id);

        $data = $request->validate([
            'nombre'=>'required|string|max:180',
            'slug'=>'nullable|string|max:190',
            'orden'=>'nullable|integer',
            'activa'=>'required|boolean',
        ]);
        if (empty($data['slug'])) $data['slug'] = Str::slug($data['nombre']);

        $categoria->update($data);
        return redirect()->route('admin.categorias.index')->with('ok','Categoría actualizada');
    }

    public function destroy(Request $request, int $id)
    {
        $empresaId = $this->resolveEmpresaId($request);
        $categoria = Categoria::where('empresa_id',$empresaId)->findOrFail($id);
        $categoria->delete();
        return redirect()->route('admin.categorias.index')->with('ok','Categoría eliminada');
    }
}
