import { useState, useEffect } from 'react';
import { dashboardApi } from '../../api/endpoints';
import { KPI } from '../../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, Receipt, DollarSign, Ban } from 'lucide-react';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [tendencia, setTendencia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState('hoy');

  useEffect(() => { loadKPI(); loadTendencia(); }, [rango]);

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

  const horasData = kpi?.ventas_por_hora?.map((v, i) => ({ hora: `${i}:00`, ventas: v })) || [];
  const pagosData = kpi ? Object.entries(kpi.metodos_pago).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
    </div>
  );
}
