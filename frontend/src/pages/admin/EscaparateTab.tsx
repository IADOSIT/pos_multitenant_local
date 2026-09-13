import { useState, useEffect, useCallback, useMemo } from 'react';
import { ecommerceApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import toast from 'react-hot-toast';
import {
  Loader2, Search, Check, Eye, EyeOff, ArrowUp, ArrowDown, Star, X, RefreshCw, Package,
} from 'lucide-react';

/**
 * Escaparate: decide QUE productos salen en la tienda en linea y en QUE orden.
 *
 * Se apoya en `ecommerce_producto_config` (visible_ecommerce / orden_ecommerce), que ya
 * existia en la base pero no tenia pantalla: por eso la portada mostraba "los mas
 * recientes" y se sentia aleatoria. Los productos con orden 1..n van primero en la
 * tienda; los de orden 0 quedan despues, por novedad, igual que hasta hoy.
 */

interface Fila {
  id: number;
  nombre: string;
  sku: string | null;
  imagen_url: string | null;
  precio: string | number;
  disponible: number;
  controla_stock: number;
  stock_actual: string | number;
  categoria_nombre: string | null;
  visible_ecommerce: boolean;
  orden_ecommerce: number;
}

export default function EscaparateTab() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [original, setOriginal] = useState<Record<number, { visible: boolean; orden: number }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buscar, setBuscar] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ecommerceApi.listEscaparate({ limit: 400 });
      const rows: Fila[] = data || [];
      setFilas(rows);
      setOriginal(Object.fromEntries(rows.map(r => [r.id, { visible: r.visible_ecommerce, orden: r.orden_ecommerce }])));
    } catch {
      toast.error('No se pudo cargar el catálogo');
    }
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const destacados = useMemo(
    () => filas.filter(f => f.orden_ecommerce > 0).sort((a, b) => a.orden_ecommerce - b.orden_ecommerce),
    [filas],
  );

  const resto = useMemo(() => {
    const t = buscar.trim().toLowerCase();
    return filas
      .filter(f => f.orden_ecommerce === 0)
      .filter(f => !t || f.nombre.toLowerCase().includes(t) || (f.sku || '').toLowerCase().includes(t))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [filas, buscar]);

  const cambios = useMemo(
    () => filas.filter(f => {
      const o = original[f.id];
      return !o || o.visible !== f.visible_ecommerce || o.orden !== f.orden_ecommerce;
    }),
    [filas, original],
  );

  function patch(id: number, p: Partial<Fila>) {
    setFilas(fs => fs.map(f => (f.id === id ? { ...f, ...p } : f)));
  }

  /** Renumera los acomodados 1..n para que el orden guardado nunca tenga huecos. */
  function renumerar(lista: Fila[]) {
    const mapa = new Map(lista.map((f, i) => [f.id, i + 1]));
    setFilas(fs => fs.map(f => (mapa.has(f.id) ? { ...f, orden_ecommerce: mapa.get(f.id)! } : f)));
  }

  function agregar(f: Fila) {
    patch(f.id, { orden_ecommerce: destacados.length + 1, visible_ecommerce: true });
  }

  function quitar(f: Fila) {
    const lista = destacados.filter(d => d.id !== f.id);
    patch(f.id, { orden_ecommerce: 0 });
    renumerar(lista);
  }

  function mover(i: number, delta: number) {
    const lista = [...destacados];
    const j = i + delta;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    renumerar(lista);
  }

  async function guardar() {
    if (!cambios.length) return;
    setSaving(true);
    try {
      await ecommerceApi.saveEscaparate(
        cambios.map(f => ({
          producto_id: f.id,
          visible_ecommerce: f.visible_ecommerce,
          orden_ecommerce: f.orden_ecommerce,
        })),
      );
      setOriginal(Object.fromEntries(filas.map(f => [f.id, { visible: f.visible_ecommerce, orden: f.orden_ecommerce }])));
      toast.success('Escaparate actualizado');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al guardar el escaparate');
    }
    setSaving(false);
  }

  const Miniatura = ({ f }: { f: Fila }) => (
    f.imagen_url
      ? <img src={resolveUploadUrl(f.imagen_url)} alt="" className="w-11 h-11 rounded-lg object-cover bg-slate-700 shrink-0" />
      : <div className="w-11 h-11 rounded-lg bg-slate-700 grid place-items-center text-slate-500 shrink-0"><Package size={16} /></div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-slate-400">
      <Loader2 className="animate-spin mr-2" size={20} /> Cargando catálogo...
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <p className="text-sm font-semibold text-white flex items-center gap-2"><Star size={14} /> Escaparate de la página principal</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Los productos que acomodes aquí salen primero y en ese orden. El resto aparece después, del más nuevo al más viejo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">
            <RefreshCw size={12} /> Recargar
          </button>
          <button onClick={guardar} disabled={saving || !cambios.length}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs rounded-lg font-medium transition-colors">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {cambios.length ? `Guardar (${cambios.length})` : 'Sin cambios'}
          </button>
        </div>
      </div>

      {/* Acomodados en orden */}
      <div className="bg-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Acomodados ({destacados.length})</p>
        {!destacados.length && (
          <p className="text-xs text-slate-400">
            Todavía no acomodas ninguno: la tienda muestra los productos más recientes. Usa "Acomodar" en la lista de abajo.
          </p>
        )}
        {destacados.map((f, i) => (
          <div key={f.id} className="flex items-center gap-3 bg-slate-900/60 rounded-lg p-2.5">
            <span className="w-6 text-center text-sm font-bold text-blue-400 shrink-0">{i + 1}</span>
            <Miniatura f={f} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{f.nombre}</p>
              <p className="text-[11px] text-slate-500 truncate">{f.categoria_nombre || 'Sin categoría'}{f.sku ? ` · ${f.sku}` : ''}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => mover(i, -1)} disabled={i === 0}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 rounded text-slate-300"><ArrowUp size={13} /></button>
              <button onClick={() => mover(i, 1)} disabled={i === destacados.length - 1}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 rounded text-slate-300"><ArrowDown size={13} /></button>
              <button onClick={() => quitar(f)} title="Quitar del escaparate"
                className="p-1.5 bg-slate-700 hover:bg-red-600 rounded text-slate-300 ml-1"><X size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Resto del catálogo */}
      <div className="bg-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <p className="text-sm font-semibold text-white">Resto del catálogo ({resto.length})</p>
          <div className="flex items-center bg-slate-700 border border-slate-600 rounded-lg px-2">
            <Search size={13} className="text-slate-400" />
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre o SKU"
              className="bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none w-full sm:w-60" />
          </div>
        </div>
        <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
          {resto.map(f => (
            <div key={f.id} className={`flex items-center gap-3 rounded-lg p-2.5 ${f.visible_ecommerce ? 'bg-slate-900/60' : 'bg-slate-900/30 opacity-60'}`}>
              <Miniatura f={f} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{f.nombre}</p>
                <p className="text-[11px] text-slate-500 truncate">{f.categoria_nombre || 'Sin categoría'}{f.sku ? ` · ${f.sku}` : ''}</p>
              </div>
              <button onClick={() => patch(f.id, { visible_ecommerce: !f.visible_ecommerce })}
                title={f.visible_ecommerce ? 'Se ve en la tienda' : 'Oculto en la tienda'}
                className={`p-1.5 rounded shrink-0 bg-slate-700 hover:bg-slate-600 ${f.visible_ecommerce ? 'text-green-400' : 'text-slate-500'}`}>
                {f.visible_ecommerce ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button onClick={() => agregar(f)} disabled={!f.visible_ecommerce}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-blue-600 disabled:opacity-30 text-slate-200 text-xs rounded-lg shrink-0 transition-colors">
                Acomodar
              </button>
            </div>
          ))}
          {!resto.length && <p className="text-xs text-slate-400">No hay productos que coincidan con la búsqueda.</p>}
        </div>
        <p className="text-[11px] text-slate-500">
          Ocultar un producto lo quita de la tienda en línea; en el POS sigue igual. Una categoría deja de mostrarse sola cuando ninguno de sus productos es visible.
        </p>
      </div>
    </div>
  );
}
