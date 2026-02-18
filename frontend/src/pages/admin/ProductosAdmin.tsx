import { useState, useEffect, useRef } from 'react';
import { productosApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Plus, Upload, Download, Search, Edit2, Package, Trash2, Image, X, ImagePlus } from 'lucide-react';

export default function ProductosAdmin() {
  const [productos, setProductos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imageResults, setImageResults] = useState<any[]>([]);
  const [imageQuery, setImageQuery] = useState('');
  const [searchingImages, setSearchingImages] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ sku: '', nombre: '', descripcion: '', precio: '', costo: '', categoria_id: '', impuesto_pct: '16', unidad: 'pza', imagen_url: '' });

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
    setForm({ sku: p.sku, nombre: p.nombre, descripcion: p.descripcion || '', precio: String(p.precio), costo: String(p.costo || ''), categoria_id: String(p.categoria_id || ''), impuesto_pct: String(p.impuesto_pct || 16), unidad: p.unidad || 'pza', imagen_url: p.imagen_url || '' });
    setShowForm(true);
  };

  const handleDelete = async (p: any) => {
    try {
      await productosApi.delete(p.id);
      toast.success('Producto eliminado');
      setDeleteConfirm(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al eliminar'); }
  };

  const handleImageSearch = async () => {
    const q = imageQuery || form.nombre;
    if (!q) return;
    setSearchingImages(true);
    try {
      const { data } = await productosApi.imageSearch(q);
      setImageResults(data);
    } catch { toast.error('Error buscando imagenes'); }
    finally { setSearchingImages(false); }
  };

  const selectImage = (url: string) => {
    setForm({ ...form, imagen_url: url });
    setShowImageSearch(false);
    setImageResults([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { data } = await productosApi.uploadImage(file);
      setForm({ ...form, imagen_url: data });
      toast.success('Imagen subida');
    } catch { toast.error('Error al subir imagen'); }
    finally { setUploadingImage(false); if (imageFileRef.current) imageFileRef.current.value = ''; }
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
    } catch (err: any) { toast.error('Error en importacion'); }
    if (fileRef.current) fileRef.current.value = '';
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
          <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ sku: '', nombre: '', descripcion: '', precio: '', costo: '', categoria_id: '', impuesto_pct: '16', unidad: 'pza', imagen_url: '' }); }} className="btn-primary text-sm">
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
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold">Resultado importacion</p>
            <button onClick={() => setImportResult(null)} className="text-xs text-slate-400 hover:text-white">Cerrar</button>
          </div>
          <p>
            <span className="text-green-400 font-bold">{importResult.success}</span> creados,{' '}
            <span className="text-blue-400 font-bold">{importResult.updated}</span> actualizados,{' '}
            <span className="text-red-400 font-bold">{importResult.errors?.length || 0}</span> errores{' '}
            (de {importResult.total} filas)
          </p>
          {importResult.columns?.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">Columnas detectadas: {importResult.columns.join(', ')}</p>
          )}
          {importResult.errors?.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto">
              {importResult.errors.slice(0, 10).map((e: any, i: number) => (
                <p key={i} className="text-red-400 text-xs">Fila {e.fila}: {e.error}</p>
              ))}
              {importResult.errors.length > 10 && <p className="text-xs text-slate-500">...y {importResult.errors.length - 10} mas</p>}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700">
              <th className="p-3">Img</th><th className="p-3">SKU</th><th className="p-3">Nombre</th><th className="p-3">Precio</th><th className="p-3">Categoria</th><th className="p-3">Estado</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-800 hover:bg-iados-card/50">
                <td className="p-3">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.nombre} className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center text-xs text-slate-400"><Image size={16} /></div>
                  )}
                </td>
                <td className="p-3 font-mono text-xs">{p.sku}</td>
                <td className="p-3">{p.nombre}</td>
                <td className="p-3 text-green-400 font-bold">${Number(p.precio).toFixed(2)}</td>
                <td className="p-3">{p.categoria?.nombre || '-'}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${p.activo ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td className="p-3 flex gap-1">
                  <button onClick={() => handleEdit(p)} className="p-2 hover:bg-iados-card rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => setDeleteConfirm(p)} className="p-2 hover:bg-red-900/50 rounded-lg text-red-400"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">{editItem ? 'Editar' : 'Nuevo'} Producto</h3>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU" className="input-touch" />
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="input-touch" />
            <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion" className="input-touch" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="Precio" type="number" className="input-touch" />
              <input value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} placeholder="Costo" type="number" className="input-touch" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.impuesto_pct} onChange={(e) => setForm({ ...form, impuesto_pct: e.target.value })} placeholder="IVA %" type="number" className="input-touch" />
              <input value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} placeholder="Unidad" className="input-touch" />
            </div>

            {/* Imagen */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Imagen</label>
              <div className="flex gap-2">
                <input value={form.imagen_url} onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} placeholder="URL de imagen" className="input-touch flex-1" />
                <button onClick={() => { setShowImageSearch(true); setImageQuery(form.nombre); handleImageSearch(); }} className="btn-secondary text-sm shrink-0" title="Buscar en Google">
                  <Search size={16} />
                </button>
                <button onClick={() => imageFileRef.current?.click()} disabled={uploadingImage} className="btn-secondary text-sm shrink-0" title="Subir imagen local">
                  <ImagePlus size={16} />
                </button>
                <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
              {form.imagen_url && (
                <img src={form.imagen_url} alt="Preview" className="w-20 h-20 object-cover rounded mt-2" />
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buscar Imagen */}
      {showImageSearch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="card max-w-2xl w-full space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Buscar Imagen</h3>
              <button onClick={() => setShowImageSearch(false)} className="p-2 hover:bg-iados-card rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex gap-2">
              <input value={imageQuery} onChange={(e) => setImageQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleImageSearch()} placeholder="Buscar..." className="input-touch flex-1" />
              <button onClick={handleImageSearch} disabled={searchingImages} className="btn-primary text-sm">
                {searchingImages ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {imageResults.map((img: any) => (
                <button key={img.id} onClick={() => selectImage(img.url)} className="rounded-lg overflow-hidden hover:ring-2 hover:ring-iados-secondary transition-all">
                  <img src={img.thumb} alt={img.alt} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
            {imageResults.length === 0 && !searchingImages && (
              <p className="text-center text-slate-500 text-sm">Escribe un termino y presiona Buscar</p>
            )}
            <p className="text-xs text-slate-500 text-center">Busqueda de imagenes en Google</p>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminacion */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full text-center space-y-4">
            <Trash2 size={40} className="mx-auto text-red-400" />
            <h3 className="text-lg font-bold">Eliminar Producto</h3>
            <p className="text-slate-400">Seguro que deseas eliminar <strong>{deleteConfirm.nombre}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
