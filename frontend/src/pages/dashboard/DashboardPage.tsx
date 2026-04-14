import { useState, useEffect } from 'react';
import { dashboardApi, tiendasApi } from '../../api/endpoints';
import { KPI } from '../../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, Receipt, DollarSign, Ban, ClipboardList, QrCode, Users, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import SelfOrderDashboard from '../admin/SelfOrderDashboard';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const [tab, setTab] = useState<'ventas' | 'selforder' | 'categorias'>('ventas');
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [tendencia, setTendencia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState('hoy');
  const [pedidosPendientes, setPedidosPendientes] = useState(0);
  const [categoriasEnabled, setCategoriasEnabled] = useState(false);
  const [ventasCat, setVentasCat] = useState<any[]>([]);
  const [loadingCat, setLoadingCat] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    loadKPI(); loadTendencia(); loadPedidosCount();
    if (tab === 'categorias') loadVentasCat();
  }, [rango]);

  useEffect(() => {
    if (user?.tienda_id) {
      tiendasApi.get(user.tienda_id).then(({ data }) => {
        setCategoriasEnabled(data?.config_pos?.dashboard_categorias_enabled || false);
      }).catch(() => {});
    }
  }, [user?.tienda_id]);

  useEffect(() => {
    if (tab === 'categorias') loadVentasCat();
  }, [tab, rango]);

  const loadPedidosCount = async () => {
    try { const { data } = await dashboardApi.pedidosCount(); setPedidosPendientes(data.count); } catch {}
  };

  const getRangoFechas = () => {
    const now = new Date();
    const hasta = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let desde = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    if (rango === 'semana') desde.setDate(desde.getDate() - 7);
    if (rango === 'mes') desde.setMonth(desde.getMonth() - 1);
    return { desde: desde.toISOString(), hasta: hasta.toISOString() };
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
    try {
      const { data } = await dashboardApi.tendencia(8);
      setTendencia(data);
    } catch {}
  };

  const loadVentasCat = async () => {
    setLoadingCat(true);
    try {
      const { desde, hasta } = getRangoFechas();
      const { data } = await dashboardApi.ventasCategoria(desde, hasta);
      setVentasCat(data);
    } catch {} finally { setLoadingCat(false); }
  };

  const horasData = kpi?.ventas_por_hora?.map((v, i) => ({ hora: `${i}:00`, ventas: v })) || [];
  const pagosData = kpi ? Object.entries(kpi.metodos_pago).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Tabs principales */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-1">
        <button
          onClick={() => setTab('ventas')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'ventas' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <TrendingUp size={15} /> Ventas
        </button>
        <button
          onClick={() => setTab('selforder')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'selforder' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <QrCode size={15} /> Self Order
        </button>
        {categoriasEnabled && (
          <button
            onClick={() => setTab('categorias')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'categorias' ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Tag size={15} /> Por Categoría
          </button>
        )}
      </div>

      {tab === 'selforder' && <SelfOrderDashboard embedded />}

      {tab === 'categorias' && (
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h1 className="text-2xl font-bold">Ventas por Categoría</h1>
            <div className="flex gap-2">
              {['hoy', 'semana', 'mes'].map((r) => (
                <button key={r} onClick={() => setRango(r)} className={`btn-touch text-sm px-4 py-2 ${rango === r ? 'bg-iados-primary' : 'bg-iados-card'}`}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {loadingCat ? (
            <div className="text-center text-slate-400 py-12">Cargando...</div>
          ) : ventasCat.length === 0 ? (
            <div className="text-center text-slate-500 py-12">Sin ventas en este período</div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Gráfica de barras por categoría */}
              <div className="card">
                <h3 className="font-bold mb-3">Ventas por Categoría</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ventasCat} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                    <YAxis type="category" dataKey="categoria" stroke="#94a3b8" fontSize={11} width={80} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Total']} />
                    <Bar dataKey="total_ventas" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {ventasCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla detalle */}
              <div className="card">
                <h3 className="font-bold mb-3">Detalle por Categoría</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-xs border-b border-slate-700">
                        <th className="text-left py-2">Categoría</th>
                        <th className="text-right py-2">Tickets</th>
                        <th className="text-right py-2">Unidades</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasCat.map((c, i) => {
                        const pct = ventasCat[0]?.total_ventas > 0 ? (c.total_ventas / ventasCat[0].total_ventas) * 100 : 0;
                        return (
                          <tr key={i} className="border-b border-slate-800 hover:bg-iados-card/50">
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                <span className="truncate max-w-[150px]">{c.categoria}</span>
                              </div>
                              <div className="h-1 bg-slate-800 rounded-full mt-1 w-full max-w-[150px] ml-4">
                                <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                              </div>
                            </td>
                            <td className="text-right py-2 text-slate-400">{c.num_ventas}</td>
                            <td className="text-right py-2 text-slate-400">{c.total_unidades}</td>
                            <td className="text-right py-2 font-bold text-green-400">${Number(c.total_ventas).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-600 text-xs text-slate-400">
                        <td className="py-2 font-medium">Total</td>
                        <td className="text-right py-2">{ventasCat.reduce((s, c) => s + c.num_ventas, 0)}</td>
                        <td className="text-right py-2">{ventasCat.reduce((s, c) => s + c.total_unidades, 0)}</td>
                        <td className="text-right py-2 font-bold text-white">${ventasCat.reduce((s, c) => s + c.total_ventas, 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
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
