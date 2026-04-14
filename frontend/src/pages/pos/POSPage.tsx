import { useState, useEffect, useCallback, useRef } from 'react';
import { usePOSStore } from '../../store/pos.store';
import { useAuthStore } from '../../store/auth.store';
import { offlineActions } from '../../store/offline.store';
import { productosApi, categoriasApi, cajaApi, tiendasApi, pedidosApi, ticketsApi, selfOrderApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import { printComanda } from '../../utils/printTicket';
import { Producto, Categoria } from '../../types';
import toast from 'react-hot-toast';
import CartPanel from '../../components/pos/CartPanel';
import PayModal from '../../components/pos/PayModal';
import AbrirCuentaModal from '../../components/pos/AbrirCuentaModal';
import { Search, ShoppingBag, Wifi, WifiOff, CreditCard, X, Clock, RefreshCw, Trash2, Minus, Plus } from 'lucide-react';

// ── Long-press product card ──────────────────────────────────────────────────
function ProductCard({ prod, onClick, onLongPress }: { prod: Producto; onClick: () => void; onLongPress: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const start = () => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, 500);
  };
  const cancel = () => { if (timerRef.current) clearTimeout(timerRef.current); };
  const handleClick = () => { if (!firedRef.current) onClick(); };

  return (
    <button
      onMouseDown={start} onMouseUp={cancel} onMouseLeave={cancel}
      onTouchStart={start} onTouchEnd={cancel} onTouchCancel={cancel}
      onClick={handleClick}
      className="card hover:ring-2 hover:ring-iados-secondary active:scale-95 transition-all flex flex-col items-center text-center p-3 min-h-[120px] select-none"
    >
      {prod.imagen_url ? (
        <img src={resolveUploadUrl(prod.imagen_url)} alt={prod.nombre} className="w-16 h-16 object-cover rounded-xl mb-2" />
      ) : (
        <div
          className="w-16 h-16 rounded-xl mb-2 flex items-center justify-center text-2xl font-bold"
          style={{ backgroundColor: (prod as any).categoria?.color || '#3b82f6', color: 'white' }}
        >
          {prod.nombre.charAt(0)}
        </div>
      )}
      <span className="text-sm font-medium leading-tight line-clamp-2">{prod.nombre}</span>
      <span className="text-iados-accent font-bold mt-1">${Number(prod.precio).toFixed(2)}</span>
    </button>
  );
}

