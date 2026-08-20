import { useState, useEffect, useCallback } from 'react';
import { apartadosApi } from '../../api/endpoints';
import { X, PackageSearch, Search, CheckCircle2, XCircle, RefreshCw, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
}

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-yellow-400' },
  entregado: { label: 'Entregado', color: 'text-green-400' },
  cancelado: { label: 'Cancelado', color: 'text-red-400' },
};

export default function ApartadosPanel({ onClose }: Props) {
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [folio, setFolio] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const cargarPendientes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apartadosApi.pendientes();
      setPendientes(data || []);
    } catch {
      toast.error('No se pudieron cargar los apartados pendientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarPendientes(); }, [cargarPendientes]);

  const buscarFolio = async () => {
    if (!folio.trim()) return;
    setBuscando(true);
    setResultado(null);
    try {
      const { data } = await apartadosApi.buscarPorFolio(folio.trim());
      setResultado(data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Apartado no encontrado');
    } finally {
      setBuscando(false);
    }
  };

  const entregar = async (id: number) => {
    setProcesando(true);
    try {
      await apartadosApi.entregar(id);
      toast.success('Apartado marcado como entregado');
      setResultado(null);
      setFolio('');
      cargarPendientes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al entregar apartado');
    } finally {
      setProcesando(false);
    }
  };

  const cancelar = async (id: number) => {
    const motivo = prompt('Motivo de la cancelación:');
    if (!motivo) return;
    setProcesando(true);
    try {
      await apartadosApi.cancelar(id, motivo);
      toast.success('Apartado cancelado — stock devuelto');
      setResultado(null);
      setFolio('');
      cargarPendientes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al cancelar apartado');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <PackageSearch size={20} className="text-iados-secondary" />
            <h2 className="text-xl font-bold">Apartados</h2>
            {pendientes.length > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendientes.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cargarPendientes} className="p-2 hover:bg-iados-card rounded-xl text-slate-400" title="Refrescar"><RefreshCw size={16} /></button>
            <button onClick={onClose} className="p-2 hover:bg-iados-card rounded-xl"><X size={20} /></button>
          </div>
        </div>

        {/* Buscar por folio */}
        <div className="flex gap-2 mb-4 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') buscarFolio(); }}
              placeholder="Buscar por folio de venta..."
              className="input-touch pl-9 text-sm py-2"
            />
          </div>
          <button onClick={buscarFolio} disabled={buscando || !folio.trim()} className="btn-secondary px-4 disabled:opacity-50">
            {buscando ? '...' : 'Buscar'}
          </button>
        </div>

        {/* Resultado de búsqueda */}
        {resultado && (
          <div className="mb-4 bg-iados-card rounded-xl p-4 border border-iados-primary/40 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">{resultado.folio}</span>
              <span className={`text-xs font-medium ${ESTADO_LABEL[resultado.estado]?.color}`}>{ESTADO_LABEL[resultado.estado]?.label}</span>
            </div>
            <p className="text-sm mb-1">{resultado.producto_nombre} × {resultado.cantidad}</p>
            {resultado.cliente_nombre && <p className="text-xs text-slate-400">Cliente: {resultado.cliente_nombre} {resultado.cliente_telefono ? `· ${resultado.cliente_telefono}` : ''}</p>}
            <p className="text-xs text-slate-500 mt-1">Creado {new Date(resultado.created_at).toLocaleString('es-MX')}</p>
            {resultado.estado === 'pendiente' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => entregar(resultado.id)} disabled={procesando} className="btn-success flex-1 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <CheckCircle2 size={16} /> Marcar entregado
                </button>
                <button onClick={() => cancelar(resultado.id)} disabled={procesando} className="text-sm px-3 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  <XCircle size={16} /> Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Lista de pendientes */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Pendientes de surtir en esta tienda</p>
          {loading ? (
            <p className="text-center text-slate-500 py-8 text-sm">Cargando...</p>
          ) : pendientes.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              <PackageSearch size={40} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No hay apartados pendientes</p>
            </div>
          ) : (
            pendientes.map((a) => (
              <div key={a.id} className="bg-iados-card rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{a.folio}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={10} />{new Date(a.created_at).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm truncate">{a.producto_nombre} × {a.cantidad}</p>
                  {a.cliente_nombre && <p className="text-xs text-slate-400 truncate">{a.cliente_nombre} {a.cliente_telefono ? `· ${a.cliente_telefono}` : ''}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => entregar(a.id)} disabled={procesando} className="btn-success text-xs px-3 py-2 flex items-center gap-1 disabled:opacity-50">
                    <CheckCircle2 size={13} /> Entregar
                  </button>
                  <button onClick={() => cancelar(a.id)} disabled={procesando} className="text-xs px-3 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1">
                    <XCircle size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
