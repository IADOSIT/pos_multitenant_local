// Detalle de un pedido de la tienda en linea. Antes vivia dentro de PedidosWebPage,
// junto con su propia tabla; ahora la tabla es la unificada y aqui solo queda el modal.
//
// Tambien resuelve el flujo de cotizacion: cuando la tienda vende "por cotizacion",
// el pedido llega sin precios (estado `cotizacion`). Aqui el admin los captura y el
// pedido pasa a `por_cobrar`, generando el pedido de mostrador que se cobra en el POS
// con el flujo normal de caja.
import { useEffect, useState } from 'react';
import { X, FileSignature, Loader2, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { ecommerceApi, tiendasApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import {
  PedidoUnificado, ESTADOS_UNIFICADOS, estadoUnificadoDe, siguienteEstadoRaw,
} from './pedidosUnificados';

interface Props {
  pedido: PedidoUnificado;
  mostrarPrecios: boolean;
  onClose: () => void;
  onAvanzar: (pedido: PedidoUnificado, estadoRaw: string) => void;
  /** Se dispara al terminar de cotizar, para que el listado se recargue. */
  onCotizado?: (pedidoActualizado: any) => void;
}

const money = (v: any) =>
  `$${Number(v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export default function DetallePedidoWeb({ pedido, mostrarPrecios, onClose, onAvanzar, onCotizado }: Props) {
  const p = pedido.raw;
  const { user } = useAuthStore();
  const siguiente = siguienteEstadoRaw(pedido);
  const dir = p.direccion_envio;

  const esCotizacion = pedido.estadoRaw === 'cotizacion';
  const esPorCobrar = pedido.estadoRaw === 'por_cobrar';

  // Precios que el admin captura, indexados por producto_id.
  const [precios, setPrecios] = useState<Record<number, string>>({});
  const [descuento, setDescuento] = useState('0');
  const [cotizando, setCotizando] = useState(false);
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [tiendaId, setTiendaId] = useState<number | ''>(user?.tienda_id || '');

  // Solo hace falta elegir tienda si el usuario no trae una en su sesion
  // (p. ej. un superadmin): el cobro tiene que caer en una caja concreta.
  useEffect(() => {
    if (!esCotizacion || user?.tienda_id) return;
    tiendasApi.list()
      .then(({ data }) => {
        const lista = data?.data || data || [];
        setTiendas(lista);
        if (lista.length === 1) setTiendaId(lista[0].id);
      })
      .catch(() => { /* el backend valida igual */ });
  }, [esCotizacion, user?.tienda_id]);

  const items = p.items || [];
  const subtotalCotizado = items.reduce(
    (acc: number, it: any) => acc + (parseFloat(precios[it.producto_id] || '') || 0) * Number(it.qty || 0),
    0,
  );
  const totalCotizado = Math.max(0, subtotalCotizado - (parseFloat(descuento) || 0));

  async function enviarCotizacion() {
    if (subtotalCotizado <= 0) { toast.error('Captura al menos un precio mayor a cero'); return; }
    if (!user?.tienda_id && !tiendaId) { toast.error('Elige la tienda que cobrará la cotización'); return; }
    setCotizando(true);
    try {
      const { data } = await ecommerceApi.cotizarPedido(pedido.id, {
        items: items.map((it: any) => ({
          producto_id: it.producto_id,
          precio_unitario: parseFloat(precios[it.producto_id] || '') || 0,
        })),
        descuento: parseFloat(descuento) || 0,
        tienda_id: tiendaId ? Number(tiendaId) : undefined,
      });
      toast.success(`Cotización enviada al POS${data?.folio_pos ? ` — ${data.folio_pos}` : ''}`);
      onCotizado?.(data);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al cotizar');
    }
    setCotizando(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-white">{pedido.numero}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              p.tipo_venta === 'mayoreo' ? 'bg-purple-900/50 text-purple-300' : 'bg-slate-700 text-slate-300'
            }`}>
              {p.tipo_venta}
            </span>
            {(esCotizacion || esPorCobrar) && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADOS_UNIFICADOS[pedido.estado].bg} ${ESTADOS_UNIFICADOS[pedido.estado].color}`}>
                {ESTADOS_UNIFICADOS[pedido.estado].label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>

        {/* Cliente */}
        <div className="bg-slate-700/50 rounded-xl p-3 space-y-1 text-sm">
          <p className="text-white font-medium">{p.cliente_nombre}</p>
          {p.cliente_email && <p className="text-slate-400">{p.cliente_email}</p>}
          {p.cliente_tel && <p className="text-slate-400">{p.cliente_tel}</p>}
          {p.cliente_empresa && <p className="text-slate-400 text-xs">{p.cliente_empresa}</p>}
          {dir && (
            <p className="text-slate-400 text-xs">
              {[dir.calle, dir.colonia, dir.ciudad, dir.estado].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {p.notas_cliente && (
          <p className="text-sm text-amber-300/80 italic">💬 {p.notas_cliente}</p>
        )}

        {esPorCobrar && (
          <p className="text-xs text-amber-200 bg-amber-950/40 border border-amber-900 rounded-lg p-3 flex items-start gap-2">
            <Banknote size={14} className="shrink-0 mt-0.5" />
            <span>Cotización aceptada. El pedido ya está en el POS listo para cobrarse en caja; al cobrarlo se cierra solo.</span>
          </p>
        )}

        {/* Items */}
        {esCotizacion ? (
          <div className="space-y-2">
            <p className="text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-900 rounded-lg p-3 flex items-start gap-2">
              <FileSignature size={14} className="shrink-0 mt-0.5" />
              <span>Captura el precio unitario de cada producto. Al enviarla, la cotización llega al POS como pedido <b>por cobrar</b>.</span>
            </p>
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm py-2 border-b border-slate-700">
                <div className="min-w-0">
                  <p className="text-white truncate">{item.nombre}</p>
                  <p className="text-xs text-slate-400">SKU: {item.sku} · Cant: {item.qty}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-500 text-xs">$</span>
                  <input
                    type="number" min={0} step="0.01" inputMode="decimal"
                    value={precios[item.producto_id] ?? ''}
                    onChange={e => setPrecios(pr => ({ ...pr, [item.producto_id]: e.target.value }))}
                    placeholder="0.00"
                    className="w-24 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-400 text-xs w-20 text-right">
                    {money((parseFloat(precios[item.producto_id] || '') || 0) * Number(item.qty || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-700">
                <div>
                  <p className="text-white">{item.nombre}</p>
                  <p className="text-xs text-slate-400">SKU: {item.sku} · Cant: {item.qty}</p>
                </div>
                {mostrarPrecios && <p className="text-white font-medium">{money(item.subtotal)}</p>}
              </div>
            ))}
          </div>
        )}

        {esCotizacion ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Descuento</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">$</span>
                <input
                  type="number" min={0} step="0.01" inputMode="decimal"
                  value={descuento} onChange={e => setDescuento(e.target.value)}
                  className="w-24 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-between text-base font-bold text-white">
              <span>Total cotizado</span>
              <span>{money(totalCotizado)}</span>
            </div>

            {!user?.tienda_id && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tienda que cobrará</label>
                <select
                  value={tiendaId} onChange={e => setTiendaId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Selecciona…</option>
                  {tiendas.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            )}

            <button
              onClick={enviarCotizacion}
              disabled={cotizando}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cotizando ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
              Cotizar y enviar al POS por cobrar
            </button>
          </div>
        ) : (
          mostrarPrecios && (
            <div className="flex justify-between text-base font-bold text-white pt-2">
              <span>Total</span>
              <span>{money(p.total)}</span>
            </div>
          )
        )}

        {siguiente && (
          <button
            onClick={() => { onAvanzar(pedido, siguiente); onClose(); }}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Avanzar a: {ESTADOS_UNIFICADOS[estadoUnificadoDe('web', siguiente)].label}
          </button>
        )}
      </div>
    </div>
  );
}
