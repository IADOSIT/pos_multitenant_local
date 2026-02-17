import { useState, useEffect } from 'react';
import { tenantsApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Building2, Plus, ChevronRight, Edit2 } from 'lucide-react';

export default function TenantsAdmin() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', razon_social: '', rfc: '', email: '', telefono: '' });

  useEffect(() => { load(); }, []);

  const load = async () => { try { const { data } = await tenantsApi.list(); setTenants(data); } catch {} };

  const handleSave = async () => {
    try {
      if (selected) { await tenantsApi.update(selected.id, form); toast.success('Actualizado'); }
      else { await tenantsApi.create(form); toast.success('Creado'); }
      setShowForm(false); setSelected(null); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleView = async (id: number) => {
    try { const { data } = await tenantsApi.get(id); setSelected(data); } catch {}
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 size={24} /> Tenants</h1>
        <button onClick={() => { setShowForm(true); setSelected(null); setForm({ nombre: '', razon_social: '', rfc: '', email: '', telefono: '' }); }} className="btn-primary text-sm">
          <Plus size={16} className="mr-1" />Nuevo
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {tenants.map((t) => (
            <div key={t.id} onClick={() => handleView(t.id)} className="card flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-iados-secondary">
              <div className="w-12 h-12 bg-iados-primary rounded-xl flex items-center justify-center font-bold text-lg">
                {t.nombre.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{t.nombre}</p>
                <p className="text-xs text-slate-400">{t.empresas?.length || 0} empresas | {t.slug}</p>
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </div>
          ))}
        </div>

        {selected && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{selected.nombre}</h3>
              <button onClick={() => { setForm(selected); setShowForm(true); }} className="btn-secondary text-sm"><Edit2 size={14} className="mr-1" />Editar</button>
            </div>
            <div className="space-y-1 text-sm mb-4">
              <p><span className="text-slate-400">Slug:</span> {selected.slug}</p>
              <p><span className="text-slate-400">RFC:</span> {selected.rfc || '-'}</p>
              <p><span className="text-slate-400">Email:</span> {selected.email || '-'}</p>
            </div>
            <h4 className="font-bold text-sm mb-2">Empresas</h4>
            {selected.empresas?.map((e: any) => (
              <div key={e.id} className="bg-iados-card p-3 rounded-xl mb-2">
                <p className="font-medium">{e.nombre}</p>
                <p className="text-xs text-slate-400">{e.tiendas?.length || 0} tiendas</p>
                {e.tiendas?.map((t: any) => (
                  <p key={t.id} className="text-xs text-slate-500 ml-4">• {t.nombre}</p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-3">
            <h3 className="text-lg font-bold">{selected ? 'Editar' : 'Nuevo'} Tenant</h3>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="input-touch" />
            <input value={form.razon_social} onChange={(e) => setForm({ ...form, razon_social: e.target.value })} placeholder="Razón social" className="input-touch" />
            <input value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value })} placeholder="RFC" className="input-touch" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input-touch" />
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono" className="input-touch" />
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(false); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
