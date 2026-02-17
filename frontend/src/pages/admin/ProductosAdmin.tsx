import { useState, useEffect, useRef } from 'react';
import { productosApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Plus, Upload, Download, Search, Edit2, Package } from 'lucide-react';

export default function ProductosAdmin() {
  const [productos, setProductos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ sku: '', nombre: '', descripcion: '', precio: '', costo: '', categoria_id: '', impuesto_pct: '16', unidad: 'pza' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const { data } = await productosApi.list(); setProductos(data); } catch {}
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await productosApi.update(editItem.id, { ...form, precio: Number(form.precio), costo: Number(form.costo) });
        toast.success('Producto actualizado');
      } else {
        await productosApi.create({ ...form, precio: Number(form.precio), costo: Number(form.costo) });
        toast.success('Producto creado');
      }
      setShowForm(false); setEditItem(null); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleEdit = (p: any) => {
    setEditItem(p);
    setForm({ sku: p.sku, nombre: p.nombre, descripcion: p.descripcion || '', precio: String(p.precio), costo: String(p.costo || ''), categoria_id: String(p.categoria_id || ''), impuesto_pct: String(p.impuesto_pct || 16), unidad: p.unidad || 'pza' });
    setShowForm(true);
  };

  const handleCSVDownload = async () => {
    try {
      const { data } = await productosApi.csvTemplate();
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = 'productos_template.csv'; a.click();
    } catch { toast.error('Error al descargar'); }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await productosApi.csvImport(file, true);
      setImportResult(data);
      toast.success(`Importados: ${data.success}, Actualizados: ${data.updated}`);
      load();
    } catch (err: any) { toast.error('Error en importación'); }
  };

  const filtered = productos.filter((p) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Package size={24} /> Productos</h1>
        <div className="flex gap-2">
          <button onClick={handleCSVDownload} className="btn-secondary text-sm"><Download size={16} className="mr-1" />CSV Template</button>
          <button onClick={() => fileRef.current?.click()} className="btn-secondary text-sm"><Upload size={16} className="mr-1" />Importar CSV</button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ sku: '', nombre: '', descripcion: '', precio: '', costo: '', categoria_id: '', impuesto_pct: '16', unidad: 'pza' }); }} className="btn-primary text-sm">
            <Plus size={16} className="mr-1" />Nuevo
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." className="input-touch pl-10" />
      </div>

      {importResult && (
        <div className="card mb-4 text-sm">
          <p className="font-bold mb-2">Resultado importación: {importResult.success} creados, {importResult.updated} actualizados, {importResult.errors?.length || 0} errores</p>
          {importResult.errors?.slice(0, 5).map((e: any, i: number) => (
            <p key={i} className="text-red-400">Fila {e.fila}: {e.error}</p>
          ))}
          <button onClick={() => setImportResult(null)} className="text-xs text-slate-400 mt-2">Cerrar</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700">
              <th className="p-3">SKU</th><th className="p-3">Nombre</th><th className="p-3">Precio</th><th className="p-3">Categoría</th><th className="p-3">Estado</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-800 hover:bg-iados-card/50">
                <td className="p-3 font-mono text-xs">{p.sku}</td>
                <td className="p-3">{p.nombre}</td>
                <td className="p-3 text-green-400 font-bold">${Number(p.precio).toFixed(2)}</td>
                <td className="p-3">{p.categoria?.nombre || '-'}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${p.activo ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td className="p-3"><button onClick={() => handleEdit(p)} className="p-2 hover:bg-iados-card rounded-lg"><Edit2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-3">
            <h3 className="text-lg font-bold">{editItem ? 'Editar' : 'Nuevo'} Producto</h3>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU" className="input-touch" />
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="input-touch" />
            <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción" className="input-touch" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="Precio" type="number" className="input-touch" />
              <input value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} placeholder="Costo" type="number" className="input-touch" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.impuesto_pct} onChange={(e) => setForm({ ...form, impuesto_pct: e.target.value })} placeholder="IVA %" type="number" className="input-touch" />
              <input value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} placeholder="Unidad" className="input-touch" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
