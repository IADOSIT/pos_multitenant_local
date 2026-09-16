import { useEffect, useState } from 'react';
import { CloudOff, UploadCloud, RefreshCw, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSyncStore } from '../../store/sync.store';
import { offlineActions, OfflineVenta } from '../../store/offline.store';
import { hayConexion } from '../../api/conexion';

/**
 * Semaforo de conexion del POS.
 *
 * Solo aparece cuando hace falta: sin internet, o con ventas todavia sin subir.
 * Con todo en orden y en linea no estorba la pantalla de venta.
 */
export default function EstadoOffline() {
  const online = useSyncStore((s) => s.online);
  const pendientes = useSyncStore((s) => s.pendientes);
  const sincronizando = useSyncStore((s) => s.sincronizando);
  const ultimoError = useSyncStore((s) => s.ultimoError);
  const ultimaSync = useSyncStore((s) => s.ultimaSync);
  const sincronizar = useSyncStore((s) => s.sincronizar);

  const [abierto, setAbierto] = useState(false);
  const [lista, setLista] = useState<OfflineVenta[]>([]);

  useEffect(() => {
    if (!abierto) return;
    offlineActions.listarRecientes(50).then(setLista);
  }, [abierto, pendientes, sincronizando]);

  if (online && pendientes === 0) return null;

  const color = !online
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
    : 'bg-blue-500/15 text-blue-300 border-blue-500/40';

  const etiqueta = !online
    ? (pendientes ? `Sin internet · ${pendientes} en cola` : 'Sin internet')
    : (sincronizando ? `Subiendo ${pendientes}…` : `${pendientes} venta(s) por subir`);

  const reintentar = async () => {
    // `false` = no silencioso: pregunta al servidor aunque el cortacircuitos este
    // abierto, porque el cajero acaba de ver volver el internet.
    const { subidas, fallidas } = await sincronizar(false);
    if (subidas) toast.success(`${subidas} venta(s) sincronizada(s)`);
    else if (fallidas) toast.error('No se pudieron subir todavía');
    else if (!hayConexion()) toast('Sigue sin internet', { icon: '📡' });
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        title="Estado de la conexión y ventas en cola"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${color}`}
      >
        {sincronizando
          ? <Loader2 size={14} className="animate-spin" />
          : online ? <UploadCloud size={14} /> : <CloudOff size={14} />}
        <span className="hidden sm:inline">{etiqueta}</span>
        {!!pendientes && <span className="sm:hidden">{pendientes}</span>}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[9990] bg-black/60 flex items-center justify-center p-4" onClick={() => setAbierto(false)}>
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <p className="text-white font-semibold flex items-center gap-2">
                  {online ? <UploadCloud size={16} /> : <CloudOff size={16} />} Ventas sin subir
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {online ? 'Hay internet: se suben solas.' : 'Sin internet: la venta se guarda aquí y sube al reconectar.'}
                </p>
              </div>
              <button onClick={() => setAbierto(false)} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex items-center gap-2 border-b border-slate-700">
              <button
                onClick={reintentar}
                disabled={sincronizando || !online}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs rounded-lg font-medium"
              >
                {sincronizando ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Sincronizar ahora
              </button>
              <span className="text-[11px] text-slate-400">
                {pendientes ? `${pendientes} pendiente(s)` : 'Todo al día'}
                {ultimaSync ? ` · última subida ${ultimaSync.toLocaleTimeString('es-MX')}` : ''}
              </span>
            </div>

            {ultimoError && (
              <div className="mx-4 mt-3 flex items-start gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {ultimoError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {!lista.length && <p className="text-xs text-slate-400">No hay ventas offline registradas.</p>}
              {lista.map((v) => (
                <div key={v.id} className="flex items-center gap-3 bg-slate-900/60 rounded-lg p-2.5">
                  <div className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${v.synced ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {v.synced ? <Check size={14} /> : <CloudOff size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {v.folio_servidor || v.folio_offline}
                      <span className="text-slate-500 text-[11px]"> · {new Date(v.created_at).toLocaleString('es-MX')}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {v.synced
                        ? 'Subida al servidor'
                        : v.ultimo_error
                          ? `${v.ultimo_error}${v.intentos ? ` (${v.intentos} intento(s))` : ''}`
                          : 'Esperando internet'}
                    </p>
                  </div>
                  <span className="text-sm text-white font-semibold shrink-0">
                    ${Number(v.total || v.data?.total || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <p className="p-4 pt-0 text-[11px] text-slate-500">
              No cierres el navegador ni borres los datos del sitio mientras haya ventas pendientes: viven en este equipo hasta que suben.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
