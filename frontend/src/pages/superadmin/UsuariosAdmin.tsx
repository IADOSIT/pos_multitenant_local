import { useState, useEffect } from 'react';
import { usersApi, tenantsApi, empresasApi, tiendasApi, empleadosApi } from '../../api/endpoints';
import { getBioSocket } from '../../api/socket';
import { resolveUploadUrl } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';
import {
  Plus, Users, UserCheck, UserX, Trash2, Edit2,
  Briefcase, UserCog, Clock, Copy, RefreshCw, Settings,
  Fingerprint, CheckCircle, AlertCircle, Loader, X, Download,
} from 'lucide-react';

const ROL_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-600', admin: 'bg-blue-600', manager: 'bg-cyan-600',
  cajero: 'bg-green-600', mesero: 'bg-amber-600',
};

const ROLES_FOR = (myRol: string) => {
  if (myRol === 'superadmin') return ['cajero', 'mesero', 'manager', 'admin', 'superadmin'];
  if (myRol === 'admin')      return ['cajero', 'mesero', 'manager', 'admin'];
  return ['cajero', 'mesero', 'manager'];
};

const EMPTY_FORM = {
  nombre: '', email: '', password: '', rol: 'cajero', pin: '',
  tenant_id: '', empresa_id: '', tienda_id: '',
  crearTienda: false, tiendaNombre: '', tiendaDireccion: '',
  crearTenant: false, tenantNombre: '',
  crearEmpresa: false, empresaNombre: '',
};

import { usePageHeader } from '../../store/pageHeader.store';

