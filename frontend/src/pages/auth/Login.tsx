import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/endpoints';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      login(data.user, data.access_token);
      toast.success(`Bienvenido, ${data.user.nombre}`);
      navigate('/pos');
    } catch {
      toast.error('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-iados-dark p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Hexágono exterior */}
              <polygon points="50,4 88,26 88,74 50,96 12,74 12,26"
                stroke="#5CB882" strokeWidth="4" fill="none" strokeLinejoin="round"/>
              {/* Líneas internas (efecto cubo 3D) */}
              <line x1="50" y1="4"  x2="50" y2="50" stroke="#5CB882" strokeWidth="2.5"/>
              <line x1="88" y1="74" x2="50" y2="50" stroke="#5CB882" strokeWidth="2.5"/>
              <line x1="12" y1="74" x2="50" y2="50" stroke="#5CB882" strokeWidth="2.5"/>
              {/* Líneas secundarias */}
              <line x1="88" y1="26" x2="50" y2="50" stroke="#7EC8A0" strokeWidth="1.5" strokeOpacity="0.7"/>
              <line x1="12" y1="26" x2="50" y2="50" stroke="#7EC8A0" strokeWidth="1.5" strokeOpacity="0.7"/>
              <line x1="50" y1="96" x2="50" y2="50" stroke="#7EC8A0" strokeWidth="1.5" strokeOpacity="0.7"/>
              {/* Círculo central */}
              <circle cx="50" cy="50" r="9" fill="#5CB882"/>
              <circle cx="50" cy="50" r="5" fill="#0f172a"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold">POS-iaDoS</h1>
          <p className="text-slate-400 mt-1">Sistema POS by iaDoS</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-touch"
              placeholder="admin@iados.mx"
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

          <button type="submit" disabled={loading} className="btn-primary w-full text-lg">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          iaDoS -{' '}
          <a href="https://iados.mx" target="_blank" rel="noopener noreferrer"
             className="hover:text-slate-300 transition-colors underline underline-offset-2">
            iados.mx
          </a>
        </p>
      </div>
    </div>
  );
}
