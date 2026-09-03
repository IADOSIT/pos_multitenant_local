import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { menuDigitalApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import { ShoppingCart, Search, X, Plus, Minus, ChevronUp, Send, MapPin, Phone, Clock, Loader2, UtensilsCrossed, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Tienda {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  logo_url: string;
  empresa_nombre: string;
}
interface Categoria { id: number; nombre: string; color: string | null; icono: string | null; orden: number; }
interface Producto   { id: number; nombre: string; descripcion: string; precio: number; categoria_id: number; imagen_url: string | null; disponible: boolean; orden: number; }
interface CartItem   { producto: Producto; cantidad: number; notas: string; }

// ─── Themes ────────────────────────────────────────────────────────────────
const THEMES = {
  oscuro: {
    page:           '#0d0d0d',
    text:           '#f8fafc',
    textSub:        '#94a3b8',
    headerBg:       'linear-gradient(160deg,#1a0a00 0%,#0d0d0d 100%)',
    glow:           'radial-gradient(ellipse at 50% 0%,#f59e0b 0%,transparent 70%)',
    accent:         '#f59e0b',
    accentFg:       '#fbbf24',
    accentBg:       'rgba(245,158,11,0.15)',
    accentBorder:   'rgba(245,158,11,0.3)',
    cardBg:         'rgba(255,255,255,0.04)',
    cardBorder:     'rgba(255,255,255,0.06)',
    cardBorderOn:   'rgba(245,158,11,0.5)',
    cardGlowOn:     '0 0 16px rgba(245,158,11,0.12)',
    tabBg:          'rgba(13,13,13,0.95)',
    tabBorderB:     '1px solid rgba(255,255,255,0.06)',
    tabInBg:        'rgba(255,255,255,0.06)',
    tabInColor:     '#94a3b8',
    tabInBorder:    '1px solid rgba(255,255,255,0.08)',
    searchBg:       'rgba(255,255,255,0.06)',
    searchBorder:   '1px solid rgba(255,255,255,0.1)',
    searchColor:    '#f8fafc',
    divider:        'rgba(255,255,255,0.08)',
    priceBg:        'rgba(0,0,0,0.75)',
    priceColor:     '#4ade80',
    placeholder:    'rgba(255,255,255,0.03)',
    cartBtn:        'linear-gradient(135deg,#f59e0b,#d97706)',
    cartGlow:       '0 4px 30px rgba(245,158,11,0.5)',
    cartColor:      '#000',
    drawerBg:       '#141414',
    drawerBorderS:  '1px solid rgba(255,255,255,0.08)',
    drawerDivider:  '1px solid #1e293b',
    drawerInputBg:  'rgba(255,255,255,0.06)',
    drawerInputBd:  '1px solid rgba(255,255,255,0.1)',
    drawerInputClr: '#f8fafc',
    drawerItemBg:   'rgba(255,255,255,0.02)',
    qtyRemoveBg:    '#1e293b',
    qtyRemoveClr:   '#cbd5e1',
    qtyAddBg:       'rgba(245,158,11,0.2)',
    qtyAddBd:       '1px solid rgba(245,158,11,0.3)',
    badgeBg:        'rgba(245,158,11,0.12)',
    badgeBd:        '1px solid rgba(245,158,11,0.3)',
    badgeClr:       '#fbbf24',
    footerClr:      '#374151',
    footerBrand:    '#4b5563',
  },
  claro: {
    page:           '#f4f4f5',
    text:           '#111827',
    textSub:        '#6b7280',
    headerBg:       'linear-gradient(160deg,#fff8f0 0%,#f4f4f5 100%)',
    glow:           'radial-gradient(ellipse at 50% 0%,#fdba74 0%,transparent 55%)',
    accent:         '#ea580c',
    accentFg:       '#c2410c',
    accentBg:       'rgba(234,88,12,0.08)',
    accentBorder:   'rgba(234,88,12,0.25)',
    cardBg:         '#ffffff',
    cardBorder:     '#e5e7eb',
    cardBorderOn:   'rgba(234,88,12,0.4)',
    cardGlowOn:     '0 4px 14px rgba(234,88,12,0.08)',
    tabBg:          'rgba(244,244,245,0.97)',
    tabBorderB:     '1px solid #e5e7eb',
    tabInBg:        '#f3f4f6',
    tabInColor:     '#6b7280',
    tabInBorder:    '1px solid #e5e7eb',
    searchBg:       '#ffffff',
    searchBorder:   '1px solid #d1d5db',
    searchColor:    '#111827',
    divider:        '#e5e7eb',
    priceBg:        'rgba(255,255,255,0.92)',
    priceColor:     '#16a34a',
    placeholder:    '#f3f4f6',
    cartBtn:        'linear-gradient(135deg,#ea580c,#c2410c)',
    cartGlow:       '0 4px 30px rgba(234,88,12,0.4)',
    cartColor:      '#fff',
    drawerBg:       '#ffffff',
    drawerBorderS:  '1px solid #e5e7eb',
    drawerDivider:  '1px solid #f3f4f6',
    drawerInputBg:  '#f9fafb',
    drawerInputBd:  '1px solid #d1d5db',
    drawerInputClr: '#111827',
    drawerItemBg:   '#fafafa',
    qtyRemoveBg:    '#f3f4f6',
    qtyRemoveClr:   '#374151',
    qtyAddBg:       'rgba(234,88,12,0.08)',
    qtyAddBd:       '1px solid rgba(234,88,12,0.2)',
    badgeBg:        'rgba(234,88,12,0.08)',
    badgeBd:        '1px solid rgba(234,88,12,0.2)',
    badgeClr:       '#ea580c',
    footerClr:      '#d1d5db',
    footerBrand:    '#9ca3af',
  },
  mar: {
    page:           '#061628',
    text:           '#e0f2fe',
    textSub:        '#7dd3fc',
    headerBg:       'linear-gradient(160deg,#082040 0%,#061628 100%)',
    glow:           'radial-gradient(ellipse at 50% 0%,#06b6d4 0%,transparent 70%)',
    accent:         '#06b6d4',
    accentFg:       '#22d3ee',
    accentBg:       'rgba(6,182,212,0.12)',
    accentBorder:   'rgba(6,182,212,0.3)',
    cardBg:         'rgba(6,182,212,0.04)',
    cardBorder:     'rgba(6,182,212,0.1)',
    cardBorderOn:   'rgba(6,182,212,0.5)',
    cardGlowOn:     '0 0 16px rgba(6,182,212,0.18)',
    tabBg:          'rgba(6,22,40,0.96)',
    tabBorderB:     '1px solid rgba(6,182,212,0.1)',
    tabInBg:        'rgba(6,182,212,0.06)',
    tabInColor:     '#7dd3fc',
    tabInBorder:    '1px solid rgba(6,182,212,0.12)',
    searchBg:       'rgba(6,182,212,0.06)',
    searchBorder:   '1px solid rgba(6,182,212,0.15)',
    searchColor:    '#e0f2fe',
    divider:        'rgba(6,182,212,0.12)',
    priceBg:        'rgba(6,22,40,0.85)',
    priceColor:     '#34d399',
    placeholder:    'rgba(6,182,212,0.04)',
    cartBtn:        'linear-gradient(135deg,#0891b2,#0e7490)',
    cartGlow:       '0 4px 30px rgba(6,182,212,0.5)',
    cartColor:      '#fff',
    drawerBg:       '#0a1e38',
    drawerBorderS:  '1px solid rgba(6,182,212,0.12)',
    drawerDivider:  '1px solid rgba(6,182,212,0.08)',
    drawerInputBg:  'rgba(6,182,212,0.06)',
    drawerInputBd:  '1px solid rgba(6,182,212,0.15)',
    drawerInputClr: '#e0f2fe',
    drawerItemBg:   'rgba(6,182,212,0.03)',
    qtyRemoveBg:    'rgba(6,182,212,0.08)',
    qtyRemoveClr:   '#7dd3fc',
    qtyAddBg:       'rgba(6,182,212,0.15)',
    qtyAddBd:       '1px solid rgba(6,182,212,0.3)',
    badgeBg:        'rgba(6,182,212,0.12)',
    badgeBd:        '1px solid rgba(6,182,212,0.3)',
    badgeClr:       '#22d3ee',
    footerClr:      '#0e4a6a',
    footerBrand:    '#0e6a8a',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

export default function MenuDigitalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [tienda, setTienda]                 = useState<Tienda | null>(null);
  const [categorias, setCategorias]         = useState<Categoria[]>([]);
  const [productos, setProductos]           = useState<Producto[]>([]);
  const [modoMenu, setModoMenu]             = useState<'consulta' | 'pedidos'>('consulta');
  const [plantilla, setPlantilla]           = useState<ThemeKey>('oscuro');
  const [search, setSearch]                 = useState('');
  const [activeCat, setActiveCat]           = useState<number | null>(null);
  const [cart, setCart]                     = useState<CartItem[]>([]);
  const [showCart, setShowCart]             = useState(false);
  const [clienteNombre, setClienteNombre]   = useState('');
  const [mesaNumero, setMesaNumero]         = useState('');
  const [sendingOrder, setSendingOrder]     = useState(false);
  const [orderSent, setOrderSent]           = useState<string | null>(null);
  const [orderToken, setOrderToken]         = useState<string | null>(null);
  const [orderStatus, setOrderStatus]       = useState<'pending' | 'received' | 'completed' | 'cancelled'>('pending');
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  // Pedido por cantidades mayores (mismo gesto que el POS: dejar presionado el producto)
  const [cantidadesEnabled, setCantidadesEnabled] = useState(false);
  const [cantidadesRapidas, setCantidadesRapidas] = useState<number[]>([10, 25, 50, 100]);
  const [qtyModal, setQtyModal]             = useState<{ producto: Producto; qty: number } | null>(null);
  const catRefs    = useRef<Map<number, HTMLDivElement>>(new Map());
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolved theme
  const th = THEMES[plantilla] ?? THEMES.oscuro;

  useEffect(() => { loadMenu(); }, [slug]);
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (pressRef.current) clearTimeout(pressRef.current);
  }, []);

  const startPolling = (token: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await menuDigitalApi.getOrderStatus(token);
        setOrderStatus(data.status);
        if (data.status !== 'pending') {
          clearInterval(pollRef.current!);
          pollRef.current = null;
        }
      } catch {
        // error de red temporal - seguir intentando en el siguiente tick
      }
    }, 3000);
  };

  const loadMenu = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const { data } = await menuDigitalApi.getPublicMenu(slug);
      setTienda(data.tienda);
      setCategorias(data.categorias || []);
      setProductos(data.productos || []);
      setModoMenu(data.modo_menu as any);
      setCantidadesEnabled(!!data.cantidades_enabled);
      const cr = String(data.cantidades_rapidas || '10,25,50,100')
        .split(',')
        .map((n: string) => parseInt(n.trim(), 10))
        .filter((n: number) => !isNaN(n) && n > 0)
        .slice(0, 8);
      setCantidadesRapidas(cr.length ? cr : [10, 25, 50, 100]);
      if (data.plantilla && (data.plantilla in THEMES)) {
        setPlantilla(data.plantilla as ThemeKey);
      }
      if (data.categorias?.length > 0) setActiveCat(data.categorias[0].id);
    } catch {
      setError('Menu no disponible. Verifica el enlace o escanea el codigo QR nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProductos = useMemo(() => {
    return productos.filter(p => {
      const matchCat = activeCat === null || p.categoria_id === activeCat;
      const matchSearch = !search ||
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productos, activeCat, search]);

  const productosPorCategoria = useMemo(() => {
    if (search) return [{ cat: null, prods: filteredProductos }];
    return categorias
      .map(cat => ({ cat, prods: productos.filter(p => p.categoria_id === cat.id && p.disponible) }))
      .filter(g => g.prods.length > 0);
  }, [categorias, productos, search, filteredProductos]);

  const cartTotal = cart.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  const cartCount = cart.reduce((s, i) => s + i.cantidad, 0);

  const addToCart = (prod: Producto, cantidad = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.producto.id === prod.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cantidad }; return next; }
      return [...prev, { producto: prod, cantidad, notas: '' }];
    });
  };

  // ── Dejar presionado un producto → selector de cantidad ──────────────────
  // Mismo gesto y mismo tiempo (500 ms) que el long-press del POS, para que el
  // personal explique igual las dos pantallas. Solo aplica si el admin lo activo.
  const pedirPorCantidad = modoMenu === 'pedidos' && cantidadesEnabled;
  const cancelPress = () => { if (pressRef.current) { clearTimeout(pressRef.current); pressRef.current = null; } };
  const startPress = (prod: Producto) => {
    if (!pedirPorCantidad) return;
    cancelPress();
    pressRef.current = setTimeout(() => setQtyModal({ producto: prod, qty: cantidadesRapidas[0] ?? 10 }), 500);
  };
  const pressProps = (prod: Producto) => pedirPorCantidad ? {
    onTouchStart: () => startPress(prod), onTouchEnd: cancelPress, onTouchCancel: cancelPress, onTouchMove: cancelPress,
    onMouseDown: () => startPress(prod), onMouseUp: cancelPress, onMouseLeave: cancelPress,
  } : {};
  // Los botones dentro de la tarjeta no deben disparar el gesto: quien aprieta "+"
  // quiere sumar de uno en uno, no abrir el selector.
  const stopPress = { onTouchStart: (e: any) => e.stopPropagation(), onMouseDown: (e: any) => e.stopPropagation() };

  const confirmQtyModal = () => {
    if (!qtyModal || qtyModal.qty < 1) return;
    addToCart(qtyModal.producto, qtyModal.qty);
    setQtyModal(null);
  };

  const removeFromCart = (prodId: number) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.producto.id === prodId);
      if (idx < 0) return prev;
      const next = [...prev];
      if (next[idx].cantidad > 1) { next[idx] = { ...next[idx], cantidad: next[idx].cantidad - 1 }; }
      else { next.splice(idx, 1); }
      return next;
    });
  };

  const getCartQty = (prodId: number) => cart.find(i => i.producto.id === prodId)?.cantidad || 0;

  const scrollToCat = (catId: number) => {
    setActiveCat(catId);
    setSearch('');
    const el = catRefs.current.get(catId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sendOrder = async () => {
    if (cart.length === 0) return;
    setSendingOrder(true);
    try {
      const items = cart.map(i => ({
        producto_id: i.producto.id, nombre: i.producto.nombre,
        precio: i.producto.precio, cantidad: i.cantidad,
        subtotal: i.producto.precio * i.cantidad, notas: i.notas,
      }));
      const { data } = await menuDigitalApi.createOrder(slug!, {
        cliente_nombre: clienteNombre || null,
        mesa_numero: mesaNumero || null,
        items, total: cartTotal,
      });
      setOrderSent(data.numero_orden);
      setOrderToken(data.token);
      setOrderStatus('pending');
      setCart([]);
      setShowCart(false);
      startPolling(data.token);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al enviar pedido');
    } finally {
      setSendingOrder(false);
    }
  };

  const fmt = (n: number) => `$${Number(n).toFixed(2)}`;

  const catDividerColor = (color: string | null) => color ? `${color}40` : th.divider;
  const catTextColor    = (color: string | null) => color || th.accent;

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d0d' }}>
      <div className="text-center space-y-4">
        <Loader2 size={40} className="animate-spin text-amber-400 mx-auto" />
        <p className="text-amber-200 text-sm">Cargando menu...</p>
      </div>
    </div>
  );

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error || !tienda) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0d0d0d' }}>
      <div className="text-center space-y-4 max-w-sm">
        <UtensilsCrossed size={56} className="mx-auto text-amber-400/40" />
        <h2 className="text-xl font-bold text-white">Menu no disponible</h2>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    </div>
  );

  // ─── Order Confirmed / Estatus del pedido ───────────────────────────────────
  if (orderSent) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: th.page }}>
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
          style={{ background: th.accentBg, border: `2px solid ${orderStatus === 'cancelled' ? '#ef4444' : th.accent}` }}>
          {orderStatus === 'cancelled'
            ? <XCircle size={40} color="#ef4444" />
            : orderStatus === 'pending'
              ? <Clock size={40} className="animate-pulse" style={{ color: th.accent }} />
              : <CheckCircle size={40} style={{ color: th.accent }} />}
        </div>
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: th.accentFg }}>
            {orderStatus === 'pending' ? 'PEDIDO ENVIADO' : orderStatus === 'cancelled' ? 'PEDIDO NO DISPONIBLE' : 'PEDIDO CONFIRMADO'}
          </p>
          <h2 className="text-3xl font-black" style={{ color: th.text }}>#{orderSent}</h2>
        </div>
        <p style={{ color: th.textSub }}>
          {orderStatus === 'pending'
            ? 'Tu pedido fue enviado al restaurante. No cierres esta pantalla — en breve recibirás la confirmación.'
            : orderStatus === 'cancelled'
              ? 'El restaurante no pudo procesar tu pedido. Por favor acércate a solicitar atención.'
              : '¡Tu pedido fue confirmado y ya está en preparación! 🍳'}
        </p>
        <button
          onClick={() => { setOrderSent(null); setOrderToken(null); setOrderStatus('pending'); }}
          className="w-full py-3 rounded-2xl font-bold"
          style={{ background: th.cartBtn, color: th.cartColor }}
        >
          Ver menu nuevamente
        </button>
      </div>
    </div>
  );

  // ─── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: th.page, color: th.text }}>

      {/* HEADER */}
      <div className="relative overflow-hidden" style={{ background: th.headerBg }}>
        <div className="absolute inset-0 opacity-20" style={{ background: th.glow }} />
        <div className="relative z-10 px-5 pt-10 pb-6 text-center">
          {tienda.logo_url ? (
            <img
              src={tienda.logo_url}
              alt={tienda.nombre}
              className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-2xl"
              style={{ outline: `2px solid ${th.accentBorder}`, outlineOffset: '2px' }}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: th.accentBg, border: `1px solid ${th.accentBorder}` }}>
              <UtensilsCrossed size={32} style={{ color: th.accent }} />
            </div>
          )}

          {tienda.empresa_nombre && (
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: th.accentFg + 'b3' }}>
              {tienda.empresa_nombre}
            </p>
          )}
          <h1 className="text-2xl font-black mb-3" style={{ color: th.text }}>{tienda.nombre}</h1>

          <div className="flex flex-wrap justify-center gap-3 text-xs" style={{ color: th.textSub }}>
            {tienda.direccion && (
              <span className="flex items-center gap-1">
                <MapPin size={12} style={{ color: th.accent }} />{tienda.direccion}
              </span>
            )}
            {tienda.telefono && (
              <a href={`tel:${tienda.telefono}`} className="flex items-center gap-1 transition-colors"
                style={{ color: th.textSub }}>
                <Phone size={12} style={{ color: th.accent }} />{tienda.telefono}
              </a>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: th.badgeBg, border: th.badgeBd, color: th.badgeClr }}>
            <Clock size={11} /> Menu Digital
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-5">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: th.textSub }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveCat(null); }}
              placeholder="Buscar platillo o bebida..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none"
              style={{ background: th.searchBg, border: th.searchBorder, color: th.searchColor }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: th.textSub }}>
                <X size={14} />
              </button>
            )}
          </div>
          {pedirPorCantidad && (
            <p className="mt-2 text-center text-[11px]" style={{ color: th.textSub }}>
              Deja presionado un producto para pedir varias piezas
            </p>
          )}
        </div>
      </div>

      {/* CATEGORY TABS */}
      {!search && categorias.length > 0 && (
        <div
          className="sticky top-0 z-30 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide"
          style={{ background: th.tabBg, backdropFilter: 'blur(12px)', borderBottom: th.tabBorderB }}
        >
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollToCat(cat.id)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={activeCat === cat.id ? {
                background: cat.color || th.accent,
                color: '#000',
                boxShadow: `0 0 16px ${cat.color || th.accent}60`,
              } : {
                background: th.tabInBg,
                color: th.tabInColor,
                border: th.tabInBorder,
              }}
            >
              {cat.icono && <span className="mr-1">{cat.icono}</span>}
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

      {/* PRODUCTS */}
      <div className="px-4 pt-4 pb-32 space-y-8">
        {search && filteredProductos.length === 0 && (
          <div className="text-center py-16" style={{ color: th.textSub }}>
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p>Sin resultados para "<strong style={{ color: th.text }}>{search}</strong>"</p>
          </div>
        )}

        {productosPorCategoria.map(({ cat, prods }) => (
          <div key={cat?.id ?? 'search'} ref={el => cat && el && catRefs.current.set(cat.id, el)}>
            {cat && (
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1" style={{ background: catDividerColor(cat.color) }} />
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
                  style={{ color: catTextColor(cat.color) }}>
                  {cat.icono && <span>{cat.icono}</span>}
                  {cat.nombre}
                </h2>
                <div className="h-px flex-1" style={{ background: catDividerColor(cat.color) }} />
              </div>
            )}

            {/* Product grid — 2 cols */}
            <div className="grid grid-cols-2 gap-3">
              {prods.map(prod => {
                const qty          = getCartQty(prod.id);
                const isExpanded   = expandedProduct === prod.id;
                return (
                  <div
                    key={prod.id}
                    {...pressProps(prod)}
                    className={`rounded-2xl overflow-hidden flex flex-col ${pedirPorCantidad ? 'select-none' : ''}`}
                    style={{
                      background:   th.cardBg,
                      border:       `1px solid ${qty > 0 ? th.cardBorderOn : th.cardBorder}`,
                      boxShadow:    qty > 0 ? th.cardGlowOn : 'none',
                      transition:   'all 0.2s ease',
                      WebkitTouchCallout: pedirPorCantidad ? 'none' : undefined,
                    }}
                  >
                    {/* Product image — fixed height for readability on mobile */}
                    <div className="relative overflow-hidden" style={{ height: '120px' }}>
                      {prod.imagen_url ? (
                        <img
                          src={resolveUploadUrl(prod.imagen_url)}
                          alt={prod.nombre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: th.placeholder }}>
                          <UtensilsCrossed size={26} style={{ color: th.textSub, opacity: 0.3 }} />
                        </div>
                      )}
                      {/* Price badge */}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-xs font-black"
                        style={{ background: th.priceBg, color: th.priceColor, backdropFilter: 'blur(8px)' }}>
                        {fmt(prod.precio)}
                      </div>
                      {/* Cart qty badge */}
                      {qty > 0 && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: th.accent, color: th.cartColor }}>
                          {qty}
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="p-3 flex flex-col flex-1 gap-2">
                      <div>
                        <p className="text-sm font-bold leading-tight" style={{ color: th.text }}>{prod.nombre}</p>
                        {prod.descripcion && (
                          <div>
                            <p className={`text-xs mt-1 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}
                              style={{ color: th.textSub }}>
                              {prod.descripcion}
                            </p>
                            {prod.descripcion.length > 60 && (
                              <button
                                onClick={() => setExpandedProduct(isExpanded ? null : prod.id)}
                                className="text-[10px] flex items-center gap-0.5 mt-0.5"
                                style={{ color: th.accentFg + '99' }}
                              >
                                {isExpanded ? <><ChevronUp size={10} /> menos</> : <><ChevronDown size={10} /> mas</>}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {modoMenu === 'pedidos' && (
                        <div className="mt-auto">
                          {qty === 0 ? (
                            <button
                              {...stopPress}
                              onClick={() => addToCart(prod)}
                              className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                              style={{ background: th.accentBg, border: `1px solid ${th.accentBorder}`, color: th.accentFg }}
                            >
                              <Plus size={14} /> Agregar
                            </button>
                          ) : (
                            <div className="flex items-center justify-between">
                              <button
                                {...stopPress}
                                onClick={() => removeFromCart(prod.id)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                                style={{ background: th.accentBg, border: `1px solid ${th.accentBorder}`, color: th.accentFg }}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="font-black text-sm" style={{ color: th.text }}>{qty}</span>
                              <button
                                {...stopPress}
                                onClick={() => addToCart(prod)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                                style={{ background: th.accentBg, border: `1px solid ${th.accentBorder}`, color: th.accentFg }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center pt-4 pb-2">
          <p className="text-xs" style={{ color: th.footerClr }}>
            Menu digital por <span style={{ color: th.footerBrand }} className="font-medium">POS-iaDoS</span>
          </p>
        </div>
      </div>

      {/* FLOATING CART BUTTON */}
      {modoMenu === 'pedidos' && cartCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-4 rounded-2xl font-bold shadow-2xl active:scale-95 transition-all"
          style={{ background: th.cartBtn, boxShadow: th.cartGlow, color: th.cartColor }}
        >
          <ShoppingCart size={20} />
          <span>{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</span>
          <span className="h-5 w-px opacity-20" style={{ background: th.cartColor }} />
          <span>{fmt(cartTotal)}</span>
        </button>
      )}

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative z-10 rounded-t-3xl overflow-hidden flex flex-col"
            style={{ background: th.drawerBg, maxHeight: '85vh', border: th.drawerBorderS, borderBottom: 'none' }}>

            <div className="flex items-center justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: th.textSub + '40' }} />
            </div>

            <div className="flex items-center justify-between px-5 pb-4"
              style={{ borderBottom: th.drawerDivider }}>
              <h3 className="text-lg font-black flex items-center gap-2" style={{ color: th.text }}>
                <ShoppingCart size={20} style={{ color: th.accent }} /> Tu Pedido
              </h3>
              <button onClick={() => setShowCart(false)}
                className="p-2 rounded-xl"
                style={{ background: th.accentBg, color: th.textSub }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.map(item => (
                <div key={item.producto.id} className="flex items-center gap-3">
                  {item.producto.imagen_url ? (
                    <img src={resolveUploadUrl(item.producto.imagen_url)} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: th.placeholder }}>
                      <UtensilsCrossed size={18} style={{ color: th.textSub, opacity: 0.5 }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: th.text }}>{item.producto.nombre}</p>
                    <p className="text-xs font-bold" style={{ color: th.accentFg }}>{fmt(item.producto.precio)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => removeFromCart(item.producto.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90"
                      style={{ background: th.qtyRemoveBg, color: th.qtyRemoveClr }}>
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center font-bold text-sm" style={{ color: th.text }}>{item.cantidad}</span>
                    <button onClick={() => addToCart(item.producto)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90"
                      style={{ background: th.qtyAddBg, border: th.qtyAddBd, color: th.accentFg }}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="text-sm font-bold w-16 text-right flex-shrink-0" style={{ color: th.text }}>
                    {fmt(item.producto.precio * item.cantidad)}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 space-y-3" style={{ borderTop: th.drawerDivider, background: th.drawerItemBg }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: th.textSub }}>Total</span>
                <span className="text-2xl font-black" style={{ color: th.accentFg }}>{fmt(cartTotal)}</span>
              </div>
              <input
                value={clienteNombre}
                onChange={e => setClienteNombre(e.target.value)}
                placeholder="Tu nombre (opcional)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: th.drawerInputBg, border: th.drawerInputBd, color: th.drawerInputClr }}
              />
              <input
                value={mesaNumero}
                onChange={e => setMesaNumero(e.target.value)}
                placeholder="Mesa o referencia (opcional)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: th.drawerInputBg, border: th.drawerInputBd, color: th.drawerInputClr }}
              />
              <button
                onClick={sendOrder}
                disabled={sendingOrder || cart.length === 0}
                className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                style={{ background: sendingOrder ? th.accent + '80' : th.cartBtn, color: th.cartColor, boxShadow: th.cartGlow }}
              >
                {sendingOrder
                  ? <><Loader2 size={18} className="animate-spin" /> Enviando...</>
                  : <><Send size={18} /> Enviar Pedido</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CANTIDAD (dejar presionado un producto) */}
      {qtyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setQtyModal(null)}>
          <div className="w-full max-w-sm rounded-3xl p-5"
            style={{ background: th.drawerBg, border: th.drawerBorderS }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="text-base font-black leading-tight" style={{ color: th.text }}>{qtyModal.producto.nombre}</h3>
              <button onClick={() => setQtyModal(null)} className="p-1.5 rounded-lg flex-shrink-0"
                style={{ background: th.accentBg, color: th.textSub }}>
                <X size={16} />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: th.textSub }}>{fmt(qtyModal.producto.precio)} c/u — ¿cuantas piezas?</p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {cantidadesRapidas.map(n => {
                const on = qtyModal.qty === n;
                return (
                  <button
                    key={n}
                    onClick={() => setQtyModal(m => m ? { ...m, qty: n } : m)}
                    className="py-3 rounded-xl font-black text-base active:scale-95 transition-all"
                    style={on
                      ? { background: th.accent, color: th.cartColor }
                      : { background: th.qtyAddBg, border: th.qtyAddBd, color: th.accentFg }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setQtyModal(m => m ? { ...m, qty: Math.max(1, m.qty - 1) } : m)}
                className="w-12 h-12 rounded-xl flex items-center justify-center active:scale-90"
                style={{ background: th.qtyRemoveBg, color: th.qtyRemoveClr }}>
                <Minus size={18} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={qtyModal.qty}
                onFocus={e => e.target.select()}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1) setQtyModal(m => m ? { ...m, qty: v } : m);
                }}
                className="flex-1 min-w-0 px-4 py-3 rounded-xl text-center text-2xl font-black outline-none"
                style={{ background: th.drawerInputBg, border: th.drawerInputBd, color: th.drawerInputClr }}
              />
              <button
                onClick={() => setQtyModal(m => m ? { ...m, qty: m.qty + 1 } : m)}
                className="w-12 h-12 rounded-xl flex items-center justify-center active:scale-90"
                style={{ background: th.qtyAddBg, border: th.qtyAddBd, color: th.accentFg }}>
                <Plus size={18} />
              </button>
            </div>

            <button
              onClick={confirmQtyModal}
              className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
              style={{ background: th.cartBtn, color: th.cartColor, boxShadow: th.cartGlow }}>
              <Plus size={18} /> Agregar {qtyModal.qty} · {fmt(qtyModal.producto.precio * qtyModal.qty)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
