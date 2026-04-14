import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { perfilesApi } from '../../api/endpoints';

export default function StockAlertBanner() {
  const [alertCount, setAlertCount] = useState(0);
  const [perfilActivo, setPerfilActivo] = useState<any>(null);
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAlertas = async () => {
    try {
      const rPerfil = await perfilesApi.getActivo();
      const perfil = rPerfil.data;
      setPerfilActivo(perfil);
      if (!perfil?.config?.alertas_stock) {
        setAlertCount(0);
        return;
      }
      const rAlertas = await perfilesApi.alertasStock();
      setAlertCount((rAlertas.data || []).length);
    } catch {
      // silencioso — no bloquear el layout
    }
  };

  useEffect(() => {
    checkAlertas();
    intervalRef.current = setInterval(checkAlertas, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!perfilActivo?.config?.alertas_stock || alertCount === 0) return null;

  return (
    <button
      onClick={() => navigate('/inventario-dual')}
      className="w-full flex items-center gap-2 bg-yellow-900/40 border-b border-yellow-700/60 px-4 py-1.5 text-left hover:bg-yellow-900/60 transition-colors"
    >
      <AlertTriangle size={14} className="text-yellow-400 animate-pulse shrink-0" />
      <span className="text-yellow-300 text-xs font-medium">
        ⚠ {alertCount} producto{alertCount !== 1 ? 's' : ''} con stock bajo
      </span>
      <span className="ml-auto text-yellow-400 text-xs underline">Ver</span>
    </button>
  );
}
