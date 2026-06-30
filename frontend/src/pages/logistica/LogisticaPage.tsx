import { useState, useEffect, useCallback } from 'react';
import { logisticaApi } from '../../api/endpoints';
import type { Repartidor, EntregaPedido, EstadoEntrega, ConfigLogistica, MetricasLogistica } from '../../types';
import { Truck, Users, BarChart2, Settings, Copy, Check, Plus, Edit2, Power, RefreshCw, MapPin, Phone, Clock, AlertTriangle, CheckCircle, Zap, MessageSquare, Save, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'entregas' | 'repartidores' | 'metricas' | 'config';

const estadoBadge: Record<EstadoEntrega, { label: string; text: string; bg: string }> = {
  asignado:     { label: 'Asignado',     text: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  en_camino:    { label: 'En camino',    text: 'text-blue-400',   bg: 'bg-blue-900/30'   },
  entregado:    { label: 'Entregado',    text: 'text-green-400',  bg: 'bg-green-900/30'  },
  con_problema: { label: 'Con problema', text: 'text-red-400',    bg: 'bg-red-900/30'    },
};

const nextEstados: Record<string, EstadoEntrega[]> = {
  asignado:     ['en_camino', 'con_problema'],
  en_camino:    ['entregado', 'con_problema'],
  con_problema: ['en_camino', 'asignado'],
};

export default function LogisticaPage() {
  const [tab, setTab] = useState<Tab>('entregas');
  const [config, setConfig] = useState<ConfigLogistica | null>(null);

  useEffect(() => {
    logisticaApi.getConfig().then(r => setConfig(r.data)).catch(() => {});
  }, []);

  const activeCount = 0;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Truck size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Logística de Entregas</h1>
          <p className="text-xs text-slate-400">Gestión de repartidores y seguimiento de entregas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {([
          { key: 'entregas',     label: 'Entregas',      icon: Truck    },
          { key: 'repartidores', label: 'Repartidores',  icon: Users    },
          { key: 'metricas',     label: 'Métricas',      icon: BarChart2 },
          { key: 'config',       label: 'Configuración', icon: Settings },
        ] as const).map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key ? 'bg-blue-600 text-white' : 'bg-iados-card text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'entregas'     && <TabEntregas />}
      {tab === 'repartidores' && <TabRepartidores />}
      {tab === 'metricas'     && <TabMetricas />}
      {tab === 'config'       && <TabConfig config={config} onSaved={setConfig} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Tab Entregas
// ──────────────────────────────────────────────────────────────────────────────
function TabEntregas() {
  const [entregas, setEntregas] = useState<EntregaPedido[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroRep, setFiltroRep] = useState('');
  const [loading, setLoading] = useState(false);
  const [cambioModal, setCambioModal] = useState<EntregaPedido | null>(null);
  const [cambioEstado, setCambioEstado] = useState<EstadoEntrega | ''>('');
  const [cambiando, setCambiando] = useState(false);

  const hoy = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroRep) params.repartidor_id = filtroRep;
      params.desde = hoy + 'T00:00:00';
      params.hasta = hoy + 'T23:59:59';
      const [e, r] = await Promise.all([
        logisticaApi.getEntregas(params),
        logisticaApi.getRepartidores(),
      ]);
      setEntregas(e.data || []);
      setRepartidores(r.data || []);
    } catch {}
    setLoading(false);
  }, [filtroEstado, filtroRep, hoy]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const handleCambio = async () => {
    if (!cambioModal || !cambioEstado) return;
    setCambiando(true);
    try {
      await logisticaApi.updateEstado(cambioModal.id, cambioEstado);
      toast.success('Estado actualizado');
      setCambioModal(null);
      setCambioEstado('');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    } finally {
      setCambiando(false);
    }
  };

  const activas = entregas.filter(e => e.estado === 'asignado' || e.estado === 'en_camino').length;

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="bg-iados-card border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
        >
          <option value="">Todos los estados</option>
          <option value="asignado">Asignado</option>
          <option value="en_camino">En camino</option>
          <option value="entregado">Entregado</option>
          <option value="con_problema">Con problema</option>
        </select>
        <select
          value={filtroRep}
          onChange={e => setFiltroRep(e.target.value)}
          className="bg-iados-card border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
        >
          <option value="">Todos los repartidores</option>
          {repartidores.map(r => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </select>
        <button onClick={load} className="flex items-center gap-1 px-3 py-2 bg-iados-card rounded-xl text-sm text-slate-400 hover:text-white">
          <RefreshCw size={14} /> Actualizar
        </button>
        <span className="ml-auto flex items-center text-xs text-slate-500 self-center">
          <Truck size={12} className="mr-1 text-blue-400" />
          {activas} activas hoy
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando...</div>
      ) : entregas.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Truck size={40} className="mx-auto mb-3 opacity-30" />
          <p>Sin entregas para los filtros seleccionados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs border-b border-slate-700">
                <th className="text-left py-2 pr-4">Folio</th>
                <th className="text-left py-2 pr-4">Cliente</th>
                <th className="text-right py-2 pr-4">Total</th>
                <th className="text-left py-2 pr-4">Repartidor</th>
                <th className="text-left py-2 pr-4">Estado</th>
                <th className="text-left py-2 pr-4">Hora</th>
                <th className="text-left py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {entregas.map(e => {
                const badge = estadoBadge[e.estado];
                const posibles = nextEstados[e.estado] || [];
                return (
                  <tr key={e.id} className="border-b border-slate-800 hover:bg-iados-card/30">
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-400">{e.pedido_folio}</td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium">{e.cliente_nombre || '—'}</p>
                      {e.cliente_direccion && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin size={10} /> {e.cliente_direccion.slice(0, 40)}...
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-green-400 font-bold">
                      ${Number(e.total).toFixed(2)}
                    </td>
                    <td className="py-2.5 pr-4">{e.repartidor_nombre}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge.text} ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-500">
                      {new Date(e.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5">
                      {posibles.length > 0 && (
                        <button
                          onClick={() => { setCambioModal(e); setCambioEstado(''); }}
                          className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300"
                        >
                          Cambiar estado
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal cambio de estado */}
      {cambioModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-iados-surface rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h3 className="font-bold text-lg mb-1">Cambiar estado</h3>
            <p className="text-sm text-slate-400 mb-4">Folio: {cambioModal.pedido_folio}</p>
            <div className="space-y-2 mb-4">
              {(nextEstados[cambioModal.estado] || []).map(s => {
                const b = estadoBadge[s];
                return (
                  <button
                    key={s}
                    onClick={() => setCambioEstado(s)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      cambioEstado === s
                        ? `${b.bg} ${b.text} border-current`
                        : 'bg-iados-card border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCambioModal(null)} className="flex-1 py-2 rounded-xl bg-slate-700 text-sm">
                Cancelar
              </button>
              <button
                onClick={handleCambio}
                disabled={!cambioEstado || cambiando}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-50"
              >
                {cambiando ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Tab Repartidores
// ──────────────────────────────────────────────────────────────────────────────
function TabRepartidores() {
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Repartidor | null>(null);
  const [form, setForm] = useState({ nombre: '', telefono: '' });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await logisticaApi.getRepartidores();
      setRepartidores(data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (editando) {
        await logisticaApi.updateRepartidor(editando.id, form);
        toast.success('Repartidor actualizado');
      } else {
        await logisticaApi.createRepartidor(form);
        toast.success('Repartidor creado. Comparte el link de acceso con él.');
      }
      setShowModal(false);
      setEditando(null);
      setForm({ nombre: '', telefono: '' });
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rep: Repartidor) => {
    try {
      await logisticaApi.toggleRepartidor(rep.id);
      toast.success(rep.activo ? 'Repartidor desactivado' : 'Repartidor activado');
      load();
    } catch { toast.error('Error'); }
  };

  const handleCopyLink = (rep: Repartidor) => {
    const url = `${window.location.origin}/repartidor/${rep.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(rep.id);
      toast.success('Link copiado al portapapeles');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">{repartidores.length} repartidor(es) registrados</p>
        <button
          onClick={() => { setShowModal(true); setEditando(null); setForm({ nombre: '', telefono: '' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium"
        >
          <Plus size={16} /> Nuevo repartidor
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando...</div>
      ) : repartidores.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>Sin repartidores. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {repartidores.map(rep => (
            <div key={rep.id} className={`bg-iados-surface rounded-2xl p-4 border ${rep.activo ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold">{rep.nombre}</p>
                  {rep.telefono && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone size={10} /> {rep.telefono}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${rep.activo ? 'bg-green-900/30 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                  {rep.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleCopyLink(rep)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-iados-card hover:bg-slate-700 rounded-xl text-xs text-slate-300 transition-colors"
                >
                  {copiedId === rep.id ? <><Check size={12} className="text-green-400" /> Copiado</> : <><Copy size={12} /> Copiar link</>}
                </button>
                <button
                  onClick={() => { setEditando(rep); setForm({ nombre: rep.nombre, telefono: rep.telefono || '' }); setShowModal(true); }}
                  className="p-2 bg-iados-card hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleToggle(rep)}
                  className={`p-2 rounded-xl ${rep.activo ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'}`}
                  title={rep.activo ? 'Desactivar' : 'Activar'}
                >
                  <Power size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-iados-surface rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h3 className="font-bold text-lg mb-4">{editando ? 'Editar repartidor' : 'Nuevo repartidor'}</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre completo"
                  className="w-full bg-iados-card border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="Opcional"
                  type="tel"
                  className="w-full bg-iados-card border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowModal(false); setEditando(null); }} className="flex-1 py-2 rounded-xl bg-slate-700 text-sm">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Tab Métricas
// ──────────────────────────────────────────────────────────────────────────────
function TabMetricas() {
  const [metricas, setMetricas] = useState<MetricasLogistica | null>(null);
  const [loading, setLoading] = useState(false);
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await logisticaApi.getMetricas(desde + 'T00:00:00', hasta + 'T23:59:59');
      setMetricas(data);
    } catch {}
    setLoading(false);
  }, [desde, hasta]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Date range */}
      <div className="flex gap-2 mb-6 items-center flex-wrap">
        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="bg-iados-card border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
        <span className="text-slate-500">—</span>
        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="bg-iados-card border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
        <button onClick={load} className="flex items-center gap-1 px-3 py-2 bg-blue-600 rounded-xl text-sm text-white">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando métricas...</div>
      ) : !metricas ? null : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total entregas', value: metricas.total, icon: Truck, color: 'text-blue-400' },
              { label: 'Entregadas', value: metricas.entregadas, icon: CheckCircle, color: 'text-green-400' },
              { label: 'En camino', value: metricas.en_camino, icon: Zap, color: 'text-blue-300' },
              { label: 'Con problema', value: metricas.con_problema, icon: AlertTriangle, color: 'text-red-400' },
              { label: 'Tiempo prom.', value: `${metricas.tiempo_promedio_min} min`, icon: Clock, color: 'text-yellow-400' },
            ].map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-iados-surface border border-slate-700 rounded-2xl p-4 text-center">
                  <Icon size={20} className={`mx-auto mb-1 ${k.color}`} />
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
                </div>
              );
            })}
          </div>

          {/* Por repartidor */}
          {metricas.por_repartidor.length > 0 && (
            <div className="bg-iados-surface border border-slate-700 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <h3 className="font-bold text-sm">Por repartidor</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs border-b border-slate-700">
                    <th className="text-left px-4 py-2">Nombre</th>
                    <th className="text-right px-4 py-2">Total</th>
                    <th className="text-right px-4 py-2">Entregadas</th>
                    <th className="text-right px-4 py-2">Problemas</th>
                    <th className="text-right px-4 py-2">% Éxito</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.por_repartidor.map(r => {
                    const pct = r.total > 0 ? Math.round((r.entregadas / r.total) * 100) : 0;
                    return (
                      <tr key={r.repartidor_id} className="border-b border-slate-800">
                        <td className="px-4 py-2.5 font-medium">{r.repartidor_nombre}</td>
                        <td className="px-4 py-2.5 text-right">{r.total}</td>
                        <td className="px-4 py-2.5 text-right text-green-400">{r.entregadas}</td>
                        <td className="px-4 py-2.5 text-right text-red-400">{r.con_problema}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`font-bold ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Tab Configuración
// ──────────────────────────────────────────────────────────────────────────────
function TabConfig({ config, onSaved }: { config: ConfigLogistica | null; onSaved: (c: ConfigLogistica) => void }) {
  const [form, setForm] = useState<Partial<ConfigLogistica>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await logisticaApi.upsertConfig(form);
      onSaved(data);
      toast.success('Configuración guardada');
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Activación del módulo */}
      <div className="bg-iados-surface border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold mb-0.5">Módulo de Logística</h3>
            <p className="text-xs text-slate-400">Habilita el sistema de entregas y repartidores para esta empresa</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, modulo_habilitado: !f.modulo_habilitado }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${form.modulo_habilitado ? 'bg-blue-600' : 'bg-slate-600'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.modulo_habilitado ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {form.modulo_habilitado && (
          <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-xl text-xs text-blue-300">
            El módulo está activo. Aparecerá en el menú lateral y se habilitará la asignación de repartidores en Pedidos.
          </div>
        )}
      </div>

      {/* Notificaciones WhatsApp (Fase 2) */}
      <div className="bg-iados-surface border border-slate-700 rounded-2xl p-5 opacity-70">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-green-400" />
          <h3 className="font-bold">Notificaciones WhatsApp al Cliente</h3>
          <span className="text-[10px] bg-yellow-900/50 text-yellow-400 border border-yellow-700/40 px-2 py-0.5 rounded-full font-bold">
            PRÓXIMAMENTE — Fase 2
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Número WhatsApp Business</label>
            <input disabled placeholder="Disponible en próxima actualización" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Token de API</label>
            <input disabled placeholder="Disponible en próxima actualización" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Proveedor</label>
            <select disabled className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-500 cursor-not-allowed">
              <option>Meta / WhatsApp Business API</option>
              <option>Twilio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mensajes personalizables */}
      <div className="bg-iados-surface border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} className="text-blue-400" />
          <h3 className="font-bold">Mensajes personalizables</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Estos mensajes se usarán cuando se active WhatsApp en Fase 2. Usa <code className="bg-slate-700 px-1 rounded text-blue-300">{'#{folio}'}</code> para incluir el folio del pedido.
        </p>
        <div className="space-y-4">
          {[
            { key: 'msg_asignado',     label: 'Al asignar repartidor' },
            { key: 'msg_en_camino',    label: 'Al salir a entregar' },
            { key: 'msg_entregado',    label: 'Al confirmar entrega' },
            { key: 'msg_con_problema', label: 'Al reportar problema' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-slate-400 mb-1 block">{label}</label>
              <textarea
                value={(form as any)[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                rows={2}
                className="w-full bg-iados-card border border-slate-700 rounded-xl px-3 py-2 text-sm text-white resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50"
      >
        <Save size={16} /> {saving ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </div>
  );
}
