import { useState, useEffect } from 'react';
import { Lock, ChevronLeft } from 'lucide-react';
import { authApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import PinPad from './PinPad';

interface TiendaUser {
  id: number;
  nombre: string;
  rol: string;
}

const ROL_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  manager: 'Gerente',
  cajero: 'Cajero',
  mesero: 'Mesero',
};

function UserAvatar({ nombre, rol }: { nombre: string; rol: string }) {
  const initial = nombre.charAt(0).toUpperCase();
  const colors: Record<string, string> = {
    superadmin: 'bg-purple-600',
    admin: 'bg-blue-600',
    manager: 'bg-indigo-600',
    cajero: 'bg-iados-primary',
    mesero: 'bg-teal-600',
  };
  return (
    <div className={`w-14 h-14 rounded-2xl ${colors[rol] || 'bg-slate-600'} flex items-center justify-center text-2xl font-bold text-white`}>
      {initial}
    </div>
  );
}

export default function LockScreen() {
  const { user: currentUser, unlock } = useAuthStore();
  const [users, setUsers] = useState<TiendaUser[]>([]);
  const [selected, setSelected] = useState<TiendaUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tienda_id = currentUser?.tienda_id ?? Number(localStorage.getItem('pos_tienda_id') ?? 0);

  useEffect(() => {
    if (!tienda_id) return;
    authApi.tiendaUsers(tienda_id)
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]));
  }, [tienda_id]);

  const handlePin = async (pin: string) => {
    if (!tienda_id || !selected) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.loginPin(pin, tienda_id, selected.id);
      unlock(data.user, data.access_token);
    } catch {
      setError('PIN incorrecto');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-iados-dark/95 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      <Lock size={32} className="text-iados-primary mb-2" />
      <h2 className="text-xl font-bold mb-1">Sesión bloqueada</h2>
      <p className="text-slate-400 text-sm mb-8">
        {currentUser?.empresa_nombre || 'POS-iaDoS'}
      </p>

      {!selected ? (
        /* Selector de usuario */
        <div className="w-full max-w-md">
          <p className="text-slate-400 text-sm text-center mb-4">¿Quién eres?</p>
          <div className="grid grid-cols-2 gap-3">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => { setSelected(u); setError(null); }}
                className="flex flex-col items-center gap-2 p-4 bg-iados-card hover:bg-iados-surface rounded-2xl transition-all active:scale-95 touch-manipulation"
              >
                <UserAvatar nombre={u.nombre} rol={u.rol} />
                <span className="font-semibold text-sm text-center leading-tight">{u.nombre}</span>
                <span className="text-xs text-slate-400">{ROL_LABEL[u.rol] || u.rol}</span>
              </button>
            ))}
          </div>

          {users.length === 0 && (
            <p className="text-center text-slate-500 text-sm mt-4">
              No se pudo cargar la lista de usuarios.
            </p>
          )}
        </div>
      ) : (
        /* PIN pad */
        <div className="w-full max-w-xs flex flex-col items-center gap-5">
          <button
            onClick={() => { setSelected(null); setError(null); }}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm self-start"
          >
            <ChevronLeft size={16} /> Cambiar usuario
          </button>

          <div className="flex flex-col items-center gap-2">
            <UserAvatar nombre={selected.nombre} rol={selected.rol} />
            <p className="font-bold text-lg">{selected.nombre}</p>
            <p className="text-sm text-slate-400">{ROL_LABEL[selected.rol] || selected.rol}</p>
          </div>

          <PinPad
            onComplete={handlePin}
            loading={loading}
            error={error}
            label="Ingresa tu PIN"
          />
        </div>
      )}
    </div>
  );
}
