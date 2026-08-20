import { useState, useRef, useEffect, useCallback } from 'react';
import { usePOSStore } from '../../store/pos.store';
import { pedidosApi, productosApi } from '../../api/endpoints';
import { Minus, Plus, Trash2, ShoppingCart, Send, BookOpen, MessageSquare, Phone, FileText, PackageSearch, X as XIcon } from 'lucide-react';
import { money } from '../../utils/money';
import { formatMonto, MonedaConfig } from '../../utils/moneda';
import toast from 'react-hot-toast';

interface Props {
  onPay: () => void;
  onEnviarPedido?: () => void;
  onAbrirCuenta?: () => void;
  onPreCuenta?: () => void;
  precuentaEnabled?: boolean;
  cuentaAbiertaEnabled?: boolean;
  notasPorItem?: boolean;
  notasRapidas?: string[];
  cantidadesRapidas?: number[];
  notasPedidoEnabled?: boolean;
  datosEnvioEnabled?: boolean;
  clienteVentaEnabled?: boolean;
  pedidoActivo?: any;
  onActualizarCuenta?: () => void;
  onCancelarEdicion?: () => void;
  mesaNumeroOculto?: boolean;
  cajaManaged?: boolean;
  enSitioVisible?: boolean;
  paraLlevarVisible?: boolean;
  mostrarPrecios?: boolean;
  precioManual?: boolean;
  moneda?: MonedaConfig;
  inventarioCompartido?: boolean;
}

