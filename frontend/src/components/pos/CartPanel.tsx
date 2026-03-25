import { useState } from 'react';
import { usePOSStore } from '../../store/pos.store';
import { Minus, Plus, Trash2, ShoppingCart, Send, BookOpen, MessageSquare } from 'lucide-react';

interface Props {
  onPay: () => void;
  onEnviarPedido?: () => void;
  onAbrirCuenta?: () => void;
  cuentaAbiertaEnabled?: boolean;
  notasPorItem?: boolean;
  pedidoActivo?: any;
  onActualizarCuenta?: () => void;
  onCancelarEdicion?: () => void;
}

export default function CartPanel({ onPay, onEnviarPedido, onAbrirCuenta, cuentaAbiertaEnabled, notasPorItem, pedidoActivo, onActualizarCuenta, onCancelarEdicion }: Props) {
  const { cart, updateQuantity, removeFromCart, clearCart, updateItemNotes, getSubtotal, getImpuestos, getTotal, cajaActiva, modoServicio, tipoCobro, mesaActiva, setMesaActiva, tipoServicio, setTipoServicio } = usePOSStore();
  const [editingNotaId, setEditingNotaId] = useState<string | null>(null);
  const [notaTemp, setNotaTemp] = useState('');

  const isMesa = modoServicio === 'mesa';
  const isPostPago = isMesa && tipoCobro === 'post_pago';

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <ShoppingCart size={20} /> Orden
        </h2>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-300">Limpiar</button>
        )}
      </div>

      {/* Banner modo edición cuenta abierta */}
      {pedidoActivo && (
        <div className="px-3 py-2 bg-orange-500/20 border-b border-orange-500/40 flex items-center justify-between">
          <span className="text-sm text-orange-300 font-medium">
            ✏️ Mesa {pedidoActivo.mesa} · {pedidoActivo.folio}
          </span>
          <button onClick={onCancelarEdicion} className="text-orange-400 hover:text-orange-200 text-xs underline">
            Cancelar edición
          </button>
        </div>
      )}

      {/* Mesa selector */}
      {isMesa && (
        <div className="p-3 border-b border-slate-700 bg-iados-card/50">
          <label className="text-xs text-slate-400 mb-1 block">Mesa</label>
          <input
            type="number"
            min="1"
            value={mesaActiva || ''}
            onChange={(e) => setMesaActiva(e.target.value ? Number(e.target.value) : null)}
            placeholder="# Mesa"
            className="input-touch text-center text-lg font-bold"
          />
        </div>
      )}

      {/* Tipo de servicio */}
      <div className="p-3 border-b border-slate-700">
        <div className="flex rounded-xl overflow-hidden border border-slate-600">
          <button
            onClick={() => setTipoServicio('en_sitio')}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
              tipoServicio === 'en_sitio' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🍽️ En sitio
          </button>
          <button
            onClick={() => setTipoServicio('para_llevar')}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
              tipoServicio === 'para_llevar' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🥡 Para llevar
          </button>
        </div>
      </div>

      {!cajaActiva && !isPostPago && (
        <div className="p-4 bg-amber-900/30 border-b border-amber-700 text-amber-300 text-sm text-center">
          No hay caja abierta. Abra una caja para vender.
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
            <p>Carrito vacio</p>
            <p className="text-xs mt-1">Toca un producto para agregar</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="bg-iados-card rounded-xl p-3">
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.nombre}</p>
                  <p className="text-xs text-slate-400">${Number(item.precio).toFixed(2)} c/u</p>
                  {notasPorItem && editingNotaId !== item.id && item.notas && (
                    <p
                      className="text-xs text-iados-accent mt-1 cursor-pointer"
                      onClick={() => { setEditingNotaId(item.id); setNotaTemp(item.notas || ''); }}
                    >{item.notas}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {notasPorItem && (
                    <button
                      onClick={() => { setEditingNotaId(item.id); setNotaTemp(item.notas || ''); }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 ${item.notas ? 'bg-iados-primary/30 text-iados-accent' : 'bg-iados-surface text-slate-500'}`}
                      title="Agregar nota"
                    >
                      <MessageSquare size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                    className="w-8 h-8 rounded-lg bg-iados-surface flex items-center justify-center active:scale-90"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-bold">{item.cantidad}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                    className="w-8 h-8 rounded-lg bg-iados-surface flex items-center justify-center active:scale-90"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded-lg bg-red-900/50 text-red-400 flex items-center justify-center active:scale-90 ml-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-right shrink-0 w-20">
                  <p className="font-bold">${item.subtotal.toFixed(2)}</p>
                </div>
              </div>
              {notasPorItem && editingNotaId === item.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={notaTemp}
                    onChange={(e) => setNotaTemp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { updateItemNotes(item.id, notaTemp.trim()); setEditingNotaId(null); }
                      if (e.key === 'Escape') { setEditingNotaId(null); }
                    }}
                    placeholder="Nota: sin cebolla, extra queso…"
                    className="input-touch text-xs py-1 flex-1"
                    maxLength={100}
                  />
                  <button
                    onClick={() => { updateItemNotes(item.id, notaTemp.trim()); setEditingNotaId(null); }}
                    className="px-3 py-1 bg-iados-primary rounded-lg text-xs font-medium"
                  >OK</button>
                  {item.notas && (
                    <button
                      onClick={() => { updateItemNotes(item.id, ''); setEditingNotaId(null); }}
                      className="px-2 py-1 bg-red-900/50 text-red-400 rounded-lg text-xs"
                    >×</button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Totales */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-slate-700 space-y-2">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span>${getSubtotal().toFixed(2)}</span>
          </div>
          {getImpuestos() > 0 && (
            <div className="flex justify-between text-sm text-slate-400">
              <span>Impuestos</span>
              <span>${getImpuestos().toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-600">
            <span>Total</span>
            <span className="text-iados-accent">${getTotal().toFixed(2)}</span>
          </div>

          {isPostPago ? (
            <button
              onClick={onEnviarPedido}
              disabled={!mesaActiva || cart.length === 0}
              className="btn-primary w-full text-lg mt-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={20} /> Enviar Pedido
            </button>
          ) : pedidoActivo ? (
            <div className="space-y-2 mt-3">
              <button
                onClick={onActualizarCuenta}
                disabled={cart.length === 0}
                className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <BookOpen size={18} /> Actualizar Mesa {pedidoActivo.mesa}
              </button>
              <button
                onClick={onPay}
                disabled={!cajaActiva || cart.length === 0}
                className="btn-accent w-full text-lg disabled:opacity-50"
              >
                Cobrar Mesa {pedidoActivo.mesa} — ${getTotal().toFixed(2)}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
              {cuentaAbiertaEnabled && onAbrirCuenta && (
                <button
                  onClick={onAbrirCuenta}
                  disabled={cart.length === 0}
                  className="btn-secondary flex-none flex items-center justify-center gap-1 px-3 disabled:opacity-50"
                  title="Abrir Cuenta"
                >
                  <BookOpen size={18} />
                  <span className="text-sm">Cuenta</span>
                </button>
              )}
              <button
                onClick={onPay}
                disabled={!cajaActiva || (isMesa && !mesaActiva)}
                className="btn-accent flex-1 text-lg disabled:opacity-50"
              >
                Cobrar ${getTotal().toFixed(2)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
