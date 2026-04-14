import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { licenciasApi } from '../api/endpoints';
import { Shield, CheckCircle, XCircle, Loader } from 'lucide-react';

/** Generates a deterministic machine fingerprint from browser environment */
function getMachineFingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.platform,
    navigator.language,
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];
  const raw = parts.join('|');
  // Simple hash — consistent per browser/machine combo
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (Math.imul(31, hash) + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0') + '-' + raw.length.toString(16);
}

type Status = 'loading' | 'success' | 'error' | 'missing';

export default function ActivarLicenciaPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [tenantName, setTenantName] = useState('');

  useEffect(() => {
    const token = params.get('t');
    if (!token) {
      setStatus('missing');
      return;
    }
    activate(token);
  }, []);

  const activate = async (token: string) => {
    try {
      const fingerprint = getMachineFingerprint();
      const { data } = await licenciasApi.activarConToken(token, fingerprint);
      setTenantName(data.tenant_id ? `Tenant #${data.tenant_id}` : '');
      setStatus('success');
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Error al activar la licencia');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-iados-dark flex items-center justify-center p-6">
      <div className="card w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <Shield size={56} className="text-iados-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Activacion de Licencia</h1>
          <p className="text-slate-400 mt-1 text-sm">POS iaDoS</p>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader size={40} className="animate-spin text-iados-primary" />
            <p className="text-slate-300">Activando licencia, por favor espera...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle size={48} className="text-green-400" />
              <p className="text-green-400 font-bold text-lg">Licencia activada exitosamente</p>
            </div>
            {tenantName && <p className="text-slate-400 text-sm">{tenantName}</p>}
            <p className="text-slate-300 text-sm">
              Tu licencia ha quedado registrada en este equipo. Puedes cerrar esta ventana o iniciar sesion en el sistema.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Ir al inicio de sesion
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <XCircle size={48} className="text-red-400" />
              <p className="text-red-400 font-bold text-lg">No se pudo activar</p>
            </div>
            <p className="text-slate-300 text-sm bg-red-900/20 rounded-lg p-3">{message}</p>
            <p className="text-slate-400 text-xs">
              Si el enlace ya fue utilizado o expiro, contacta a tu administrador para que genere uno nuevo.
            </p>
          </div>
        )}

        {status === 'missing' && (
          <div className="space-y-4">
            <XCircle size={48} className="text-red-400 mx-auto" />
            <p className="text-red-400 font-bold">Enlace invalido</p>
            <p className="text-slate-400 text-sm">El enlace no contiene un token de activacion. Verifica que hayas copiado la URL completa.</p>
          </div>
        )}
      </div>
    </div>
  );
}
