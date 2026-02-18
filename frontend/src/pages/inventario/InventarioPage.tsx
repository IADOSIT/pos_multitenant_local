import { useState, useEffect, useRef } from 'react';
import { inventarioApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import {
  Warehouse, Search, Plus, ArrowDownToLine, ArrowUpFromLine, RefreshCw,
  Download, Upload, FileSpreadsheet, AlertTriangle, X, ChevronDown
} from 'lucide-react';

type Producto = {
  id: number; sku: string; nombre: string; stock_actual: number;
  stock_minimo: number; controla_stock: boolean; unidad: string;
  costo: number; precio: number; imagen_url?: string;
};

type Movimiento = {
  id: number; producto_nombre: string; producto_sku: string;
  tipo: string; cantidad: number; stock_anterior: number;
  stock_nuevo: number; concepto: string; usuario_nombre: string;
  created_at: string;
};

const TIPOS = [
  { value: 'entrada', label: 'Entrada', icon: ArrowDownToLine, color: 'text-green-400' },
  { value: 'salida', label: 'Salida', icon: ArrowUpFromLine, color: 'text-red-400' },
  { value: 'ajuste', label: 'Ajuste', icon: RefreshCw, color: 'text-yellow-400' },
];

export default function InventarioPage() {
  const [tab, setTab] = useState<'stock' | 'movimientos'>('stock');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState<Producto | null>(null);
  const [movForm, setMovForm] = useState({ producto_id: 0, tipo: 'entrada', cantidad: '', concepto: '' });
  const [importResult, setImportResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, [tab]);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'stock') {
        const { data } = await inventarioApi.listStock();
        setProductos(data);
      } else {
        const { data } = await inventarioApi.listMovimientos();
        setMovimientos(data);
      }
    } catch { toast.error('Error al cargar datos'); }
    setLoading(false);
  };

  const filtered = tab === 'stock'
    ? productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    : movimientos.filter(m => m.producto_nombre.toLowerCase().includes(search.toLowerCase()) || m.producto_sku?.toLowerCase().includes(search.toLowerCase()));

  const handleMovimiento = async () => {
    if (!movForm.producto_id || !movForm.cantidad) { toast.error('Completa los campos'); return; }
    try {
      const { data } = await inventarioApi.registrarMovimiento({
        producto_id: movForm.producto_id,
        tipo: movForm.tipo,
        cantidad: parseFloat(movForm.cantidad),
        concepto: movForm.concepto || undefined,
      });
      toast.success(`Stock actualizado: ${data.stock_actual}`);
      setShowModal(false);
      setMovForm({ producto_id: 0, tipo: 'entrada', cantidad: '', concepto: '' });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  const handleSettings = async (prod: Producto, data: { controla_stock?: boolean; stock_minimo?: number }) => {
    try {
      await inventarioApi.updateProducto(prod.id, data);
      toast.success('Configuracion actualizada');
      setShowSettingsModal(null);
      load();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleCSVTemplate = async () => {
    try {
      const { data } = await inventarioApi.csvTemplate();
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = 'inventario_template.csv'; a.click();
    } catch { toast.error('Error al descargar plantilla'); }
  };

  const handleCSVExport = async () => {
    try {
      const { data } = await inventarioApi.csvExport();
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = 'inventario_export.csv'; a.click();
      toast.success('Exportado');
    } catch { toast.error('Error al exportar'); }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await inventarioApi.csvImport(file);
      setImportResult(data);
      toast.success(`${data.success} de ${data.total} productos actualizados`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al importar');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const openMovModal = (prod?: Producto) => {
    setMovForm({ producto_id: prod?.id || 0, tipo: 'entrada', cantidad: '', concepto: '' });
    setShowModal(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Warehouse className="text-iados-primary" size={28} />
          <h1 className="text-2xl font-bold">Inventario</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCSVTemplate} className="btn-secondary text-sm flex items-center gap-1">
            <FileSpreadsheet size={16} /> Plantilla CSV
          </button>
          <button onClick={handleCSVExport} className="btn-secondary text-sm flex items-center gap-1">
            <Download size={16} /> Exportar
          </button>
          <label className="btn-secondary text-sm flex items-center gap-1 cursor-pointer">
            <Upload size={16} /> Importar
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>
          <button onClick={() => openMovModal()} className="btn-primary text-sm flex items-center gap-1">
            <Plus size={16} /> Movimiento
          </button>
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className="bg-iados-card rounded-xl p-4 mb-4 border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Resultado importacion</span>
            <button onClick={() => setImportResult(null)}><X size={16} /></button>
          </div>
          <p className="text-sm text-slate-300">
            Exitosos: <span className="text-green-400 font-bold">{importResult.success}</span> / {importResult.total}
          </p>
          {importResult.errors?.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto text-xs text-red-400">
              {importResult.errors.map((e: any, i: number) => (
                <div key={i}>Fila {e.fila}: {e.error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex bg-iados-card rounded-xl p-1">
          <button onClick={() => setTab('stock')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'stock' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}>
            Stock
          </button>
          <button onClick={() => setTab('movimientos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'movimientos' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}>
            Movimientos
          </button>
        </div>
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-10 pr-4 py-2 bg-iados-card rounded-xl border border-slate-700 focus:border-iados-primary outline-none text-sm"
          />
        </div>
        <button onClick={load} className="p-2 text-slate-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Cargando...</div>
      ) : tab === 'stock' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="pb-3 pl-2">Producto</th>
                <th className="pb-3">SKU</th>
                <th className="pb-3 text-right">Stock</th>
                <th className="pb-3 text-right">Minimo</th>
                <th className="pb-3 text-center">Controla</th>
                <th className="pb-3 text-right">Costo</th>
                <th className="pb-3 text-right">Precio</th>
                <th className="pb-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(filtered as Producto[]).map(p => {
                const lowStock = p.controla_stock && p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo;
                return (
                  <tr key={p.id} className={`border-b border-slate-800 hover:bg-iados-card/50 ${lowStock ? 'bg-red-900/10' : ''}`}>
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2">
                        {p.imagen_url ? (
                          <img src={p.imagen_url} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-xs text-slate-400">
                            {p.nombre.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{p.nombre}</span>
                        {lowStock && <AlertTriangle size={14} className="text-red-400" />}
                      </div>
                    </td>
                    <td className="py-3 text-slate-400">{p.sku}</td>
                    <td className={`py-3 text-right font-bold ${lowStock ? 'text-red-400' : 'text-white'}`}>
                      {p.stock_actual ?? 0} {p.unidad || 'pza'}
                    </td>
                    <td className="py-3 text-right text-slate-400">{p.stock_minimo ?? 0}</td>
                    <td className="py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.controla_stock ? 'bg-green-900/30 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                        {p.controla_stock ? 'Si' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400">${Number(p.costo || 0).toFixed(2)}</td>
                    <td className="py-3 text-right">${Number(p.precio).toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openMovModal(p)} className="p-1.5 hover:bg-iados-primary/20 rounded-lg text-iados-primary" title="Registrar movimiento">
                          <Plus size={16} />
                        </button>
                        <button onClick={() => setShowSettingsModal(p)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400" title="Config stock">
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(filtered as Producto[]).length === 0 && (
            <div className="text-center py-12 text-slate-500">No se encontraron productos</div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {(filtered as Movimiento[]).map(m => (
            <div key={m.id} className="bg-iados-card rounded-xl p-4 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                m.tipo === 'entrada' ? 'bg-green-900/30' : m.tipo === 'salida' ? 'bg-red-900/30' : m.tipo === 'devolucion' ? 'bg-blue-900/30' : 'bg-yellow-900/30'
              }`}>
                {m.tipo === 'entrada' ? <ArrowDownToLine size={20} className="text-green-400" /> :
                 m.tipo === 'salida' ? <ArrowUpFromLine size={20} className="text-red-400" /> :
                 <RefreshCw size={20} className="text-yellow-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.producto_nombre}</div>
                <div className="text-xs text-slate-400">{m.producto_sku} - {m.concepto || m.tipo}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${m.tipo === 'entrada' || m.tipo === 'devolucion' ? 'text-green-400' : m.tipo === 'salida' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {m.tipo === 'entrada' || m.tipo === 'devolucion' ? '+' : m.tipo === 'salida' ? '-' : '='}{m.cantidad}
                </div>
                <div className="text-xs text-slate-500">{m.stock_anterior} → {m.stock_nuevo}</div>
              </div>
              <div className="text-right text-xs text-slate-500 hidden sm:block">
                <div>{m.usuario_nombre}</div>
                <div>{new Date(m.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {(filtered as Movimiento[]).length === 0 && (
            <div className="text-center py-12 text-slate-500">No hay movimientos registrados</div>
          )}
        </div>
      )}

      {/* Modal: Registrar Movimiento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div className="bg-iados-surface rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Registrar Movimiento</h3>

            <label className="block text-sm text-slate-400 mb-1">Producto</label>
            <select
              value={movForm.producto_id}
              onChange={e => setMovForm({ ...movForm, producto_id: Number(e.target.value) })}
              className="w-full mb-3 p-2.5 bg-iados-card rounded-xl border border-slate-700 outline-none text-sm"
            >
              <option value={0}>Seleccionar producto...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>
              ))}
            </select>

            <label className="block text-sm text-slate-400 mb-1">Tipo</label>
            <div className="flex gap-2 mb-3">
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setMovForm({ ...movForm, tipo: t.value })}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium transition ${
                    movForm.tipo === t.value ? 'bg-iados-primary text-white' : 'bg-iados-card border border-slate-700 text-slate-400'
                  }`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>

            <label className="block text-sm text-slate-400 mb-1">
              {movForm.tipo === 'ajuste' ? 'Stock final' : 'Cantidad'}
            </label>
            <input
              type="number" min="0" step="0.01"
              value={movForm.cantidad}
              onChange={e => setMovForm({ ...movForm, cantidad: e.target.value })}
              className="w-full mb-3 p-2.5 bg-iados-card rounded-xl border border-slate-700 outline-none text-sm"
              placeholder={movForm.tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
            />

            <label className="block text-sm text-slate-400 mb-1">Concepto (opcional)</label>
            <input
              value={movForm.concepto}
              onChange={e => setMovForm({ ...movForm, concepto: e.target.value })}
              className="w-full mb-4 p-2.5 bg-iados-card rounded-xl border border-slate-700 outline-none text-sm"
              placeholder="Ej: Compra proveedor, merma, etc."
            />

            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-iados-card rounded-xl text-slate-400 hover:text-white">
                Cancelar
              </button>
              <button onClick={handleMovimiento} className="flex-1 py-2.5 bg-iados-primary rounded-xl text-white font-medium hover:bg-iados-primary/80">
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Settings stock */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowSettingsModal(null)}>
          <div className="bg-iados-surface rounded-2xl p-6 w-full max-w-sm mx-4 border border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Config: {showSettingsModal.nombre}</h3>

            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={showSettingsModal.controla_stock}
                onChange={e => setShowSettingsModal({ ...showSettingsModal, controla_stock: e.target.checked })}
                className="w-5 h-5 accent-iados-primary"
              />
              <span className="text-sm">Controla stock</span>
            </label>

            <label className="block text-sm text-slate-400 mb-1">Stock minimo (alerta)</label>
            <input
              type="number" min="0"
              value={showSettingsModal.stock_minimo ?? 0}
              onChange={e => setShowSettingsModal({ ...showSettingsModal, stock_minimo: Number(e.target.value) })}
              className="w-full mb-4 p-2.5 bg-iados-card rounded-xl border border-slate-700 outline-none text-sm"
            />

            <div className="flex gap-2">
              <button onClick={() => setShowSettingsModal(null)} className="flex-1 py-2.5 bg-iados-card rounded-xl text-slate-400">
                Cancelar
              </button>
              <button
                onClick={() => handleSettings(showSettingsModal, {
                  controla_stock: showSettingsModal.controla_stock,
                  stock_minimo: showSettingsModal.stock_minimo,
                })}
                className="flex-1 py-2.5 bg-iados-primary rounded-xl text-white font-medium"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
