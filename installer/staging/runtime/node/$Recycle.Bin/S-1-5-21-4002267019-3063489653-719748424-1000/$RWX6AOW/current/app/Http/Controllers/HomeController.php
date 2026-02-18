<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HomeController extends Controller
{
    public function empresa()
    {
        $empresas = Empresa::orderBy('id')->get();
        return view('empresa.switch', compact('empresas'));
    }

    public function empresaSet(Request $request)
    {
        $data = $request->validate([
            'empresa_id' => ['required','integer','exists:empresas,id'],
        ]);

        $user = auth()->user();
        $e = Empresa::findOrFail($data['empresa_id']);

        // Non-superadmin users can only switch to empresas they're assigned to
        if (!$user->isSuperAdmin()) {
            $hasAccess = DB::table('empresa_usuario')
                ->where('usuario_id', $user->id)
                ->where('empresa_id', $e->id)
                ->where('activo', true)
                ->exists();

            if (!$hasAccess) {
                return back()->with('error', 'No tienes acceso a esa empresa.');
            }
        }

        session([
            'empresa_id' => $e->id,
            'empresa_nombre' => $e->nombre ?? ('Empresa #'.$e->id),
        ]);

        return redirect()->route('dashboard');
    }
}
