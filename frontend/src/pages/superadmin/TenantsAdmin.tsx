import { useState, useEffect } from 'react';
import { tenantsApi, tiendasApi, empresasApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Building2, Plus, ChevronRight, Edit2, Trash2, Store, X } from 'lucide-react';

export default function TenantsAdmin() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'tenant' | 'tienda'>('tenant');
  const [form, setForm] = useState({ nombre: '', razon_social: '', rfc: '', email: '', telefono: '' });

  // Tienda state
  const [showTiendaForm, setShowTiendaForm] = useState(false);
  const [editingTienda, setEditingTienda] = useState<any>(null);
  const [tiendaForm, setTiendaForm] = useState({ nombre: '', direccion: '', telefono: '', email: '' });
  const [tiendaEmpresa, setTiendaEmpresa] = useState<any>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const { data } = await tenantsApi.list(); setTenants(data); } catch {}
  };

  const handleView = async (id: number) => {
    try { const { data } = await tenantsApi.get(id); setSelected(data); } catch {}
  };

  const refreshSelected = () => { if (selected) handleView(selected.id); };

  // ---- Tenant CRUD ----
  const handleSave = async () => {
    try {
      if (editingTenant && selected) {
        await tenantsApi.update(selected.id, form);
        toast.success('Tenant actualizado');
      } else {
        await tenantsApi.create(form);
        toast.success('Tenant creado');
      }
      setShowForm(false);
      setEditingTenant(false);
      load();
      if (editingTenant && selected) handleView(selected.id);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleDeleteTenant = async (t: any) => {
    try {
      await tenantsApi.delete(t.id);
      toast.success('Tenant eliminado');
      setDeleteConfirm(null);
      if (selected?.id === t.id) setSelected(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al eliminar'); }
  };

  // ---- Tienda CRUD ----
  const openNewTienda = (empresa: any) => {
    setTiendaEmpresa(empresa);
    setEditingTienda(null);
    setTiendaForm({ nombre: '', direccion: '', telefono: '', email: '' });
    setShowTiendaForm(true);
  };

  const openEditTienda = (tienda: any, empresa: any) => {
    setTiendaEmpresa(empresa);
    setEditingTienda(tienda);
    setTiendaForm({
      nombre: tienda.nombre || '',
      direccion: tienda.direccion || '',
      telefono: tienda.telefono || '',
      email: tienda.email || '',
    });
    setShowTiendaForm(true);
  };

  const handleSaveTienda = async () => {
    try {
      if (editingTienda) {
        await tiendasApi.update(editingTienda.id, tiendaForm);
        toast.success('Tienda actualizada');
      } else {
        await tiendasApi.create({
          ...tiendaForm,
          tenant_id: selected.id,
          empresa_id: tiendaEmpresa.id,
        });
        toast.success('Tienda creada');
      }
      setShowTiendaForm(false);
      refreshSelected();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleDeleteTienda = async (tienda: any) => {
    try {
      await tiendasApi.delete(tienda.id);
      toast.success('Tienda eliminada');
      setDeleteConfirm(null);
      refreshSelected();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al eliminar'); }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 size={24} /> Tenants</h1>
        <button onClick={() => {
          setShowForm(true);
          setEditingTenant(false);
          setForm({ nombre: '', razon_social: '', rfc: '', email: '', telefono: '' });
        }} className="btn-primary text-sm">
          <Plus size={16} className="mr-1" />Nuevo
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Lista tenants */}
        <div className="space-y-3">
          {tenants.map((t) => (
            <div key={t.id} onClick={() => handleView(t.id)}
              className={`card flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-iados-secondary ${selected?.id === t.id ? 'ring-2 ring-iados-primary' : ''}`}>
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
          {tenants.length === 0 && <p className="text-slate-500 text-center py-8">No hay tenants</p>}
        </div>

        {/* Detalle tenant */}
        {selected && (
          <div className="card max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{selected.nombre}</h3>
              <div className="flex gap-2">
                <button onClick={() => {
                  setForm({
                    nombre: selected.nombre || '',
                    razon_social: selected.razon_social || '',
                    rfc: selected.rfc || '',
                    email: selected.email || '',
                    telefono: selected.telefono || '',
                  });
                  setEditingTenant(true);
                  setShowForm(true);
                }} className="btn-secondary text-sm"><Edit2 size={14} className="mr-1" />Editar</button>
                <button onClick={() => { setDeleteConfirm(selected); setDeleteType('tenant'); }}
                  className="p-2 hover:bg-red-900/50 rounded-lg text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="space-y-1 text-sm mb-4">
              <p><span className="text-slate-400">ID:</span> {selected.id}</p>
              <p><span className="text-slate-400">Slug:</span> {selected.slug}</p>
              <p><span className="text-slate-400">RFC:</span> {selected.rfc || '-'}</p>
              <p><span className="text-slate-400">Email:</span> {selected.email || '-'}</p>
              <p><span className="text-slate-400">Telefono:</span> {selected.telefono || '-'}</p>
            </div>

            <h4 className="font-bold text-sm mb-2">Empresas y Tiendas</h4>
            {selected.empresas?.map((emp: any) => (
              <div key={emp.id} className="bg-iados-card p-3 rounded-xl mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{emp.nombre}</p>
                    <p className="text-xs text-slate-400">{emp.tiendas?.length || 0} tiendas</p>
                  </div>
                  <button onClick={() => openNewTienda(emp)} className="text-xs bg-iados-primary/30 hover:bg-iados-primary/50 text-iados-primary px-2 py-1 rounded-lg flex items-center gap-1">
                    <Plus size={12} /> Tienda
                  </button>
                </div>
                {emp.tiendas?.map((tienda: any) => (
                  <div key={tienda.id} className="flex items-center gap-2 ml-2 py-1.5 border-t border-slate-700/50">
                    <Store size={14} className="text-slate-400" />
                    <div className="flex-1">
                      <span className="text-sm">{tienda.nombre}</span>
                      {tienda.direccion && <span className="text-xs text-slate-500 ml-2">{tienda.direccion}</span>}
                    </div>
                    <button onClick={() => openEditTienda(tienda, emp)} className="p-1 hover:bg-slate-600/50 rounded text-slate-400 hover:text-white">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => { setDeleteConfirm(tienda); setDeleteType('tienda'); }}
                      className="p-1 hover:bg-red-900/50 rounded text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {(!emp.tiendas || emp.tiendas.length === 0) && (
                  <p className="text-xs text-slate-500 ml-2 mt-1">Sin tiendas</p>
                )}
              </div>
            ))}
            {(!selected.empresas || selected.empresas.length === 0) && (
              <p className="text-sm text-slate-500">Sin empresas</p>
            )}
          </div>
        )}
      </div>

      {/* Modal Tenant Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingTenant ? 'Editar' : 'Nuevo'} Tenant</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="input-touch" />
            <input value={form.razon_social} onChange={(e) => setForm({ ...form, razon_social: e.target.value })} placeholder="Razon social" className="input-touch" />
            <input value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value })} placeholder="RFC" className="input-touch" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input-touch" />
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Telefono" className="input-touch" />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tienda Form */}
      {showTiendaForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingTienda ? 'Editar' : 'Nueva'} Tienda</h3>
              <button onClick={() => setShowTiendaForm(false)}><X size={20} /></button>
            </div>
            <p className="text-xs text-slate-400">Empresa: {tiendaEmpresa?.nombre}</p>
            <input value={tiendaForm.nombre} onChange={(e) => setTiendaForm({ ...tiendaForm, nombre: e.target.value })} placeholder="Nombre de la tienda" className="input-touch" />
            <input value={tiendaForm.direccion} onChange={(e) => setTiendaForm({ ...tiendaForm, direccion: e.target.value })} placeholder="Direccion" className="input-touch" />
            <input value={tiendaForm.telefono} onChange={(e) => setTiendaForm({ ...tiendaForm, telefono: e.target.value })} placeholder="Telefono" className="input-touch" />
            <input value={tiendaForm.email} onChange={(e) => setTiendaForm({ ...tiendaForm, email: e.target.value })} placeholder="Email" className="input-touch" />
            <div className="flex gap-2">
              <button onClick={() => setShowTiendaForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSaveTienda} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminacion */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full text-center space-y-4">
            <Trash2 size={40} className="mx-auto text-red-400" />
            <h3 className="text-lg font-bold">Eliminar {deleteType === 'tenant' ? 'Tenant' : 'Tienda'}</h3>
            <p className="text-slate-400">Seguro que deseas eliminar <strong>{deleteConfirm.nombre}</strong>?</p>
            {deleteType === 'tenant' && (
              <p className="text-xs text-red-400">Esto eliminara todas las empresas, tiendas, usuarios y datos asociados.</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => deleteType === 'tenant' ? handleDeleteTenant(deleteConfirm) : handleDeleteTienda(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
