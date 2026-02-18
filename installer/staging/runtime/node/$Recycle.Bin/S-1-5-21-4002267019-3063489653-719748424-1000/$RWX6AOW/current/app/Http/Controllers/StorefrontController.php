<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class StorefrontController extends Controller
{
    public function index(Request $request)
    {
        $empresaId = (int) ($request->query('empresa_id') ?? $request->session()->get('empresa_id'));
        if (!$empresaId) $empresaId = (int) (\DB::table('empresas')->orderBy('id')->value('id') ?? 0);

        $q = Producto::query()
            ->where('empresa_id', $empresaId)
            ->where('activo', true)
            ->orderBy('id','desc');

        $cat = $request->query('cat');
        if ($cat) $q->where('categoria_id', (int)$cat);

        $search = trim((string)$request->query('q',''));
        if ($search !== '') {
            $search = mb_substr($search, 0, 80);
            $search = preg_replace('/[%_]+/u',' ', $search);
            $q->where('nombre','ilike',"%{$search}%");
        }

        $productos = $q->paginate(12)->withQueryString();

        $catQ = Categoria::query()->where('empresa_id',$empresaId);
        if (Schema::hasColumn('categorias','activa')) $catQ->where('activa',true);
        if (Schema::hasColumn('categorias','orden')) $catQ->orderByRaw('orden NULLS LAST');
        $categorias = $catQ->orderBy('id')->get();

        return view('store.index', compact('productos','categorias','empresaId','search','cat'));
    }
}
