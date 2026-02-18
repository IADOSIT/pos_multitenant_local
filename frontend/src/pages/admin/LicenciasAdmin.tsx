import { useState, useEffect } from 'react';
import { licenciasApi, tenantsApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import {
  Shield, Key, Copy, Ban, PlayCircle, Trash2, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';

const PLANES = [
  { value: 'basico', label: 'Basico', color: 'bg-slate-600' },
  { value: 'pro', label: 'Pro', color: 'bg-blue-600' },
  { value: 'enterprise', label: 'Enterprise', color: 'bg-purple-600' },
];

const FEATURES_MAP: Record<string, string[]> = {
  basico: ['pos', 'caja'],
  pro: ['pos', 'caja', 'pedidos', 'reportes', 'dashboard'],
  enterprise: ['pos', 'caja', 'pedidos', 'reportes', 'dashboard', 'kiosco', 'multitenant'],
};

export default function LicenciasAdmin() {
  const [licencias, setLicencias] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerar, setShowGenerar] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [genForm, setGenForm] = useState({
    tenant_id: 0, plan: 'pro', meses: 12, max_tiendas: 3, max_usuarios: 10, grace_days: 15, offline_allowed: true,
  });

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

  const handleGenerar = async () => {
    if (!genForm.tenant_id) return toast.error('Selecciona un tenant');
    try {
      const { data } = await licenciasApi.generarCodigo(genForm);
      setCodigoGenerado(data.codigo_formateado);
      toast.success('Codigo generado');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codigoGenerado);
    toast.success('Copiado al portapapeles');
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

  const getTenantNombre = (tid: number) => tenants.find(t => t.id === tid)?.nombre || `Tenant #${tid}`;

  const estadoColor = (estado: string) => {
    const map: Record<string, string> = { trial: 'bg-amber-600', activa: 'bg-green-600', suspendida: 'bg-red-600', expirada: 'bg-slate-600' };
    return map[estado] || 'bg-slate-600';
  };

  const planColor = (plan: string) => PLANES.find(p => p.value === plan)?.color || 'bg-slate-600';

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield size={28} /> Licencias</h1>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-1"><RefreshCw size={16} /></button>
          <button onClick={() => setShowGenerar(!showGenerar)} className="btn-primary flex items-center gap-2">
            <Key size={18} /> Generar Codigo
          </button>
        </div>
      </div>

      {/* Generar codigo */}
      {showGenerar && (
        <div className="card border border-iados-primary/50">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Key size={18} /> Generar Codigo de Activacion</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tenant</label>
              <select value={genForm.tenant_id} onChange={e => setGenForm({ ...genForm, tenant_id: Number(e.target.value) })} className="input-touch">
                <option value={0}>-- Seleccionar --</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.nombre} (ID:{t.id})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Plan</label>
              <select value={genForm.plan} onChange={e => {
                const plan = e.target.value;
                const defaults: any = { basico: { mt: 1, mu: 3, g: 7 }, pro: { mt: 3, mu: 10, g: 15 }, enterprise: { mt: 999, mu: 999, g: 30 } };
                const d = defaults[plan] || defaults.pro;
                setGenForm({ ...genForm, plan, max_tiendas: d.mt, max_usuarios: d.mu, grace_days: d.g });
              }} className="input-touch">
                {PLANES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Periodo (meses)</label>
              <select value={genForm.meses} onChange={e => setGenForm({ ...genForm, meses: Number(e.target.value) })} className="input-touch">
                {[1, 3, 6, 12, 24, 36].map(m => <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max Tiendas</label>
              <input type="number" value={genForm.max_tiendas} onChange={e => setGenForm({ ...genForm, max_tiendas: Number(e.target.value) })} className="input-touch" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max Usuarios</label>
              <input type="number" value={genForm.max_usuarios} onChange={e => setGenForm({ ...genForm, max_usuarios: Number(e.target.value) })} className="input-touch" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Grace Days</label>
              <input type="number" value={genForm.grace_days} onChange={e => setGenForm({ ...genForm, grace_days: Number(e.target.value) })} className="input-touch" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={genForm.offline_allowed} onChange={e => setGenForm({ ...genForm, offline_allowed: e.target.checked })} />
              Permitir uso offline
            </label>
          </div>
          <button onClick={handleGenerar} className="btn-success mt-3">Generar Codigo</button>

          {codigoGenerado && (
            <div className="mt-4 p-4 bg-iados-card rounded-xl">
              <label className="text-xs text-slate-400 block mb-2">Codigo de Activacion (enviar al cliente)</label>
              <div className="bg-black/50 p-3 rounded-lg font-mono text-sm text-green-400 break-all select-all">
                {codigoGenerado}
              </div>
              <button onClick={copyCode} className="btn-secondary mt-2 flex items-center gap-2">
                <Copy size={16} /> Copiar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de licencias */}
      <div className="space-y-3">
        {loading && <p className="text-slate-400 text-center py-8">Cargando...</p>}
        {!loading && licencias.length === 0 && <p className="text-slate-500 text-center py-8">No hay licencias registradas. Se crean automaticamente al primer login del tenant.</p>}
        {licencias.map(lic => (
          <div key={lic.id} className="card">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-iados-primary" />
                <div>
                  <span className="font-bold">{getTenantNombre(lic.tenant_id)}</span>
                  <span className="text-xs text-slate-400 ml-2">ID:{lic.tenant_id}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${estadoColor(lic.estado)}`}>{lic.estado}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${planColor(lic.plan)}`}>{lic.plan}</span>
              </div>
              <div className="flex gap-1">
                {lic.estado !== 'suspendida' ? (
                  <button onClick={() => handleSuspender(lic.id)} className="p-2 hover:bg-red-600/20 rounded-lg text-red-400" title="Suspender"><Ban size={16} /></button>
                ) : (
                  <button onClick={() => handleReactivar(lic.id)} className="p-2 hover:bg-green-600/20 rounded-lg text-green-400" title="Reactivar"><PlayCircle size={16} /></button>
                )}
                <button onClick={() => handleDelete(lic.id)} className="p-2 hover:bg-red-600/20 rounded-lg text-red-400" title="Eliminar"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Instalacion</span>
                <span className="font-mono text-xs">{lic.codigo_instalacion || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Vigencia</span>
                <span>{lic.fecha_inicio || '-'} → {lic.fecha_fin || '-'}</span>
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
            {lic.features?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {lic.features.map((f: string) => (
                  <span key={f} className="text-xs bg-iados-card px-2 py-0.5 rounded">{f}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
