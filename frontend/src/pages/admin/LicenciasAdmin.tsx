import { useState, useEffect } from 'react';
import { licenciasApi, tenantsApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import {
  Shield, Key, Copy, Ban, PlayCircle, Trash2, RefreshCw, Edit2,
  Link, Lock, CheckCircle, Infinity, X,
} from 'lucide-react';

const PLANES = [
  { value: 'basico', label: 'Basico', color: 'bg-slate-600' },
  { value: 'pro', label: 'Pro', color: 'bg-blue-600' },
  { value: 'enterprise', label: 'Enterprise', color: 'bg-purple-600' },
];

const PLAN_DEFAULTS: Record<string, { mt: number; mu: number; g: number }> = {
  basico: { mt: 1, mu: 3, g: 7 },
  pro: { mt: 3, mu: 10, g: 15 },
  enterprise: { mt: 999, mu: 999, g: 30 },
};

const DEFAULT_GEN_FORM = {
  tenant_id: 0,
  plan: 'pro',
  meses: 12,
  max_tiendas: 3,
  max_usuarios: 10,
  grace_days: 15,
  offline_allowed: true,
  machine_locked: false,
};

type GenForm = typeof DEFAULT_GEN_FORM;

function estadoColor(estado: string) {
  const map: Record<string, string> = {
    trial: 'bg-amber-600',
    activa: 'bg-green-600',
    suspendida: 'bg-red-600',
    expirada: 'bg-slate-600',
  };
  return map[estado] || 'bg-slate-600';
}

function planColor(plan: string) {
  return PLANES.find(p => p.value === plan)?.color || 'bg-slate-600';
}

// ---- Generar Link Modal ----
function GenerarLinkModal({
  lic,
  tenants,
  onClose,
}: { lic: any; tenants: any[]; onClose: () => void }) {
  const tenantNombre = tenants.find(t => t.id === lic.tenant_id)?.nombre || `Tenant #${lic.tenant_id}`;

  const [form, setForm] = useState<GenForm>({
    ...DEFAULT_GEN_FORM,
    tenant_id: lic.tenant_id,
    plan: lic.plan || 'pro',
    max_tiendas: lic.max_tiendas ?? 3,
    max_usuarios: lic.max_usuarios ?? 10,
    grace_days: lic.grace_days ?? 15,
    offline_allowed: lic.offline_allowed !== false,
    machine_locked: lic.machine_locked || false,
    meses: lic.permanente ? 0 : 12,
  });

  const [codigoRaw, setCodigoRaw] = useState('');
  const [tokenUrl, setTokenUrl] = useState('');
  const [step, setStep] = useState<'config' | 'url'>('config');
  const [loading, setLoading] = useState(false);

  const handlePlanChange = (plan: string) => {
    const d = PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.pro;
    setForm(f => ({ ...f, plan, max_tiendas: d.mt, max_usuarios: d.mu, grace_days: d.g }));
  };

  const handleGenerar = async () => {
    setLoading(true);
    try {
      // 1. Generate raw activation code
      const { data: codeData } = await licenciasApi.generarCodigo(form);
      const raw = codeData.codigo_raw as string;
      setCodigoRaw(codeData.codigo_formateado);

      // 2. Generate one-time token linked to this code
      const { data: tokenData } = await licenciasApi.generarToken(lic.id, raw);
      const url = `${window.location.origin}/activar?t=${tokenData.token}`;
      setTokenUrl(url);
      setStep('url');
      toast.success('Enlace generado — válido 48 horas');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error generando enlace');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Link size={18} className="text-iados-primary" />
            Generar Enlace de Activacion
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded"><X size={18} /></button>
        </div>
        <p className="text-sm text-slate-400">
          Tenant: <span className="text-white font-medium">{tenantNombre}</span> — licencia ID {lic.id}
        </p>

        {step === 'config' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Plan</label>
                <select value={form.plan} onChange={e => handlePlanChange(e.target.value)} className="input-touch">
                  {PLANES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Periodo</label>
                <select value={form.meses} onChange={e => setForm(f => ({ ...f, meses: Number(e.target.value) }))} className="input-touch">
                  {[1, 3, 6, 12, 24, 36].map(m => <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>)}
                  <option value={0}>Permanente</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Max Tiendas</label>
                <input type="number" value={form.max_tiendas} onChange={e => setForm(f => ({ ...f, max_tiendas: Number(e.target.value) }))} className="input-touch" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Max Usuarios</label>
                <input type="number" value={form.max_usuarios} onChange={e => setForm(f => ({ ...f, max_usuarios: Number(e.target.value) }))} className="input-touch" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Grace Days</label>
                <input type="number" value={form.grace_days} onChange={e => setForm(f => ({ ...f, grace_days: Number(e.target.value) }))} className="input-touch" />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.offline_allowed} onChange={e => setForm(f => ({ ...f, offline_allowed: e.target.checked }))} />
                Offline permitido
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.machine_locked} onChange={e => setForm(f => ({ ...f, machine_locked: e.target.checked }))} />
                Bloquear a este equipo
              </label>
            </div>
            {form.machine_locked && (
              <p className="text-xs text-amber-400 bg-amber-900/20 rounded p-2">
                La licencia quedará vinculada al primer equipo que active este enlace. No podrá usarse en otro equipo.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="btn-secondary">Cancelar</button>
              <button onClick={handleGenerar} disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Link size={16} />}
                Generar Enlace
              </button>
            </div>
          </>
        )}

        {step === 'url' && (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Enlace de activacion (valido 48 h, uso unico)</label>
                <div className="bg-black/50 p-3 rounded-lg text-sm text-blue-400 break-all select-all font-mono">
                  {tokenUrl}
                </div>
                <button onClick={() => copy(tokenUrl, 'Enlace')} className="btn-secondary mt-2 flex items-center gap-2 text-sm">
                  <Copy size={14} /> Copiar enlace
                </button>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Codigo de activacion (alternativa manual)</label>
                <div className="bg-black/50 p-3 rounded-lg font-mono text-xs text-green-400 break-all select-all">
                  {codigoRaw}
                </div>
                <button onClick={() => copy(codigoRaw, 'Codigo')} className="btn-secondary mt-2 flex items-center gap-2 text-sm">
                  <Copy size={14} /> Copiar codigo
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="btn-primary">Listo</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Edit Modal ----
function EditModal({
  lic,
  onClose,
  onSaved,
}: { lic: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    plan: lic.plan || 'pro',
    fecha_inicio: lic.fecha_inicio || '',
    fecha_fin: lic.fecha_fin || '',
    max_tiendas: lic.max_tiendas ?? 3,
    max_usuarios: lic.max_usuarios ?? 10,
    grace_days: lic.grace_days ?? 15,
    offline_allowed: lic.offline_allowed !== false,
    machine_locked: lic.machine_locked || false,
    permanente: lic.permanente || false,
    notas: lic.notas || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (form.permanente) payload.fecha_fin = null;
      await licenciasApi.update(lic.id, payload);
      toast.success('Licencia actualizada');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const f = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Edit2 size={18} className="text-iados-primary" />
            Editar Licencia #{lic.id}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Plan</label>
            <select value={form.plan} onChange={e => f('plan', e.target.value)} className="input-touch">
              {PLANES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Grace Days</label>
            <input type="number" value={form.grace_days} onChange={e => f('grace_days', Number(e.target.value))} className="input-touch" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Max Tiendas</label>
            <input type="number" value={form.max_tiendas} onChange={e => f('max_tiendas', Number(e.target.value))} className="input-touch" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Max Usuarios</label>
            <input type="number" value={form.max_usuarios} onChange={e => f('max_usuarios', Number(e.target.value))} className="input-touch" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Fecha Inicio</label>
            <input type="date" value={form.fecha_inicio} onChange={e => f('fecha_inicio', e.target.value)} className="input-touch" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Fecha Fin</label>
            <input type="date" value={form.fecha_fin} onChange={e => f('fecha_fin', e.target.value)} disabled={form.permanente} className="input-touch disabled:opacity-40" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.offline_allowed} onChange={e => f('offline_allowed', e.target.checked)} />
            Offline permitido
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.machine_locked} onChange={e => f('machine_locked', e.target.checked)} />
            Bloqueada a equipo
          </label>
          <label className="flex items-center gap-2 col-span-2">
            <input type="checkbox" checked={form.permanente} onChange={e => {
              f('permanente', e.target.checked);
              if (e.target.checked) f('fecha_fin', '');
            }} />
            <span className="text-amber-400 font-medium">Licencia permanente (sin vencimiento)</span>
          </label>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Notas internas</label>
          <textarea value={form.notas} onChange={e => f('notas', e.target.value)} rows={2} className="input-touch w-full" placeholder="Opcional..." />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-success flex items-center gap-2">
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function LicenciasAdmin() {
  const [licencias, setLicencias] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Generar nuevo codigo (panel global)
  const [showGenerar, setShowGenerar] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [genForm, setGenForm] = useState<GenForm>({ ...DEFAULT_GEN_FORM });

  // Modals
  const [editLic, setEditLic] = useState<any | null>(null);
  const [linkLic, setLinkLic] = useState<any | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [licRes, tenRes] = await Promise.all([licenciasApi.list(), tenantsApi.list()]);
      setLicencias(licRes.data || []);
      setTenants(tenRes.data || []);
    } catch { toast.error('Error cargando datos'); }
    finally { setLoading(false); }
  };

  const handleGenerarCodigo = async () => {
    if (!genForm.tenant_id) return toast.error('Selecciona un tenant');
    try {
      const { data } = await licenciasApi.generarCodigo(genForm);
      setCodigoGenerado(data.codigo_formateado);
      toast.success('Codigo generado');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handlePlanChangeGen = (plan: string) => {
    const d = PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.pro;
    setGenForm(f => ({ ...f, plan, max_tiendas: d.mt, max_usuarios: d.mu, grace_days: d.g }));
  };

  const handleSuspender = async (id: number) => {
    if (!confirm('Suspender esta licencia?')) return;
    try { await licenciasApi.suspender(id); load(); toast.success('Suspendida'); } catch { toast.error('Error'); }
  };

  const handleReactivar = async (id: number) => {
    try { await licenciasApi.reactivar(id); load(); toast.success('Reactivada'); } catch { toast.error('Error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar licencia permanentemente?')) return;
    try { await licenciasApi.delete(id); load(); toast.success('Eliminada'); } catch { toast.error('Error'); }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado');
  };

  const getTenantNombre = (tid: number) => tenants.find(t => t.id === tid)?.nombre || `Tenant #${tid}`;

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield size={28} /> Licencias</h1>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-1"><RefreshCw size={16} /></button>
          <button onClick={() => { setShowGenerar(!showGenerar); setCodigoGenerado(''); }} className="btn-primary flex items-center gap-2">
            <Key size={18} /> Generar Codigo
          </button>
        </div>
      </div>

      {/* Panel generar codigo manual */}
      {showGenerar && (
        <div className="card border border-iados-primary/50">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Key size={18} /> Generar Codigo de Activacion (manual)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tenant</label>
              <select value={genForm.tenant_id} onChange={e => setGenForm(f => ({ ...f, tenant_id: Number(e.target.value) }))} className="input-touch">
                <option value={0}>-- Seleccionar --</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.nombre} (ID:{t.id})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Plan</label>
              <select value={genForm.plan} onChange={e => handlePlanChangeGen(e.target.value)} className="input-touch">
                {PLANES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Periodo (meses)</label>
              <select value={genForm.meses} onChange={e => setGenForm(f => ({ ...f, meses: Number(e.target.value) }))} className="input-touch">
                {[1, 3, 6, 12, 24, 36].map(m => <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>)}
                <option value={0}>Permanente</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max Tiendas</label>
              <input type="number" value={genForm.max_tiendas} onChange={e => setGenForm(f => ({ ...f, max_tiendas: Number(e.target.value) }))} className="input-touch" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max Usuarios</label>
              <input type="number" value={genForm.max_usuarios} onChange={e => setGenForm(f => ({ ...f, max_usuarios: Number(e.target.value) }))} className="input-touch" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Grace Days</label>
              <input type="number" value={genForm.grace_days} onChange={e => setGenForm(f => ({ ...f, grace_days: Number(e.target.value) }))} className="input-touch" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={genForm.offline_allowed} onChange={e => setGenForm(f => ({ ...f, offline_allowed: e.target.checked }))} />
              Permitir uso offline
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={genForm.machine_locked} onChange={e => setGenForm(f => ({ ...f, machine_locked: e.target.checked }))} />
              Bloquear a equipo
            </label>
          </div>
          <button onClick={handleGenerarCodigo} className="btn-success mt-3">Generar Codigo</button>

          {codigoGenerado && (
            <div className="mt-4 p-4 bg-iados-card rounded-xl">
              <label className="text-xs text-slate-400 block mb-2">Codigo de Activacion (enviar al cliente)</label>
              <div className="bg-black/50 p-3 rounded-lg font-mono text-sm text-green-400 break-all select-all">
                {codigoGenerado}
              </div>
              <button onClick={() => copyText(codigoGenerado)} className="btn-secondary mt-2 flex items-center gap-2">
                <Copy size={16} /> Copiar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de licencias */}
      <div className="space-y-3">
        {loading && <p className="text-slate-400 text-center py-8">Cargando...</p>}
        {!loading && licencias.length === 0 && (
          <p className="text-slate-500 text-center py-8">No hay licencias registradas. Se crean automaticamente al primer login del tenant.</p>
        )}

        {licencias.map(lic => (
          <div key={lic.id} className="card">
            {/* Fila superior: nombre + badges + acciones */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Shield size={20} className="text-iados-primary" />
                <span className="font-bold">{getTenantNombre(lic.tenant_id)}</span>
                <span className="text-xs text-slate-400">ID:{lic.tenant_id}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${estadoColor(lic.estado)}`}>{lic.estado}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${planColor(lic.plan)}`}>{lic.plan}</span>
                {lic.permanente && (
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-700 flex items-center gap-1">
                    <Infinity size={11} /> Permanente
                  </span>
                )}
                {lic.machine_locked && (
                  <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${lic.machine_fingerprint ? 'bg-orange-700' : 'bg-slate-700'}`}>
                    <Lock size={11} /> {lic.machine_fingerprint ? 'Equipo vinculado' : 'Bloqueada (sin vincular)'}
                  </span>
                )}
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => setLinkLic(lic)}
                  className="p-2 hover:bg-blue-600/20 rounded-lg text-blue-400"
                  title="Generar enlace de activacion"
                >
                  <Link size={16} />
                </button>
                <button
                  onClick={() => setEditLic(lic)}
                  className="p-2 hover:bg-slate-600/40 rounded-lg text-slate-300"
                  title="Editar licencia"
                >
                  <Edit2 size={16} />
                </button>
                {lic.estado !== 'suspendida' ? (
                  <button onClick={() => handleSuspender(lic.id)} className="p-2 hover:bg-red-600/20 rounded-lg text-red-400" title="Suspender">
                    <Ban size={16} />
                  </button>
                ) : (
                  <button onClick={() => handleReactivar(lic.id)} className="p-2 hover:bg-green-600/20 rounded-lg text-green-400" title="Reactivar">
                    <PlayCircle size={16} />
                  </button>
                )}
                <button onClick={() => handleDelete(lic.id)} className="p-2 hover:bg-red-600/20 rounded-lg text-red-400" title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Instalacion</span>
                <span className="font-mono text-xs">{lic.codigo_instalacion || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Vigencia</span>
                {lic.permanente
                  ? <span className="text-yellow-400 flex items-center gap-1"><Infinity size={13} /> Sin vencimiento</span>
                  : <span>{lic.fecha_inicio || '-'} → {lic.fecha_fin || '-'}</span>
                }
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Tiendas / Usuarios</span>
                <span>{lic.max_tiendas} / {lic.max_usuarios}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Grace</span>
                <span>{lic.grace_days} dias</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Last Heartbeat</span>
                <span className="text-xs">{lic.last_heartbeat ? new Date(lic.last_heartbeat).toLocaleString('es-MX') : 'Nunca'}</span>
              </div>
            </div>

            {/* Token status */}
            {lic.activation_token && (
              <div className="mt-2 text-xs flex items-center gap-2 text-slate-400">
                <Link size={12} />
                Token:
                {lic.activation_token_used
                  ? <span className="text-green-400">Usado</span>
                  : lic.activation_token_expires && new Date() > new Date(lic.activation_token_expires)
                    ? <span className="text-red-400">Expirado</span>
                    : <span className="text-blue-400">Activo hasta {lic.activation_token_expires ? new Date(lic.activation_token_expires).toLocaleString('es-MX') : '?'}</span>
                }
              </div>
            )}

            {/* Features */}
            {lic.features?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {lic.features.map((f: string) => (
                  <span key={f} className="text-xs bg-iados-card px-2 py-0.5 rounded">{f}</span>
                ))}
              </div>
            )}

            {/* Notas */}
            {lic.notas && (
              <p className="text-xs text-slate-400 mt-2 italic">{lic.notas}</p>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      {editLic && (
        <EditModal lic={editLic} onClose={() => setEditLic(null)} onSaved={load} />
      )}
      {linkLic && (
        <GenerarLinkModal lic={linkLic} tenants={tenants} onClose={() => setLinkLic(null)} />
      )}
    </div>
  );
}
