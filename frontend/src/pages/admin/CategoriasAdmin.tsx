import { useState, useEffect } from 'react';
import { categoriasApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Plus, Edit2, Tag } from 'lucide-react';

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ nombre: '', color: '#3b82f6', icono: '', orden: '0', es_seccion_especial: false, tipo_seccion: '' });

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
    setForm({ nombre: c.nombre, color: c.color || '#3b82f6', icono: c.icono || '', orden: String(c.orden), es_seccion_especial: c.es_seccion_especial, tipo_seccion: c.tipo_seccion || '' });
    setShowForm(true);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Tag size={24} /> Categorías</h1>
        <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ nombre: '', color: '#3b82f6', icono: '', orden: '0', es_seccion_especial: false, tipo_seccion: '' }); }} className="btn-primary text-sm">
          <Plus size={16} className="mr-1" />Nueva
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categorias.map((c) => (
          <div key={c.id} className="card flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-iados-secondary" onClick={() => handleEdit(c)}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: c.color || '#3b82f6' }}>
              {c.nombre.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium">{c.nombre}</p>
              <p className="text-xs text-slate-400">Orden: {c.orden} {c.es_seccion_especial && `| ${c.tipo_seccion}`}</p>
            </div>
            <Edit2 size={16} className="text-slate-500" />
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-3">
            <h3 className="text-lg font-bold">{editItem ? 'Editar' : 'Nueva'} Categoría</h3>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="input-touch" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400">Color</label>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-12 rounded-xl cursor-pointer" />
              </div>
              <input value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} placeholder="Orden" type="number" className="input-touch" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.es_seccion_especial} onChange={(e) => setForm({ ...form, es_seccion_especial: e.target.checked })} className="w-5 h-5 rounded" />
              <span className="text-sm">Sección especial (Bebidas/Postres/Extras)</span>
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
    </div>
  );
}
