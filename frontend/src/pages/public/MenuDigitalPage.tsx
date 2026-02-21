import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { menuDigitalApi } from '../../api/endpoints';
import { ShoppingCart, Search, X, Plus, Minus, ChevronUp, Send, MapPin, Phone, Clock, Loader2, UtensilsCrossed, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface Tienda {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  logo_url: string;
  empresa_nombre: string;
}

interface Categoria {
  id: number;
  nombre: string;
  color: string | null;
  icono: string | null;
  orden: number;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number;
  imagen_url: string | null;
  disponible: boolean;
  orden: number;
}

interface CartItem {
  producto: Producto;
  cantidad: number;
  notas: string;
}

export default function MenuDigitalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [modoMenu, setModoMenu] = useState<'consulta' | 'pedidos'>('consulta');
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [mesaNumero, setMesaNumero] = useState('');
  const [sendingOrder, setSendingOrder] = useState(false);
  const [orderSent, setOrderSent] = useState<string | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const catRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const catTabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMenu();
  }, [slug]);

  const loadMenu = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const { data } = await menuDigitalApi.getPublicMenu(slug);
      setTienda(data.tienda);
      setCategorias(data.categorias || []);
      setProductos(data.productos || []);
      setModoMenu(data.modo_menu as any);
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
      .map(cat => ({
        cat,
        prods: productos.filter(p => p.categoria_id === cat.id && p.disponible),
      }))
      .filter(g => g.prods.length > 0);
  }, [categorias, productos, search, filteredProductos]);

  const cartTotal = cart.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  const cartCount = cart.reduce((s, i) => s + i.cantidad, 0);

  const addToCart = (prod: Producto) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.producto.id === prod.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
      }
      return [...prev, { producto: prod, cantidad: 1, notas: '' }];
    });
  };

  const removeFromCart = (prodId: number) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.producto.id === prodId);
      if (idx < 0) return prev;
      const next = [...prev];
      if (next[idx].cantidad > 1) {
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad - 1 };
      } else {
        next.splice(idx, 1);
      }
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
        producto_id: i.producto.id,
        nombre: i.producto.nombre,
        precio: i.producto.precio,
        cantidad: i.cantidad,
        subtotal: i.producto.precio * i.cantidad,
        notas: i.notas,
      }));
      const { data } = await menuDigitalApi.createOrder(slug!, {
        cliente_nombre: clienteNombre || null,
        mesa_numero: mesaNumero || null,
        items,
        total: cartTotal,
      });
      setOrderSent(data.numero_orden);
      setCart([]);
      setShowCart(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al enviar pedido');
    } finally {
      setSendingOrder(false);
    }
  };

  const fmt = (n: number) => `$${Number(n).toFixed(2)}`;

  // ---- Loading ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d0d' }}>
        <div className="text-center space-y-4">
          <Loader2 size={40} className="animate-spin text-amber-400 mx-auto" />
          <p className="text-amber-200 text-sm">Cargando menu...</p>
        </div>
      </div>
    );
  }

  // ---- Error ----
  if (error || !tienda) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0d0d0d' }}>
        <div className="text-center space-y-4 max-w-sm">
          <UtensilsCrossed size={56} className="mx-auto text-amber-400/40" />
          <h2 className="text-xl font-bold text-white">Menu no disponible</h2>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ---- Order Confirmed ----
  if (orderSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0d0d0d' }}>
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-24 h-24 rounded-full bg-amber-400/10 border-2 border-amber-400 flex items-center justify-center mx-auto">
            <span className="text-4xl">✓</span>
          </div>
          <div>
            <p className="text-amber-400 text-sm font-medium mb-1">PEDIDO ENVIADO</p>
            <h2 className="text-3xl font-black text-white">#{orderSent}</h2>
          </div>
          <p className="text-slate-400">Tu pedido fue enviado al restaurante. En breve te atendemos.</p>
          <button
            onClick={() => setOrderSent(null)}
            className="w-full py-3 rounded-2xl bg-amber-500 text-black font-bold"
          >
            Ver menu nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0d0d0d', color: '#f8fafc' }}>

      {/* ---- HEADER ---- */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #1a0a00 0%, #0d0d0d 100%)' }}>
        {/* Background glow */}
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #f59e0b 0%, transparent 70%)' }} />

        <div className="relative z-10 px-5 pt-10 pb-6 text-center">
          {/* Logo */}
          {tienda.logo_url ? (
            <img
              src={tienda.logo_url}
              alt={tienda.nombre}
              className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-2xl ring-2 ring-amber-400/30"
              style={{ boxShadow: '0 0 30px rgba(245,158,11,0.3)' }}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed size={32} className="text-amber-400" />
            </div>
          )}

          {/* Tienda info */}
          {tienda.empresa_nombre && (
            <p className="text-xs text-amber-400/70 uppercase tracking-widest mb-1">{tienda.empresa_nombre}</p>
          )}
          <h1 className="text-2xl font-black text-white mb-3"
            style={{ textShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
            {tienda.nombre}
          </h1>

          <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-400">
            {tienda.direccion && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-amber-400" />
                {tienda.direccion}
              </span>
            )}
            {tienda.telefono && (
              <a href={`tel:${tienda.telefono}`} className="flex items-center gap-1 hover:text-amber-400 transition-colors">
                <Phone size={12} className="text-amber-400" />
                {tienda.telefono}
              </a>
            )}
          </div>

          {/* "Menu Digital" badge */}
          <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
            <Clock size={11} />
            Menu Digital
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-5">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveCat(null); }}
              placeholder="Buscar platillo o bebida..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f8fafc',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---- CATEGORY TABS ---- */}
      {!search && categorias.length > 0 && (
        <div
          ref={catTabsRef}
          className="sticky top-0 z-30 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide"
          style={{ background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollToCat(cat.id)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={activeCat === cat.id ? {
                background: cat.color || '#f59e0b',
                color: '#000',
                boxShadow: `0 0 16px ${cat.color || '#f59e0b'}60`,
              } : {
                background: 'rgba(255,255,255,0.06)',
                color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {cat.icono && <span className="mr-1">{cat.icono}</span>}
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

      {/* ---- PRODUCTS ---- */}
      <div className="px-4 pt-4 pb-32 space-y-8">
        {search && filteredProductos.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p>Sin resultados para "<strong className="text-slate-400">{search}</strong>"</p>
          </div>
        )}

        {productosPorCategoria.map(({ cat, prods }) => (
          <div key={cat?.id ?? 'search'} ref={el => cat && el && catRefs.current.set(cat.id, el)}>
            {/* Category header */}
            {cat && (
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1" style={{ background: cat.color ? `${cat.color}40` : 'rgba(255,255,255,0.08)' }} />
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
                  style={{ color: cat.color || '#f59e0b' }}>
                  {cat.icono && <span>{cat.icono}</span>}
                  {cat.nombre}
                </h2>
                <div className="h-px flex-1" style={{ background: cat.color ? `${cat.color}40` : 'rgba(255,255,255,0.08)' }} />
              </div>
            )}

            {/* Product grid */}
            <div className="grid grid-cols-2 gap-3">
              {prods.map(prod => {
                const qty = getCartQty(prod.id);
                const isExpanded = expandedProduct === prod.id;
                return (
                  <div
                    key={prod.id}
                    className="rounded-2xl overflow-hidden flex flex-col"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: qty > 0
                        ? '1px solid rgba(245,158,11,0.5)'
                        : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: qty > 0 ? '0 0 20px rgba(245,158,11,0.1)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Product image */}
                    <div className="relative aspect-square">
                      {prod.imagen_url ? (
                        <img
                          src={prod.imagen_url}
                          alt={prod.nombre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <UtensilsCrossed size={28} className="text-slate-700" />
                        </div>
                      )}
                      {/* Price badge */}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-xs font-black"
                        style={{ background: 'rgba(0,0,0,0.8)', color: '#4ade80', backdropFilter: 'blur(8px)' }}>
                        {fmt(prod.precio)}
                      </div>
                      {/* Cart qty badge */}
                      {qty > 0 && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-xs font-black text-black">
                          {qty}
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="p-3 flex flex-col flex-1 gap-2">
                      <div>
                        <p className="text-sm font-bold leading-tight text-white">{prod.nombre}</p>
                        {prod.descripcion && (
                          <div>
                            <p className={`text-xs mt-1 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}
                              style={{ color: '#94a3b8' }}>
                              {prod.descripcion}
                            </p>
                            {prod.descripcion.length > 60 && (
                              <button
                                onClick={() => setExpandedProduct(isExpanded ? null : prod.id)}
                                className="text-[10px] text-amber-400/70 flex items-center gap-0.5 mt-0.5"
                              >
                                {isExpanded ? <><ChevronUp size={10} /> menos</> : <><ChevronDown size={10} /> mas</>}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Add to cart / qty controls */}
                      {modoMenu === 'pedidos' && (
                        <div className="mt-auto">
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(prod)}
                              className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}
                            >
                              <Plus size={14} /> Agregar
                            </button>
                          ) : (
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => removeFromCart(prod.id)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-400 active:scale-90 transition-transform"
                                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="font-black text-white text-sm">{qty}</span>
                              <button
                                onClick={() => addToCart(prod)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-400 active:scale-90 transition-transform"
                                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
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
          <p className="text-xs text-slate-700">
            Menu digital por <span className="text-slate-600 font-medium">POS-iaDoS</span>
          </p>
        </div>
      </div>

      {/* ---- FLOATING CART BUTTON ---- */}
      {modoMenu === 'pedidos' && cartCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-black shadow-2xl active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '0 4px 30px rgba(245,158,11,0.5)',
          }}
        >
          <ShoppingCart size={20} />
          <span>{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</span>
          <span className="h-5 w-px bg-black/20" />
          <span>{fmt(cartTotal)}</span>
        </button>
      )}

      {/* ---- CART DRAWER ---- */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCart(false)} />

          {/* Drawer */}
          <div className="relative z-10 rounded-t-3xl overflow-hidden flex flex-col"
            style={{ background: '#141414', maxHeight: '85vh', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>

            {/* Handle */}
            <div className="flex items-center justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Cart header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShoppingCart size={20} className="text-amber-400" /> Tu Pedido
              </h3>
              <button onClick={() => setShowCart(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.map(item => (
                <div key={item.producto.id} className="flex items-center gap-3">
                  {item.producto.imagen_url ? (
                    <img src={item.producto.imagen_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed size={18} className="text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.producto.nombre}</p>
                    <p className="text-xs text-amber-400 font-bold">{fmt(item.producto.precio)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => removeFromCart(item.producto.id)}
                      className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 active:scale-90">
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center font-bold text-white text-sm">{item.cantidad}</span>
                    <button onClick={() => addToCart(item.producto)}
                      className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 active:scale-90">
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-white w-16 text-right flex-shrink-0">
                    {fmt(item.producto.precio * item.cantidad)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total & order form */}
            <div className="px-5 py-4 space-y-3 border-t border-slate-800"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total</span>
                <span className="text-2xl font-black text-amber-400">{fmt(cartTotal)}</span>
              </div>
              <input
                value={clienteNombre}
                onChange={e => setClienteNombre(e.target.value)}
                placeholder="Tu nombre (opcional)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
              <input
                value={mesaNumero}
                onChange={e => setMesaNumero(e.target.value)}
                placeholder="Mesa o referencia (opcional)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              />
              <button
                onClick={sendOrder}
                disabled={sendingOrder || cart.length === 0}
                className="w-full py-4 rounded-2xl font-black text-black flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                style={{
                  background: sendingOrder ? '#78350f' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
                }}
              >
                {sendingOrder ? (
                  <><Loader2 size={18} className="animate-spin" /> Enviando...</>
                ) : (
                  <><Send size={18} /> Enviar Pedido</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