export default function UsuariosAdmin() {
  usePageHeader({ title: 'Usuarios', subtitle: 'Cuentas y permisos del equipo' });
  const { user } = useAuthStore();
  const [usuarios, setUsuarios]   = useState<any[]>([]);
  const [tenants, setTenants]     = useState<any[]>([]);
  const [empresas, setEmpresas]   = useState<any[]>([]);
  const [tiendas, setTiendas]     = useState<any[]>([]);

  // Wizard
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep]             = useState(1);
  const [form, setForm]             = useState({ ...EMPTY_FORM });

  // Edit modal
  const [showEdit, setShowEdit]     = useState(false);
  const [editItem, setEditItem]     = useState<any>(null);
  const [editForm, setEditForm]     = useState({
    nombre: '', email: '', password: '', rol: 'cajero', pin: '',
    tenant_id: '', empresa_id: '', tienda_id: '',
  });
  const [editEmpresas, setEditEmpresas] = useState<any[]>([]);
  const [editTiendas, setEditTiendas]   = useState<any[]>([]);

  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  // ── Tab Empleados ──
  type AdminTab = 'usuarios' | 'empleados';
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios');
  const [empEnabled, setEmpEnabled] = useState(false);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [bioCfg, setBioCfg] = useState<any>(null);
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editEmp, setEditEmp] = useState<any>(null);
  const [empForm, setEmpForm] = useState({ nombre: '', apellido: '', cargo: '', departamento: '', email: '', telefono: '' });
  const [empFormStep, setEmpFormStep] = useState<'datos' | 'huella'>('datos');
  const [savingEmp, setSavingEmp] = useState(false);
  const [showHorario, setShowHorario] = useState<number | null>(null);
  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const [horarios, setHorarios] = useState<Record<number, { hora_entrada: string; tolerancia: number; activo: boolean }>>(
    Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(d => [d, { hora_entrada: '08:00', tolerancia: 10, activo: d >= 1 && d <= 5 }])),
  );
  // Enrollment state
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [enrollStatus, setEnrollStatus] = useState<'idle' | 'waiting' | 'success' | 'error'>('idle');
  const [enrollMsg, setEnrollMsg] = useState('');

  useEffect(() => {
    if (user?.empresa_id) {
      empresasApi.get(user.empresa_id)
        .then(r => setEmpEnabled(r.data?.config_especial?.empleados_enabled === true))
        .catch(() => {});
    }
  }, [user?.empresa_id]);

  const loadEmpleados = async () => {
    setEmpLoading(true);
    try {
      const [eR, cR] = await Promise.all([empleadosApi.list(), empleadosApi.getBioConfig()]);
      setEmpleados(eR.data || []);
      setBioCfg(cR.data);
    } catch (e: any) {
      if (e?.response?.status !== 403) toast.error('Error al cargar empleados');
    } finally { setEmpLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'empleados' && empEnabled) loadEmpleados();
  }, [activeTab, empEnabled]);

  const loadHorario = async (emp: any) => {
    try {
      const { data } = await empleadosApi.getHorario(emp.id);
      const base = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(d => [d, { hora_entrada: '08:00', tolerancia: 10, activo: false }]));
      for (const h of data || []) {
        base[h.dia_semana] = { hora_entrada: h.hora_entrada, tolerancia: h.tolerancia_minutos, activo: h.activo };
      }
      setHorarios(base);
      setShowHorario(emp.id);
    } catch { toast.error('Error al cargar horario'); }
  };

  const startEnrollment = (emp: any) => {
    if (!bioCfg?.empresa_token) { toast.error('Configura el biométrico primero'); return; }
    setEnrollingId(emp.id);
    setEnrollStatus('waiting');
    setEnrollMsg('Pide al empleado que coloque su dedo en el lector...');
    const sock = getBioSocket();
    sock.emit('live-join', { empresa_token: bioCfg.empresa_token });
    sock.emit('enroll-start', { empleado_id: emp.id, empresa_token: bioCfg.empresa_token });
    sock.once('enroll-result', (data: any) => {
      if (data.success) {
        setEnrollStatus('success');
        setEnrollMsg('Huella registrada correctamente');
        loadEmpleados();
        setTimeout(() => { setEnrollingId(null); setEnrollStatus('idle'); }, 2500);
      } else {
        setEnrollStatus('error');
        setEnrollMsg(data.reason || 'Error al registrar huella');
      }
    });
    // Timeout de 30s
    setTimeout(() => {
      setEnrollStatus((s) => {
        if (s === 'waiting') {
          setEnrollMsg('Tiempo agotado. El bridge no respondió.');
          return 'error';
        }
        return s;
      });
    }, 30000);
  };

  const handleGuardarEmp = async () => {
    setSavingEmp(true);
    try {
      const d = { ...empForm };
      const { data } = editEmp ? await empleadosApi.update(editEmp.id, d) : await empleadosApi.create(d);
      toast.success('Guardado');
      setEditEmp(data);
      setEmpFormStep('huella');
      loadEmpleados();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    } finally {
      setSavingEmp(false);
    }
  };

  const cerrarEmpForm = () => {
    setShowEmpForm(false);
    setEditEmp(null);
    setEmpFormStep('datos');
    if (enrollStatus !== 'waiting') { setEnrollingId(null); setEnrollStatus('idle'); }
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const { data } = await usersApi.list(); setUsuarios(data); } catch {}
    if (user?.rol === 'superadmin') {
      try { const { data } = await tenantsApi.list(); setTenants(data); } catch {}
    }
  };

  /* ── Wizard open: pre-load data scoped to creator's role ── */
  const openWizard = async () => {
    const base = { ...EMPTY_FORM };
    setEmpresas([]); setTiendas([]);

    if (user?.rol === 'admin') {
      base.tenant_id = String(user.tenant_id || '');
      try {
        const { data } = await empresasApi.list();
        setEmpresas(data.filter((e: any) => e.tenant_id === user?.tenant_id));
      } catch {}
    } else if (user?.rol !== 'superadmin') {
      // manager or below: tenant + empresa are fixed
      base.tenant_id  = String(user?.tenant_id  || '');
      base.empresa_id = String(user?.empresa_id || '');
      try {
        const { data } = await tiendasApi.list();
        setTiendas(data.filter((t: any) => t.empresa_id === user?.empresa_id));
      } catch {}
    }

    setForm(base);
    setStep(1);
    setShowWizard(true);
  };

  /* ── Cascading for superadmin ── */
  const onSATenantChange = async (tenantId: string) => {
    setForm(f => ({ ...f, tenant_id: tenantId, empresa_id: '', tienda_id: '' }));
    setEmpresas([]); setTiendas([]);
    if (tenantId) {
      try { const { data } = await empresasApi.list(); setEmpresas(data.filter((e: any) => e.tenant_id === Number(tenantId))); } catch {}
    }
  };

  const onSAEmpresaChange = async (empresaId: string) => {
    setForm(f => ({ ...f, empresa_id: empresaId, tienda_id: '' }));
    setTiendas([]);
    if (empresaId) {
      try { const { data } = await tiendasApi.list(); setTiendas(data.filter((t: any) => t.empresa_id === Number(empresaId))); } catch {}
    }
  };

  /* ── Cascading for admin (empresa already in scope, just loads tiendas) ── */
  const onAdminEmpresaChange = async (empresaId: string) => {
    setForm(f => ({ ...f, empresa_id: empresaId, tienda_id: '' }));
    setTiendas([]);
    if (empresaId) {
      try { const { data } = await tiendasApi.list(); setTiendas(data.filter((t: any) => t.empresa_id === Number(empresaId))); } catch {}
    }
  };

  /* ── Save ── */
  const handleSave = async () => {
    const payload: any = {
      nombre: form.nombre, email: form.email, password: form.password,
      rol: form.rol, pin: form.pin || undefined,
    };

    if (user?.rol === 'superadmin') {
      if (form.crearTenant)  { payload.nuevo_tenant  = { nombre: form.tenantNombre };  }
      else                   { payload.tenant_id     = Number(form.tenant_id)  || undefined; }
      if (form.crearEmpresa) { payload.nueva_empresa = { nombre: form.empresaNombre }; }
      else                   { payload.empresa_id    = Number(form.empresa_id) || undefined; }
    } else if (user?.rol === 'admin') {
      payload.tenant_id  = user.tenant_id;
      payload.empresa_id = Number(form.empresa_id) || undefined;
    } else {
      payload.tenant_id  = user?.tenant_id;
      payload.empresa_id = user?.empresa_id;
    }

    if (form.crearTienda) { payload.nueva_tienda = { nombre: form.tiendaNombre, direccion: form.tiendaDireccion }; }
    else                  { payload.tienda_id    = Number(form.tienda_id) || undefined; }

    try {
      await usersApi.createWizard(payload);
      toast.success('Usuario creado');
      setShowWizard(false);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  /* ── Edit ── */
  const handleEdit = async (u: any) => {
    setEditItem(u);
    setEditForm({
      nombre: u.nombre, email: u.email, password: '', rol: u.rol, pin: u.pin || '',
      tenant_id: String(u.tenant_id || ''), empresa_id: String(u.empresa_id || ''), tienda_id: String(u.tienda_id || ''),
    });
    setEditEmpresas([]); setEditTiendas([]);
    if (user?.rol === 'superadmin' && tenants.length === 0) {
      try { const { data } = await tenantsApi.list(); setTenants(data); } catch {}
    }
    if (u.tenant_id) {
      try { const { data } = await empresasApi.list(); setEditEmpresas(data.filter((e: any) => e.tenant_id === u.tenant_id)); } catch {}
    }
    if (u.empresa_id) {
      try { const { data } = await tiendasApi.list(); setEditTiendas(data.filter((t: any) => t.empresa_id === u.empresa_id)); } catch {}
    }
    setShowEdit(true);
  };

  const onEditTenantChange = async (tenantId: string) => {
    setEditForm(f => ({ ...f, tenant_id: tenantId, empresa_id: '', tienda_id: '' }));
    setEditEmpresas([]); setEditTiendas([]);
    if (tenantId) {
      try { const { data } = await empresasApi.list(); setEditEmpresas(data.filter((e: any) => e.tenant_id === Number(tenantId))); } catch {}
    }
  };

  const onEditEmpresaChange = async (empresaId: string) => {
    setEditForm(f => ({ ...f, empresa_id: empresaId, tienda_id: '' }));
    setEditTiendas([]);
    if (empresaId) {
      try { const { data } = await tiendasApi.list(); setEditTiendas(data.filter((t: any) => t.empresa_id === Number(empresaId))); } catch {}
    }
  };

  const handleUpdate = async () => {
    try {
      const payload: any = { nombre: editForm.nombre, email: editForm.email, rol: editForm.rol, pin: editForm.pin || undefined };
      if (editForm.password)  payload.password  = editForm.password;
      if (editForm.tenant_id) payload.tenant_id  = Number(editForm.tenant_id);
      if (editForm.empresa_id) payload.empresa_id = Number(editForm.empresa_id);
      if (editForm.tienda_id) payload.tienda_id  = Number(editForm.tienda_id);
      await usersApi.update(editItem.id, payload);
      toast.success('Usuario actualizado');
      setShowEdit(false); setEditItem(null); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al actualizar'); }
  };

  const handleToggle = async (id: number) => {
    try { await usersApi.toggle(id); load(); toast.success('Estado actualizado'); } catch {}
  };

  const handleDelete = async (u: any) => {
    try {
      await usersApi.delete(u.id);
      toast.success('Usuario eliminado');
      setDeleteConfirm(null); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al eliminar'); }
  };

  /* ── Labels for scoped read-only info ── */
  const tenantNombreActual  = tenants.find(t => t.id === user?.tenant_id)?.nombre  || `Tenant #${user?.tenant_id}`;
  const empresaNombreActual = editEmpresas.find(e => e.id === user?.empresa_id)?.nombre || empresas.find(e => e.id === user?.empresa_id)?.nombre || `Empresa #${user?.empresa_id}`;

  const isSA      = user?.rol === 'superadmin';
  const isAdmin   = user?.rol === 'admin';

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex gap-1 mb-6 border-b border-slate-700">
        <button onClick={() => setActiveTab('usuarios')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'usuarios' ? 'border-iados-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
          <UserCog size={14} /> Usuarios del sistema
        </button>
        {empEnabled && (
          <button onClick={() => setActiveTab('empleados')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'empleados' ? 'border-iados-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
            <Briefcase size={14} /> Empleados
          </button>
        )}
      </div>

      {activeTab === 'usuarios' && (
      <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users size={24} /> Usuarios</h1>
        <button onClick={openWizard} className="btn-primary text-sm"><Plus size={16} className="mr-1" />Nuevo Usuario</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700">
              <th className="p-3">Nombre</th><th className="p-3">Email</th><th className="p-3">Rol</th>
              <th className="p-3">Tenant / Empresa / Tienda</th><th className="p-3">Estado</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-slate-800 hover:bg-iados-card/50">
                <td className="p-3 font-medium">{u.nombre}</td>
                <td className="p-3 text-slate-400">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs text-white ${ROL_COLORS[u.rol] || 'bg-slate-600'}`}>{u.rol}</span>
                </td>
                <td className="p-3 text-xs text-slate-400">{u.tenant_id} / {u.empresa_id} / {u.tienda_id}</td>
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

      {/* ── Wizard ── */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card max-w-md w-full space-y-4 my-4">
            <h3 className="text-lg font-bold">Nuevo Usuario — Paso {step}/2</h3>

            {/* Progress */}
            <div className="flex gap-1">
              {[1, 2].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded ${s <= step ? 'bg-iados-primary' : 'bg-iados-card'}`} />
              ))}
            </div>

            {/* Paso 1: Datos básicos */}
            {step === 1 && (
              <div className="space-y-3">
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre completo" className="input-touch" />
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email" type="email" className="input-touch" />
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Contraseña" type="password" className="input-touch" />
                <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} className="input-touch">
                  {ROLES_FOR(user?.rol || '').map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
                <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  placeholder="PIN (4 dígitos, opcional)" className="input-touch" maxLength={4} />
              </div>
            )}

            {/* Paso 2: Asignación — scoped por rol del creador */}
            {step === 2 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-300">Asignación de Tenant / Empresa / Tienda</h4>

                {/* ── Tenant ── */}
                {isSA ? (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 block">Tenant (corporativo)</label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.crearTenant}
                        onChange={(e) => setForm({ ...form, crearTenant: e.target.checked, tenant_id: '', empresa_id: '', tienda_id: '' })}
                        className="w-4 h-4" /> Crear nuevo tenant
                    </label>
                    {form.crearTenant ? (
                      <input value={form.tenantNombre} onChange={(e) => setForm({ ...form, tenantNombre: e.target.value })}
                        placeholder="Nombre del tenant" className="input-touch" />
                    ) : (
                      <select value={form.tenant_id}
                        onChange={(e) => onSATenantChange(e.target.value)} className="input-touch">
                        <option value="">Seleccionar tenant...</option>
                        {tenants.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-iados-card rounded-xl text-sm">
                    <span className="text-slate-400">Tenant:</span>
                    <span className="font-medium">{tenantNombreActual}</span>
                  </div>
                )}

                {/* ── Empresa ── */}
                {isSA ? (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 block">Empresa</label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.crearEmpresa}
                        onChange={(e) => setForm({ ...form, crearEmpresa: e.target.checked, empresa_id: '', tienda_id: '' })}
                        className="w-4 h-4" /> Crear nueva empresa
                    </label>
                    {form.crearEmpresa ? (
                      <input value={form.empresaNombre} onChange={(e) => setForm({ ...form, empresaNombre: e.target.value })}
                        placeholder="Nombre de la empresa" className="input-touch" />
                    ) : (
                      <select value={form.empresa_id}
                        onChange={(e) => onSAEmpresaChange(e.target.value)} className="input-touch"
                        disabled={!form.tenant_id && !form.crearTenant}>
                        <option value="">Seleccionar empresa...</option>
                        {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    )}
                  </div>
                ) : isAdmin ? (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 block">Empresa</label>
                    <select value={form.empresa_id}
                      onChange={(e) => onAdminEmpresaChange(e.target.value)} className="input-touch">
                      <option value="">Seleccionar empresa...</option>
                      {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-iados-card rounded-xl text-sm">
                    <span className="text-slate-400">Empresa:</span>
                    <span className="font-medium">{empresaNombreActual}</span>
                  </div>
                )}

                {/* ── Tienda ── */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 block">Tienda</label>
                  {isSA && (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.crearTienda}
                        onChange={(e) => setForm({ ...form, crearTienda: e.target.checked, tienda_id: '' })}
                        className="w-4 h-4" /> Crear nueva tienda
                    </label>
                  )}
                  {form.crearTienda ? (
                    <div className="space-y-2">
                      <input value={form.tiendaNombre} onChange={(e) => setForm({ ...form, tiendaNombre: e.target.value })}
                        placeholder="Nombre de la tienda" className="input-touch" />
                      <input value={form.tiendaDireccion} onChange={(e) => setForm({ ...form, tiendaDireccion: e.target.value })}
                        placeholder="Dirección" className="input-touch" />
                    </div>
                  ) : (
                    <select value={form.tienda_id}
                      onChange={(e) => setForm({ ...form, tienda_id: e.target.value })} className="input-touch"
                      disabled={isSA && !form.empresa_id && !form.crearEmpresa}>
                      <option value="">Sin tienda asignada</option>
                      {tiendas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { if (step === 1) setShowWizard(false); else setStep(1); }}
                className="btn-secondary flex-1">
                {step === 1 ? 'Cancelar' : 'Anterior'}
              </button>
              {step < 2 ? (
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.nombre || !form.email || !form.password}
                  className="btn-primary flex-1 disabled:opacity-50">
                  Siguiente
                </button>
              ) : (
                <button onClick={handleSave} className="btn-success flex-1">Crear Usuario</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar ── */}
      {showEdit && editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card max-w-md w-full space-y-3 my-4">
            <h3 className="text-lg font-bold">Editar Usuario</h3>
            <input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              placeholder="Nombre completo" className="input-touch" />
            <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              placeholder="Email" type="email" className="input-touch" />
            <input value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              placeholder="Nueva contraseña (dejar vacío para no cambiar)" type="password" className="input-touch" />
            <select value={editForm.rol} onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })} className="input-touch">
              {ROLES_FOR(user?.rol || '').map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <input value={editForm.pin} onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })}
              placeholder="PIN" className="input-touch" maxLength={4} />

            <div className="border-t border-slate-700 pt-3 space-y-3">
              <h4 className="text-sm font-semibold text-slate-300">Asignación</h4>

              {isSA && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tenant</label>
                  <select value={editForm.tenant_id} onChange={(e) => onEditTenantChange(e.target.value)} className="input-touch">
                    <option value="">Seleccionar...</option>
                    {tenants.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Empresa</label>
                <select value={editForm.empresa_id} onChange={(e) => onEditEmpresaChange(e.target.value)} className="input-touch"
                  disabled={!isSA && !isAdmin}>
                  <option value="">Seleccionar...</option>
                  {editEmpresas.map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tienda</label>
                <select value={editForm.tienda_id} onChange={(e) => setEditForm({ ...editForm, tienda_id: e.target.value })} className="input-touch">
                  <option value="">Sin tienda</option>
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

      {/* ── Confirmar Eliminación ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full text-center space-y-4">
            <Trash2 size={40} className="mx-auto text-red-400" />
            <h3 className="text-lg font-bold">Eliminar Usuario</h3>
            <p className="text-slate-400">¿Seguro que deseas eliminar a <strong>{deleteConfirm.nombre}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {activeTab === 'empleados' && empEnabled && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Empleados</h2>
            <button onClick={() => { setShowEmpForm(true); setEditEmp(null); setEmpFormStep('datos'); setEmpForm({ nombre: '', apellido: '', cargo: '', departamento: '', email: '', telefono: '' }); }}
              className="btn-primary text-sm flex items-center gap-2"><Plus size={15} />Nuevo empleado</button>
          </div>

          {empLoading ? (
            <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-iados-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {empleados.map(emp => (
                <div key={emp.id} className="bg-iados-card rounded-xl border border-slate-700 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{emp.nombre} {emp.apellido}</p>
                      <p className="text-xs text-slate-400">{emp.cargo || 'Sin cargo'}{emp.departamento ? ` · ${emp.departamento}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {emp.fmd_template
                        ? <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Fingerprint size={10} /> Enrolado
                          </span>
                        : <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Sin huella</span>
                      }
                      <button
                        onClick={() => startEnrollment(emp)}
                        disabled={enrollingId === emp.id}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                          enrollingId === emp.id && enrollStatus === 'waiting' ? 'bg-yellow-900/30 text-yellow-400' :
                          enrollingId === emp.id && enrollStatus === 'success' ? 'bg-green-900/30 text-green-400' :
                          enrollingId === emp.id && enrollStatus === 'error' ? 'bg-red-900/30 text-red-400' :
                          'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                        title={emp.fmd_template ? 'Re-capturar huella' : 'Capturar huella'}>
                        {enrollingId === emp.id && enrollStatus === 'waiting' ? <Loader size={14} className="animate-spin" /> :
                         enrollingId === emp.id && enrollStatus === 'success' ? <CheckCircle size={14} /> :
                         enrollingId === emp.id && enrollStatus === 'error' ? <AlertCircle size={14} /> :
                         <Fingerprint size={14} />}
                      </button>
                      {emp.fmd_template && (
                        <button onClick={async () => { if (confirm('Eliminar huella?')) { await empleadosApi.clearHuella(emp.id); loadEmpleados(); } }}
                          className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-900/20 rounded-lg" title="Eliminar huella">
                          <X size={13} />
                        </button>
                      )}
                      <button onClick={() => loadHorario(emp)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><Clock size={14} /></button>
                      <button onClick={() => { setEditEmp(emp); setEmpForm({ nombre: emp.nombre, apellido: emp.apellido || '', cargo: emp.cargo || '', departamento: emp.departamento || '', email: emp.email || '', telefono: emp.telefono || '' }); setEmpFormStep('datos'); setShowEmpForm(true); }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={async () => { await empleadosApi.toggle(emp.id); loadEmpleados(); }}
                        className={`p-1.5 rounded-lg ${emp.activo ? 'text-green-400' : 'text-slate-500'}`}>
                        {emp.activo ? <UserCheck size={14} /> : <UserX size={14} />}
                      </button>
                    </div>
                  </div>
                  {enrollingId === emp.id && enrollStatus !== 'idle' && (
                    <div className={`mt-2 text-xs px-3 py-1.5 rounded-lg ${enrollStatus === 'waiting' ? 'bg-yellow-900/20 text-yellow-300' : enrollStatus === 'success' ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}>
                      {enrollMsg}
                      {enrollStatus === 'error' && (
                        <button onClick={() => { setEnrollingId(null); setEnrollStatus('idle'); }} className="ml-3 underline">Cerrar</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {empleados.length === 0 && <p className="text-slate-500 text-center py-10 text-sm">Sin empleados registrados</p>}
            </div>
          )}

          {bioCfg && (
            <div className="bg-iados-card rounded-2xl border border-slate-700 p-5">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-sm"><Settings size={14} /> Dispositivo HID DigitalPersona</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Token del bridge — pegar en el archivo <code>.env</code> del reader-bridge como <code>EMPRESA_TOKEN</code>:</p>
                  <div className="flex items-center gap-2 bg-iados-bg rounded-lg px-3 py-2 border border-slate-600">
                    <code className="text-xs text-green-400 flex-1 break-all">{bioCfg.empresa_token}</code>
                    <button onClick={() => { navigator.clipboard.writeText(bioCfg.empresa_token); toast.success('Token copiado'); }}
                      className="text-slate-400 hover:text-white shrink-0"><Copy size={13} /></button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">URL de la pantalla de accesos en tiempo real:</p>
                  <div className="flex items-center gap-2 bg-iados-bg rounded-lg px-3 py-2 border border-slate-600">
                    <code className="text-xs text-blue-400 flex-1 break-all">
                      {`${window.location.origin}/biometrico-live/${bioCfg.empresa_token}`}
                    </code>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/biometrico-live/${bioCfg.empresa_token}`); toast.success('URL copiada'); }}
                      className="text-slate-400 hover:text-white shrink-0"><Copy size={13} /></button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Abrir esta URL en pantalla completa en la pantalla de la entrada.</p>
                </div>
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <a href={resolveUploadUrl('/api/uploads/downloads/pos-iados-bridge.zip')} download
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-800 rounded-lg px-3 py-1.5">
                    <Download size={12} /> Descargar Bridge Biométrico
                  </a>
                  <button onClick={async () => { if (confirm('Regenerar token? El bridge deberá configurarse de nuevo.')) { const { data } = await empleadosApi.regenToken(); setBioCfg(data); toast.success('Token regenerado'); } }}
                    className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-800 rounded-lg px-3 py-1.5">
                    <RefreshCw size={12} /> Regenerar token
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Instalar en la PC de Windows con el lector conectado. Incluye instrucciones (LEEME.txt)
                  y el archivo <code>.env.example</code> para configurar el token de arriba.
                </p>
              </div>
            </div>
          )}

          {showEmpForm && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-iados-surface rounded-2xl border border-slate-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                {empFormStep === 'huella' ? (
                  <>
                    <h3 className="font-bold mb-1">Huella del empleado</h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {editEmp?.nombre} {editEmp?.apellido} — guardado correctamente.
                    </p>
                    {!bioCfg?.empresa_token ? (
                      <p className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded-lg px-3 py-2">
                        Configura primero el biométrico (tarjeta "Dispositivo HID DigitalPersona" más abajo)
                        para poder capturar huellas.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-slate-300 mb-3">
                          {editEmp?.fmd_template
                            ? 'Ya tiene una huella registrada. Puedes volver a capturarla si es necesario.'
                            : 'Pide al empleado que coloque su dedo en el lector para registrar su huella.'}
                        </p>
                        <button
                          onClick={() => startEnrollment(editEmp)}
                          disabled={enrollingId === editEmp?.id}
                          className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border transition-colors ${
                            enrollingId === editEmp?.id && enrollStatus === 'waiting' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700' :
                            enrollingId === editEmp?.id && enrollStatus === 'success' ? 'bg-green-900/30 text-green-400 border-green-700' :
                            enrollingId === editEmp?.id && enrollStatus === 'error' ? 'bg-red-900/30 text-red-400 border-red-700' :
                            'bg-iados-primary/10 text-iados-primary border-iados-primary hover:bg-iados-primary/20'
                          }`}>
                          {enrollingId === editEmp?.id && enrollStatus === 'waiting' ? <><Loader size={16} className="animate-spin" /> Esperando huella...</> :
                           enrollingId === editEmp?.id && enrollStatus === 'success' ? <><CheckCircle size={16} /> Huella registrada</> :
                           <><Fingerprint size={16} /> {editEmp?.fmd_template ? 'Re-capturar huella' : 'Capturar huella'}</>}
                        </button>
                        {enrollingId === editEmp?.id && enrollStatus !== 'idle' && (
                          <div className={`mt-2 text-xs px-3 py-2 rounded-lg ${enrollStatus === 'waiting' ? 'bg-yellow-900/20 text-yellow-300' : enrollStatus === 'success' ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}>
                            {enrollMsg}
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex gap-3 mt-5">
                      <button onClick={cerrarEmpForm} className="btn-primary flex-1 text-sm">
                        {editEmp?.fmd_template || (enrollingId === editEmp?.id && enrollStatus === 'success') ? 'Finalizar' : 'Saltar por ahora'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold mb-4">{editEmp ? 'Editar empleado' : 'Nuevo empleado'}</h3>
                    <div className="space-y-3">
                      {([['nombre', 'Nombre *'], ['apellido', 'Apellido'], ['cargo', 'Cargo'], ['departamento', 'Departamento'], ['email', 'Email'], ['telefono', 'Teléfono']] as const).map(([k, p]) => (
                        <input key={k} placeholder={p} value={(empForm as any)[k]} onChange={e => setEmpForm(prev => ({ ...prev, [k]: e.target.value }))}
                          className="w-full bg-iados-bg border border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-iados-primary" />
                      ))}
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={cerrarEmpForm} className="btn-secondary flex-1 text-sm">Cancelar</button>
                      <button onClick={handleGuardarEmp} disabled={!empForm.nombre || savingEmp} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                        {savingEmp && <Loader size={14} className="animate-spin" />} Guardar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {showHorario !== null && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-iados-surface rounded-2xl border border-slate-700 p-6 w-full max-w-sm">
                <h3 className="font-bold mb-4">Horario del empleado</h3>
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5, 6].map(d => (
                    <div key={d} className="flex items-center gap-3">
                      <button onClick={() => setHorarios(p => ({ ...p, [d]: { ...p[d], activo: !p[d].activo } }))}
                        className={`w-10 text-xs font-medium rounded-lg py-1 text-center ${horarios[d]?.activo ? 'bg-iados-primary text-white' : 'bg-slate-700 text-slate-400'}`}>
                        {DIAS[d]}
                      </button>
                      <input type="time" value={horarios[d]?.hora_entrada || '08:00'} disabled={!horarios[d]?.activo}
                        onChange={e => setHorarios(p => ({ ...p, [d]: { ...p[d], hora_entrada: e.target.value } }))}
                        className="flex-1 bg-iados-bg border border-slate-600 rounded-lg px-2 py-1 text-sm disabled:opacity-30 focus:outline-none focus:border-iados-primary" />
                      <input type="number" value={horarios[d]?.tolerancia || 10} min="0" max="60" disabled={!horarios[d]?.activo}
                        onChange={e => setHorarios(p => ({ ...p, [d]: { ...p[d], tolerancia: parseInt(e.target.value) || 0 } }))}
                        className="w-14 bg-iados-bg border border-slate-600 rounded-lg px-2 py-1 text-xs text-center disabled:opacity-30" />
                      <span className="text-xs text-slate-500">min</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">Min de tolerancia antes de marcar tarde.</p>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowHorario(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                  <button onClick={async () => { const arr = [0, 1, 2, 3, 4, 5, 6].filter(d => horarios[d]?.activo).map(d => ({ dia_semana: d, hora_entrada: horarios[d].hora_entrada, tolerancia_minutos: horarios[d].tolerancia, activo: true })); await empleadosApi.setHorario(showHorario, arr); toast.success('Horario guardado'); setShowHorario(null); }} className="btn-primary flex-1 text-sm">Guardar horario</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
