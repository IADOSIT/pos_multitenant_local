import { useState, useEffect, useRef } from 'react';
import { materiaPrimaApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Beef, Download, Upload, Trash2, Search, RefreshCw, X, AlertTriangle, CheckCircle2, Plus, Edit2, Save } from 'lucide-react';

type Item = {
  id: number; sku: string; nombre: string; descripcion?: string; categoria?: string;
  unidad: string; costo: number; stock_actual: number; stock_minimo: number;
  proveedor?: string; notas?: string;
};

const EMPTY_FORM = { sku: '', nombre: '', descripcion: '', categoria: '', unidad: 'kg', costo: '', stock_actual: '', stock_minimo: '', proveedor: '', notas: '' };

export default function MateriaPrimaPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const { data } = await materiaPrimaApi.list(); setItems(data); } catch { toast.error('Error al cargar'); }
    setLoading(false);
  };

  const filtered = items.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.nombre?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q) || p.proveedor?.toLowerCase().includes(q);
  });

  // CRUD
  const openNew = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: Item) => {
    setEditItem(item);
    setForm({
      sku: item.sku, nombre: item.nombre, descripcion: item.descripcion || '',
      categoria: item.categoria || '', unidad: item.unidad || 'pza',
      costo: String(item.costo || ''), stock_actual: String(item.stock_actual || ''),
      stock_minimo: String(item.stock_minimo || ''), proveedor: item.proveedor || '', notas: item.notas || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.sku || !form.nombre) { toast.error('SKU y nombre obligatorios'); return; }
    const payload = {
      ...form,
      costo: parseFloat(form.costo) || 0,
      stock_actual: parseFloat(form.stock_actual) || 0,
      stock_minimo: parseFloat(form.stock_minimo) || 0,
    };
    try {
      if (editItem) {
        await materiaPrimaApi.update(editItem.id, payload);
        toast.success('Actualizado');
      } else {
        await materiaPrimaApi.create(payload);
        toast.success('Creado');
      }
      setShowForm(false);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (item: Item) => {
    try {
      await materiaPrimaApi.delete(item.id);
      toast.success('Eliminado');
      setDeleteConfirm(null);
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Eliminar TODA la materia prima? No se puede deshacer.')) return;
    try {
      const { data } = await materiaPrimaApi.deleteAll();
      toast.success(`${data.deleted} registros eliminados`);
      load();
    } catch { toast.error('Error'); }
  };

  // CSV
  const handleDownloadTemplate = async () => {
    try {
      const { data } = await materiaPrimaApi.csvTemplate();
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = 'materia_prima_plantilla.csv'; a.click();
    } catch { toast.error('Error'); }
  };

  const handleExport = async () => {
    try {
      const { data } = await materiaPrimaApi.csvExport();
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = 'materia_prima_export.csv'; a.click();
      toast.success('Exportado');
    } catch { toast.error('Error'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await materiaPrimaApi.csvImport(file);
      setImportResult(data);
      if (data.success > 0 || data.updated > 0) toast.success(`${data.success} creados, ${data.updated} actualizados`);
      if (data.errors?.length > 0) toast.error(`${data.errors.length} errores`);
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error al importar'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const categorias = [...new Set(items.map(i => i.categoria).filter(Boolean))];
  const stats = {
    total: items.length,
    categorias: categorias.length,
    bajoStock: items.filter(i => i.stock_minimo > 0 && i.stock_actual <= i.stock_minimo).length,
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Beef className="text-orange-400" size={28} />
          <div>
            <h1 className="text-2xl font-bold">Materia Prima</h1>
            <p className="text-xs text-slate-500">Ingreso manual o por plantilla CSV</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadTemplate} className="btn-secondary text-sm flex items-center gap-1.5">
            <Download size={16} /> Plantilla
          </button>
          <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-1.5" disabled={items.length === 0}>
            <Download size={16} /> Exportar
          </button>
          <label className="btn-secondary text-sm flex items-center gap-1.5 cursor-pointer">
            <Upload size={16} /> Importar CSV
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={openNew} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus size={16} /> Agregar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-iados-card rounded-xl p-3 text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-slate-400">Insumos</div>
        </div>
        <div className="bg-iados-card rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.categorias}</div>
          <div className="text-xs text-slate-400">Categorias</div>
        </div>
        <div className="bg-iados-card rounded-xl p-3 text-center">
          <div className={`text-2xl font-bold ${stats.bajoStock > 0 ? 'text-red-400' : 'text-slate-500'}`}>{stats.bajoStock}</div>
          <div className="text-xs text-slate-400">Stock bajo</div>
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className="bg-iados-card rounded-xl p-4 mb-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-400" /> Resultado
            </span>
            <button onClick={() => setImportResult(null)}><X size={16} className="text-slate-400" /></button>
          </div>
          <div className="flex gap-4 text-sm">
            <span><span className="text-green-400 font-bold">{importResult.success}</span> creados</span>
            <span><span className="text-blue-400 font-bold">{importResult.updated}</span> actualizados</span>
            <span><span className="text-red-400 font-bold">{importResult.errors?.length || 0}</span> errores</span>
            <span className="text-slate-500">de {importResult.total} filas</span>
          </div>
          {importResult.columns?.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">Columnas: {importResult.columns.join(', ')}</p>
          )}
          {importResult.errors?.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto text-xs">
              {importResult.errors.map((e: any, i: number) => (
                <div key={i} className="text-red-400">Fila {e.fila}: {e.error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="bg-iados-card rounded-xl p-6 mb-4 border border-dashed border-slate-600 text-center">
          <Beef size={48} className="mx-auto mb-3 text-slate-600" />
          <h3 className="font-bold mb-2">Sin materia prima</h3>
          <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">
            Agrega insumos manualmente o descarga la plantilla CSV, llena tus datos e importa.
          </p>
        </div>
      )}

      {/* Search + actions */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU, categoria o proveedor..."
              className="w-full pl-10 pr-4 py-2 bg-iados-card rounded-xl border border-slate-700 focus:border-iados-primary outline-none text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-iados-card"><RefreshCw size={18} /></button>
            <button onClick={handleDeleteAll} className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/20" title="Eliminar todos"><Trash2 size={18} /></button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Cargando...</div>
      ) : items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="pb-3 pl-2">Nombre</th>
                <th className="pb-3">SKU</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3 text-right">Costo</th>
                <th className="pb-3 text-right">Stock</th>
                <th className="pb-3 text-right">Min</th>
                <th className="pb-3">Unidad</th>
                <th className="pb-3">Proveedor</th>
                <th className="pb-3 text-center w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const low = p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo;
                return (
                  <tr key={p.id} className={`border-b border-slate-800 hover:bg-iados-card/50 ${low ? 'bg-red-900/10' : ''}`}>
                    <td className="py-2.5 pl-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        {p.nombre}
                        {low && <AlertTriangle size={14} className="text-red-400" />}
                      </div>
                      {p.descripcion && <div className="text-xs text-slate-500 truncate max-w-[200px]">{p.descripcion}</div>}
                    </td>
                    <td className="py-2.5 text-slate-400 font-mono text-xs">{p.sku}</td>
                    <td className="py-2.5">
                      <span className="text-xs px-2 py-0.5 bg-iados-card rounded-full text-slate-300">{p.categoria || '-'}</span>
                    </td>
                    <td className="py-2.5 text-right">${Number(p.costo || 0).toFixed(2)}</td>
                    <td className={`py-2.5 text-right font-bold ${low ? 'text-red-400' : ''}`}>{p.stock_actual ?? 0}</td>
                    <td className="py-2.5 text-right text-slate-500">{p.stock_minimo ?? 0}</td>
                    <td className="py-2.5 text-slate-400">{p.unidad}</td>
                    <td className="py-2.5 text-slate-400 text-xs truncate max-w-[120px]">{p.proveedor || '-'}</td>
                    <td className="py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1 hover:bg-iados-card rounded text-slate-400 hover:text-white"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteConfirm(p)} className="p-1 hover:bg-red-900/30 rounded text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && search && (
            <div className="text-center py-8 text-slate-500 text-sm">Sin resultados para "{search}"</div>
          )}
        </div>
      )}

      {/* Modal: Crear/Editar */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowForm(false)}>
          <div className="bg-iados-surface rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editItem ? 'Editar' : 'Nueva'} Materia Prima</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">SKU *</label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="input-touch" placeholder="MP-001" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Categoria</label>
                  <input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="input-touch" placeholder="Mariscos" list="cat-list" />
                  <datalist id="cat-list">
                    {categorias.map(c => <option key={c} value={c!} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="input-touch" placeholder="Camaron Grande" />
              </div>

              <div>
                <label className="text-xs text-slate-400">Descripcion</label>
                <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="input-touch" placeholder="Opcional" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Costo</label>
                  <input type="number" step="0.01" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} className="input-touch" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Unidad</label>
                  <select value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} className="input-touch">
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lt">lt</option>
                    <option value="ml">ml</option>
                    <option value="pza">pza</option>
                    <option value="paq">paq</option>
                    <option value="caja">caja</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Proveedor</label>
                  <input value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} className="input-touch" placeholder="Opcional" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Stock actual</label>
                  <input type="number" step="0.01" value={form.stock_actual} onChange={e => setForm({ ...form, stock_actual: e.target.value })} className="input-touch" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Stock minimo</label>
                  <input type="number" step="0.01" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} className="input-touch" placeholder="0" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Notas</label>
                <input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="input-touch" placeholder="Opcional" />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-iados-card rounded-xl text-slate-400">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-iados-primary rounded-xl text-white font-medium flex items-center justify-center gap-1.5">
                <Save size={16} /> {editItem ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-iados-surface rounded-2xl p-6 w-full max-w-sm mx-4 border border-slate-700 text-center" onClick={e => e.stopPropagation()}>
            <Trash2 size={36} className="mx-auto text-red-400 mb-3" />
            <h3 className="font-bold mb-1">Eliminar</h3>
            <p className="text-sm text-slate-400 mb-4">{deleteConfirm.nombre} ({deleteConfirm.sku})</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-iados-card rounded-xl text-slate-400">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 rounded-xl text-white font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
