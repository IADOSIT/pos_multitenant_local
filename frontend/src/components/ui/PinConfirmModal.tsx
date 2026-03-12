import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { authApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import PinPad from './PinPad';

interface AuthUser {
  id: number;
  nombre: string;
  rol: string;
}

interface Props {
  open: boolean;
  title: string;
  description?: string;
  /** Si se especifican, solo usuarios con esos roles pueden autorizar */
  requiredRoles?: string[];
  onConfirm: (user: AuthUser) => void;
  onCancel: () => void;
}

export default function PinConfirmModal({ open, title, description, requiredRoles, onConfirm, onCancel }: Props) {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const tienda_id = currentUser?.tienda_id ?? Number(localStorage.getItem('pos_tienda_id') ?? 0);

  const handlePin = async (pin: string) => {
    if (!tienda_id) { setError('No se puede determinar la tienda'); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.verifyPin(pin, tienda_id);
      if (!data.ok) {
        setError('PIN incorrecto');
        setLoading(false);
        return;
      }
      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(data.user.rol)) {
        setError(`Requiere rol: ${requiredRoles.join(' / ')}`);
        setLoading(false);
        return;
      }
      onConfirm(data.user);
    } catch {
      setError('Error al verificar PIN');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="card max-w-sm w-full space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-iados-primary shrink-0" />
            <div>
              <h3 className="font-bold text-base">{title}</h3>
              {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-iados-card">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-400 text-center">
          Ingresa tu PIN para continuar
        </p>

        <PinPad onComplete={handlePin} loading={loading} error={error} />
      </div>
    </div>
  );
}
