import { useState, useEffect } from 'react';
import { usersApi, tenantsApi, empresasApi, tiendasApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';
import { Plus, Users, Shield, UserCheck, UserX, Trash2, Edit2 } from 'lucide-react';

export default function UsuariosAdmin() {
  const { user } = useAuthStore();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);

  // Wizard data
  const [tenants, setTenants] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({ nombre: '', email: '', password: '', rol: 'cajero', pin: '', tenant_id: '', empresa_id: '', tienda_id: '' });
  const [editEmpresas, setEditEmpresas] = useState<any[]>([]);
  const [editTiendas, setEditTiendas] = useState<any[]>([]);
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', rol: 'cajero', pin: '',
    tenant_id: '', empresa_id: '', tienda_id: '',
    nuevo_tenant: null as any, nueva_empresa: null as any, nueva_tienda: null as any,
    crearTenant: false, crearEmpresa: false, crearTienda: false,
    tenantNombre: '', empresaNombre: '', tiendaNombre: '', tiendaDireccion: '',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const { data } = await usersApi.list(); setUsuarios(data); } catch {}
    if (user?.rol === 'superadmin') {
      try { const { data } = await tenantsApi.list(); setTenants(data); } catch {}
    }
  };

  const loadEmpresas = async (tenantId: number) => {
    try { const { data } = await empresasApi.list(); setEmpresas(data.filter((e: any) => e.tenant_id === tenantId)); } catch {}
  };

  const loadTiendas = async (empresaId: number) => {
    try { const { data } = await tiendasApi.list(); setTiendas(data.filter((t: any) => t.empresa_id === empresaId)); } catch {}
  };

  const handleSave = async () => {
    const payload: any = {
      nombre: form.nombre, email: form.email, password: form.password,
      rol: form.rol, pin: form.pin || undefined,
    };

    if (form.crearTenant) {
      payload.nuevo_tenant = { nombre: form.tenantNombre };
    } else { payload.tenant_id = Number(form.tenant_id) || undefined; }

    if (form.crearEmpresa) {
      payload.nueva_empresa = { nombre: form.empresaNombre };
    } else { payload.empresa_id = Number(form.empresa_id) || undefined; }

    if (form.crearTienda) {
      payload.nueva_tienda = { nombre: form.tiendaNombre, direccion: form.tiendaDireccion };
    } else { payload.tienda_id = Number(form.tienda_id) || undefined; }

    try {
      await usersApi.createWizard(payload);
      toast.success('Usuario creado');
      setShowWizard(false); setStep(1); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleToggle = async (id: number) => {
    try { await usersApi.toggle(id); load(); toast.success('Estado actualizado'); } catch {}
  };

  const handleDelete = async (u: any) => {
    try {
      await usersApi.delete(u.id);
      toast.success('Usuario eliminado');
      setDeleteConfirm(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al eliminar'); }
  };

  const handleEdit = async (u: any) => {
    setEditItem(u);
    setEditForm({
      nombre: u.nombre, email: u.email, password: '', rol: u.rol, pin: u.pin || '',
      tenant_id: String(u.tenant_id || ''), empresa_id: String(u.empresa_id || ''), tienda_id: String(u.tienda_id || ''),
    });
    // Load tenants for superadmin
    if (user?.rol === 'superadmin' && tenants.length === 0) {
      try { const { data } = await tenantsApi.list(); setTenants(data); } catch {}
    }
    // Load empresas/tiendas for current user's scope
    if (u.tenant_id) {
      try { const { data } = await empresasApi.list(); setEditEmpresas(data.filter((e: any) => e.tenant_id === u.tenant_id)); } catch {}
    }
    if (u.empresa_id) {
      try { const { data } = await tiendasApi.list(); setEditTiendas(data.filter((t: any) => t.empresa_id === u.empresa_id)); } catch {}
    }
    setShowEdit(true);
  };

  const handleEditTenantChange = async (tenantId: string) => {
    setEditForm({ ...editForm, tenant_id: tenantId, empresa_id: '', tienda_id: '' });
    setEditTiendas([]);
    if (tenantId) {
      try { const { data } = await empresasApi.list(); setEditEmpresas(data.filter((e: any) => e.tenant_id === Number(tenantId))); } catch {}
    } else { setEditEmpresas([]); }
  };

  const handleEditEmpresaChange = async (empresaId: string) => {
    setEditForm({ ...editForm, empresa_id: empresaId, tienda_id: '' });
    if (empresaId) {
      try { const { data } = await tiendasApi.list(); setEditTiendas(data.filter((t: any) => t.empresa_id === Number(empresaId))); } catch {}
    } else { setEditTiendas([]); }
  };

  const handleUpdate = async () => {
    try {
      const payload: any = { nombre: editForm.nombre, email: editForm.email, rol: editForm.rol, pin: editForm.pin || undefined };
      if (editForm.password) payload.password = editForm.password;
      if (editForm.tenant_id) payload.tenant_id = Number(editForm.tenant_id);
      if (editForm.empresa_id) payload.empresa_id = Number(editForm.empresa_id);
      if (editForm.tienda_id) payload.tienda_id = Number(editForm.tienda_id);
      await usersApi.update(editItem.id, payload);
      toast.success('Usuario actualizado');
      setShowEdit(false); setEditItem(null); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al actualizar'); }
  };

  const rolColors: Record<string, string> = {
    superadmin: 'bg-purple-600', admin: 'bg-blue-600', manager: 'bg-cyan-600', cajero: 'bg-green-600', mesero: 'bg-amber-600',
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users size={24} /> Usuarios</h1>
        <button onClick={() => setShowWizard(true)} className="btn-primary text-sm"><Plus size={16} className="mr-1" />Nuevo (Wizard)</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-slate-700">
            <th className="p-3">Nombre</th><th className="p-3">Email</th><th className="p-3">Rol</th><th className="p-3">Tenant/Empresa/Tienda</th><th className="p-3">Estado</th><th className="p-3"></th>
          </tr></thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-slate-800 hover:bg-iados-card/50">
                <td className="p-3 font-medium">{u.nombre}</td>
                <td className="p-3 text-slate-400">{u.email}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs text-white ${rolColors[u.rol] || 'bg-slate-600'}`}>{u.rol}</span></td>
                <td className="p-3 text-xs text-slate-400">{u.tenant_id}/{u.empresa_id}/{u.tienda_id}</td>
                <td className="p-3">
                  <button onClick={() => handleToggle(u.id)} className={`flex items-center gap-1 text-xs ${u.activo ? 'text-green-400' : 'text-red-400'}`}>
                    {u.activo ? <><UserCheck size={14} /> Activo</> : <><UserX size={14} /> Inactivo</>}
                  </button>
                </td>
                <td className="p-3 flex gap-1">
                  <button onClick={() => handleEdit(u)} className="p-2 hover:bg-iados-card rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => setDeleteConfirm(u)} className="p-2 hover:bg-red-900/50 rounded-lg text-red-400"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Crear Usuario - Paso {step}/4</h3>

            {/* Progress */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded ${s <= step ? 'bg-iados-primary' : 'bg-iados-card'}`} />
              ))}
            </div>

            {step === 1 && (<>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" className="input-touch" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="input-touch" />
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contraseña" type="password" className="input-touch" />
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} className="input-touch">
                <option value="cajero">Cajero</option><option value="mesero">Mesero</option>
                <option value="manager">Manager</option><option value="admin">Admin</option>
                {user?.rol === 'superadmin' && <option value="superadmin">SuperAdmin</option>}
              </select>
              <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder="PIN (opcional)" className="input-touch" />
            </>)}

            {step === 2 && user?.rol === 'superadmin' && (<>
              <h4 className="font-medium">Tenant (Corporativo)</h4>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.crearTenant} onChange={(e) => setForm({ ...form, crearTenant: e.target.checked })} className="w-5 h-5" /> Crear nuevo</label>
              {form.crearTenant ? (
                <input value={form.tenantNombre} onChange={(e) => setForm({ ...form, tenantNombre: e.target.value })} placeholder="Nombre del tenant" className="input-touch" />
              ) : (
                <select value={form.tenant_id} onChange={(e) => { setForm({ ...form, tenant_id: e.target.value }); loadEmpresas(Number(e.target.value)); }} className="input-touch">
                  <option value="">Seleccionar...</option>
                  {tenants.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              )}
            </>)}

            {step === 3 && (<>
              <h4 className="font-medium">Empresa</h4>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.crearEmpresa} onChange={(e) => setForm({ ...form, crearEmpresa: e.target.checked })} className="w-5 h-5" /> Crear nueva</label>
              {form.crearEmpresa ? (
                <input value={form.empresaNombre} onChange={(e) => setForm({ ...form, empresaNombre: e.target.value })} placeholder="Nombre empresa" className="input-touch" />
              ) : (
                <select value={form.empresa_id} onChange={(e) => { setForm({ ...form, empresa_id: e.target.value }); loadTiendas(Number(e.target.value)); }} className="input-touch">
                  <option value="">Seleccionar...</option>
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              )}
            </>)}

            {step === 4 && (<>
              <h4 className="font-medium">Tienda</h4>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.crearTienda} onChange={(e) => setForm({ ...form, crearTienda: e.target.checked })} className="w-5 h-5" /> Crear nueva</label>
              {form.crearTienda ? (<>
                <input value={form.tiendaNombre} onChange={(e) => setForm({ ...form, tiendaNombre: e.target.value })} placeholder="Nombre tienda" className="input-touch" />
                <input value={form.tiendaDireccion} onChange={(e) => setForm({ ...form, tiendaDireccion: e.target.value })} placeholder="Dirección" className="input-touch" />
              </>) : (
                <select value={form.tienda_id} onChange={(e) => setForm({ ...form, tienda_id: e.target.value })} className="input-touch">
                  <option value="">Seleccionar...</option>
                  {tiendas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              )}
            </>)}

            <div className="flex gap-2">
              <button onClick={() => { if (step === 1) setShowWizard(false); else setStep(step - 1); }} className="btn-secondary flex-1">
                {step === 1 ? 'Cancelar' : 'Anterior'}
              </button>
              {step < 4 ? (
                <button onClick={() => setStep(step + 1)} className="btn-primary flex-1">Siguiente</button>
              ) : (
                <button onClick={handleSave} className="btn-success flex-1">Crear Usuario</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEdit && editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card max-w-md w-full space-y-3 my-4">
            <h3 className="text-lg font-bold">Editar Usuario</h3>
            <input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} placeholder="Nombre completo" className="input-touch" />
            <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" type="email" className="input-touch" />
            <input value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Nueva contraseña (dejar vacio para no cambiar)" type="password" className="input-touch" />
            <select value={editForm.rol} onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })} className="input-touch">
              <option value="cajero">Cajero</option><option value="mesero">Mesero</option>
              <option value="manager">Manager</option><option value="admin">Admin</option>
              {user?.rol === 'superadmin' && <option value="superadmin">SuperAdmin</option>}
            </select>
            <input value={editForm.pin} onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })} placeholder="PIN" className="input-touch" />

            {/* Asignacion Tenant/Empresa/Tienda */}
            <div className="border-t border-slate-700 pt-3 space-y-3">
              <h4 className="text-sm font-semibold text-slate-300">Asignacion</h4>

              {/* Tenant - solo superadmin puede cambiar */}
              {user?.rol === 'superadmin' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tenant</label>
                  <select value={editForm.tenant_id} onChange={(e) => handleEditTenantChange(e.target.value)} className="input-touch">
                    <option value="">Seleccionar...</option>
                    {tenants.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
              )}

              {/* Empresa - superadmin y admin */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Empresa</label>
                <select value={editForm.empresa_id} onChange={(e) => handleEditEmpresaChange(e.target.value)} className="input-touch">
                  <option value="">Seleccionar...</option>
                  {editEmpresas.map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>

              {/* Tienda */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tienda</label>
                <select value={editForm.tienda_id} onChange={(e) => setEditForm({ ...editForm, tienda_id: e.target.value })} className="input-touch">
                  <option value="">Seleccionar...</option>
                  {editTiendas.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setShowEdit(false); setEditItem(null); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleUpdate} className="btn-primary flex-1">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminacion */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full text-center space-y-4">
            <Trash2 size={40} className="mx-auto text-red-400" />
            <h3 className="text-lg font-bold">Eliminar Usuario</h3>
            <p className="text-slate-400">Seguro que deseas eliminar a <strong>{deleteConfirm.nombre}</strong>?</p>
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
