import { useState, useEffect } from 'react';
import { productosApi, categoriasApi } from '../../api/endpoints';
import { Producto, Categoria } from '../../types';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';

interface KioskItem {
  producto: Producto;
  cantidad: number;
}

export default function KioscoPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catActiva, setCatActiva] = useState<number | null>(null);
  const [carrito, setCarrito] = useState<KioskItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, c] = await Promise.all([productosApi.forPOS(), categoriasApi.list()]);
        setProductos(p.data);
        setCategorias(c.data);
        if (c.data.length) setCatActiva(c.data[0].id);
      } catch {}
    };
    load();
  }, []);

  const addItem = (prod: Producto) => {
    setCarrito((prev) => {
      const existing = prev.find((i) => i.producto.id === prod.id);
      if (existing) return prev.map((i) => i.producto.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { producto: prod, cantidad: 1 }];
    });
  };

  const updateQty = (prodId: number, delta: number) => {
    setCarrito((prev) => prev.map((i) => i.producto.id === prodId ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i).filter((i) => i.cantidad > 0));
  };

  const total = carrito.reduce((s, i) => s + Number(i.producto.precio) * i.cantidad, 0);
  const itemCount = carrito.reduce((s, i) => s + i.cantidad, 0);

  const filtered = catActiva ? productos.filter((p) => p.categoria_id === catActiva) : productos;

  return (
    <div className="min-h-screen bg-iados-dark flex flex-col">
      {/* Header kiosk */}
      <header className="bg-iados-primary p-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold">POS-iaDoS</h1>
          <p className="text-sm opacity-70">Haz tu pedido</p>
        </div>
        <button onClick={() => setShowCart(true)} className="relative bg-white/20 p-3 rounded-xl">
          <ShoppingBag size={28} />
          {itemCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">{itemCount}</span>}
        </button>
      </header>

      {/* Categorías */}
      <div className="flex gap-2 p-3 overflow-x-auto shrink-0 bg-iados-surface">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCatActiva(cat.id)}
            className={`shrink-0 px-6 py-3 rounded-2xl font-semibold text-base transition-all active:scale-95 ${
              catActiva === cat.id ? 'text-white' : 'bg-iados-card text-slate-300'
            }`}
            style={catActiva === cat.id && cat.color ? { backgroundColor: cat.color } : {}}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Productos grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((prod) => (
            <button
              key={prod.id}
              onClick={() => addItem(prod)}
              className="bg-iados-surface rounded-3xl p-4 flex flex-col items-center text-center hover:ring-2 hover:ring-iados-accent active:scale-95 transition-all min-h-[160px]"
            >
              <div
                className="w-20 h-20 rounded-2xl mb-3 flex items-center justify-center text-3xl font-bold text-white"
                style={{ backgroundColor: prod.categoria?.color || '#3b82f6' }}
              >
                {prod.nombre.charAt(0)}
              </div>
              <span className="font-semibold text-base leading-tight">{prod.nombre}</span>
              <span className="text-iados-accent font-bold text-lg mt-2">${Number(prod.precio).toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Barra inferior fija */}
      {itemCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 bg-iados-accent p-4 flex items-center justify-between" onClick={() => setShowCart(true)}>
          <span className="text-black font-bold text-lg">{itemCount} artículos</span>
          <span className="text-black font-bold text-2xl">${total.toFixed(2)}</span>
        </div>
      )}

      {/* Panel carrito */}
      {showCart && (
        <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50">
          <div className="bg-iados-surface w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold">Tu Pedido</h2>
              <button onClick={() => setShowCart(false)}><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {carrito.map((item) => (
                <div key={item.producto.id} className="flex items-center gap-3 bg-iados-card p-3 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium">{item.producto.nombre}</p>
                    <p className="text-sm text-iados-accent">${Number(item.producto.precio).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.producto.id, -1)} className="w-10 h-10 rounded-xl bg-iados-surface flex items-center justify-center"><Minus size={18} /></button>
                    <span className="w-8 text-center font-bold text-lg">{item.cantidad}</span>
                    <button onClick={() => updateQty(item.producto.id, 1)} className="w-10 h-10 rounded-xl bg-iados-surface flex items-center justify-center"><Plus size={18} /></button>
                  </div>
                  <span className="font-bold w-20 text-right">${(Number(item.producto.precio) * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-700">
              <div className="flex justify-between text-xl font-bold mb-3">
                <span>Total</span>
                <span className="text-iados-accent">${total.toFixed(2)}</span>
              </div>
              <p className="text-center text-slate-400 text-sm">Presenta este pedido en caja</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
