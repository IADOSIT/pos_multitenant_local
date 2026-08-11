import { useState, useEffect, useRef, useCallback } from 'react';
import { usePOSStore } from '../../store/pos.store';
import { useAuthStore } from '../../store/auth.store';
import { productosApi, cajaApi, tiendasApi, empresasApi } from '../../api/endpoints';
import { Producto } from '../../types';
import { money } from '../../utils/money';
import PayModal from '../../components/pos/PayModal';
import { Search, Minus, Plus, Trash2, ShoppingCart, ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';

// POS estilo TIENDA / RETAIL (tipo supermercado). Componente NUEVO e independiente del
// POSPage (restaurante). Reutiliza el mismo carrito (usePOSStore) y el mismo proceso de
// cobro (PayModal + tipo de servicio en sitio/para llevar). Se activa desde
// Configuración → Modo de Servicio POS → "Tienda / Retail".
export default function POSRetailPage() {
  const { user } = useAuthStore();
  const {
    addToCart, cart, updateQuantity, removeFromCart, getItemCount,
    cajaActiva, setCajaActiva, tipoServicio, setTipoServicio,
    setIvaConfig, setModoServicio,
  } = usePOSStore();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [payKey, setPayKey] = useState(0); // remonta PayModal inline tras cada venta
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cajaManaged, setCajaManaged] = useState(false);
  const [mostrarPrecios, setMostrarPrecios] = useState(true);
  const [enSitioVisible, setEnSitioVisible] = useState(true);
  const [paraLlevarVisible, setParaLlevarVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const stockDe = (productoId: number): number | null => {
    const p = productos.find((x) => x.id === productoId) as any;
    const s = p?.stock_actual ?? p?.stock;
    return s === undefined || s === null ? null : Number(s);
  };

  const ensureCaja = useCallback(async (autoOpen: boolean) => {
    try {
      const { data } = await cajaApi.activa();
      setCajaActiva(data);
    } catch {
      if (autoOpen) {
        try {
          const { data } = await cajaApi.abrir({ fondo: 0, nombre: `Caja-${new Date().toLocaleDateString('es-MX')}` });
          setCajaActiva(data);
        } catch { /* otra caja abierta o red */ }
      } else setCajaActiva(null);
    }
  }, [setCajaActiva]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    productosApi.list().then(({ data }) => setProductos(data || [])).catch(() => {});
    if (user?.empresa_id) {
      empresasApi.get(user.empresa_id)
        .then((r) => setMostrarPrecios(r.data?.config_especial?.mostrar_precios !== false))
        .catch(() => {});
    }
    if (user?.tienda_id) {
      tiendasApi.get(user.tienda_id).then(async ({ data }) => {
        const cp = data?.config_pos || {};
        setModoServicio(cp.modo_servicio || 'autoservicio');
        setIvaConfig({ enabled: cp.iva_enabled || false, porcentaje: cp.iva_porcentaje ?? 16, incluido: cp.iva_incluido ?? true });
        setEnSitioVisible(cp.en_sitio_visible !== false);
        setParaLlevarVisible(cp.para_llevar_visible !== false);
        const managed = (cp.caja_auto_enabled || false) || (cp.caja_ocultar_ui || false);
        setCajaManaged(managed);
        await ensureCaja(managed);
      }).catch(() => ensureCaja(false));
    } else {
      ensureCaja(false);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tienda_id, user?.empresa_id]);

  const term = busqueda.trim().toLowerCase();
  const resultados = term
    ? productos.filter((p) =>
        p.nombre.toLowerCase().includes(term) ||
        String(p.sku || '').toLowerCase().includes(term) ||
        String((p as any).codigo_barras || '').toLowerCase().includes(term),
      ).slice(0, 8)
    : [];

  const agregar = (p: Producto) => {
    addToCart(p, 1);
    setBusqueda('');
    inputRef.current?.focus();
  };

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !term) return;
    e.preventDefault();
    // Coincidencia exacta por código de barras o SKU (pistola lectora) → agrega directo.
    const exacto = productos.find((p) =>
      String((p as any).codigo_barras || '').toLowerCase() === term || String(p.sku || '').toLowerCase() === term,
    );
    const p = exacto || resultados[0];
    if (p) agregar(p);
    else toast.error('Producto no encontrado');
  };

  return (
    <div className="flex h-full">
      {/* Panel izquierdo: captura + tabla */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header búsqueda/escáner */}
        <div className="h-16 shrink-0 flex items-center gap-2 px-3 bg-iados-surface border-b border-slate-700">
          <div className="flex-1 relative">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              ref={inputRef}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={onEnter}
              placeholder="Escanear o buscar producto (código o descripción)…"
              className="input-touch pl-10"
              autoComplete="off"
            />
            {/* Resultados en vivo */}
            {resultados.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-iados-surface border border-slate-600 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                {resultados.map((p) => (
                  <button key={p.id} onClick={() => agregar(p)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-iados-card text-left border-b border-slate-700/50 last:border-0">
                    <span className="w-9 h-9 rounded-lg bg-iados-card overflow-hidden shrink-0 flex items-center justify-center text-slate-500">
                      {p.imagen_url ? <img src={p.imagen_url} alt="" className="w-full h-full object-cover" /> : '🛒'}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-white truncate">{p.nombre}</span>
                      <span className="block text-xs text-slate-500">{p.sku}</span>
                    </span>
                    {mostrarPrecios && <span className="text-sm font-bold text-iados-accent tabular-nums">${money(p.precio)}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500 hidden lg:flex items-center gap-1 shrink-0"><Search size={13} /> Enter para agregar</span>
        </div>

        {/* Tabla de ticket */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <ScanLine size={48} className="opacity-30 mb-3" />
              <p className="text-sm">Escanea o busca un producto para comenzar</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-iados-dark/95 backdrop-blur text-xs uppercase text-slate-400 tracking-wide">
                <tr className="border-b border-slate-700">
                  <th className="text-left font-semibold px-3 py-2">Código</th>
                  <th className="text-left font-semibold px-3 py-2">Descripción</th>
                  {mostrarPrecios && <th className="text-right font-semibold px-3 py-2">Precio</th>}
                  <th className="text-center font-semibold px-3 py-2">Cant.</th>
                  {mostrarPrecios && <th className="text-right font-semibold px-3 py-2">Importe</th>}
                  <th className="text-center font-semibold px-2 py-2">Exist.</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((i) => (
                  <tr key={i.id} className="border-b border-slate-800 hover:bg-iados-card/40">
                    <td className="px-3 py-2 text-slate-400 tabular-nums whitespace-nowrap">{i.sku}</td>
                    <td className="px-3 py-2 text-white font-medium">{i.nombre}</td>
                    {mostrarPrecios && <td className="px-3 py-2 text-right text-slate-300 tabular-nums">${money(i.precio)}</td>}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => updateQuantity(i.id, i.cantidad - 1)} className="w-7 h-7 rounded-lg bg-iados-surface flex items-center justify-center active:scale-90"><Minus size={13} /></button>
                        <input
                          type="number" min={1} value={i.cantidad}
                          onChange={(e) => updateQuantity(i.id, parseInt(e.target.value, 10) || 1)}
                          onFocus={(e) => e.target.select()}
                          className="w-16 text-center font-bold bg-iados-bg border border-slate-600 rounded-lg text-sm px-1 py-1 tabular-nums"
                        />
                        <button onClick={() => updateQuantity(i.id, i.cantidad + 1)} className="w-7 h-7 rounded-lg bg-iados-surface flex items-center justify-center active:scale-90"><Plus size={13} /></button>
                      </div>
                    </td>
                    {mostrarPrecios && <td className="px-3 py-2 text-right font-bold tabular-nums">${money((i.precioManual ?? i.precio) * i.cantidad)}</td>}
                    <td className="px-2 py-2 text-center text-slate-500 tabular-nums">{stockDe(i.producto_id) ?? '—'}</td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => removeFromCart(i.id)} className="w-7 h-7 rounded-lg bg-red-900/40 text-red-400 hover:bg-red-900/70 flex items-center justify-center active:scale-90"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Panel derecho: resumen de pago */}
      <aside className="w-96 shrink-0 border-l border-slate-700 bg-iados-surface flex flex-col">
        <div className="h-16 shrink-0 px-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} /> Resumen de Pago</h2>
          <span className="text-xs text-slate-500">{getItemCount()} art.</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tipo de servicio (mismo proceso que el POS actual) */}
          {(enSitioVisible || paraLlevarVisible) && (
            <div className="flex rounded-xl overflow-hidden border border-slate-600">
              {enSitioVisible && (
                <button onClick={() => setTipoServicio('en_sitio')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${tipoServicio === 'en_sitio' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-slate-200'}`}>🍽️ En sitio</button>
              )}
              {paraLlevarVisible && (
                <button onClick={() => setTipoServicio('para_llevar')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${tipoServicio === 'para_llevar' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>🥡 Para llevar</button>
              )}
            </div>
          )}

          {!cajaActiva && !cajaManaged && (
            <div className="p-3 rounded-xl bg-amber-900/30 border border-amber-700 text-amber-300 text-sm text-center">
              No hay caja abierta. Abra una caja para vender.
            </div>
          )}

          {cart.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-10">Agrega productos para cobrar.</div>
          ) : (
            /* Cobro INLINE: mismo proceso que el POS actual (PayModal embebido) */
            <PayModal
              key={payKey}
              inline
              isOnline={isOnline}
              cajaManaged={cajaManaged}
              onClose={() => setPayKey((k) => k + 1)}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