export default function CartPanel({ onPay, onEnviarPedido, onAbrirCuenta, onPreCuenta, precuentaEnabled, cuentaAbiertaEnabled, notasPorItem, notasRapidas = [], cantidadesRapidas, notasPedidoEnabled, datosEnvioEnabled, clienteVentaEnabled, pedidoActivo, onActualizarCuenta, onCancelarEdicion, mesaNumeroOculto, cajaManaged, enSitioVisible = true, paraLlevarVisible = true, mostrarPrecios = true, precioManual = false, moneda, inventarioCompartido = false }: Props) {
  const { cart, updateQuantity, removeFromCart, clearCart, updateItemNotes, getSubtotal, getImpuestos, getTotal, cajaActiva, modoServicio, tipoCobro, mesaActiva, setMesaActiva, tipoServicio, setTipoServicio, notaPedido, setNotaPedido, clienteNombre, setClienteNombre, clienteTelefono, setClienteTelefono, clienteDireccion, setClienteDireccion, updateItemPrice, setItemApartado } = usePOSStore();

  // Apartar en otra tienda — selector de tienda destino cuando el stock local no alcanza
  const [apartadoPickerItemId, setApartadoPickerItemId] = useState<string | null>(null);
  const [apartadoOpciones, setApartadoOpciones] = useState<{ tienda_id: number; tienda_nombre: string; stock: number }[]>([]);
  const [apartadoLoading, setApartadoLoading] = useState(false);

  const abrirApartadoPicker = async (item: any) => {
    setApartadoPickerItemId(item.id);
    setApartadoOpciones([]);
    setApartadoLoading(true);
    try {
      const { data } = await productosApi.stockOtrasTiendas(item.producto_id);
      setApartadoOpciones(data || []);
      if (!data?.length) toast('Sin stock disponible en otras tiendas', { icon: '⚠️' });
    } catch {
      toast.error('No se pudo consultar stock en otras tiendas');
    } finally {
      setApartadoLoading(false);
    }
  };

  const elegirTiendaApartado = (tienda_id: number, tienda_nombre: string) => {
    if (apartadoPickerItemId) setItemApartado(apartadoPickerItemId, tienda_id, tienda_nombre);
    setApartadoPickerItemId(null);
  };

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

  // Precio manual — buffer de texto crudo por item para no perder el punto decimal
  // mientras se escribe (ej. "12." se vería como "12" si solo guardaramos el numero)
  const [precioInputs, setPrecioInputs] = useState<Record<string, string>>({});

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
  const precioManualIncompleto = precioManual && cart.some(i => i.precioManual === undefined || i.precioManual === 0);
  const stockApartadoIncompleto = inventarioCompartido && cart.some(
    (i) => i.controla_stock && i.stock_actual !== undefined && i.cantidad > i.stock_actual && !i.apartado_tienda_id,
  );

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 shrink-0 px-4 border-b border-slate-700 flex items-center justify-between">
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

      {/* Datos para llevar / cliente de la venta — detección automática nombre/teléfono */}
      {((datosEnvioEnabled && tipoServicio === 'para_llevar') || clienteVentaEnabled) && (
        <div className="px-3 pt-2 pb-1 border-b border-orange-500/30 bg-orange-950/20">
          <p className="text-xs text-orange-400 font-medium mb-2 flex items-center gap-1">
            <Phone size={11} /> {tipoServicio === 'para_llevar' ? 'Datos de entrega' : 'Cliente (opcional)'}
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

          {tipoServicio === 'para_llevar' && (
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
          )}
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
            <div key={item.id} className="bg-iados-card rounded-xl px-3 pt-2 pb-2">
              {/* Fila 1: Nombre completo como encabezado */}
              <p className="font-semibold text-sm leading-snug mb-1">{item.nombre}</p>

              {/* Fila 2: precio · controles · subtotal */}
              <div className="flex items-center gap-1.5">
                {precioManual ? (
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-slate-500">$/u</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={precioInputs[item.id] ?? (item.precioManual !== undefined ? String(item.precioManual) : '')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        setPrecioInputs((prev) => ({ ...prev, [item.id]: raw }));
                        updateItemPrice(item.id, parseFloat(raw) || 0);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-20 bg-iados-bg border border-slate-600 rounded-lg px-1.5 py-0.5 text-xs text-right focus:outline-none focus:border-iados-primary"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 flex-1 tabular-nums">{mostrarPrecios && item.cantidad > 1 ? `$${Number(item.precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} c/u` : ''}</span>
                )}

                {notasPorItem && (
                  <button
                    onClick={() => { setEditingNotaId(item.id); setNotaTemp(item.notas || ''); }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 shrink-0 ${item.notas ? 'bg-iados-primary/30 text-iados-accent' : 'bg-iados-surface text-slate-500'}`}
                    title="Agregar nota"
                  >
                    <MessageSquare size={13} />
                  </button>
                )}

                <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="w-7 h-7 rounded-lg bg-iados-surface flex items-center justify-center active:scale-90 shrink-0"><Minus size={13} /></button>

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
                    className="w-24 text-center font-bold bg-iados-primary/20 border border-iados-primary/50 rounded-lg text-sm px-1 py-0.5 shrink-0 tabular-nums"
                  />
                ) : (
                  <button
                    className="min-w-[4rem] h-7 px-1.5 text-center font-bold hover:bg-iados-primary/20 rounded-lg transition-colors text-sm shrink-0 tabular-nums"
                    title="Toca para editar cantidad"
                    onClick={() => { setEditingQtyId(item.id); setQtyTemp(String(item.cantidad)); }}
                  >{item.cantidad}</button>
                )}

                <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="w-7 h-7 rounded-lg bg-iados-surface flex items-center justify-center active:scale-90 shrink-0"><Plus size={13} /></button>
                <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-lg bg-red-900/50 text-red-400 flex items-center justify-center active:scale-90 shrink-0"><Trash2 size={13} /></button>

                {(mostrarPrecios || precioManual) && (
                  <span className={`font-bold text-sm text-right shrink-0 min-w-[3.5rem] tabular-nums ${precioManual && !item.precioManual ? 'text-slate-500' : ''}`}>
                    ${((item.precioManual ?? item.precio) * item.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              {/* Apartado: stock local insuficiente + inventario compartido activo */}
              {inventarioCompartido && item.controla_stock && item.stock_actual !== undefined && item.cantidad > item.stock_actual && (
                item.apartado_tienda_id ? (
                  <div className="mt-1.5 flex items-center gap-1.5 bg-blue-900/30 border border-blue-700/50 rounded-lg px-2 py-1">
                    <PackageSearch size={12} className="text-blue-400 shrink-0" />
                    <span className="text-xs text-blue-300 flex-1 truncate">Apartado en {item.apartado_tienda_nombre}</span>
                    <button onClick={() => setItemApartado(item.id, undefined)} className="text-blue-400 hover:text-red-400 shrink-0"><XIcon size={12} /></button>
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center gap-1.5 bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-2 py-1">
                    <span className="text-xs text-yellow-400 flex-1">⚠ Sin stock suficiente ({item.stock_actual} disp.)</span>
                    <button
                      onClick={() => abrirApartadoPicker(item)}
                      className="text-xs font-medium text-blue-300 hover:text-blue-200 underline shrink-0"
                    >
                      Apartar en otra tienda
                    </button>
                  </div>
                )
              )}

              {/* Nota visible */}
              {notasPorItem && editingNotaId !== item.id && item.notas && (
                <p
                  className="text-xs text-iados-accent mt-1 cursor-pointer"
                  onClick={() => { setEditingNotaId(item.id); setNotaTemp(item.notas || ''); }}
                >{item.notas}</p>
              )}

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
          {precioManual && cart.some(i => i.precioManual === undefined || i.precioManual === 0) && (
            <div className="px-3 py-1.5 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
              <p className="text-xs text-yellow-400">⚠ Ingresa el precio de todos los productos</p>
            </div>
          )}
          {stockApartadoIncompleto && (
            <div className="px-3 py-1.5 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
              <p className="text-xs text-yellow-400">⚠ Resuelve el apartado de los productos sin stock</p>
            </div>
          )}
          {(mostrarPrecios || precioManual) && (
            <>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span className="tabular-nums">${money(getSubtotal())}</span>
              </div>
              {getImpuestos() > 0 && (
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Impuestos</span>
                  <span className="tabular-nums">${money(getImpuestos())}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-600">
                <span>Total</span>
                <span className="text-iados-accent tabular-nums">{formatMonto(getTotal(), moneda)}</span>
              </div>
            </>
          )}

          {isPostPago ? (
            <div className="space-y-2 mt-3">
              {precuentaEnabled && onPreCuenta && cart.length > 0 && (
                <button onClick={onPreCuenta} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                  <FileText size={16} /> Pre-cuenta
                </button>
              )}
              <button
                onClick={onEnviarPedido}
                disabled={(!mesaActiva && !mesaNumeroOculto) || cart.length === 0 || precioManualIncompleto}
                className="btn-primary w-full text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={20} /> Enviar Pedido{mesaActiva ? ` — Mesa ${mesaActiva}` : ''}
              </button>
            </div>
          ) : pedidoActivo ? (
            <div className="space-y-2 mt-3">
              {precuentaEnabled && onPreCuenta && (
                <button onClick={onPreCuenta} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                  <FileText size={16} /> Pre-cuenta
                </button>
              )}
              <button onClick={onActualizarCuenta} disabled={cart.length === 0} className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                <BookOpen size={18} /> Actualizar Mesa {pedidoActivo.mesa}
              </button>
              <button onClick={onPay} disabled={(!cajaActiva && !cajaManaged) || cart.length === 0 || precioManualIncompleto} className="btn-accent w-full text-lg disabled:opacity-50">
                Cobrar Mesa {pedidoActivo.mesa}{mostrarPrecios ? ` — $${money(getTotal())}` : ''}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mt-3 flex-wrap">
              {precuentaEnabled && onPreCuenta && cart.length > 0 && (
                <button onClick={onPreCuenta} className="btn-secondary flex-none flex items-center justify-center gap-1 px-3" title="Pre-cuenta">
                  <FileText size={18} />
                </button>
              )}
              {cuentaAbiertaEnabled && onAbrirCuenta && (
                <button onClick={onAbrirCuenta} disabled={cart.length === 0} className="btn-secondary flex-none flex items-center justify-center gap-1 px-3 disabled:opacity-50" title="Abrir Cuenta">
                  <BookOpen size={18} />
                  <span className="text-sm">Cuenta</span>
                </button>
              )}
              <button onClick={onPay} disabled={(!cajaActiva && !cajaManaged) || (isMesa && !mesaActiva && !mesaNumeroOculto) || precioManualIncompleto || stockApartadoIncompleto} className="btn-accent flex-1 text-lg disabled:opacity-50">
                Cobrar{mostrarPrecios ? ` $${money(getTotal())}` : ''}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selector de tienda para apartar */}
      {apartadoPickerItemId && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setApartadoPickerItemId(null)}>
          <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base flex items-center gap-2"><PackageSearch size={18} /> Apartar en otra tienda</h3>
              <button onClick={() => setApartadoPickerItemId(null)} className="text-slate-400 hover:text-white"><XIcon size={18} /></button>
            </div>
            {apartadoLoading ? (
              <p className="text-sm text-slate-400 text-center py-6">Buscando stock...</p>
            ) : apartadoOpciones.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No hay stock disponible en otras tiendas.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {apartadoOpciones.map((o) => (
                  <button
                    key={o.tienda_id}
                    onClick={() => elegirTiendaApartado(o.tienda_id, o.tienda_nombre)}
                    className="w-full flex items-center justify-between bg-iados-card hover:bg-iados-primary/20 border border-slate-600 hover:border-iados-primary rounded-xl px-3 py-2.5 transition-colors"
                  >
                    <span className="text-sm font-medium">{o.tienda_nombre}</span>
                    <span className="text-xs text-slate-400">{o.stock} disp.</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
