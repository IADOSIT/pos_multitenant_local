import { useState, useEffect } from 'react';
import { ecommerceApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { ShoppingBag, Eye, Loader2, RefreshCw, Check, X, Clock, Truck, Package, XCircle } from 'lucide-react';

const ESTADOS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pendiente:   { label: 'Pendiente',   color: 'text-yellow-300', bg: 'bg-yellow-900/40', icon: Clock },
  confirmado:  { label: 'Confirmado',  color: 'text-blue-300',   bg: 'bg-blue-900/40',   icon: Check },
  preparando:  { label: 'Preparando',  color: 'text-purple-300', bg: 'bg-purple-900/40', icon: Package },
  enviado:     { label: 'Enviado',     color: 'text-cyan-300',   bg: 'bg-cyan-900/40',   icon: Truck },
  entregado:   { label: 'Entregado',   color: 'text-green-300',  bg: 'bg-green-900/40',  icon: Check },
  cancelado:   { label: 'Cancelado',   color: 'text-red-400',    bg: 'bg-red-900/40',    icon: XCircle },
};

const NEXT_ESTADO: Record<string, string> = {
  pendiente: 'confirmado', confirmado: 'preparando', preparando: 'enviado', enviado: 'entregado',
};

export default function PedidosWebPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [buscar, setBuscar] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => { load(); }, [filtroEstado, filtroTipo, buscar, page]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await ecommerceApi.listPedidos({ estado: filtroEstado || undefined, tipo_venta: filtroTipo || undefined, buscar: buscar || undefined, page, limit: 20 });
      setPedidos(data.data || []);
      setMeta(data.meta || {});
    } catch { toast.error('Error al cargar pedidos'); }
    setLoading(false);
  }

  async function cambiarEstado(pedido: any, nuevoEstado: string) {
    setUpdatingId(pedido.id);
    try {
      const { data } = await ecommerceApi.updateEstado(pedido.id, nuevoEstado);
      setPedidos(ps => ps.map(p => p.id === pedido.id ? { ...p, estado: data.estado } : p));
      if (selected?.id === pedido.id) setSelected({ ...selected, estado: data.estado });
      toast.success(`Pedido ${pedido.numero_pedido} → ${ESTADOS[nuevoEstado]?.label}`);
    } catch { toast.error('Error al actualizar estado'); }
    setUpdatingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-blue-400" />
          <h3 className="text-base font-semibold text-white">Pedidos Web</h3>
          {meta.total !== undefined && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{meta.total} total</span>}
        </div>
        <button onClick={load} className="p-2 text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <input value={buscar} onChange={e => { setBuscar(e.target.value); setPage(1); }}
          placeholder="Buscar pedido o cliente..." className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-52" />
        <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
          <option value="">Todos los tipos</option>
          <option value="menudeo">Menudeo</option>
          <option value="mayoreo">Mayoreo</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-xs text-slate-400">
              <th className="text-left px-4 py-3"># Pedido</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-center px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500"><Loader2 size={18} className="animate-spin inline" /></td></tr>
            )}
            {!loading && pedidos.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">No hay pedidos web aún</td></tr>
            )}
            {!loading && pedidos.map(p => {
              const est = ESTADOS[p.estado] || ESTADOS.pendiente;
              const EstIcon = est.icon;
              const nextEst = NEXT_ESTADO[p.estado];
              return (
                <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                  <td className="px-4 py-3 font-mono text-blue-400 text-xs">{p.numero_pedido}</td>
                  <td className="px-4 py-3 text-white">{p.cliente_nombre}<br /><span className="text-xs text-slate-400">{p.cliente_email}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.tipo_venta === 'mayoreo' ? 'bg-purple-900/50 text-purple-300' : 'bg-slate-700 text-slate-300'}`}>
                      {p.tipo_venta}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-semibold">${Number(p.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${est.bg} ${est.color}`}>
                      <EstIcon size={10} /> {est.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelected(p)} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Ver detalle">
                        <Eye size={14} />
                      </button>
                      {nextEst && (
                        <button onClick={() => cambiarEstado(p, nextEst)} disabled={updatingId === p.id}
                          className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50" title={`→ ${ESTADOS[nextEst]?.label}`}>
                          {updatingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {meta.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: meta.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1 rounded text-xs ${page === p ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{p}</button>
          ))}
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{selected.numero_pedido}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${selected.tipo_venta === 'mayoreo' ? 'bg-purple-900/50 text-purple-300' : 'bg-slate-700 text-slate-300'}`}>
                  {selected.tipo_venta}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            {/* Cliente */}
            <div className="bg-slate-700/50 rounded-xl p-3 space-y-1 text-sm">
              <p className="text-white font-medium">{selected.cliente_nombre}</p>
              <p className="text-slate-400">{selected.cliente_email}</p>
              {selected.cliente_tel && <p className="text-slate-400">{selected.cliente_tel}</p>}
              {selected.direccion_envio && (
                <p className="text-slate-400 text-xs">
                  {[selected.direccion_envio.calle, selected.direccion_envio.colonia, selected.direccion_envio.ciudad, selected.direccion_envio.estado].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2">
              {(selected.items || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-700">
                  <div>
                    <p className="text-white">{item.nombre}</p>
                    <p className="text-xs text-slate-400">SKU: {item.sku} · Cant: {item.qty}</p>
                  </div>
                  <p className="text-white font-medium">${Number(item.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-base font-bold text-white pt-2">
              <span>Total</span>
              <span>${Number(selected.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Cambiar estado */}
            {NEXT_ESTADO[selected.estado] && (
              <button onClick={() => { cambiarEstado(selected, NEXT_ESTADO[selected.estado]); setSelected(null); }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
                Avanzar a: {ESTADOS[NEXT_ESTADO[selected.estado]]?.label}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
