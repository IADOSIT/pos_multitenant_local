import { useState, useEffect, useCallback, useRef } from 'react';
import { usePOSStore } from '../../store/pos.store';
import { useAuthStore } from '../../store/auth.store';
import { useScope } from '../../hooks/useScope';
import { offlineActions } from '../../store/offline.store';
import { productosApi, categoriasApi, cajaApi, tiendasApi, pedidosApi, ticketsApi, selfOrderApi, empresasApi, basculaApi } from '../../api/endpoints';
import { io, Socket } from 'socket.io-client';
import { resolveUploadUrl } from '../../api/client';
import { printComanda, printTicket } from '../../utils/printTicket';
import { decodeEan13PesoVariable } from '../../utils/ean13';
import { formatMonto, MonedaConfig } from '../../utils/moneda';
import { Producto, Categoria } from '../../types';
import toast from 'react-hot-toast';
import CartPanel from '../../components/pos/CartPanel';
import PayModal from '../../components/pos/PayModal';
import AbrirCuentaModal from '../../components/pos/AbrirCuentaModal';
import DevolucionBuscarModal from '../../components/pos/DevolucionBuscarModal';
import DevolucionModal from '../../components/pos/DevolucionModal';
import ApartadosPanel from '../../components/pos/ApartadosPanel';
import { Search, ShoppingBag, Wifi, WifiOff, CreditCard, X, Clock, RefreshCw, Trash2, Minus, Plus, FileText, RotateCcw, PackageSearch } from 'lucide-react';

