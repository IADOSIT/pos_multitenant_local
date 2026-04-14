import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { perfilesApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';

export default function StockAlertBanner() {
  const { user } = useAuthStore();
  const [alertCount, setAlertCount] = useState(0);
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAlertas = async () => {
    try {
      const modulo = (user as any)?.modulo || undefined;
      const { data } = await perfilesApi.alertasStock(modulo);
      setAlertCount((data || []).length);
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    checkAlertas();
    intervalRef.current = setInterval(checkAlertas, 60_000);
    window.addEventListener('inventario:changed', checkAlertas);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('inventario:changed', checkAlertas);
    };
  }, [user]);

  if (alertCount === 0) return null;

  return (
    <button
      onClick={() => navigate('/inventario')}
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
