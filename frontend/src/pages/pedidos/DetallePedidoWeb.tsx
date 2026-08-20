// Detalle de un pedido de la tienda en linea. Antes vivia dentro de PedidosWebPage,
// junto con su propia tabla; ahora la tabla es la unificada y aqui solo queda el modal.
import { X } from 'lucide-react';
import {
  PedidoUnificado, ESTADOS_UNIFICADOS, estadoUnificadoDe, siguienteEstadoRaw,
} from './pedidosUnificados';

interface Props {
  pedido: PedidoUnificado;
  mostrarPrecios: boolean;
  onClose: () => void;
  onAvanzar: (pedido: PedidoUnificado, estadoRaw: string) => void;
}

const money = (v: any) =>
  `$${Number(v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export default function DetallePedidoWeb({ pedido, mostrarPrecios, onClose, onAvanzar }: Props) {
  const p = pedido.raw;
  const siguiente = siguienteEstadoRaw(pedido);
  const dir = p.direccion_envio;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{pedido.numero}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              p.tipo_venta === 'mayoreo' ? 'bg-purple-900/50 text-purple-300' : 'bg-slate-700 text-slate-300'
            }`}>
              {p.tipo_venta}
            </span>
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

        {/* Items */}
        <div className="space-y-2">
          {(p.items || []).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-700">
              <div>
                <p className="text-white">{item.nombre}</p>
                <p className="text-xs text-slate-400">SKU: {item.sku} · Cant: {item.qty}</p>
              </div>
              {mostrarPrecios && <p className="text-white font-medium">{money(item.subtotal)}</p>}
            </div>
          ))}
        </div>

        {mostrarPrecios && (
          <div className="flex justify-between text-base font-bold text-white pt-2">
            <span>Total</span>
            <span>{money(p.total)}</span>
          </div>
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