// ── Long-press product card ──────────────────────────────────────────────────
function ProductCard({ prod, onClick, onLongPress, showStockBadge, mostrarPrecios, moneda }: { prod: Producto; onClick: () => void; onLongPress: () => void; showStockBadge?: boolean; mostrarPrecios?: boolean; moneda?: MonedaConfig }) {
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

  const stockActual = Number((prod as any).stock_actual ?? 0);
  const stockMinimo = Number((prod as any).stock_minimo ?? 0);
  const controlaStock = (prod as any).controla_stock;
  const stockBajoCritico = showStockBadge && controlaStock && stockMinimo > 0 && stockActual <= stockMinimo;
  const stockBajoPrevio = showStockBadge && controlaStock && stockMinimo > 0 && stockActual > stockMinimo && stockActual <= stockMinimo * 2;

  return (
    <button
      onMouseDown={start} onMouseUp={cancel} onMouseLeave={cancel}
      onTouchStart={start} onTouchEnd={cancel} onTouchCancel={cancel}
      onClick={handleClick}
      className="card hover:ring-2 hover:ring-iados-secondary active:scale-95 transition-all flex flex-col items-center text-center p-3 min-h-[120px] select-none relative"
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
      {mostrarPrecios !== false && (
        <span className="text-iados-accent font-bold mt-1">{formatMonto(Number(prod.precio), moneda)}</span>
      )}
      {stockBajoCritico && (
        <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          ⚠ {stockActual}
        </span>
      )}
      {stockBajoPrevio && (
        <span className="absolute top-1.5 right-1.5 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          {stockActual}
        </span>
      )}
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
  const [clienteVentaEnabled, setClienteVentaEnabled] = useState(false);
  const [cantidadesRapidas, setCantidadesRapidas] = useState<number[]>([10, 25, 50, 100]);
  const [qtyModal, setQtyModal] = useState<{ producto: any; qty: number } | null>(null);
  const [mesaNumeroOculto, setMesaNumeroOculto] = useState(false);
  const [cajaManaged, setCajaManaged] = useState(false); // true cuando caja_auto_enabled o caja_ocultar_ui
  const [enSitioVisible, setEnSitioVisible] = useState(true);
  const [paraLlevarVisible, setParaLlevarVisible] = useState(true);
  const [stockBadgeEnabled, setStockBadgeEnabled] = useState(false);
  const [precuentaEnabled, setPrecuentaEnabled] = useState(false);
  const [showDevBuscar, setShowDevBuscar] = useState(false);
  const [devVentaId, setDevVentaId] = useState<number | null>(null);
  const [showApartados, setShowApartados] = useState(false);
  const [devolucionesEnabled, setDevolucionesEnabled] = useState(false);
  const [devolucionesRol, setDevolucionesRol] = useState('admin');
  const [mostrarPrecios, setMostrarPrecios] = useState(true);
  const [precioManual, setPrecioManual] = useState(false);
  const [moneda, setMoneda] = useState<MonedaConfig | undefined>(undefined);
  const [inventarioCompartido, setInventarioCompartido] = useState(false);
  const [escanerHabilitado, setEscanerHabilitado] = useState(false);
  const busquedaRef = useRef<HTMLInputElement | null>(null);
  const [basculaEnPos, setBasculaEnPos] = useState(false);
  const [basculaConectada, setBasculaConectada] = useState(false);
  const [pesoModal, setPesoModal] = useState<{ producto: Producto } | null>(null);
  const [pesoEnVivo, setPesoEnVivo] = useState(0);
  const [pesoManualInput, setPesoManualInput] = useState('');
  const basculaSockRef = useRef<Socket | null>(null);

  const { user } = useAuthStore();
  const { tiendaId, empresaId } = useScope();
  const { categoriaActiva, setCategoriaActiva, addToCart, cart, getItemCount, getSubtotal, getImpuestos, getTotal, cajaActiva, setCajaActiva, modoServicio, setModoServicio, setTipoCobro, setIvaConfig, mesaActiva, setMesaActiva, tipoServicio, clearCart, notaPedido, clienteNombre, clienteTelefono, clienteDireccion, updateItemPrice, updateItemNotes } = usePOSStore();

  // Conexion al socket de bascula (peso en vivo) — solo si esta habilitada para el POS.
  useEffect(() => {
    if (!basculaEnPos || !tiendaId) return;
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://posapi.iados.online';
    const sock = io(`${base}/bascula`, { transports: ['websocket'] });
    basculaSockRef.current = sock;
    sock.on('connect', () => {
      setBasculaConectada(true);
      sock.emit('kiosk-join', { tienda_id: tiendaId });
    });
    sock.on('disconnect', () => setBasculaConectada(false));
    sock.on('weight-update', (data: { peso_kg: number }) => setPesoEnVivo(data.peso_kg || 0));
    return () => { sock.disconnect(); };
  }, [basculaEnPos, tiendaId]);

  // Etiqueta de bascula de autoservicio: codigo EAN-13 de peso variable (prefijo "2").
  // El lector de barras "teclea" el codigo completo casi instantaneo — se detecta apenas
  // el campo de busqueda llega a 13 digitos, sin esperar Enter.
  useEffect(() => {
    if (!/^\d{13}$/.test(busqueda)) return;
    const decoded = decodeEan13PesoVariable(busqueda);
    if (!decoded) return; // 13 digitos pero no es un codigo de peso variable valido — se deja como busqueda normal
    const producto = productos.find((p) => p.id === decoded.plu);
    if (!producto) {
      toast.error('Producto de la etiqueta no encontrado');
      setBusqueda('');
      return;
    }
    addToCart(producto, 1);
    // El item recien agregado queda al final del carrito (mismo producto sin notas/modificadores previos)
    setTimeout(() => {
      const cartActual = usePOSStore.getState().cart;
      const item = [...cartActual].reverse().find((i) => i.producto_id === producto.id && !i.notas);
      if (item) {
        updateItemPrice(item.id, decoded.precio);
        updateItemNotes(item.id, 'Precio de báscula (etiqueta)');
      }
    }, 0);
    toast.success(`${producto.nombre} — $${decoded.precio.toFixed(2)}`, { duration: 1200 });
    setBusqueda('');
  }, [busqueda, productos]);

  // Pistola lectora de codigo de barras (opcional, activable en Configuracion → POS): la
  // pistola "teclea" el codigo en el mismo buscador y termina con Enter/muy rapido. Si
  // coincide exactamente con el codigo_barras de un producto, se agrega directo al carrito
  // sin necesidad de tocar la pantalla.
  useEffect(() => {
    if (!escanerHabilitado || !busqueda || busqueda.length < 4) return;
    const producto = productos.find((p) => (p as any).codigo_barras && (p as any).codigo_barras === busqueda);
    if (!producto) return;
    handleProductClick(producto);
    setBusqueda('');
    busquedaRef.current?.focus();
  }, [busqueda, productos, escanerHabilitado]);

  // La pistola termina el escaneo con Enter. Si para entonces el codigo no hizo match arriba
  // (producto inexistente), se avisa en pantalla, se limpia el buscador y se regresa el foco
  // para que la siguiente lectura no se pierda.
  const handleBusquedaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !escanerHabilitado || !busqueda.trim()) return;
    const producto = productos.find((p) => (p as any).codigo_barras && (p as any).codigo_barras === busqueda);
    if (producto) return; // ya lo tomo el effect de arriba antes de llegar aqui
    toast.error(`Producto no encontrado: ${busqueda}`, { duration: 3000 });
    setBusqueda('');
    busquedaRef.current?.focus();
  };

  // Al activar el escaner, enfoca el buscador para que la pistola pueda "teclear" de inmediato.
  useEffect(() => {
    if (escanerHabilitado) busquedaRef.current?.focus();
  }, [escanerHabilitado]);

  // Con el lector activo, el cursor SIEMPRE debe vivir en el buscador: si el usuario
  // (o la pistola lectora) empieza a "teclear" sin el foco ahi, redirigimos el texto
  // al buscador en vez de dejar que se pierda en el body u otro elemento sin input.
  // NO se interfiere si ya esta escribiendo en OTRO campo de texto (modal abierto, etc).
  useEffect(() => {
    if (!escanerHabilitado) return;
    const esCampoTexto = (el: Element | null) => {
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable;
    };
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1 || e.key === ' ') return;
      const activo = document.activeElement;
      if (activo === busquedaRef.current) return;
      if (esCampoTexto(activo)) return;
      e.preventDefault();
      busquedaRef.current?.focus();
      setBusqueda((prev) => prev + e.key);
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [escanerHabilitado]);

  // Tras cerrar cualquier modal/panel (pago, cantidad, pesaje, devolucion, cuentas...) con
  // el lector activo, regresa el foco al buscador para que la siguiente lectura no se pierda.
  useEffect(() => {
    if (!escanerHabilitado) return;
    if (showPay || qtyModal || pesoModal || showDevBuscar || devVentaId || showCuentas || showAbrirCuenta || showApartados) return;
    const t = setTimeout(() => busquedaRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [escanerHabilitado, showPay, qtyModal, pesoModal, showDevBuscar, devVentaId, showCuentas, showAbrirCuenta, showApartados]);

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
    const onInventarioChanged = () => loadData();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('inventario:changed', onInventarioChanged);
    // Refresco automático cada 30s
    const interval = setInterval(loadCuentasAbiertas, 30000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('inventario:changed', onInventarioChanged);
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
    if (!tiendaId) return;
    try {
      const { data } = await tiendasApi.get(tiendaId);
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
        setClienteVentaEnabled(cp.cliente_venta_enabled || false);
        setMesaNumeroOculto(cp.mesa_numero_oculto || false);
        setEnSitioVisible(cp.en_sitio_visible !== false);
        setParaLlevarVisible(cp.para_llevar_visible !== false);
        setStockBadgeEnabled(cp.pos_stock_badge_enabled || false);
        setEscanerHabilitado(cp.escaner_habilitado || false);
        setPrecuentaEnabled(cp.precuenta_enabled || false);
        setDevolucionesEnabled(cp.devoluciones_enabled || false);
        setDevolucionesRol(cp.devoluciones_rol || 'admin');
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

    // Bascula: si esta habilitada para usarse en el POS, conectamos el socket de peso
    try {
      const { data } = await basculaApi.getConfig(tiendaId);
      setBasculaEnPos(data?.usar_en_pos || false);
    } catch { setBasculaEnPos(false); }

    // Cargar config_especial de empresa
    if (empresaId) {
      try {
        const empR = await empresasApi.get(empresaId);
        const cfgEsp = empR.data?.config_especial || {};
        setMostrarPrecios(cfgEsp.mostrar_precios !== false);
        setPrecioManual(cfgEsp.precio_manual === true);
        setMoneda(cfgEsp.moneda?.activa ? cfgEsp.moneda : undefined);
        setInventarioCompartido(cfgEsp.inventario_compartido === true);
      } catch {}
    }
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
      return p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || ((p as any).codigo_barras || '').toLowerCase().includes(q);
    }
    if (categoriaActiva) return p.categoria_id === categoriaActiva;
    return true;
  });

  const handleProductClick = (producto: Producto) => {
    if (basculaEnPos && (producto as any).unidad === 'kg') {
      setPesoEnVivo(0);
      setPesoManualInput('');
      setPesoModal({ producto });
      return;
    }
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

  // Confirma el pesaje inline en el POS: agrega el producto al carrito con el precio
  // calculado (peso x precio/kg) — el cobro sigue el flujo normal de POS (PayModal),
  // mezclado con el resto del carrito, junto a los demas productos de la venta.
  const confirmarPesajePOS = () => {
    if (!pesoModal) return;
    const peso = pesoEnVivo > 0 ? pesoEnVivo : Number(pesoManualInput) || 0;
    if (peso <= 0) return;
    const producto = pesoModal.producto;
    const precioCalculado = Math.round(peso * Number(producto.precio) * 100) / 100;
    addToCart(producto, 1);
    setTimeout(() => {
      const cartActual = usePOSStore.getState().cart;
      const item = [...cartActual].reverse().find((i) => i.producto_id === producto.id && !i.notas);
      if (item) {
        updateItemPrice(item.id, precioCalculado);
        updateItemNotes(item.id, `Peso: ${peso.toFixed(3)}kg`);
      }
    }, 0);
    toast.success(`${producto.nombre} — ${peso.toFixed(3)}kg = $${precioCalculado.toFixed(2)}`, { duration: 1200 });
    setPesoModal(null);
  };

  const handleEnviarPedido = async () => {
    // Cuando mesa_numero_oculto=true no se requiere mesaActiva — se envía como 0 (sin número)
    if (cart.length === 0) return;
    if (!mesaNumeroOculto && !mesaActiva) return;
    try {
      const data = {
        mesa: mesaActiva || 0,
        tipo_servicio: tipoServicio,
        notas: notaPedido || undefined,
        cliente_nombre: clienteNombre || undefined,
        cliente_telefono: clienteTelefono || undefined,
        cliente_direccion: clienteDireccion || undefined,
        items: cart.map((i) => ({
          producto_id: i.producto_id,
          nombre: i.nombre,
          sku: i.sku,
          precio: i.precioManual ?? i.precio,
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
          precio: i.precioManual ?? i.precio,
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
    precio: i.precioManual ?? i.precio,
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

  const handlePreCuenta = async (pedidoOverride?: any) => {
    const pedido = pedidoOverride ?? pedidoActivo;
    if (cart.length === 0 && !pedido) return;
    try {
      const items = pedido
        ? pedido.detalles?.map((d: any) => ({
            nombre: d.producto_nombre,
            cantidad: Number(d.cantidad),
            precio: Number(d.precio_unitario),
            descuento: Number(d.descuento || 0),
            notas: d.notas,
          }))
        : cart.map((i) => ({
            nombre: i.nombre,
            cantidad: i.cantidad,
            precio: i.precioManual ?? i.precio,
            descuento: i.descuento || 0,
            notas: i.notas,
          }));
      const subtotal = pedido ? Number(pedido.subtotal) : getSubtotal();
      const impuestos = pedido ? Number(pedido.impuestos) : getImpuestos();
      const totalPc = pedido ? Number(pedido.total) : getTotal();
      const { data: ticket } = await ticketsApi.precuenta({
        items,
        subtotal,
        impuestos,
        total: totalPc,
        mesa: pedido?.mesa || mesaActiva,
        cliente_nombre: pedido?.cliente_nombre || clienteNombre || undefined,
        notas: pedido?.notas || notaPedido || undefined,
      });
      printTicket(ticket.raw, ticket.ancho_papel, ticket.fuente_familia, ticket.fuente_tamano, null, ticket.logo_posicion, 1, ticket.modo_impresion);
      toast.success('Pre-cuenta impresa');
    } catch (e: any) {
      toast.error('Error al generar pre-cuenta');
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
        <div className="h-16 shrink-0 flex items-center gap-2 px-3 bg-iados-surface border-b border-slate-700">
          {user?.empresa_logo && (
            <img src={resolveUploadUrl(user.empresa_logo)} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          )}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              ref={busquedaRef}
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setCategoriaActiva(null); }}
              onKeyDown={handleBusquedaKeyDown}
              placeholder={escanerHabilitado ? 'Buscar producto o escanear código...' : 'Buscar producto o SKU...'}
              className="input-touch pl-10"
            />
          </div>

          {/* Botón Devolución */}
          {devolucionesEnabled && ['admin', 'superadmin', 'manager', ...(devolucionesRol === 'cajero' ? ['cajero'] : [])].includes(user?.rol || '') && (
            <button
              onClick={() => setShowDevBuscar(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600/20 border border-amber-600/40 hover:bg-amber-600/30 text-amber-400 text-sm font-medium transition-colors shrink-0"
              title="Procesar devolución"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Devolver</span>
            </button>
          )}

          {/* Botón Apartados (inventario compartido entre tiendas) */}
          {inventarioCompartido && (
            <button
              onClick={() => setShowApartados(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-600/40 hover:bg-blue-600/30 text-blue-400 text-sm font-medium transition-colors shrink-0"
              title="Apartados de inventario"
            >
              <PackageSearch size={16} />
              <span className="hidden sm:inline">Apartados</span>
            </button>
          )}

          {/* Botón Cuentas Abiertas */}
          {cuentaAbiertaEnabled && <button
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
          </button>}

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filteredProductos.map((prod) => (
              <ProductCard
                key={prod.id}
                prod={prod}
                onClick={() => handleProductClick(prod)}
                onLongPress={() => handleProductLongPress(prod)}
                showStockBadge={stockBadgeEnabled}
                mostrarPrecios={mostrarPrecios}
                moneda={moneda}
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
          onPreCuenta={handlePreCuenta}
          precuentaEnabled={precuentaEnabled}
          cuentaAbiertaEnabled={cuentaAbiertaEnabled}
          notasPorItem={notasPorItem}
          notasRapidas={notasRapidas}
          cantidadesRapidas={cantidadesRapidas}
          notasPedidoEnabled={notasPedidoEnabled}
          datosEnvioEnabled={datosEnvioEnabled}
          clienteVentaEnabled={clienteVentaEnabled}
          pedidoActivo={pedidoActivo}
          onActualizarCuenta={handleActualizarCuenta}
          onCancelarEdicion={() => { setPedidoActivo(null); clearCart(); }}
          mesaNumeroOculto={mesaNumeroOculto}
          cajaManaged={cajaManaged}
          enSitioVisible={enSitioVisible}
          paraLlevarVisible={paraLlevarVisible}
          mostrarPrecios={mostrarPrecios}
          precioManual={precioManual}
          moneda={moneda}
          inventarioCompartido={inventarioCompartido}
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

      {/* Modal de pesaje (producto por kg, bascula integrada al POS) */}
      {pesoModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPesoModal(null)}>
          <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg">{pesoModal.producto.nombre}</h3>
              <button onClick={() => setPesoModal(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex items-center gap-1.5 mb-4">
              <div className={`w-2 h-2 rounded-full ${basculaConectada ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-xs text-slate-500">{basculaConectada ? 'Báscula conectada' : 'Sin conexión — puedes capturar el peso manual'}</span>
            </div>

            <div className="bg-iados-card rounded-2xl px-6 py-6 flex flex-col items-center gap-1 mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Peso</p>
              <p className="text-4xl font-black tabular-nums">{pesoEnVivo.toFixed(3)} <span className="text-lg text-slate-500">kg</span></p>
            </div>

            {!basculaConectada && (
              <input
                type="number"
                inputMode="decimal"
                value={pesoManualInput}
                onChange={(e) => setPesoManualInput(e.target.value)}
                placeholder="Peso manual (kg)"
                className="input-touch text-center text-xl font-bold mb-4"
              />
            )}

            <p className="text-center text-sm text-slate-400 mb-4">
              Total: <span className="text-white font-bold text-lg">
                ${(((pesoEnVivo > 0 ? pesoEnVivo : Number(pesoManualInput) || 0)) * Number(pesoModal.producto.precio)).toFixed(2)}
              </span>
            </p>

            <div className="flex gap-3">
              <button onClick={() => setPesoModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={confirmarPesajePOS}
                disabled={pesoEnVivo <= 0 && !(Number(pesoManualInput) > 0)}
                className="btn-accent flex-1 text-lg disabled:opacity-40"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales devolución */}
      {showDevBuscar && (
        <DevolucionBuscarModal
          onClose={() => setShowDevBuscar(false)}
          onSelectVenta={(id) => { setShowDevBuscar(false); setDevVentaId(id); }}
        />
      )}
      {devVentaId && (
        <DevolucionModal
          ventaId={devVentaId}
          onClose={() => setDevVentaId(null)}
          onSuccess={() => { setDevVentaId(null); loadCaja(); }}
        />
      )}

      {/* Panel: Apartados */}
      {showApartados && <ApartadosPanel onClose={() => setShowApartados(false)} />}

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
                      {precuentaEnabled && (
                        <button
                          onClick={() => handlePreCuenta(p)}
                          className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
                        >
                          <FileText size={13} /> Pre-cuenta
                        </button>
                      )}
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
