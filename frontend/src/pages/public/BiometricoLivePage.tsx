import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { CheckCircle, XCircle } from 'lucide-react';

interface AttendanceEvent {
  id: number; empleado_nombre: string; fecha: string;
  timestamp_entrada: string; estado: string; minutos_tarde?: number;
  nuevo: boolean; resultado?: string;
}

export default function BiometricoLivePage() {
  const { empresa_token } = useParams<{ empresa_token: string }>();
  const [latest, setLatest] = useState<AttendanceEvent | null>(null);
  const [history, setHistory] = useState<AttendanceEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [hora, setHora] = useState(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const showTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sockRef = useRef<Socket | null>(null);

  useEffect(() => {
    const ticker = setInterval(() => setHora(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })), 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (!empresa_token) return;
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://posapi.iados.online';
    const sock = io(`${base}/biometrico`, { transports: ['websocket'] });
    sockRef.current = sock;
    sock.on('connect', () => {
      setConnected(true);
      sock.emit('live-join', { empresa_token });
    });
    sock.on('disconnect', () => setConnected(false));
    sock.on('attendance-event', (data: AttendanceEvent) => {
      if (data.resultado === 'no_match') {
        setLatest({ id: 0, empleado_nombre: 'No reconocido', fecha: '', timestamp_entrada: new Date().toISOString(), estado: 'no_match', nuevo: true });
      } else {
        setLatest(data);
        if (data.nuevo) {
          setHistory(prev => [data, ...prev].slice(0, 8));
        }
      }
      if (showTimeout.current) clearTimeout(showTimeout.current);
      showTimeout.current = setTimeout(() => setLatest(null), 6000);
    });
    return () => { sock.disconnect(); };
  }, [empresa_token]);

  const hora_entry = latest ? new Date(latest.timestamp_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
  const isNoMatch = latest?.estado === 'no_match';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center select-none" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Reloj */}
      <div className="absolute top-6 right-8 text-slate-500 text-2xl font-mono">{hora}</div>
      <div className="absolute top-6 left-8 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
        <span className="text-xs text-slate-500">{connected ? 'Bridge conectado' : 'Esperando bridge...'}</span>
      </div>

      {/* Panel principal */}
      {latest ? (
        <div className={`flex flex-col items-center gap-6 transition-all duration-500 ${isNoMatch ? 'opacity-80' : ''}`}>
          <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl ${
            isNoMatch ? 'bg-red-900/40 border-2 border-red-500' :
            latest.estado === 'tarde' ? 'bg-yellow-900/40 border-2 border-yellow-500' :
            'bg-green-900/40 border-2 border-green-500'
          }`}>
            {isNoMatch
              ? <XCircle size={56} className="text-red-400" />
              : <CheckCircle size={56} className={latest.estado === 'tarde' ? 'text-yellow-400' : 'text-green-400'} />
            }
          </div>
          <div className="text-center">
            <p className={`text-5xl font-bold mb-2 ${isNoMatch ? 'text-red-300' : latest.estado === 'tarde' ? 'text-yellow-300' : 'text-white'}`}>
              {isNoMatch ? 'No reconocido' : latest.empleado_nombre}
            </p>
            {!isNoMatch && (
              <>
                <p className="text-3xl text-slate-400 mb-1">{hora_entry}</p>
                <span className={`text-xl font-semibold px-4 py-1 rounded-full ${latest.estado === 'puntual' ? 'bg-green-900/50 text-green-300' : latest.estado === 'tarde' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-slate-700 text-slate-300'}`}>
                  {latest.estado === 'puntual' ? '✓ Puntual' : latest.estado === 'tarde' ? `⚠ Tarde ${latest.minutos_tarde}min` : ''}
                </span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 text-slate-700">
          <div className="w-28 h-28 rounded-full border-2 border-slate-700 flex items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="28" cy="28" rx="20" ry="26" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M18 28 Q22 20 28 20 Q34 20 38 28" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M21 33 Q25 27 28 25 Q31 27 35 33" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <p className="text-2xl font-light tracking-wider">Coloca tu huella en el lector</p>
        </div>
      )}

      {/* Historial reciente */}
      {history.length > 0 && (
        <div className="absolute bottom-6 left-0 right-0 px-8">
          <div className="flex gap-2 justify-center overflow-hidden">
            {history.slice(0, 6).map((h, i) => (
              <div key={h.id + i} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center min-w-[100px]">
                <p className="text-xs font-medium text-slate-300 truncate max-w-[90px]">{h.empleado_nombre.split(' ')[0]}</p>
                <p className="text-xs text-slate-500">{new Date(h.timestamp_entrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                <span className={`text-xs ${h.estado === 'puntual' ? 'text-green-500' : h.estado === 'tarde' ? 'text-yellow-500' : 'text-slate-500'}`}>
                  {h.estado === 'puntual' ? '●' : h.estado === 'tarde' ? '▲' : '○'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
