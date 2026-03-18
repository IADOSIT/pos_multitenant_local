import { useState, useEffect } from 'react';
import { selfOrderApi, encuestasApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { QrCode, Star, TrendingUp, Users, MessageSquare, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
};

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= Math.round(value) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
        />
      ))}
      <span className="ml-1 text-sm font-bold">{value.toFixed(1)}</span>
    </span>
  );
}

export default function SelfOrderDashboard({ embedded = false }: { embedded?: boolean }) {
  const [desde, setDesde] = useState(weekAgo());
  const [hasta, setHasta] = useState(today());
  const [kpisVentas, setKpisVentas] = useState<any>(null);
  const [kpisEncuestas, setKpisEncuestas] = useState<any>(null);
  const [encuestasRecientes, setEncuestasRecientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [kv, ke, er] = await Promise.all([
        selfOrderApi.kpis(desde, hasta),
        encuestasApi.kpis(desde, hasta),
        encuestasApi.list(20),
      ]);
      setKpisVentas(kv.data);
      setKpisEncuestas(ke.data);
      setEncuestasRecientes(er.data);
    } catch {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const meseroData = (kpisEncuestas?.por_mesero || []).map((m: any) => ({
    name: m.mesero_nombre.split(' ')[0],
    servicio: m.promedio_servicio,
    comida: m.promedio_comida,
    total: m.total_encuestas,
  }));

  return (
    <div className={`${embedded ? '' : 'p-4 max-w-6xl mx-auto'} space-y-4`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode size={24} /> Self Order — KPIs
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="input-touch text-sm py-1.5 w-36" />
          <span className="text-slate-400 text-sm">al</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="input-touch text-sm py-1.5 w-36" />
          <button onClick={load} disabled={loading} className="btn-primary text-sm py-1.5">
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {/* KPI Cards - Ventas */}
      {kpisVentas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card text-center">
            <div className="text-3xl font-black text-iados-secondary">{kpisVentas.total_pedidos ?? 0}</div>
            <div className="text-xs text-slate-400 mt-1">Pedidos Self Order</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-black text-green-400">
              ${Number(kpisVentas.total_ventas ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">Ventas Totales</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-black text-blue-400">
              ${Number(kpisVentas.ticket_promedio ?? 0).toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Ticket Promedio</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-black text-purple-400">{kpisVentas.rechazados ?? 0}</div>
            <div className="text-xs text-slate-400 mt-1">Rechazados</div>
          </div>
        </div>
      )}

      {/* KPI Cards - Encuestas de Meseros */}
      <div className="card">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><Star size={16} className="text-yellow-400" /> Encuestas de Meseros</h2>
        {kpisEncuestas && kpisEncuestas.total > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Star size={20} className="text-yellow-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Servicio</div>
                <StarDisplay value={kpisEncuestas.promedio_servicio} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Award size={20} className="text-orange-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Comida</div>
                <StarDisplay value={kpisEncuestas.promedio_comida} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare size={20} className="text-indigo-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Encuestas completadas</div>
                <div className="text-2xl font-black">{kpisEncuestas.total}</div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Sin encuestas en el periodo — se generan al cobrar pedidos Self Order.</p>
        )}
      </div>

      {/* Gráfica por mesero */}
      {meseroData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Users size={16} /> Calificaciones por Mesero
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={meseroData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Bar dataKey="servicio" name="Servicio" fill="#facc15" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comida" name="Comida" fill="#fb923c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {(kpisEncuestas?.por_mesero || []).map((m: any) => (
              <div key={m.mesero_id} className="flex items-center justify-between text-xs bg-iados-card rounded-lg px-3 py-2">
                <span className="font-medium">{m.mesero_nombre}</span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">{m.total_encuestas} enc.</span>
                  <span className="text-yellow-400">Serv: {m.promedio_servicio}</span>
                  <span className="text-orange-400">Com: {m.promedio_comida}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encuestas recientes */}
      {encuestasRecientes.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <TrendingUp size={16} /> Últimas Encuestas
          </h2>
          <div className="space-y-2">
            {encuestasRecientes.filter((e) => e.completada).map((e) => (
              <div key={e.id} className="flex items-start justify-between bg-iados-card rounded-lg px-3 py-2 text-xs gap-2">
                <div className="min-w-0">
                  <span className="font-medium text-slate-300">
                    Mesa {e.mesa_numero}{e.mesero_nombre ? ` · ${e.mesero_nombre}` : ''}
                  </span>
                  {e.comentario && (
                    <p className="text-slate-400 mt-0.5 truncate max-w-xs">"{e.comentario}"</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star size={11} className="fill-yellow-400" /> {e.calificacion_servicio}/5
                  </span>
                  <span className="flex items-center gap-1 text-orange-400">
                    <Award size={11} /> {e.calificacion_comida}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && kpisVentas && kpisVentas.total_pedidos === 0 && (
        <div className="text-center text-slate-500 py-16">
          <QrCode size={48} className="mx-auto mb-3 opacity-30" />
          <p>No hay pedidos Self Order en el periodo seleccionado.</p>
          <p className="text-xs mt-1">Asegúrate de que Self Order esté activo en Configuración.</p>
        </div>
      )}
    </div>
  );
}
