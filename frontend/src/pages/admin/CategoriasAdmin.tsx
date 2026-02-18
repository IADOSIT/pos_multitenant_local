import { useState, useEffect, useRef } from 'react';
import { categoriasApi, productosApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Plus, Edit2, Tag, Trash2, Search, X, Image, ImagePlus } from 'lucide-react';

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imageResults, setImageResults] = useState<any[]>([]);
  const [imageQuery, setImageQuery] = useState('');
  const [searchingImages, setSearchingImages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ nombre: '', color: '#3b82f6', icono: '', orden: '0', es_seccion_especial: false, tipo_seccion: '', imagen_url: '' });

  useEffect(() => { load(); }, []);

  const load = async () => { try { const { data } = await categoriasApi.list(); setCategorias(data); } catch {} };

  const handleSave = async () => {
    try {
      const payload = { ...form, orden: Number(form.orden) };
      if (editItem) { await categoriasApi.update(editItem.id, payload); toast.success('Actualizada'); }
      else { await categoriasApi.create(payload); toast.success('Creada'); }
      setShowForm(false); setEditItem(null); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleEdit = (c: any) => {
    setEditItem(c);
    setForm({ nombre: c.nombre, color: c.color || '#3b82f6', icono: c.icono || '', orden: String(c.orden), es_seccion_especial: c.es_seccion_especial, tipo_seccion: c.tipo_seccion || '', imagen_url: c.imagen_url || '' });
    setShowForm(true);
  };

  const handleDelete = async (c: any) => {
    try {
      await categoriasApi.delete(c.id);
      toast.success('Categoria eliminada');
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

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Tag size={24} /> Categorias</h1>
        <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ nombre: '', color: '#3b82f6', icono: '', orden: '0', es_seccion_especial: false, tipo_seccion: '', imagen_url: '' }); }} className="btn-primary text-sm">
          <Plus size={16} className="mr-1" />Nueva
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categorias.map((c) => (
          <div key={c.id} className="card flex items-center gap-3">
            {c.imagen_url ? (
              <img src={c.imagen_url} alt={c.nombre} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: c.color || '#3b82f6' }}>
                {c.nombre.charAt(0)}
              </div>
            )}
            <div className="flex-1 cursor-pointer" onClick={() => handleEdit(c)}>
              <p className="font-medium">{c.nombre}</p>
              <p className="text-xs text-slate-400">Orden: {c.orden} {c.es_seccion_especial && `| ${c.tipo_seccion}`}</p>
            </div>
            <button onClick={() => handleEdit(c)} className="p-2 hover:bg-iados-card rounded-lg"><Edit2 size={16} className="text-slate-500" /></button>
            <button onClick={() => setDeleteConfirm(c)} className="p-2 hover:bg-red-900/50 rounded-lg text-red-400"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      {/* Modal Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">{editItem ? 'Editar' : 'Nueva'} Categoria</h3>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="input-touch" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400">Color</label>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-12 rounded-xl cursor-pointer" />
              </div>
              <input value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} placeholder="Orden" type="number" className="input-touch" />
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

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.es_seccion_especial} onChange={(e) => setForm({ ...form, es_seccion_especial: e.target.checked })} className="w-5 h-5 rounded" />
              <span className="text-sm">Seccion especial (Bebidas/Postres/Extras)</span>
            </label>
            {form.es_seccion_especial && (
              <input value={form.tipo_seccion} onChange={(e) => setForm({ ...form, tipo_seccion: e.target.value })} placeholder="Tipo: bebidas, postres, adicionales" className="input-touch" />
            )}
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
            <h3 className="text-lg font-bold">Eliminar Categoria</h3>
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
