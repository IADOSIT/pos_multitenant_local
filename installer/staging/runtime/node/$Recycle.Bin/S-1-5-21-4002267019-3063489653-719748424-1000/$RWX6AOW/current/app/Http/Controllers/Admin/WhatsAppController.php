<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VendedorWhatsapp;
use App\Models\WhatsappLog;
use Illuminate\Http\Request;

class WhatsAppController extends Controller
{
    public function index(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $numeros = VendedorWhatsapp::where('empresa_id',$empresaId)->orderByDesc('id')->get();
        $logs = WhatsappLog::where('empresa_id',$empresaId)->orderByDesc('id')->limit(25)->get();

        return view('admin.whatsapp.index', compact('numeros','logs'));
    }

    public function create()
    {
        return view('admin.whatsapp.create');
    }

    public function store(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');

        $data = $request->validate([
            'whatsapp' => 'required|string|max:30',
            'activo' => 'required|boolean',
        ]);

        VendedorWhatsapp::create([
            'empresa_id' => $empresaId,
            'whatsapp' => $data['whatsapp'],
            'activo' => $data['activo'],
        ]);

        return redirect()->route('admin.whatsapp.index')->with('ok','Número guardado');
    }

    public function toggle(Request $request, int $id)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $n = VendedorWhatsapp::where('empresa_id',$empresaId)->findOrFail($id);
        $n->activo = !$n->activo;
        $n->save();
        return back()->with('ok','Actualizado');
    }

    public function destroy(Request $request, int $id)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $n = VendedorWhatsapp::where('empresa_id',$empresaId)->findOrFail($id);
        $n->delete();
        return back()->with('ok','Eliminado');
    }
}
