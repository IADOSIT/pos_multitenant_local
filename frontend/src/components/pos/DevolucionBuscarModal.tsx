import { useState, useEffect, useRef } from 'react';
import { ventasApi } from '../../api/endpoints';
import { X, Search, RotateCcw, Clock, User } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSelectVenta: (ventaId: number) => void;
}

export default function DevolucionBuscarModal({ onClose, onSelectVenta }: Props) {
  const [q, setQ] = useState('');
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carga ventas del día al abrir
  useEffect(() => {
    buscar('');
    inputRef.current?.focus();
  }, []);

  const buscar = async (term: string) => {
    setLoading(true);
    try {
      const { data } = await ventasApi.buscar(term);
      setVentas(data || []);
    } catch {
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (val: string) => {
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(val), 300);
  };

  const metodoLabel: Record<string, string> = {
    efectivo: '💵 Efectivo',
    tarjeta: '💳 Tarjeta',
    transferencia: '🏦 Transfer.',
    mixto: '🔀 Mixto',
  };

  const timeAgo = (fecha: string) => {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <RotateCcw size={18} className="text-amber-400" />
            Devolución — Buscar Ticket
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-iados-card rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Buscador */}
        <div className="relative mb-3 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => handleChange(e.target.value)}
            placeholder="Folio (V-ABC123), monto exacto o nombre cliente..."
            className="input-touch pl-9 w-full text-sm"
          />
        </div>

        <p className="text-xs text-slate-500 mb-2 shrink-0">
          {q ? `Resultados para "${q}"` : 'Ventas de hoy — toca una para devolver'}
        </p>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 space-y-2">
          {loading && <p className="text-center text-slate-400 py-8 text-sm">Buscando...</p>}

          {!loading && ventas.length === 0 && (
            <div className="text-center text-slate-500 py-10">
              <RotateCcw size={36} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No se encontraron ventas</p>
              {q && <p className="text-xs mt-1">Prueba con el folio exacto o el monto</p>}
            </div>
          )}

          {!loading && ventas.map((v) => (
            <button
              key={v.id}
              onClick={() => onSelectVenta(v.id)}
              className="w-full text-left bg-iados-card hover:bg-slate-700 rounded-xl p-3 transition-colors flex items-center gap-3"
            >
              {/* Icono */}
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center shrink-0">
                <RotateCcw size={18} className="text-amber-400" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">{v.folio}</span>
                  <span className="text-xs text-slate-400">{metodoLabel[v.metodo_pago] || v.metodo_pago}</span>
                </div>
                {v.cliente_nombre && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <User size={10} />{v.cliente_nombre}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <Clock size={10} />{timeAgo(v.created_at)}
                  {v.usuario_nombre && <span>· {v.usuario_nombre}</span>}
                </div>
              </div>

              {/* Total */}
              <div className="text-right shrink-0">
                <p className="text-green-400 font-bold text-lg">${Number(v.total).toFixed(2)}</p>
                <p className="text-xs text-amber-400">Devolver →</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
