import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { logisticaApi } from '../../api/endpoints';
import type { Repartidor, EntregaPedido, EstadoEntrega } from '../../types';
import { Truck, CheckCircle, AlertTriangle, RefreshCw, MapPin, Phone, DollarSign } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const estadoBadge: Record<EstadoEntrega, { label: string; text: string; bg: string }> = {
  asignado:     { label: 'Asignado',      text: 'text-yellow-400', bg: 'bg-yellow-900/30 border border-yellow-700/40' },
  en_camino:    { label: 'En camino',     text: 'text-blue-400',   bg: 'bg-blue-900/30 border border-blue-700/40' },
  entregado:    { label: 'Entregado',     text: 'text-green-400',  bg: 'bg-green-900/30 border border-green-700/40' },
  con_problema: { label: 'Con problema',  text: 'text-red-400',    bg: 'bg-red-900/30 border border-red-700/40' },
};

const nextActions: Record<EstadoEntrega, { label: string; estado: EstadoEntrega; color: string }[]> = {
  asignado:     [{ label: 'Salí a entregar 🚚', estado: 'en_camino',    color: 'bg-blue-600 hover:bg-blue-500' }],
  en_camino:    [
    { label: 'Entregué ✓',  estado: 'entregado',    color: 'bg-green-600 hover:bg-green-500' },
    { label: 'Problema ⚠️', estado: 'con_problema', color: 'bg-red-700 hover:bg-red-600' },
  ],
  con_problema: [{ label: 'Reintentar 🔄', estado: 'en_camino', color: 'bg-blue-600 hover:bg-blue-500' }],
  entregado:    [],
};

export default function RepartidorPage() {
  const { token } = useParams<{ token: string }>();
  const [repartidor, setRepartidor] = useState<Repartidor | null>(null);
  const [entregas, setEntregas] = useState<EntregaPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ entrega: EntregaPedido; accion: { label: string; estado: EstadoEntrega; color: string } } | null>(null);
  const [notas, setNotas] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await logisticaApi.getRepartidorView(token);
      setRepartidor(data.repartidor);
      setEntregas(data.entregas);
      setError('');
    } catch {
      setError('Link inválido o repartidor inactivo.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const handleActualizar = async () => {
    if (!modal || !token) return;
    setUpdating(true);
    try {
      await logisticaApi.updateEstadoByToken(token, modal.entrega.id, modal.accion.estado, notas || undefined);
      toast.success(`Estado actualizado: ${estadoBadge[modal.accion.estado].label}`);
      setModal(null);
      setNotas('');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al actualizar');
    } finally {
      setUpdating(false);
    }
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const activas = entregas.filter(e => e.estado === 'asignado' || e.estado === 'en_camino');
  const completadas = entregas.filter(e => e.estado === 'entregado' || e.estado === 'con_problema');

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <Truck size={40} className="mx-auto mb-3 animate-pulse text-blue-400" />
        <p className="text-slate-400">Cargando...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-sm">
        <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Link inválido</h2>
        <p className="text-slate-400">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-8">
      <Toaster position="top-center" toastOptions={{ style: { background: '#334155', color: '#fff' } }} />

      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Truck size={20} />
            </div>
            <div>
              <p className="font-bold">{repartidor?.nombre}</p>
              <p className="text-xs text-slate-400">Repartidor — iaDoS POS</p>
            </div>
          </div>
          <button onClick={load} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Entregas activas */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">
            Entregas activas ({activas.length})
          </h2>
          {activas.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl p-6 text-center text-slate-500">
              <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
              <p className="text-sm">Sin entregas activas por ahora</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activas.map(e => <EntregaCard key={e.id} entrega={e} onAccion={(accion) => { setModal({ entrega: e, accion }); setNotas(''); }} />)}
            </div>
          )}
        </div>

        {/* Completadas hoy */}
        {completadas.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">
              Completadas hoy ({completadas.length})
            </h2>
            <div className="space-y-3">
              {completadas.map(e => <EntregaCard key={e.id} entrega={e} onAccion={(accion) => { setModal({ entrega: e, accion }); setNotas(''); }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h3 className="font-bold text-lg mb-1">{modal.accion.label}</h3>
            <p className="text-sm text-slate-400 mb-4">
              Folio: <strong className="text-white">{modal.entrega.pedido_folio}</strong>
              {modal.entrega.cliente_nombre && <> — {modal.entrega.cliente_nombre}</>}
            </p>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Notas opcionales (ej: no había nadie, dejé en puerta...)"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none h-20 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={handleActualizar}
                disabled={updating}
                className={`flex-1 py-3 rounded-xl text-white text-sm font-bold ${modal.accion.color} disabled:opacity-50`}
              >
                {updating ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EntregaCard({ entrega, onAccion }: {
  entrega: EntregaPedido;
  onAccion: (accion: { label: string; estado: EstadoEntrega; color: string }) => void;
}) {
  const badge = estadoBadge[entrega.estado];
  const acciones = nextActions[entrega.estado] || [];

  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono text-sm text-slate-400">{entrega.pedido_folio}</p>
          {entrega.cliente_nombre && <p className="font-bold text-lg leading-tight">{entrega.cliente_nombre}</p>}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.text} ${badge.bg}`}>
          {badge.label}
        </span>
      </div>

      {entrega.cliente_direccion && (
        <div className="flex items-start gap-2 mb-2 text-sm text-slate-300">
          <MapPin size={14} className="mt-0.5 text-blue-400 shrink-0" />
          <span>{entrega.cliente_direccion}</span>
        </div>
      )}
      {entrega.cliente_telefono && (
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-300">
          <Phone size={14} className="text-green-400 shrink-0" />
          <a href={`tel:${entrega.cliente_telefono}`} className="text-green-400 underline">
            {entrega.cliente_telefono}
          </a>
        </div>
      )}
      <div className="flex items-center gap-2 text-sm font-bold text-green-400 mb-3">
        <DollarSign size={14} />
        ${Number(entrega.total).toFixed(2)}
      </div>

      {acciones.length > 0 && (
        <div className="flex gap-2">
          {acciones.map(a => (
            <button
              key={a.estado}
              onClick={() => onAccion(a)}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold ${a.color} transition-colors`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
