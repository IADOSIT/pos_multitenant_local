import { useState, useRef, useEffect, useCallback } from 'react';
import { usePOSStore } from '../../store/pos.store';
import { pedidosApi } from '../../api/endpoints';
import { Minus, Plus, Trash2, ShoppingCart, Send, BookOpen, MessageSquare, Phone } from 'lucide-react';

interface Props {
  onPay: () => void;
  onEnviarPedido?: () => void;
  onAbrirCuenta?: () => void;
  cuentaAbiertaEnabled?: boolean;
  notasPorItem?: boolean;
  notasRapidas?: string[];
  cantidadesRapidas?: number[];
  notasPedidoEnabled?: boolean;
  datosEnvioEnabled?: boolean;
  pedidoActivo?: any;
  onActualizarCuenta?: () => void;
  onCancelarEdicion?: () => void;
  mesaNumeroOculto?: boolean;
  cajaManaged?: boolean;
  enSitioVisible?: boolean;
  paraLlevarVisible?: boolean;
}

export default function CartPanel({ onPay, onEnviarPedido, onAbrirCuenta, cuentaAbiertaEnabled, notasPorItem, notasRapidas = [], cantidadesRapidas, notasPedidoEnabled, datosEnvioEnabled, pedidoActivo, onActualizarCuenta, onCancelarEdicion, mesaNumeroOculto, cajaManaged, enSitioVisible = true, paraLlevarVisible = true }: Props) {
  const { cart, updateQuantity, removeFromCart, clearCart, updateItemNotes, getSubtotal, getImpuestos, getTotal, cajaActiva, modoServicio, tipoCobro, mesaActiva, setMesaActiva, tipoServicio, setTipoServicio, notaPedido, setNotaPedido, clienteNombre, setClienteNombre, clienteTelefono, setClienteTelefono, clienteDireccion, setClienteDireccion } = usePOSStore();

  // Auto-seleccionar tipo de servicio si solo uno está habilitado
  useEffect(() => {
    if (enSitioVisible && !paraLlevarVisible) setTipoServicio('en_sitio');
    else if (!enSitioVisible && paraLlevarVisible) setTipoServicio('para_llevar');
  }, [enSitioVisible, paraLlevarVisible]);

  // Notas por ítem
  const [editingNotaId, setEditingNotaId] = useState<string | null>(null);
  const [notaTemp, setNotaTemp] = useState('');

  // Inline qty editing
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [qtyTemp, setQtyTemp] = useState('');

  // Para llevar — autocomplete con detección automática nombre/teléfono
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [modoCliente, setModoCliente] = useState<'telefono' | 'nombre'>('telefono');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const telRef = useRef<HTMLInputElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);
  const primerRef = useRef<HTMLInputElement>(null);

  const esTelefono = (val: string) => /^[\d\s\+\-\(\)]*$/.test(val);

  const buscarClientes = useCallback(async (q: string) => {
    if (q.length < 2) { setSugerencias([]); setShowSugerencias(false); return; }
    try {
      const { data } = await pedidosApi.buscarClientes(q);
      setSugerencias(data || []);
      setShowSugerencias((data || []).length > 0);
    } catch {
      setSugerencias([]);
    }
  }, []);

  // Campo primario inteligente: detecta tipo al escribir
  const handlePrimerCampo = (val: string) => {
    const esTel = esTelefono(val);
    if (esTel) {
      setModoCliente('telefono');
      setClienteTelefono(val);
    } else {
      setModoCliente('nombre');
      setClienteNombre(val);
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarClientes(val), 300);
  };

  const primerValor = modoCliente === 'telefono' ? clienteTelefono : clienteNombre;

  const seleccionarCliente = (c: any) => {
    setClienteTelefono(c.telefono || '');
    setClienteNombre(c.nombre || '');
    setClienteDireccion(c.direccion || '');
    setSugerencias([]);
    setShowSugerencias(false);
  };

  // Chips de nota: toggle chip en el texto
  const toggleChip = (chip: string) => {
    const partes = notaTemp.split(',').map(s => s.trim()).filter(Boolean);
    const idx = partes.findIndex(p => p.toLowerCase() === chip.toLowerCase());
    if (idx >= 0) {
      partes.splice(idx, 1);
    } else {
      partes.push(chip);
    }
    setNotaTemp(partes.join(', '));
  };

  const chipActivo = (chip: string) =>
    notaTemp.split(',').map(s => s.trim().toLowerCase()).includes(chip.toLowerCase());

  const confirmarNota = (itemId: string) => {
    updateItemNotes(itemId, notaTemp.trim());
    setEditingNotaId(null);
  };

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
      {isMesa && !mesaNumeroOculto && (
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

      {/* Tipo de servicio — solo si al menos uno está habilitado */}
      {(enSitioVisible || paraLlevarVisible) && (
        <div className="p-3 border-b border-slate-700">
          <div className="flex rounded-xl overflow-hidden border border-slate-600">
            {enSitioVisible && (
              <button
                onClick={() => setTipoServicio('en_sitio')}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                  tipoServicio === 'en_sitio' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🍽️ En sitio
              </button>
            )}
            {paraLlevarVisible && (
              <button
                onClick={() => setTipoServicio('para_llevar')}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                  tipoServicio === 'para_llevar' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🥡 Para llevar
              </button>
            )}
          </div>
        </div>
      )}

      {!cajaActiva && !isPostPago && !cajaManaged && (
        <div className="p-4 bg-amber-900/30 border-b border-amber-700 text-amber-300 text-sm text-center">
          No hay caja abierta. Abra una caja para vender.
        </div>
      )}

      {/* Datos para llevar — detección automática nombre/teléfono */}
      {datosEnvioEnabled && tipoServicio === 'para_llevar' && (
        <div className="px-3 pt-2 pb-1 border-b border-orange-500/30 bg-orange-950/20">
          <p className="text-xs text-orange-400 font-medium mb-2 flex items-center gap-1">
            <Phone size={11} /> Datos de entrega
            <span className="ml-auto text-orange-300/50 font-normal">
              {modoCliente === 'telefono' ? '📞 por teléfono' : '👤 por nombre'}
            </span>
          </p>

          {/* Campo primario inteligente */}
          <div className="relative mb-1">
            <input
              ref={primerRef}
              type={modoCliente === 'telefono' ? 'tel' : 'text'}
              inputMode={modoCliente === 'telefono' ? 'numeric' : 'text'}
              value={primerValor}
              onChange={(e) => handlePrimerCampo(e.target.value)}
              onFocus={() => primerValor.length >= 2 && setShowSugerencias(sugerencias.length > 0)}
              onBlur={() => setTimeout(() => setShowSugerencias(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault();
                  (modoCliente === 'telefono' ? nombreRef : telRef).current?.focus();
                }
              }}
              placeholder={modoCliente === 'telefono' ? 'Teléfono o nombre del cliente' : 'Nombre o teléfono del cliente'}
              className="input-touch text-sm py-1.5 w-full"
              maxLength={100}
              autoComplete="off"
            />
            {showSugerencias && sugerencias.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-iados-card border border-slate-600 rounded-xl shadow-xl overflow-hidden">
                {sugerencias.map((c, i) => (
                  <button
                    key={i}
                    onMouseDown={() => seleccionarCliente(c)}
                    className="w-full text-left px-3 py-2 hover:bg-iados-primary/20 transition-colors border-b border-slate-700/50 last:border-0"
                  >
                    <span className="text-sm font-medium text-white">{c.nombre || '—'}</span>
                    <span className="text-xs text-slate-400 ml-2">{c.telefono}</span>
                    {c.direccion && <p className="text-xs text-slate-500 truncate">{c.direccion}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Campo secundario: el que no está primero */}
          {modoCliente === 'telefono' ? (
            <input
              ref={nombreRef}
              type="text"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); dirRef.current?.focus(); } }}
              placeholder="Nombre"
              className="input-touch text-sm py-1.5 w-full mb-1"
              maxLength={100}
            />
          ) : (
            <input
              ref={telRef}
              type="tel"
              inputMode="numeric"
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); dirRef.current?.focus(); } }}
              placeholder="Teléfono"
              className="input-touch text-sm py-1.5 w-full mb-1"
              maxLength={15}
            />
          )}

          <input
            ref={dirRef}
            type="text"
            value={clienteDireccion}
            onChange={(e) => setClienteDireccion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            placeholder="Dirección (opcional)"
            className="input-touch text-sm py-1.5 w-full"
            maxLength={200}
          />
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
                  <p className="font-medium text-sm leading-tight line-clamp-2 break-words">{item.nombre}</p>
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
                  <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="w-8 h-8 rounded-lg bg-iados-surface flex items-center justify-center active:scale-90"><Minus size={14} /></button>
                  {editingQtyId === item.id ? (
                    <input
                      type="number"
                      min="1"
                      autoFocus
                      value={qtyTemp}
                      onChange={(e) => setQtyTemp(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => {
                        const v = parseInt(qtyTemp, 10);
                        if (!isNaN(v) && v >= 1) updateQuantity(item.id, v);
                        else if (v < 1) removeFromCart(item.id);
                        setEditingQtyId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setEditingQtyId(null);
                      }}
                      className="w-12 text-center font-bold bg-iados-primary/20 border border-iados-primary/50 rounded-lg text-sm px-1 py-0.5"
                    />
                  ) : (
                    <button
                      className="w-8 text-center font-bold hover:bg-iados-primary/20 rounded-lg transition-colors"
                      title="Toca para editar cantidad"
                      onClick={() => { setEditingQtyId(item.id); setQtyTemp(String(item.cantidad)); }}
                    >{item.cantidad}</button>
                  )}
                  <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="w-8 h-8 rounded-lg bg-iados-surface flex items-center justify-center active:scale-90"><Plus size={14} /></button>
                  <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-lg bg-red-900/50 text-red-400 flex items-center justify-center active:scale-90 ml-1"><Trash2 size={14} /></button>
                </div>
                <div className="text-right shrink-0 w-20">
                  <p className="font-bold">${item.subtotal.toFixed(2)}</p>
                </div>
              </div>

              {/* Editor de nota con chips */}
              {notasPorItem && editingNotaId === item.id && (
                <div className="mt-2 space-y-1.5">
                  {notasRapidas.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {notasRapidas.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => toggleChip(chip)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                            chipActivo(chip)
                              ? 'bg-iados-primary border-iados-primary text-white'
                              : 'bg-iados-surface border-slate-600 text-slate-300 hover:border-iados-primary'
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      autoFocus={notasRapidas.length === 0}
                      type="text"
                      value={notaTemp}
                      onChange={(e) => setNotaTemp(e.target.value)}
                      onBlur={() => confirmarNota(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.currentTarget.blur(); }
                        if (e.key === 'Escape') setEditingNotaId(null);
                      }}
                      placeholder="Nota personalizada…"
                      className="input-touch text-xs py-1 flex-1"
                      maxLength={100}
                    />
                    {(item.notas || notaTemp) && (
                      <button
                        onMouseDown={(e) => { e.preventDefault(); setNotaTemp(''); updateItemNotes(item.id, ''); setEditingNotaId(null); }}
                        className="px-2 py-1 bg-red-900/50 text-red-400 rounded-lg text-xs"
                      >×</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Nota general del pedido */}
        {notasPedidoEnabled && cart.length > 0 && (
          <div className="mt-2 pt-3 border-t border-slate-700">
            <label className="text-xs text-slate-400 mb-1 block">Nota del pedido</label>
            <textarea
              value={notaPedido}
              onChange={(e) => setNotaPedido(e.target.value)}
              placeholder="Ej: sin cebolla, extra salsa, alergia a..."
              className="input-touch text-sm resize-none w-full"
              rows={2}
              maxLength={300}
            />
          </div>
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
              disabled={(!mesaActiva && !mesaNumeroOculto) || cart.length === 0}
              className="btn-primary w-full text-lg mt-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={20} /> Enviar Pedido{mesaActiva ? ` — Mesa ${mesaActiva}` : ''}
            </button>
          ) : pedidoActivo ? (
            <div className="space-y-2 mt-3">
              <button onClick={onActualizarCuenta} disabled={cart.length === 0} className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                <BookOpen size={18} /> Actualizar Mesa {pedidoActivo.mesa}
              </button>
              <button onClick={onPay} disabled={(!cajaActiva && !cajaManaged) || cart.length === 0} className="btn-accent w-full text-lg disabled:opacity-50">
                Cobrar Mesa {pedidoActivo.mesa} — ${getTotal().toFixed(2)}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
              {cuentaAbiertaEnabled && onAbrirCuenta && (
                <button onClick={onAbrirCuenta} disabled={cart.length === 0} className="btn-secondary flex-none flex items-center justify-center gap-1 px-3 disabled:opacity-50" title="Abrir Cuenta">
                  <BookOpen size={18} />
                  <span className="text-sm">Cuenta</span>
                </button>
              )}
              <button onClick={onPay} disabled={(!cajaActiva && !cajaManaged) || (isMesa && !mesaActiva && !mesaNumeroOculto)} className="btn-accent flex-1 text-lg disabled:opacity-50">
                Cobrar ${getTotal().toFixed(2)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
