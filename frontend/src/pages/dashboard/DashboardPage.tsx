import { useState, useEffect } from 'react';
import { dashboardApi, tiendasApi } from '../../api/endpoints';
import { KPI } from '../../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, Receipt, DollarSign, Ban, ClipboardList, QrCode, Users, Tag, ChevronDown, ChevronRight, Layers, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import SelfOrderDashboard from '../admin/SelfOrderDashboard';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#a855f7', '#84cc16'];

type DashTab = 'ventas' | 'selforder' | 'categorias' | 'presentacion' | 'top_productos';

interface DashConfig {
  ventas_enabled: boolean;
  selforder_enabled: boolean;
  categorias_enabled: boolean;
  drill_down_enabled: boolean;
  unidad_enabled: boolean;
  top_productos_enabled: boolean;
  top_n: number;
  mostrar_margen: boolean;
}

export default function DashboardPage() {
  const [tab, setTab] = useState<DashTab>('ventas');
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [tendencia, setTendencia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState('hoy');
  const [pedidosPendientes, setPedidosPendientes] = useState(0);
  const [cfg, setCfg] = useState<DashConfig>({ ventas_enabled: true, selforder_enabled: true, categorias_enabled: false, drill_down_enabled: false, unidad_enabled: false, top_productos_enabled: false, top_n: 10, mostrar_margen: false });

  // Tab data
  const [ventasCat, setVentasCat] = useState<any[]>([]);
  const [ventasUnidad, setVentasUnidad] = useState<any[]>([]);
  const [ventasProd, setVentasProd] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // Drill-down categoría → productos
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [drillData, setDrillData] = useState<Record<string, any[]>>({});
  const [loadingDrill, setLoadingDrill] = useState<string | null>(null);

  // Filtro categoría en top productos
  const [filtroCat, setFiltroCat] = useState<string>('');

  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Cargar config de la tienda
  useEffect(() => {
    if (user?.tienda_id) {
      tiendasApi.get(user.tienda_id).then(({ data }) => {
        const cp = data?.config_pos || {};
        setCfg({
          ventas_enabled: cp.dashboard_ventas_enabled !== false,
          selforder_enabled: cp.dashboard_selforder_enabled !== false,
          categorias_enabled: cp.dashboard_categorias_enabled || false,
          drill_down_enabled: cp.dashboard_drill_down_enabled || false,
          unidad_enabled: cp.dashboard_unidad_enabled || false,
          top_productos_enabled: cp.dashboard_top_productos_enabled || false,
          top_n: cp.dashboard_top_n || 10,
          mostrar_margen: cp.dashboard_mostrar_margen || false,
        });
      }).catch(() => {});
    }
  }, [user?.tienda_id]);

  // Si el tab activo queda oculto por config, saltar al primer tab visible
  useEffect(() => {
    const tabShow: Record<DashTab, boolean> = {
      ventas: cfg.ventas_enabled,
      selforder: cfg.selforder_enabled,
      categorias: cfg.categorias_enabled,
      presentacion: cfg.unidad_enabled,
      top_productos: cfg.top_productos_enabled,
    };
    if (!tabShow[tab]) {
      const first = (Object.entries(tabShow) as [DashTab, boolean][]).find(([, v]) => v)?.[0];
      if (first) setTab(first);
    }
  }, [cfg]);

  useEffect(() => { loadKPI(); loadTendencia(); loadPedidosCount(); }, [rango]);

  useEffect(() => {
    const { desde, hasta } = getRangoFechas();
    if (tab === 'categorias') loadVentasCat(desde, hasta);
    if (tab === 'presentacion') loadVentasUnidad(desde, hasta);
    if (tab === 'top_productos') loadVentasProd(desde, hasta);
    setExpandedCat(null);
  }, [tab, rango]);

  const loadPedidosCount = async () => {
    try { const { data } = await dashboardApi.pedidosCount(); setPedidosPendientes(data.count); } catch {}
  };

  const getRangoFechas = () => {
    const TZ = 'America/Mexico_City';
    const now = new Date();
    // Fecha actual en hora Mexico/Monterrey (independiente del timezone del browser)
    const mxDate = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
    const offsetMs = now.getTime() - mxDate.getTime(); // ms que UTC está adelante de MX
    const y = mxDate.getFullYear(), mo = mxDate.getMonth(), d = mxDate.getDate();
    // Límites en hora MX → convertir a UTC para el query
    const hastaLocal = new Date(y, mo, d, 23, 59, 59);
    let desdeLocal = new Date(y, mo, d, 0, 0, 0);
    if (rango === 'semana') desdeLocal = new Date(y, mo, d - 7, 0, 0, 0);
    if (rango === 'mes') desdeLocal = new Date(y, mo - 1, d, 0, 0, 0);
    return {
      desde: new Date(desdeLocal.getTime() + offsetMs).toISOString(),
      hasta: new Date(hastaLocal.getTime() + offsetMs).toISOString(),
    };
  };

  const loadKPI = async () => {
    setLoading(true);
    try {
      const { desde, hasta } = getRangoFechas();
      const { data } = await dashboardApi.kpi(desde, hasta);
      setKpi(data);
    } catch {} finally { setLoading(false); }
  };

  const loadTendencia = async () => {
    try { const { data } = await dashboardApi.tendencia(8); setTendencia(data); } catch {}
  };

  const loadVentasCat = async (desde: string, hasta: string) => {
    setLoadingTab(true);
    try { const { data } = await dashboardApi.ventasCategoria(desde, hasta); setVentasCat(data); }
    catch {} finally { setLoadingTab(false); }
  };

  const loadVentasUnidad = async (desde: string, hasta: string) => {
    setLoadingTab(true);
    try { const { data } = await dashboardApi.ventasUnidad(desde, hasta); setVentasUnidad(data); }
    catch {} finally { setLoadingTab(false); }
  };

  const loadVentasProd = async (desde: string, hasta: string, catId?: number) => {
    setLoadingTab(true);
    try { const { data } = await dashboardApi.ventasProducto(desde, hasta, catId); setVentasProd(data); }
    catch {} finally { setLoadingTab(false); }
  };

  // Drill-down: carga productos de una categoría al expandir
  const toggleDrill = async (cat: any) => {
    if (!cfg.drill_down_enabled) return;
    if (expandedCat === cat.categoria) { setExpandedCat(null); return; }
    setExpandedCat(cat.categoria);
    if (drillData[cat.categoria]) return; // ya cargado
    setLoadingDrill(cat.categoria);
    try {
      const { desde, hasta } = getRangoFechas();
      // Necesitamos categoria_id — lo obtenemos del primer registro de ventasCat que tenga id
      const { data } = await dashboardApi.ventasProducto(desde, hasta);
      const prodsCat = data.filter((p: any) => p.categoria === cat.categoria);
      setDrillData(prev => ({ ...prev, [cat.categoria]: prodsCat }));
    } catch {} finally { setLoadingDrill(null); }
  };

  // Helpers
  const RangoSelector = () => (
    <div className="flex gap-2">
      {['hoy', 'semana', 'mes'].map((r) => (
        <button key={r} onClick={() => setRango(r)} className={`btn-touch text-sm px-4 py-2 ${rango === r ? 'bg-iados-primary' : 'bg-iados-card'}`}>
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </button>
      ))}
    </div>
  );

  const TablaBase = ({ rows, total, showMargen }: { rows: any[]; total: number; showMargen?: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs border-b border-slate-700">
            <th className="text-left py-2">Nombre</th>
            <th className="text-right py-2">Tickets</th>
            <th className="text-right py-2">Uds.</th>
            <th className="text-right py-2">Total</th>
            <th className="text-right py-2">%</th>
            {showMargen && <th className="text-right py-2">Precio prom.</th>}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, cfg.top_n).map((r, i) => {
            const pct = total > 0 ? (r.total_ventas / total) * 100 : 0;
            return (
              <tr key={i} className="border-b border-slate-800 hover:bg-iados-card/50">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="truncate max-w-[180px]">{r.categoria || r.nombre || r.unidad}</span>
                    {r.unidad && r.nombre && <span className="text-xs text-slate-500 ml-1">{r.unidad}</span>}
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full mt-1 ml-4" style={{ maxWidth: 160 }}>
                    <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </td>
                <td className="text-right py-2 text-slate-400">{r.num_ventas}</td>
                <td className="text-right py-2 text-slate-400">{r.total_unidades}</td>
                <td className="text-right py-2 font-bold text-green-400">${Number(r.total_ventas).toFixed(2)}</td>
                <td className="text-right py-2 text-slate-400">{pct.toFixed(1)}%</td>
                {showMargen && <td className="text-right py-2 text-slate-300">${Number(r.precio_promedio || 0).toFixed(2)}</td>}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-600 text-xs text-slate-400">
            <td className="py-2 font-medium">Total ({rows.length} ítems)</td>
            <td className="text-right">{rows.reduce((s, r) => s + r.num_ventas, 0)}</td>
            <td className="text-right">{rows.reduce((s, r) => s + r.total_unidades, 0)}</td>
            <td className="text-right font-bold text-white">${rows.reduce((s, r) => s + r.total_ventas, 0).toFixed(2)}</td>
            <td />
            {showMargen && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const horasData = kpi?.ventas_por_hora?.map((v, i) => ({ hora: `${i}:00`, ventas: v })) || [];
  const pagosData = kpi ? Object.entries(kpi.metodos_pago).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Tabs principales */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-700 pb-1">
        {([
          { id: 'ventas',        icon: TrendingUp, label: 'Ventas',          show: cfg.ventas_enabled },
          { id: 'selforder',     icon: QrCode,     label: 'Self Order',      show: cfg.selforder_enabled },
          { id: 'categorias',    icon: Tag,        label: 'Por Categoría',   show: cfg.categorias_enabled },
          { id: 'presentacion',  icon: Layers,     label: 'Por Presentación',show: cfg.unidad_enabled },
          { id: 'top_productos', icon: Package,    label: 'Top Productos',   show: cfg.top_productos_enabled },
        ] as { id: DashTab; icon: any; label: string; show: boolean }[])
          .filter(t => t.show)
          .map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === id ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))
        }
      </div>

      {tab === 'selforder' && <SelfOrderDashboard embedded />}

      {/* ── TAB: POR CATEGORÍA ─────────────────────────────────────────── */}
      {tab === 'categorias' && (
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h1 className="text-2xl font-bold">Ventas por Categoría</h1>
            <RangoSelector />
          </div>
          {loadingTab ? <div className="text-center text-slate-400 py-12">Cargando...</div>
          : ventasCat.length === 0 ? <div className="text-center text-slate-500 py-12">Sin ventas en este período</div>
          : (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-bold mb-3">Distribución por Categoría</h3>
                <ResponsiveContainer width="100%" height={Math.max(200, ventasCat.length * 36)}>
                  <BarChart data={ventasCat.slice(0, cfg.top_n)} layout="vertical" margin={{ left: 90 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                    <YAxis type="category" dataKey="categoria" stroke="#94a3b8" fontSize={11} width={90} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Ventas']} />
                    <Bar dataKey="total_ventas" radius={[0, 4, 4, 0]}>
                      {ventasCat.slice(0, cfg.top_n).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  Detalle
                  {cfg.drill_down_enabled && <span className="text-xs text-slate-500 font-normal">— toca una fila para ver productos</span>}
                </h3>
                {(() => {
                  const total = ventasCat.reduce((s, c) => s + c.total_ventas, 0);
                  return (
                    <div className="space-y-1">
                      {ventasCat.slice(0, cfg.top_n).map((c, i) => {
                        const pct = total > 0 ? (c.total_ventas / total) * 100 : 0;
                        const isOpen = expandedCat === c.categoria;
                        return (
                          <div key={i}>
                            <div
                              onClick={() => toggleDrill(c)}
                              className={`flex items-center gap-2 p-2 rounded-lg ${cfg.drill_down_enabled ? 'cursor-pointer hover:bg-iados-card/70' : ''} transition-colors`}
                            >
                              {cfg.drill_down_enabled && (isOpen ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />)}
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline gap-2">
                                  <span className="text-sm truncate">{c.categoria}</span>
                                  <span className="text-sm font-bold text-green-400 shrink-0">${Number(c.total_ventas).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="flex-1 h-1 bg-slate-800 rounded-full">
                                    <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                                  </div>
                                  <span className="text-xs text-slate-500 shrink-0">{pct.toFixed(1)}% · {c.total_unidades} uds</span>
                                </div>
                              </div>
                            </div>
                            {/* Drill-down: productos de esta categoría */}
                            {cfg.drill_down_enabled && isOpen && (
                              <div className="ml-8 mb-2 bg-iados-card/40 rounded-lg overflow-hidden">
                                {loadingDrill === c.categoria ? (
                                  <div className="text-xs text-slate-400 p-3">Cargando productos...</div>
                                ) : (drillData[c.categoria] || []).length === 0 ? (
                                  <div className="text-xs text-slate-500 p-3">Sin datos de productos</div>
                                ) : (
                                  <table className="w-full text-xs">
                                    <thead><tr className="text-slate-500 border-b border-slate-700">
                                      <th className="text-left p-2">Producto</th>
                                      <th className="text-right p-2">Uds.</th>
                                      <th className="text-right p-2">Total</th>
                                      {cfg.mostrar_margen && <th className="text-right p-2">P.prom</th>}
                                    </tr></thead>
                                    <tbody>
                                      {(drillData[c.categoria] || []).slice(0, cfg.top_n).map((p, j) => (
                                        <tr key={j} className="border-b border-slate-800/50">
                                          <td className="p-2">
                                            <span className="truncate block max-w-[160px]">{p.nombre}</span>
                                            {p.unidad && <span className="text-slate-500">{p.unidad}</span>}
                                          </td>
                                          <td className="text-right p-2 text-slate-400">{p.total_unidades}</td>
                                          <td className="text-right p-2 font-medium text-green-400">${Number(p.total_ventas).toFixed(2)}</td>
                                          {cfg.mostrar_margen && <td className="text-right p-2 text-slate-300">${Number(p.precio_promedio).toFixed(2)}</td>}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex justify-between px-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
                        <span>{ventasCat.length} categorías</span>
                        <span className="font-bold text-white">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: POR PRESENTACIÓN/UNIDAD ──────────────────────────────── */}
      {tab === 'presentacion' && (
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h1 className="text-2xl font-bold">Ventas por Presentación</h1>
            <RangoSelector />
          </div>
          {loadingTab ? <div className="text-center text-slate-400 py-12">Cargando...</div>
          : ventasUnidad.length === 0 ? <div className="text-center text-slate-500 py-12">Sin ventas en este período</div>
          : (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-bold mb-3">Ventas por Unidad / Presentación</h3>
                <ResponsiveContainer width="100%" height={Math.max(200, ventasUnidad.length * 32)}>
                  <BarChart data={ventasUnidad.slice(0, cfg.top_n)} layout="vertical" margin={{ left: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                    <YAxis type="category" dataKey="unidad" stroke="#94a3b8" fontSize={11} width={70} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                      formatter={(v: any, _n: any, props: any) => [`$${Number(v).toFixed(2)} — cat: ${props.payload.categoria}`, 'Ventas']} />
                    <Bar dataKey="total_ventas" radius={[0, 4, 4, 0]}>
                      {ventasUnidad.slice(0, cfg.top_n).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="font-bold mb-3">Tabla de Presentaciones</h3>
                {(() => {
                  const total = ventasUnidad.reduce((s, r) => s + r.total_ventas, 0);
                  return <TablaBase rows={ventasUnidad.map(r => ({ ...r, nombre: r.unidad }))} total={total} />;
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: TOP PRODUCTOS ────────────────────────────────────────── */}
      {tab === 'top_productos' && (
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h1 className="text-2xl font-bold">Top Productos</h1>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filtroCat}
                onChange={(e) => setFiltroCat(e.target.value)}
                className="input-touch text-sm"
              >
                <option value="">Todas las categorías</option>
                {[...new Set(ventasProd.map((p) => p.categoria))].map((cat) => (
                  <option key={cat as string} value={cat as string}>{cat as string}</option>
                ))}
              </select>
              <RangoSelector />
            </div>
          </div>
          {loadingTab ? <div className="text-center text-slate-400 py-12">Cargando...</div>
          : ventasProd.length === 0 ? <div className="text-center text-slate-500 py-12">Sin ventas en este período</div>
          : (() => {
              const rows = filtroCat ? ventasProd.filter((p) => p.categoria === filtroCat) : ventasProd;
              const total = rows.reduce((s, r) => s + r.total_ventas, 0);
              return (
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="font-bold mb-3">Top {cfg.top_n} — {filtroCat || 'Todos'}</h3>
                    <ResponsiveContainer width="100%" height={Math.max(200, Math.min(cfg.top_n, rows.length) * 34)}>
                      <BarChart data={rows.slice(0, cfg.top_n)} layout="vertical" margin={{ left: 120 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                        <YAxis type="category" dataKey="nombre" stroke="#94a3b8" fontSize={10} width={120}
                          tickFormatter={(v) => v.length > 18 ? v.slice(0, 17) + '…' : v} />
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                          formatter={(v: any, _n: any, props: any) => [`$${Number(v).toFixed(2)}${props.payload.unidad ? ' — ' + props.payload.unidad : ''}`, 'Ventas']} />
                        <Bar dataKey="total_ventas" radius={[0, 4, 4, 0]}>
                          {rows.slice(0, cfg.top_n).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <h3 className="font-bold mb-3">Ranking detallado</h3>
                    <TablaBase rows={rows} total={total} showMargen={cfg.mostrar_margen} />
                  </div>
                </div>
              );
            })()
          }
        </div>
      )}

      {tab === 'ventas' && <>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Dashboard KPI</h1>
        <div className="flex gap-2">
          {['hoy', 'semana', 'mes'].map((r) => (
            <button key={r} onClick={() => setRango(r)} className={`btn-touch text-sm px-4 py-2 ${rango === r ? 'bg-iados-primary' : 'bg-iados-card'}`}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Ventas', value: kpi?.total_ventas, icon: DollarSign, color: 'text-green-400', prefix: '$' },
          { label: 'Tickets', value: kpi?.num_tickets, icon: Receipt, color: 'text-blue-400' },
          { label: 'Ticket Promedio', value: kpi?.ticket_promedio, icon: ShoppingBag, color: 'text-amber-400', prefix: '$' },
          { label: 'Cancelaciones', value: kpi?.cancelaciones, icon: Ban, color: 'text-red-400' },
          { label: 'Top Producto', value: kpi?.top_productos?.[0]?.nombre || '-', icon: TrendingUp, color: 'text-purple-400', isText: true },
        ].map((card, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={18} className={card.color} />
              <span className="text-xs text-slate-400">{card.label}</span>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>
              {loading ? '...' : card.isText ? card.value : `${card.prefix || ''}${Number(card.value || 0).toFixed(card.prefix ? 2 : 0)}`}
            </p>
          </div>
        ))}
        {/* Pedidos Pendientes */}
        <div onClick={() => navigate('/pedidos')} className="card cursor-pointer hover:ring-2 hover:ring-iados-secondary transition-all">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={18} className="text-orange-400" />
            <span className="text-xs text-slate-400">Pedidos Pend.</span>
          </div>
          <p className={`text-xl font-bold ${pedidosPendientes > 0 ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`}>
            {pedidosPendientes}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Ventas por hora */}
        <div className="card">
          <h3 className="font-bold mb-3">Ventas por Hora</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={horasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hora" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
              <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Métodos de pago */}
        <div className="card">
          <h3 className="font-bold mb-3">Métodos de Pago</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pagosData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: $${value.toFixed(0)}`}>
                {pagosData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top productos */}
        <div className="card">
          <h3 className="font-bold mb-3">Top 10 Productos</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {kpi?.top_productos?.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-iados-card p-2 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-iados-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="flex-1 text-sm truncate">{p.nombre}</span>
                <span className="text-xs text-slate-400">{p.cantidad}u</span>
                <span className="text-sm font-bold text-green-400">${p.total.toFixed(2)}</span>
              </div>
            )) || <p className="text-slate-500 text-sm">Sin datos</p>}
          </div>
        </div>

        {/* Top 10 Clientes */}
        {(kpi?.top_clientes?.length ?? 0) > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2"><Users size={16} className="text-iados-accent" /> Top Clientes</h3>
              <button onClick={() => navigate('/reportes')} className="text-xs text-iados-primary hover:underline">Ver todos</button>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {(kpi?.top_clientes ?? []).map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-iados-card p-2 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.nombre || c.telefono}</div>
                    {c.nombre && <div className="text-xs text-slate-400">{c.telefono}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-green-400">${Number(c.total_gastado).toFixed(2)}</div>
                    <div className="text-xs text-slate-400">{c.total_compras} compras</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tendencia semanal */}
        <div className="card">
          <h3 className="font-bold mb-3">Tendencia Semanal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tendencia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="semana" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
              <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      </>}
    </div>
  );
}
