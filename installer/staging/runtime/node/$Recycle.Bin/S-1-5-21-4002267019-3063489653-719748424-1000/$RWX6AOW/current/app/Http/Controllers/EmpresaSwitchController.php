<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class EmpresaSwitchController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $empresas = DB::table('empresa_usuario')
            ->join('empresas','empresas.id','=','empresa_usuario.empresa_id')
            ->where('empresa_usuario.usuario_id', $user->id)
            ->where('empresa_usuario.activo', true)
            ->orderBy('empresas.nombre')
            ->select('empresas.id','empresas.nombre','empresas.slug')
            ->get();

        return view('empresa.switch', compact('empresas'));
    }

    public function set(Request $request)
    {
        $data = $request->validate(['empresa_id'=>'required|integer']);
        $user = Auth::user();

        $ok = DB::table('empresa_usuario')
            ->where('usuario_id',$user->id)
            ->where('empresa_id',$data['empresa_id'])
            ->where('activo', true)
            ->exists();

        abort_unless($ok, 403);

        $request->session()->put('empresa_id', (int)$data['empresa_id']);
        return redirect()->route('dashboard');
    }
}
