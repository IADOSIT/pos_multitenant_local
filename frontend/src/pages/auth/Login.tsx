import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authApi, tiendasApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { ChevronLeft, LinkIcon, Store } from 'lucide-react';
import PinPad from '../../components/ui/PinPad';

interface TiendaUser {
  id: number;
  nombre: string;
  rol: string;
}

interface TiendaOption {
  id: number;
  nombre: string;
  direccion?: string;
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
    <div className={`w-16 h-16 rounded-2xl ${colors[rol] || 'bg-slate-600'} flex items-center justify-center text-3xl font-bold text-white`}>
      {initial}
    </div>
  );
}

const IaDosLogo = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <polygon points="50,4 88,26 88,74 50,96 12,74 12,26"
      stroke="#5CB882" strokeWidth="4" fill="none" strokeLinejoin="round"/>
    <line x1="50" y1="4"  x2="50" y2="50" stroke="#5CB882" strokeWidth="2.5"/>
    <line x1="88" y1="74" x2="50" y2="50" stroke="#5CB882" strokeWidth="2.5"/>
    <line x1="12" y1="74" x2="50" y2="50" stroke="#5CB882" strokeWidth="2.5"/>
    <line x1="88" y1="26" x2="50" y2="50" stroke="#7EC8A0" strokeWidth="1.5" strokeOpacity="0.7"/>
    <line x1="12" y1="26" x2="50" y2="50" stroke="#7EC8A0" strokeWidth="1.5" strokeOpacity="0.7"/>
    <line x1="50" y1="96" x2="50" y2="50" stroke="#7EC8A0" strokeWidth="1.5" strokeOpacity="0.7"/>
    <circle cx="50" cy="50" r="9" fill="#5CB882"/>
    <circle cx="50" cy="50" r="5" fill="#0f172a"/>
  </svg>
);

// Modos del login:
// 'select-user'   → muestra tarjetas de usuarios de la tienda registrada
// 'pin'           → PinPad para el usuario seleccionado
// 'email'         → login normal con email/password → navega a /pos
// 'cambiar-tienda'→ re-vincula el dispositivo (pide credenciales admin)
// 'select-tienda' → selector de tienda cuando el admin gestiona varias
type Mode = 'select-user' | 'pin' | 'email' | 'cambiar-tienda' | 'select-tienda';

