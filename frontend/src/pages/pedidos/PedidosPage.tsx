import { useState, useEffect, useCallback } from 'react';
import { pedidosApi, ventasApi, ticketsApi } from '../../api/endpoints';
import { usePOSStore } from '../../store/pos.store';
import { useAuthStore } from '../../store/auth.store';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { printTicket } from '../../utils/printTicket';
import toast from 'react-hot-toast';
import { ClipboardList, Clock, ChefHat, PackageCheck, CreditCard, XCircle, RefreshCw } from 'lucide-react';

const estadoConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  recibido: { label: 'Recibido', color: 'text-yellow-300', bg: 'bg-yellow-900/50', icon: Clock },
  en_elaboracion: { label: 'En Elaboracion', color: 'text-blue-300', bg: 'bg-blue-900/50', icon: ChefHat },
  listo_para_entrega: { label: 'Listo', color: 'text-green-300', bg: 'bg-green-900/50', icon: PackageCheck },
  entregado: { label: 'Entregado', color: 'text-slate-400', bg: 'bg-slate-700/50', icon: PackageCheck },
  cancelado: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-900/50', icon: XCircle },
};

const nextEstado: Record<string, string> = {
  recibido: 'en_elaboracion',
  en_elaboracion: 'listo_para_entrega',
  listo_para_entrega: 'entregado',
};