export default function POSPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [showPay, setShowPay] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cartVisible, setCartVisible] = useState(false);
  const [cuentasAbiertas, setCuentasAbiertas] = useState<any[]>([]);
  const [showCuentas, setShowCuentas] = useState(false);
  const [pedidoACobrar, setPedidoACobrar] = useState<any>(null);
  const [showAbrirCuenta, setShowAbrirCuenta] = useState(false);
  const [cuentaAbiertaEnabled, setCuentaAbiertaEnabled] = useState(false);
  const [pedidoActivo, setPedidoActivo] = useState<any>(null);
  const [mostrarSoPendienteEnPos, setMostrarSoPendienteEnPos] = useState(false);
  const [notasPorItem, setNotasPorItem] = useState(false);
  const [notasRapidas, setNotasRapidas] = useState<string[]>([]);
  const [notasPedidoEnabled, setNotasPedidoEnabled] = useState(false);
  const [datosEnvioEnabled, setDatosEnvioEnabled] = useState(false);
  const [cantidadesRapidas, setCantidadesRapidas] = useState<number[]>([10, 25, 50, 100]);
  const [qtyModal, setQtyModal] = useState<{ producto: any; qty: number } | null>(null);
  const [mesaNumeroOculto, setMesaNumeroOculto] = useState(false);
  const [cajaManaged, setCajaManaged] = useState(false); // true cuando caja_auto_enabled o caja_ocultar_ui

  const { user } = useAuthStore();
  const { categoriaActiva, setCategoriaActiva, addToCart, cart, getItemCount, getSubtotal, getImpuestos, getTotal, cajaActiva, setCajaActiva, modoServicio, setModoServicio, setTipoCobro, setIvaConfig, mesaActiva, setMesaActiva, tipoServicio, clearCart, notaPedido, clienteNombre, clienteTelefono, clienteDireccion } = usePOSStore();

  const loadCuentasAbiertas = useCallback(async () => {
    try {
      const { data } = await pedidosApi.pendientes();
      setCuentasAbiertas(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
    loadCaja();
    loadTiendaConfig();
    loadCuentasAbiertas();
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    // Refresco automático cada 30s
    const interval = setInterval(loadCuentasAbiertas, 30000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
    };
  }, [loadCuentasAbiertas]);

  /** Asegura que haya una caja abierta. Si autoOpen=true, la crea con fondo $0 si no hay ninguna. */
  const ensureCajaAbierta = async (autoOpen: boolean) => {
    try {
      const { data } = await cajaApi.activa();
      setCajaActiva(data);
    } catch {
      if (autoOpen) {
        try {
          const diaNatural = new Date().toLocaleDateString('es-MX');
          const { data } = await cajaApi.abrir({ fondo: 0, nombre: `Caja-${diaNatural}` });
          setCajaActiva(data);
        } catch {} // ya hay una caja open en otro turno o error de red → se reintentará en siguiente heartbeat
      } else {
        setCajaActiva(null);
      }
    }
  };

  const loadTiendaConfig = async () => {
    if (!user?.tienda_id) return;
    try {
      const { data } = await tiendasApi.get(user.tienda_id);
      if (data.config_pos) {
        const cp = data.config_pos;
        setModoServicio(cp.modo_servicio || 'autoservicio');
        setTipoCobro(cp.tipo_cobro_mesa || 'pago_inmediato');
        setIvaConfig({
          enabled: cp.iva_enabled || false,
          porcentaje: cp.iva_porcentaje ?? 16,
          incluido: cp.iva_incluido ?? true,
        });
        setCuentaAbiertaEnabled(cp.habilitar_cuenta_abierta || false);
        setMostrarSoPendienteEnPos(cp.mostrar_so_pendiente_en_pos || false);
        setNotasPorItem(cp.notas_por_item || false);
        setNotasRapidas(
          (cp.notas_rapidas || '')
            .split(',').map((s: string) => s.trim()).filter(Boolean)
        );
        setNotasPedidoEnabled(cp.notas_pedido_enabled || false);
        setDatosEnvioEnabled(cp.datos_envio_enabled || false);
        setMesaNumeroOculto(cp.mesa_numero_oculto || false);
        const cr = (cp.cantidades_rapidas || '10,25,50,100')
          .split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => n > 0);
        setCantidadesRapidas(cr.length ? cr : [10, 25, 50, 100]);

        // Si la caja está en modo automático u oculta, garantizar que esté abierta
        const managed = (cp.caja_auto_enabled || false) || (cp.caja_ocultar_ui || false);
        setCajaManaged(managed);
        if (managed) {
          await ensureCajaAbierta(true);
        }
      }
    } catch {}
  };

  const loadData = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        productosApi.forPOS(),
        categoriasApi.list(),
      ]);
      setProductos(prodsRes.data);
      setCategorias(catsRes.data);
      offlineActions.cacheProductos(prodsRes.data);
      offlineActions.cacheCategorias(catsRes.data);
    } catch {
      const cachedProds = await offlineActions.getCachedProductos();
      const cachedCats = await offlineActions.getCachedCategorias();
      if (cachedProds.length) {
        setProductos(cachedProds);
        setCategorias(cachedCats);
        toast('Modo offline - datos en cache', { icon: '📡' });
      }
    }
  };

  const loadCaja = async () => {
    try {
      const { data } = await cajaApi.activa();
      setCajaActiva(data);
    } catch {}
  };

  const filteredProductos = productos.filter((p) => {
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    if (categoriaActiva) return p.categoria_id === categoriaActiva;
    return true;
  });

  const handleProductClick = (producto: Producto) => {
    addToCart(producto);
    toast.success(`${producto.nombre} agregado`, { duration: 800 });
  };

  const handleProductLongPress = (producto: Producto) => {
    setQtyModal({ producto, qty: 1 });
  };

  const handleQtyConfirm = () => {
    if (!qtyModal || qtyModal.qty < 1) return;
    addToCart(qtyModal.producto, qtyModal.qty);
    toast.success(`${qtyModal.producto.nombre} x${qtyModal.qty}`, { duration: 800 });
    setQtyModal(null);
  };

  const handleEnviarPedido = async () => {
    if (!mesaActiva || cart.length === 0) return;
    try {
      const data = {
        mesa: mesaActiva,
        tipo_servicio: tipoServicio,
        notas: notaPedido || undefined,
        cliente_nombre: clienteNombre || undefined,
        cliente_telefono: clienteTelefono || undefined,
        cliente_direccion: clienteDireccion || undefined,
        items: cart.map((i) => ({
          producto_id: i.producto_id,
          nombre: i.nombre,
          sku: i.sku,
          precio: i.precio,
          cantidad: i.cantidad,
          descuento: i.descuento,
          impuesto: i.impuesto,
          modificadores: i.modificadores,
          notas: i.notas,
        })),
        subtotal: getSubtotal(),
        impuestos: getImpuestos(),
        total: getTotal(),
      };
      const { data: pedido } = await pedidosApi.crear(data);
      // Auto-print comanda if configured
      try {
        const { data: ticketConfig } = await ticketsApi.getConfig();
        if (ticketConfig.comanda_enabled && ticketConfig.comanda_auto_print) {
          printComanda(
            {
              mesa: data.mesa,
              folio: pedido.folio,
              usuario_nombre: pedido.usuario_nombre || user?.nombre,
              tipo_servicio: data.tipo_servicio,
              items: data.items.map((i: any) => ({
                cantidad: i.cantidad,
                nombre: i.nombre,
                precio: i.precio,
                notas: i.notas,
              })),
            },
            ticketConfig,
          );
        }
      } catch {}
      toast.success(`Pedido ${pedido.folio} enviado - Mesa ${mesaActiva}`);
      clearCart();
      loadCuentasAbiertas();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al enviar pedido');
    }
  };

  const handleAbrirCuentaDesdeModal = async (mesa: number, cliente: string, telefono: string, direccion: string) => {
    if (cart.length === 0) return;
    try {
      const data = {
        mesa,
        tipo_servicio: tipoServicio,
        notas: notaPedido || undefined,
        cliente_nombre: cliente || clienteNombre || undefined,
        cliente_telefono: telefono || clienteTelefono || undefined,
        cliente_direccion: direccion || clienteDireccion || undefined,
        items: cart.map((i) => ({
          producto_id: i.producto_id,
          nombre: i.nombre,
          sku: i.sku,
          precio: i.precio,
          cantidad: i.cantidad,
          descuento: i.descuento,
          impuesto: i.impuesto,
          modificadores: i.modificadores,
          notas: i.notas,
        })),
        subtotal: getSubtotal(),
        impuestos: getImpuestos(),
        total: getTotal(),
      };
      const { data: pedido } = await pedidosApi.crear(data);
      clearCart();
      setShowAbrirCuenta(false);
      setMesaActiva(null);
      loadCuentasAbiertas();
      setShowCuentas(true);
      toast.success(`Mesa ${mesa} — cuenta abierta (${pedido.folio})`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al abrir cuenta');
      throw e;
    }
  };

  const handleCobrarDesdeCuentaModal = (mesa: number, _cliente: string, _telefono: string, _direccion: string) => {
    setMesaActiva(mesa);
    setShowAbrirCuenta(false);
    setShowPay(true);
  };

  const handleCargarAlCarrito = (pedido: any) => {
    if (cart.length > 0) {
      if (!confirm('El carrito actual tiene items. ¿Reemplazar con los items de esta cuenta?')) return;
      clearCart();
    }
    pedido.detalles?.forEach((d: any) => {
      addToCart({
        id: d.producto_id,
        nombre: d.producto_nombre,
        sku: d.producto_sku,
        precio: Number(d.precio_unitario),
        categoria_id: 0,
        descripcion: '',
        imagen_url: '',
        disponible: true,
        en_pos: true,
      } as Producto, Number(d.cantidad));
    });
    setPedidoActivo(pedido);
    setShowCuentas(false);
    toast.success(`Mesa ${pedido.mesa} cargada — agrega items y actualiza o cobra`);
  };

  const handleConfirmarSO = async (pedido: any) => {
    try {
      await selfOrderApi.confirmar(pedido.id);
      toast.success(`Mesa ${pedido.mesa} confirmada al cliente`);
      loadCuentasAbiertas();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al confirmar');
    }
  };

  const handleCancelarCuenta = async (pedido: any) => {
    if (!confirm(`¿Cancelar cuenta Mesa ${pedido.mesa} (${pedido.folio})? Esta acción no se puede deshacer.`)) return;
    try {
      await pedidosApi.cancelar(pedido.id, 'Cancelado desde Cuentas Abiertas');
      if (pedidoActivo?.id === pedido.id) { setPedidoActivo(null); clearCart(); }
      loadCuentasAbiertas();
      toast.success(`Mesa ${pedido.mesa} cancelada`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al cancelar cuenta');
    }
  };

  const buildItemsFromCart = () => cart.map((i) => ({
    producto_id: i.producto_id,
    nombre: i.nombre,
    sku: i.sku,
    precio: i.precio,
    cantidad: i.cantidad,
    descuento: i.descuento,
    impuesto: i.impuesto,
    modificadores: i.modificadores,
    notas: i.notas,
  }));

  const handleActualizarCuenta = async () => {
    if (!pedidoActivo || cart.length === 0) return;
    try {
      await pedidosApi.actualizarItems(pedidoActivo.id, {
        items: buildItemsFromCart(),
        subtotal: getSubtotal(),
        impuestos: getImpuestos(),
        total: getTotal(),
      });
      clearCart();
      setPedidoActivo(null);
      loadCuentasAbiertas();
      setShowCuentas(true);
      toast.success(`Mesa ${pedidoActivo.mesa} actualizada`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al actualizar cuenta');
    }
  };

  const handleCobrarConPedidoActivo = async () => {
    if (!pedidoActivo) return;
    try {
      const { data: updated } = await pedidosApi.actualizarItems(pedidoActivo.id, {
        items: buildItemsFromCart(),
        subtotal: getSubtotal(),
        impuestos: getImpuestos(),
        total: getTotal(),
      });
      clearCart();
      setPedidoActivo(null);
      setPedidoACobrar(updated);
      setShowPay(true);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al preparar cobro');
    }
  };

  const handleCobrarPedido = (pedido: any) => {
    setPedidoACobrar(pedido);
    setShowCuentas(false);
    setShowPay(true);
  };

  const tiempoTranscurrido = (fecha: string) => {
    const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const estadoColor: Record<string, string> = {
    recibido: 'text-blue-400',
    en_elaboracion: 'text-yellow-400',
    listo_para_entrega: 'text-green-400',
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Panel izquierdo: categorias + productos */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header POS */}
        <div className="flex items-center gap-2 p-3 bg-iados-surface border-b border-slate-700">
          {user?.empresa_logo && (
            <img src={resolveUploadUrl(user.empresa_logo)} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          )}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setCategoriaActiva(null); }}
              placeholder="Buscar producto o SKU..."
              className="input-touch pl-10"
            />
          </div>

          {/* Botón Cuentas Abiertas */}
          <button
            onClick={() => { setShowCuentas(true); loadCuentasAbiertas(); }}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-iados-card border border-slate-600 hover:border-iados-secondary text-sm font-medium transition-colors shrink-0"
          >
            <CreditCard size={16} />
            <span className="hidden sm:inline">Cuentas</span>
            {cuentasAbiertas.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cuentasAbiertas.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1 text-xs text-slate-400">
            {isOnline ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-red-400" />}
            {modoServicio === 'mesa' && (
              <span className="ml-1 px-2 py-0.5 bg-iados-primary/30 text-iados-accent rounded text-xs">Mesa</span>
            )}
          </div>

          {/* Boton carrito movil */}
          <button
            className="lg:hidden btn-accent relative"
            onClick={() => setCartVisible(!cartVisible)}
          >
            <ShoppingBag size={20} />
            {getItemCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {getItemCount()}
              </span>
            )}
          </button>
        </div>

        {/* Banner Self Order pendientes de confirmar */}
        {mostrarSoPendienteEnPos && cuentasAbiertas.filter(p => p.self_order && !p.mesero_confirmado && p.estado === 'recibido').length > 0 && (
          <div className="bg-orange-600/20 border-b border-orange-500/40 px-3 py-2 space-y-1">
            {cuentasAbiertas.filter(p => p.self_order && !p.mesero_confirmado && p.estado === 'recibido').map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-orange-300 font-bold animate-pulse">📱 Mesa {p.mesa} — {p.folio} · ${Number(p.total).toFixed(2)}</span>
                <button
                  onClick={() => handleConfirmarSO(p)}
                  className="shrink-0 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-lg"
                >
                  Confirmar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Categorias - scroll horizontal */}
        <div className="flex gap-2 p-3 overflow-x-auto shrink-0 bg-iados-dark/50">
          <button
            onClick={() => { setCategoriaActiva(null); setBusqueda(''); }}
            className={`btn-touch shrink-0 text-sm px-4 py-2 rounded-xl ${
              !categoriaActiva ? 'bg-iados-primary text-white' : 'bg-iados-card text-slate-300'
            }`}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategoriaActiva(cat.id); setBusqueda(''); }}
              className={`btn-touch shrink-0 text-sm px-4 py-2 rounded-xl ${
                categoriaActiva === cat.id
                  ? 'text-white font-bold'
                  : 'bg-iados-card text-slate-300'
              }`}
              style={categoriaActiva === cat.id && cat.color ? { backgroundColor: cat.color } : {}}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProductos.map((prod) => (
              <ProductCard
                key={prod.id}
                prod={prod}
                onClick={() => handleProductClick(prod)}
                onLongPress={() => handleProductLongPress(prod)}
              />
            ))}
          </div>
          {filteredProductos.length === 0 && (
            <div className="text-center text-slate-500 py-12">No se encontraron productos</div>
          )}
        </div>
      </div>

      {/* Panel derecho: Carrito */}
      <div className={`${cartVisible ? 'fixed inset-0 z-40 lg:relative' : 'hidden lg:flex'} lg:w-96 flex flex-col bg-iados-surface border-l border-slate-700`}>
        <button className="lg:hidden absolute top-2 right-2 z-50 p-2 text-slate-400" onClick={() => setCartVisible(false)}>✕</button>
        <CartPanel
          onPay={() => {
            if (pedidoActivo) { handleCobrarConPedidoActivo(); setCartVisible(false); }
            else { setShowPay(true); setCartVisible(false); setPedidoACobrar(null); }
          }}
          onEnviarPedido={handleEnviarPedido}
          onAbrirCuenta={() => { setShowAbrirCuenta(true); setCartVisible(false); }}
          cuentaAbiertaEnabled={cuentaAbiertaEnabled}
          notasPorItem={notasPorItem}
          notasRapidas={notasRapidas}
          cantidadesRapidas={cantidadesRapidas}
          notasPedidoEnabled={notasPedidoEnabled}
          datosEnvioEnabled={datosEnvioEnabled}
          pedidoActivo={pedidoActivo}
          onActualizarCuenta={handleActualizarCuenta}
          onCancelarEdicion={() => { setPedidoActivo(null); clearCart(); }}
          mesaNumeroOculto={mesaNumeroOculto}
          cajaManaged={cajaManaged}
        />
      </div>

      {/* Modal Abrir Cuenta */}
      {showAbrirCuenta && (
        <AbrirCuentaModal
          mesaInicial={mesaActiva}
          tipoServicio={tipoServicio}
          datosEnvioEnabled={datosEnvioEnabled}
          onClose={() => setShowAbrirCuenta(false)}
          onAbrirCuenta={handleAbrirCuentaDesdeModal}
          onCobrar={handleCobrarDesdeCuentaModal}
        />
      )}

      {/* Modal de pago */}
      {showPay && (
        <PayModal
          onClose={(mantenerAbierta) => { setShowPay(false); setPedidoACobrar(null); loadCuentasAbiertas(); if (mantenerAbierta) setShowCuentas(true); }}
          isOnline={isOnline}
          pedido={pedidoACobrar}
          cajaManaged={cajaManaged}
        />
      )}

      {/* Modal: Cantidad rápida (long-press) */}
      {qtyModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setQtyModal(null)}>
          <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{qtyModal.producto.nombre}</h3>
              <button onClick={() => setQtyModal(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-400 mb-3 text-center">¿Cuántas unidades?</p>
            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {cantidadesRapidas.map((n) => (
                <button
                  key={n}
                  onClick={() => setQtyModal((m) => m ? { ...m, qty: n } : m)}
                  className={`py-3 rounded-xl font-bold text-lg transition-colors ${
                    qtyModal.qty === n ? 'bg-iados-primary text-white' : 'bg-iados-card text-slate-200 hover:bg-iados-primary/30'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {/* Manual input */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setQtyModal((m) => m ? { ...m, qty: Math.max(1, m.qty - 1) } : m)}
                className="w-12 h-12 rounded-xl bg-iados-card flex items-center justify-center text-slate-300 hover:bg-iados-primary/30"
              ><Minus size={18} /></button>
              <input
                type="number"
                min="1"
                value={qtyModal.qty}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1) setQtyModal((m) => m ? { ...m, qty: v } : m);
                }}
                onFocus={(e) => e.target.select()}
                className="flex-1 input-touch text-center text-2xl font-bold"
              />
              <button
                onClick={() => setQtyModal((m) => m ? { ...m, qty: m.qty + 1 } : m)}
                className="w-12 h-12 rounded-xl bg-iados-card flex items-center justify-center text-slate-300 hover:bg-iados-primary/30"
              ><Plus size={18} /></button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setQtyModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleQtyConfirm} className="btn-accent flex-1 text-lg">
                Agregar {qtyModal.qty} × ${(Number(qtyModal.producto.precio) * qtyModal.qty).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel: Cuentas Abiertas */}
      {showCuentas && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-iados-secondary" />
                <h2 className="text-xl font-bold">Cuentas Abiertas</h2>
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cuentasAbiertas.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={loadCuentasAbiertas} className="p-2 hover:bg-iados-card rounded-xl text-slate-400" title="Refrescar">
                  <RefreshCw size={16} />
                </button>
                <button onClick={() => setShowCuentas(false)} className="p-2 hover:bg-iados-card rounded-xl">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {cuentasAbiertas.length === 0 ? (
                <div className="text-center text-slate-500 py-16">
                  <CreditCard size={48} className="mx-auto mb-3 opacity-20" />
                  <p>No hay cuentas abiertas</p>
                </div>
              ) : (
                cuentasAbiertas.map((p) => (
                  <div key={p.id} className="bg-iados-card rounded-xl p-4 flex gap-3">
                    {/* Mesa badge */}
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-black shrink-0 text-white ${p.cuenta_abierta ? 'bg-orange-600' : 'bg-iados-primary'}`}>
                      <span className="text-xs font-normal opacity-80">Mesa</span>
                      <span className="text-xl leading-none">{p.mesa}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold">{p.folio}</span>
                        {p.cuenta_abierta && (
                          <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30">
                            Pago parcial
                          </span>
                        )}
                        <span className={`text-xs ${estadoColor[p.estado] || 'text-slate-400'}`}>
                          {p.estado.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {p.detalles?.slice(0, 3).map((d: any) => d.producto_nombre).join(', ')}
                        {p.detalles?.length > 3 && ` +${p.detalles.length - 3} más`}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-lg font-bold text-iados-accent">${Number(p.total).toFixed(2)}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={10} />{tiempoTranscurrido(p.created_at)}
                        </span>
                        {p.tipo_servicio === 'para_llevar' && (
                          <span className="text-xs text-orange-400">🥡 Para llevar</span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleCobrarPedido(p)}
                        className="btn-success text-xs px-3 py-2 flex items-center gap-1"
                      >
                        <CreditCard size={13} /> Cobrar
                      </button>
                      <button
                        onClick={() => handleCargarAlCarrito(p)}
                        className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
                      >
                        <ShoppingBag size={13} /> Cargar
                      </button>
                      <button
                        onClick={() => handleCancelarCuenta(p)}
                        className="text-xs px-3 py-2 flex items-center gap-1 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} /> Cancelar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