export default function Login() {
  const [tiendaId, setTiendaId] = useState<number>(() => Number(localStorage.getItem('pos_tienda_id') ?? 0));
  const [mode, setMode] = useState<Mode>('select-user');
  const [tiendaUsers, setTiendaUsers] = useState<TiendaUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<TiendaUser | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Selector de tienda (para admin sin tienda_id específica)
  const [tiendaOptions, setTiendaOptions] = useState<TiendaOption[]>([]);

  // Email/password form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  // Cargar usuarios cada vez que cambia la tienda registrada
  useEffect(() => {
    if (!tiendaId) {
      setLoadingUsers(false);
      setMode('email');
      return;
    }
    setLoadingUsers(true);
    authApi.tiendaUsers(tiendaId)
      .then(({ data }) => {
        setTiendaUsers(data);
        setMode(data.length > 0 ? 'select-user' : 'email');
      })
      .catch(() => { setTiendaUsers([]); setMode('email'); })
      .finally(() => setLoadingUsers(false));
  }, [tiendaId]);

  const handleSelectUser = (u: TiendaUser) => {
    setSelectedUser(u);
    setPinError(null);
    setMode('pin');
  };

  const handlePin = async (pin: string) => {
    if (!tiendaId || !selectedUser) return;
    setPinLoading(true);
    setPinError(null);
    try {
      const { data } = await authApi.loginPin(pin, tiendaId, selectedUser.id);
      login(data.user, data.access_token);
      toast.success(`Bienvenido, ${data.user.nombre}`);
      navigate('/pos');
    } catch {
      setPinError('PIN incorrecto');
      setPinLoading(false);
    }
  };

  // Vincular este dispositivo a una tienda concreta y recargar usuarios
  const bindTienda = (id: number) => {
    localStorage.setItem('pos_tienda_id', String(id));
    toast.success('Dispositivo vinculado');
    setTiendaId(id); // dispara useEffect → carga usuarios → va a select-user
  };

  // Login con email — comportamiento distinto según el modo activo
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const { data } = await authApi.login(email, password);

      if (mode === 'cambiar-tienda') {
        const adminUser = data.user;
        setEmail('');
        setPassword('');

        // Si el admin ya tiene tienda asignada → vincular directo
        if (adminUser.tienda_id) {
          bindTienda(adminUser.tienda_id);
          return;
        }

        // Admin de empresa: cargar sus tiendas usando el token temporal
        localStorage.setItem('pos_token', data.access_token);
        try {
          const { data: tiendasData } = await tiendasApi.list();
          const opts: TiendaOption[] = adminUser.empresa_id
            ? tiendasData.filter((t: any) => t.empresa_id === adminUser.empresa_id)
            : tiendasData;

          if (opts.length === 1) {
            bindTienda(opts[0].id);
          } else if (opts.length > 1) {
            setTiendaOptions(opts);
            setMode('select-tienda');
          } else {
            toast.error('No se encontraron tiendas para esta empresa');
          }
        } catch {
          toast.error('Error al cargar tiendas');
        } finally {
          // Limpiar token temporal (el usuario no quedó "logged in" en el store)
          localStorage.removeItem('pos_token');
        }
      } else {
        // Login normal
        login(data.user, data.access_token);
        toast.success(`Bienvenido, ${data.user.nombre}`);
        navigate('/pos');
      }
    } catch {
      toast.error('Credenciales inválidas');
    } finally {
      setEmailLoading(false);
    }
  };

  const goToEmail = () => {
    setEmail('');
    setPassword('');
    setMode('email');
  };

  const goToCambiarTienda = () => {
    setEmail('');
    setPassword('');
    setMode('cambiar-tienda');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-iados-dark p-4">
      <div className="w-full max-w-md flex flex-col items-center">

        {/* Logo + título */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3">
            <IaDosLogo />
          </div>
          <h1 className="text-2xl font-bold">POS-iaDoS</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema POS by iaDoS</p>
        </div>

        {loadingUsers ? (
          <div className="text-slate-400 text-sm animate-pulse py-12">Cargando...</div>

        ) : mode === 'select-user' ? (
          /* ── Selector de usuario ── */
          <div className="w-full">
            <p className="text-slate-400 text-sm text-center mb-4">¿Quién eres?</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {tiendaUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="flex flex-col items-center gap-2 p-4 bg-iados-card hover:bg-iados-surface rounded-2xl transition-all active:scale-95 touch-manipulation"
                >
                  <UserAvatar nombre={u.nombre} rol={u.rol} />
                  <span className="font-semibold text-sm text-center leading-tight">{u.nombre}</span>
                  <span className="text-xs text-slate-400">{ROL_LABEL[u.rol] || u.rol}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1 items-center">
              <button onClick={goToEmail} className="text-slate-500 hover:text-slate-300 text-sm py-1 transition-colors">
                Acceso con email / contraseña
              </button>
              <button onClick={goToCambiarTienda} className="flex items-center gap-1 text-slate-600 hover:text-slate-400 text-xs py-1 transition-colors">
                <LinkIcon size={11} /> Cambiar tienda registrada
              </button>
            </div>
          </div>

        ) : mode === 'pin' && selectedUser ? (
          /* ── PIN pad ── */
          <div className="w-full flex flex-col items-center gap-5">
            <button
              onClick={() => { setSelectedUser(null); setMode('select-user'); setPinError(null); }}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm self-start"
            >
              <ChevronLeft size={16} /> Cambiar usuario
            </button>

            <div className="flex flex-col items-center gap-2">
              <UserAvatar nombre={selectedUser.nombre} rol={selectedUser.rol} />
              <p className="font-bold text-lg">{selectedUser.nombre}</p>
              <p className="text-sm text-slate-400">{ROL_LABEL[selectedUser.rol] || selectedUser.rol}</p>
            </div>

            <PinPad onComplete={handlePin} loading={pinLoading} error={pinError} label="Ingresa tu PIN" />

            <button onClick={goToEmail} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              Acceso con email / contraseña
            </button>
          </div>

        ) : mode === 'select-tienda' ? (
          /* ── Selector de tienda (admin con varias tiendas) ── */
          <div className="w-full">
            <button
              onClick={goToCambiarTienda}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4"
            >
              <ChevronLeft size={16} /> Cancelar
            </button>

            <p className="text-slate-400 text-sm text-center mb-4">
              ¿A qué tienda vincular este dispositivo?
            </p>

            <div className="space-y-2">
              {tiendaOptions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => bindTienda(t.id)}
                  className="w-full flex items-center gap-3 p-4 bg-iados-card hover:bg-iados-surface rounded-2xl transition-all active:scale-95 touch-manipulation text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-iados-primary/20 flex items-center justify-center shrink-0">
                    <Store size={18} className="text-iados-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.nombre}</p>
                    {t.direccion && <p className="text-xs text-slate-400 truncate">{t.direccion}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>

        ) : (
          /* ── Email / contraseña (login normal o cambiar-tienda) ── */
          <div className="w-full">
            <button
              onClick={() => tiendaUsers.length > 0 ? setMode('select-user') : undefined}
              className={`flex items-center gap-1 text-sm mb-4 ${tiendaUsers.length > 0 ? 'text-slate-400 hover:text-white cursor-pointer' : 'text-transparent cursor-default'}`}
            >
              <ChevronLeft size={16} />
              {mode === 'cambiar-tienda' ? 'Cancelar' : 'Acceso con PIN'}
            </button>

            <form onSubmit={handleEmailSubmit} className="card space-y-4">
              {mode === 'cambiar-tienda' && (
                <div className="flex items-center gap-2 p-3 bg-amber-900/30 border border-amber-700/40 rounded-xl">
                  <LinkIcon size={16} className="text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-200">
                    Ingresa las credenciales del administrador de la tienda a registrar en este dispositivo.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-touch"
                  placeholder="admin@empresa.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-touch"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" disabled={emailLoading} className="btn-primary w-full text-lg">
                {emailLoading
                  ? 'Verificando...'
                  : mode === 'cambiar-tienda'
                    ? 'Continuar'
                    : 'Ingresar'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-slate-500 text-xs mt-6">
          iaDoS —{' '}
          <a href="https://iados.mx" target="_blank" rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors underline underline-offset-2">
            iados.mx
          </a>
        </p>
      </div>
    </div>
  );
}