export default function PedidosPage() {
  const { user } = useAuthStore();
  const { cajaActiva } = usePOSStore();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [tab, setTab] = useState<'pendientes' | 'completados'>('pendientes');
  const [selected, setSelected] = useState<any>(null);
  const [showCobrar, setShowCobrar] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  // Payment state for cobrar
  const [metodo, setMetodo] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [pagado, setPagado] = useState('');

  const load = useCallback(async () => {
    try {
      if (tab === 'pendientes') {
        const { data } = await pedidosApi.pendientes();
        setPedidos(data);
      } else {
        const { data } = await pedidosApi.list('entregado');
        const { data: data2 } = await pedidosApi.list('cancelado');
        setPedidos([...data, ...data2].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch {}
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  // SSE: auto-refresh on new pedido events
  useNotificaciones({
    onNuevoPedido: () => { if (tab === 'pendientes') load(); },
    onPedidoActualizado: () => load(),
    onPedidoCobrado: () => load(),
    enabled: ['cajero', 'admin', 'manager', 'superadmin'].includes(user?.rol || ''),
  });

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleAvanzarEstado = async (pedido: any) => {
    const next = nextEstado[pedido.estado];
    if (!next) return;
    try {
      await pedidosApi.updateEstado(pedido.id, next);
      toast.success(`Pedido ${pedido.folio} → ${estadoConfig[next]?.label}`);
      load();
      setSelected(null);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleCobrar = async () => {
    if (!selected || !cajaActiva) return;
    setLoading(true);
    try {
      const pagoData: any = {
        caja_id: cajaActiva.id,
        metodo_pago: metodo,
        cambio: 0,
        pagos: [],
      };
      const total = Number(selected.total);

      if (metodo === 'efectivo') {
        const pag = Number(pagado) || 0;
        if (pag < total) { toast.error('Monto insuficiente'); setLoading(false); return; }
        pagoData.pago_efectivo = pag;
        pagoData.cambio = pag - total;
      } else if (metodo === 'tarjeta') {
        pagoData.pago_tarjeta = total;
      } else {
        pagoData.pago_transferencia = total;
      }

      const { data } = await pedidosApi.cobrar(selected.id, pagoData);
      toast.success(`Pedido ${selected.folio} cobrado - Venta ${data.venta.folio}`);

      // Print ticket
      try {
        const { data: ticketData } = await ticketsApi.preview(data.venta);
        if (ticketData.raw) printTicket(ticketData.raw);
      } catch {}

      setShowCobrar(false);
      setSelected(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al cobrar'); }
    finally { setLoading(false); }
  };

  const handleCancelar = async () => {
    if (!selected || !cancelMotivo) return;
    try {
      await pedidosApi.cancelar(selected.id, cancelMotivo);
      toast.success('Pedido cancelado');
      setShowCancelar(false);
      setCancelMotivo('');
      setSelected(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const canManage = ['cajero', 'admin', 'manager', 'superadmin'].includes(user?.rol || '');

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList size={24} /> Pedidos</h1>
        <button onClick={load} className="btn-secondary text-sm"><RefreshCw size={16} className="mr-1" />Actualizar</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('pendientes')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'pendientes' ? 'bg-iados-primary text-white' : 'bg-iados-card text-slate-400'}`}>
          Pendientes ({tab === 'pendientes' ? pedidos.length : '...'})
        </button>
        <button onClick={() => setTab('completados')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'completados' ? 'bg-iados-primary text-white' : 'bg-iados-card text-slate-400'}`}>
          Completados
        </button>
      </div>

      {/* Pedidos Grid */}
      {pedidos.length === 0 ? (
        <div className="text-center text-slate-500 py-16">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-50" />
          <p>{tab === 'pendientes' ? 'No hay pedidos pendientes' : 'No hay pedidos completados'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pedidos.map((p) => {
            const cfg = estadoConfig[p.estado] || estadoConfig.recibido;
            const Icon = cfg.icon;
            return (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className={`card cursor-pointer hover:ring-2 hover:ring-iados-secondary transition-all ${selected?.id === p.id ? 'ring-2 ring-iados-primary' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-iados-primary rounded-xl flex items-center justify-center font-bold text-xl">
                      {p.mesa}
                    </div>
                    <div>
                      <p className="font-mono text-xs text-slate-400">{p.folio}</p>
                      <p className="text-xs text-slate-500">{p.usuario_nombre || 'Mesero'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-0.5 mb-2">
                  {p.detalles?.slice(0, 3).map((d: any, i: number) => (
                    <p key={i}>{d.cantidad}x {d.producto_nombre}</p>
                  ))}
                  {p.detalles?.length > 3 && <p className="text-slate-500">+{p.detalles.length - 3} mas...</p>}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold">${Number(p.total).toFixed(2)}</span>
                  <span className="text-xs text-slate-500">{timeAgo(p.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail + Actions Panel */}
      {selected && tab === 'pendientes' && canManage && (
        <div className="fixed bottom-0 left-0 right-0 md:left-20 lg:left-56 bg-iados-surface border-t border-slate-700 p-4 z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-bold">Mesa {selected.mesa}</span>
              <span className="text-slate-400 mx-2">|</span>
              <span className="font-mono text-sm">{selected.folio}</span>
              <span className="text-slate-400 mx-2">|</span>
              <span className="text-green-400 font-bold">${Number(selected.total).toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              {nextEstado[selected.estado] && selected.estado !== 'listo_para_entrega' && (
                <button onClick={() => handleAvanzarEstado(selected)} className="btn-secondary text-sm">
                  {selected.estado === 'recibido' ? 'Iniciar Elaboracion' : 'Marcar Listo'}
                </button>
              )}
              {(selected.estado === 'listo_para_entrega' || selected.estado === 'recibido' || selected.estado === 'en_elaboracion') && (
                <button
                  onClick={() => { setShowCobrar(true); setMetodo('efectivo'); setPagado(''); }}
                  disabled={!cajaActiva}
                  className="btn-primary text-sm"
                >
                  <CreditCard size={16} className="mr-1" />Cobrar
                </button>
              )}
              <button onClick={() => { setShowCancelar(true); setCancelMotivo(''); }} className="text-red-400 hover:bg-red-900/50 px-3 py-2 rounded-xl text-sm">
                Cancelar
              </button>
              <button onClick={() => setSelected(null)} className="btn-secondary text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cobrar */}
      {showCobrar && selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Cobrar Pedido - Mesa {selected.mesa}</h3>
            <p className="text-sm text-slate-400">{selected.folio} | {selected.detalles?.length} productos</p>
            <p className="text-2xl font-bold text-green-400">${Number(selected.total).toFixed(2)}</p>

            {/* Metodo */}
            <div className="flex gap-2">
              {(['efectivo', 'tarjeta', 'transferencia'] as const).map((m) => (
                <button key={m} onClick={() => setMetodo(m)} className={`flex-1 py-2 rounded-xl text-sm font-medium ${metodo === m ? 'bg-iados-primary text-white' : 'bg-iados-card text-slate-400'}`}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {metodo === 'efectivo' && (
              <>
                <input
                  value={pagado}
                  onChange={(e) => setPagado(e.target.value)}
                  placeholder="Monto recibido"
                  type="number"
                  className="input-touch text-center text-2xl"
                  autoFocus
                />
                <div className="flex gap-2 flex-wrap">
                  {[50, 100, 200, 500, 1000].map((q) => (
                    <button key={q} onClick={() => setPagado(String(q))} className="bg-iados-card px-3 py-2 rounded-xl text-sm">${q}</button>
                  ))}
                </div>
                {Number(pagado) > Number(selected.total) && (
                  <p className="text-center text-yellow-400 font-bold">Cambio: ${(Number(pagado) - Number(selected.total)).toFixed(2)}</p>
                )}
              </>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowCobrar(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleCobrar} disabled={loading || (metodo === 'efectivo' && Number(pagado) < Number(selected.total))} className="btn-primary flex-1">
                {loading ? 'Procesando...' : 'Confirmar Cobro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {showCancelar && selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full space-y-4 text-center">
            <XCircle size={40} className="mx-auto text-red-400" />
            <h3 className="text-lg font-bold">Cancelar Pedido {selected.folio}</h3>
            <input value={cancelMotivo} onChange={(e) => setCancelMotivo(e.target.value)} placeholder="Motivo de cancelacion" className="input-touch" />
            <div className="flex gap-2">
              <button onClick={() => setShowCancelar(false)} className="btn-secondary flex-1">Volver</button>
              <button onClick={handleCancelar} disabled={!cancelMotivo} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex-1">Cancelar Pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
