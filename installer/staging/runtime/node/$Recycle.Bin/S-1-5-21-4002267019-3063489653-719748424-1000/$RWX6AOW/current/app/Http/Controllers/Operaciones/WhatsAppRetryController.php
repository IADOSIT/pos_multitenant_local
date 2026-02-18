<?php

namespace App\Http\Controllers\Operaciones;

use App\Http\Controllers\Controller;
use App\Models\WhatsappLog;
use App\Models\Orden;
use App\Services\WhatsApp\WhatsAppSender;
use Illuminate\Http\Request;

class WhatsAppRetryController extends Controller
{
    public function index(Request $request)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $q = WhatsappLog::where('empresa_id',$empresaId)->orderByDesc('id');

        if ($status = $request->get('status')) $q->where('status',$status);
        $logs = $q->paginate(30)->withQueryString();

        return view('ops.whatsapp.index', compact('logs'));
    }

    public function retry(Request $request, int $logId, WhatsAppSender $sender)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $log = WhatsappLog::where('empresa_id',$empresaId)->findOrFail($logId);
        $sender->retryLog($log);
        return back()->with('ok','Reintento en cola');
    }

    public function retryLast(Request $request, int $ordenId, WhatsAppSender $sender)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $orden = Orden::where('empresa_id',$empresaId)->findOrFail($ordenId);
        $log = WhatsappLog::where('empresa_id',$empresaId)->where('orden_id',$orden->id)->orderByDesc('id')->first();
        if (!$log) return back()->with('error','No hay logs');
        $sender->retryLog($log);
        return back()->with('ok','Reintento en cola');
    }

    public function optout(Request $request, int $ordenId)
    {
        $empresaId = (int) $request->session()->get('empresa_id');
        $orden = Orden::where('empresa_id',$empresaId)->findOrFail($ordenId);

        // marca cliente como opt-out
        if ($orden->cliente_id) {
            \DB::table('clientes')->where('empresa_id',$empresaId)->where('id',$orden->cliente_id)->update([
                'enviar_estatus'=>false,
                'updated_at'=>now(),
            ]);
        }

        // log auditoría
        WhatsappLog::create([
            'empresa_id'=>$empresaId,
            'orden_id'=>$orden->id,
            'evento'=>'opt_out',
            'to_whatsapp'=>$orden->comprador_whatsapp,
            'status'=>'skipped',
            'skipped_reason'=>'opt_out',
            'payload'=>['by'=>'ops'],
            'provider_response'=>null,
            'error'=>null,
        ]);

        return back()->with('ok','Opt-out aplicado');
    }
}
