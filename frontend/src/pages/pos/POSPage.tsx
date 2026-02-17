import { useState, useEffect } from 'react';
import { usePOSStore } from '../../store/pos.store';
import { offlineActions } from '../../store/offline.store';
import { productosApi, categoriasApi, ventasApi, cajaApi } from '../../api/endpoints';
import { Producto, Categoria } from '../../types';
import toast from 'react-hot-toast';
import CartPanel from '../../components/pos/CartPanel';
import PayModal from '../../components/pos/PayModal';
import { Search, ShoppingBag, Wifi, WifiOff } from 'lucide-react';

export default function POSPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [showPay, setShowPay] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cartVisible, setCartVisible] = useState(false);

  const { categoriaActiva, setCategoriaActiva, addToCart, cart, getItemCount, cajaActiva, setCajaActiva } = usePOSStore();

  useEffect(() => {
    loadData();
    loadCaja();
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const loadData = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        productosApi.forPOS(),
        categoriasApi.list(),
      ]);
      setProductos(prodsRes.data);
      setCategorias(catsRes.data);
      // Cache para offline
      offlineActions.cacheProductos(prodsRes.data);
      offlineActions.cacheCategorias(catsRes.data);
    } catch {
      // Fallback offline
      const cachedProds = await offlineActions.getCachedProductos();
      const cachedCats = await offlineActions.getCachedCategorias();
      if (cachedProds.length) {
        setProductos(cachedProds);
        setCategorias(cachedCats);
        toast('Modo offline - datos en caché', { icon: '📡' });
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
    toast.success(`${producto.nombre} agregado`, { duration: 1000 });
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Panel izquierdo: categorías + productos */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header POS */}
        <div className="flex items-center gap-2 p-3 bg-iados-surface border-b border-slate-700">
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
          <div className="flex items-center gap-1 text-xs text-slate-400">
            {isOnline ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-red-400" />}
          </div>
          {/* Botón carrito móvil */}
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

        {/* Categorías - scroll horizontal */}
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

        {/* Grid de productos - estilo McDonald's */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProductos.map((prod) => (
              <button
                key={prod.id}
                onClick={() => handleProductClick(prod)}
                className="card hover:ring-2 hover:ring-iados-secondary active:scale-95 transition-all flex flex-col items-center text-center p-3 min-h-[120px]"
              >
                {prod.imagen_url ? (
                  <img src={prod.imagen_url} alt={prod.nombre} className="w-16 h-16 object-cover rounded-xl mb-2" />
                ) : (
                  <div
                    className="w-16 h-16 rounded-xl mb-2 flex items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: prod.categoria?.color || '#3b82f6' }}
                  >
                    {prod.nombre.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium leading-tight line-clamp-2">{prod.nombre}</span>
                <span className="text-iados-accent font-bold mt-1">${Number(prod.precio).toFixed(2)}</span>
              </button>
            ))}
          </div>
          {filteredProductos.length === 0 && (
            <div className="text-center text-slate-500 py-12">No se encontraron productos</div>
          )}
        </div>
      </div>

      {/* Panel derecho: Carrito - Desktop siempre, móvil condicional */}
      <div className={`${cartVisible ? 'fixed inset-0 z-40 lg:relative' : 'hidden lg:flex'} lg:w-96 flex flex-col bg-iados-surface border-l border-slate-700`}>
        {/* Cerrar en móvil */}
        <button className="lg:hidden absolute top-2 right-2 z-50 p-2 text-slate-400" onClick={() => setCartVisible(false)}>✕</button>
        <CartPanel onPay={() => { setShowPay(true); setCartVisible(false); }} />
      </div>

      {/* Modal de pago */}
      {showPay && (
        <PayModal
          onClose={() => setShowPay(false)}
          isOnline={isOnline}
        />
      )}
    </div>
  );
}
