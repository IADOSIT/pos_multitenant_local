<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\Traits\AdminContext;
use App\Models\Empresa;
use App\Models\Producto;
use App\Models\InventarioMovimiento;
use App\Services\InventarioService;
use Illuminate\Http\Request;

class InventariosController extends Controller
{
    use AdminContext;

    public function index(Request $request, InventarioService $inv)
    {
        $empresaId = $this->resolveEmpresaId($request);
        $search = trim((string)$request->get('q',''));

        $q = Producto::orderBy('id');

        if ($this->isSuperAdmin() && !$request->filled('empresa_id')) {
            $q->with('empresa');
        } else {
            $q->where('empresa_id', $empresaId);
        }

        if ($search !== '') {
            $s = mb_substr(preg_replace('/[%_]+/u',' ', $search), 0, 80);
            $q->where('nombre','ilike',"%{$s}%");
        }

        $productos = $q->paginate(30)->withQueryString();
        $rows = [];
        foreach ($productos as $p) {
            $rows[] = ['producto'=>$p, 'stock'=>$inv->stock($p->empresa_id, $p->id)];
        }

        $empresas = $this->getEmpresasForUser();

        return view('admin.inventarios.index', compact('productos','rows','search','empresas','empresaId'));
    }

    public function kardex(Request $request, int $productoId, InventarioService $inv)
    {
        $empresaId = $this->resolveEmpresaId($request);
        $producto = Producto::where('empresa_id',$empresaId)->findOrFail($productoId);

        $movs = InventarioMovimiento::where('empresa_id',$empresaId)->where('producto_id',$producto->id)->orderByDesc('id')->limit(200)->get();
        $stock = $inv->stock($empresaId, $producto->id);

        return view('admin.inventarios.kardex', compact('producto','movs','stock'));
    }

    public function ajustar(Request $request, int $productoId, InventarioService $inv)
    {
        $empresaId = $this->resolveEmpresaId($request);
        $producto = Producto::where('empresa_id',$empresaId)->findOrFail($productoId);

        $data = $request->validate([
            'tipo' => 'required|in:ajuste,merma,compra',
            'cantidad' => 'required|integer',
            'nota' => 'nullable|string|max:255',
        ]);

        $inv->ajuste($empresaId, $producto->id, (int)$data['cantidad'], $data['tipo'], $data['nota'] ?? null, auth()->id());
        return back()->with('ok','Inventario actualizado');
    }
}
