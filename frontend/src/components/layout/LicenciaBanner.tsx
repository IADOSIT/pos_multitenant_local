import { useState, useEffect } from 'react';
import { licenciasApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import { Shield, AlertTriangle, XCircle, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LicenciaBanner() {
  const { user } = useAuthStore();
  const [lic, setLic] = useState<any>(null);
  const [showActivar, setShowActivar] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [activando, setActivando] = useState(false);

  useEffect(() => {
    if (user) loadEstado();
    // Heartbeat every 24h
    const interval = setInterval(() => {
      licenciasApi.heartbeat().catch(() => {});
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadEstado = async () => {
    try {
      const { data } = await licenciasApi.estado();
      setLic(data);
    } catch {}
  };

  const handleActivar = async () => {
    if (!codigo.trim()) return;
    setActivando(true);
    try {
      await licenciasApi.activar(codigo.trim());
      toast.success('Licencia activada exitosamente!');
      setCodigo('');
      setShowActivar(false);
      loadEstado();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Codigo invalido');
    } finally { setActivando(false); }
  };

  if (!lic) return null;

  // Superadmin never restricted, no banner
  if (user?.rol === 'superadmin') return null;

  // Hide banner only if active (not trial) and > 15 days remaining
  if (lic.estado === 'activa' && lic.dias_restantes > 15 && !lic.bloqueada) return null;

  const isAdmin = ['superadmin', 'admin'].includes(user?.rol || '');

  // Expired + blocked = full modal
  if (lic.bloqueada) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
        <div className="bg-iados-surface border border-red-600 rounded-2xl p-6 max-w-md w-full text-center space-y-4">
          <XCircle size={48} className="mx-auto text-red-500" />
          <h2 className="text-xl font-bold text-red-400">Licencia Expirada</h2>
          <p className="text-slate-400 text-sm">
            Tu licencia ha expirado y el periodo de gracia ha terminado. El sistema esta en modo solo lectura.
          </p>
          <p className="text-xs text-slate-500">
            Codigo: <span className="font-mono">{lic.codigo_instalacion}</span>
          </p>
          {isAdmin && (
            <>
              <input
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Ingresa codigo de activacion"
                className="input-touch text-center font-mono"
              />
              <button onClick={handleActivar} disabled={activando} className="btn-success w-full">
                {activando ? 'Activando...' : 'Activar Licencia'}
              </button>
            </>
          )}
          {!isAdmin && <p className="text-xs text-slate-500">Contacta al administrador para renovar.</p>}
        </div>
      </div>
    );
  }

  // Grace period = red banner
  if (lic.en_grace) {
    return (
      <>
        <div className="bg-red-600/90 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2 flex-wrap">
          <AlertTriangle size={16} />
          <span>Licencia vencida - {lic.dias_grace_restantes} dias de gracia restantes</span>
          {isAdmin && (
            <button onClick={() => setShowActivar(!showActivar)} className="underline text-xs ml-2">Activar</button>
          )}
        </div>
        {showActivar && isAdmin && (
          <div className="bg-red-900/50 px-4 py-2 flex items-center gap-2 justify-center">
            <input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Codigo de activacion" className="input-touch text-sm max-w-xs font-mono" />
            <button onClick={handleActivar} disabled={activando} className="btn-success text-sm">{activando ? '...' : 'Activar'}</button>
          </div>
        )}
      </>
    );
  }

  // Trial or expiring soon = yellow banner
  if (lic.estado === 'trial' || lic.dias_restantes <= 15) {
    const isTrial = lic.estado === 'trial';
    return (
      <>
        <div className="bg-amber-600/90 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 flex-wrap">
          <Shield size={16} className="shrink-0" />
          <span>
            {isTrial ? 'Periodo de prueba' : 'Licencia por vencer'} — {lic.dias_restantes} días restantes
            {isTrial && lic.codigo_instalacion && (
              <span className="ml-2 text-xs opacity-80">
                · Código instalación: <span className="font-mono font-bold">{lic.codigo_instalacion}</span>
              </span>
            )}
          </span>
          {isAdmin && (
            <button onClick={() => setShowActivar(!showActivar)} className="underline text-xs ml-2 shrink-0">
              {showActivar ? 'Cerrar' : 'Activar licencia'}
            </button>
          )}
        </div>
        {showActivar && isAdmin && (
          <div className="bg-amber-900/60 px-4 py-3 flex flex-col items-center gap-2">
            {isTrial && lic.codigo_instalacion && (
              <p className="text-xs text-amber-200 text-center">
                Comparte el código <span className="font-mono font-bold">{lic.codigo_instalacion}</span> con tu proveedor para obtener el código de activación.
              </p>
            )}
            <div className="flex items-center gap-2">
              <input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ingresa código de activación" className="input-touch text-sm max-w-xs font-mono" />
              <button onClick={handleActivar} disabled={activando} className="btn-success text-sm">{activando ? '...' : 'Activar'}</button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
