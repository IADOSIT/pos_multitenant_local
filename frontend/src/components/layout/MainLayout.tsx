import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { pedidosApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import {
  ShoppingCart, LayoutDashboard, CreditCard, Package,
  Users, Building2, Settings, LogOut, Menu, X, ClipboardList, FileBarChart, Warehouse, Database, Lock, BookOpen, Grid3X3, Truck, Scale, Store
} from 'lucide-react';
import { logisticaApi, basculaApi } from '../../api/endpoints';
import StockAlertBanner from '../ui/StockAlertBanner';
import LicenciaBanner from './LicenciaBanner';
import ViewAsBanner from './ViewAsBanner';
import LockScreen from '../ui/LockScreen';

// Connection info from env
const apiUrl = import.meta.env.VITE_API_URL || '/api';
const isExterno = !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1');
const modoConexion = isExterno ? 'EXTERNO' : 'LOCAL';
const backendHost = (() => {
  try { return new URL(apiUrl).host; } catch { return 'localhost:3000'; }
})();

const navItems = [
  { to: '/pos',                 icon: ShoppingCart,    label: 'POS',        roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'] },
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard',  roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/pedidos',             icon: ClipboardList,   label: 'Pedidos',    roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'], badge: true },
  { to: '/caja',                icon: CreditCard,      label: 'Caja',       roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/reportes',            icon: FileBarChart,    label: 'Reportes',   roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/inventario',          icon: Warehouse,       label: 'Inventario', roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/catalogos',           icon: BookOpen,        label: 'Catalogos',  roles: ['superadmin', 'admin'] },
  { to: '/admin/mesas',         icon: Grid3X3,         label: 'Mesas',      roles: ['superadmin', 'admin'] },
  { to: '/admin/usuarios',      icon: Users,           label: 'Usuarios',   roles: ['superadmin', 'admin'] },
  { to: '/admin/tienda-en-linea', icon: Store,         label: 'Tienda en Línea', roles: ['superadmin', 'admin'] },
  { to: '/admin/configuracion', icon: Settings,        label: 'Config',     roles: ['superadmin', 'admin'] },
  { to: '/admin/tenants',       icon: Building2,       label: 'Tenants',    roles: ['superadmin'] },
];

export default function MainLayout() {
  const { user, logout, lock, isLocked } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbHost, setDbHost] = useState('...');
  const [appVersion, setAppVersion] = useState('');
  const [cajeroDashboard, setCajeroDashboard] = useState(false);
  const [sidebarPermisos, setSidebarPermisos] = useState<Record<string, string[]>>({});
  const [logisticaEnabled, setLogisticaEnabled] = useState(false);
  const [basculaEnabled, setBasculaEnabled] = useState(false);

  // Fetch DB host from backend health endpoint
  useEffect(() => {
    apiClient.get('/health').then(({ data }) => {
      if (data.db_host) setDbHost(data.db_host);
      if (data.version) setAppVersion(data.version);
    }).catch(() => setDbHost('?'));
  }, []);

  // Load config_pos flags
  useEffect(() => {
    if (user?.tienda_id) {
      import('../../api/endpoints').then(({ tiendasApi }) => {
        tiendasApi.get(user.tienda_id!).then(({ data }) => {
          const cp = data?.config_pos || {};
          setCajeroDashboard(cp.cajero_dashboard_enabled || false);
          setSidebarPermisos(cp.sidebar_permisos || {});
        }).catch(() => {});
      });
    }
  }, [user?.tienda_id]);

  // Load logistica enabled flag
  useEffect(() => {
    if (['admin', 'superadmin', 'manager', 'cajero'].includes(user?.rol || '')) {
      logisticaApi.getConfig().then(({ data }) => {
        setLogisticaEnabled(data?.modulo_habilitado || false);
      }).catch(() => {});
    }
  }, [user?.rol]);

  // Load bascula (autoservicio frutas/verduras) enabled flag — es por tienda, no por empresa
  useEffect(() => {
    if (user?.tienda_id) {
      basculaApi.getConfig(user.tienda_id).then(({ data }) => {
        setBasculaEnabled(data?.activo || false);
      }).catch(() => {});
    }
  }, [user?.tienda_id]);

  const isDbExterno = dbHost !== 'localhost' && dbHost !== '127.0.0.1' && dbHost !== '...';

  const isCajeroLike = ['cajero', 'admin', 'manager', 'superadmin'].includes(user?.rol || '');

  const { pedidosPendientes, resetPendientes } = useNotificaciones({
    onNuevoPedido: (data) => {
      toast(`Nuevo pedido Mesa ${data.mesa} - $${Number(data.total).toFixed(2)}`, { icon: '🔔', duration: 5000 });
    },
    enabled: isCajeroLike,
  });

  // Load initial count
  useEffect(() => {
    if (isCajeroLike) {
      pedidosApi.count().then(({ data }) => resetPendientes(data.count)).catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const baseFiltered = navItems.filter((n) => {
    if (!user) return false;
    if (!n.roles.includes(user.rol)) return false;

    const permList = sidebarPermisos[user.rol];
    const hasPermList = permList && permList.length > 0 && !['superadmin'].includes(user.rol);

    if (hasPermList) {
      if (n.to === '/dashboard' && user.rol === 'cajero') {
        return permList.includes(n.to) || cajeroDashboard;
      }
      return permList.includes(n.to);
    }

    if (n.to === '/dashboard' && user.rol === 'cajero') return cajeroDashboard;
    return true;
  });

  // Logística: se muestra solo si el módulo está habilitado para la empresa.
  // El toggle para activarlo vive en Configuración > Módulos (siempre accesible para admin/superadmin),
  // así que no hace falta forzar este link a mostrarse antes de activar el módulo.
  const logisticaNavItem = {
    to: '/logistica', icon: Truck, label: 'Logística',
    roles: ['superadmin', 'admin', 'manager', 'cajero'],
    badge: false,
  };
  const withLogistica = logisticaEnabled && user && logisticaNavItem.roles.includes(user.rol)
    ? [...baseFiltered.slice(0, 6), logisticaNavItem, ...baseFiltered.slice(6)]
    : baseFiltered;

  // Bascula: se abre en ventana aparte (popup), no navega dentro del SPA — el cliente
  // se autodespacha ahi sin tocar el resto del sistema.
  const basculaNavItem = {
    to: '/bascula-kiosko', icon: Scale, label: 'Bascula',
    roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'],
    badge: false, popup: true,
  };
  const filtered = basculaEnabled && user && basculaNavItem.roles.includes(user.rol)
    ? [...withLogistica, basculaNavItem]
    : withLogistica;

  const abrirBasculaPopup = () => {
    window.open('/bascula-kiosko', 'bascula_kiosko', 'width=1000,height=800,resizable=yes');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-20 lg:w-56 bg-iados-surface border-r border-slate-700 shrink-0">
        <div className="p-3 lg:p-4 border-b border-slate-700 flex items-center justify-center lg:justify-start gap-2">
          {user?.empresa_logo ? (
            <img src={resolveUploadUrl(user.empresa_logo)} alt="" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 bg-iados-primary rounded-xl flex items-center justify-center font-bold text-lg">
              {(user?.empresa_nombre || 'P').charAt(0)}
            </div>
          )}
          <div className="hidden lg:block leading-tight">
            <span className="font-bold text-sm block truncate">{user?.empresa_nombre || 'POS-iaDoS'}</span>
            <span className="text-[10px] text-slate-500">POS-iaDoS</span>
          </div>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {filtered.map((item) => (
            'popup' in item && item.popup ? (
              <button
                key={item.to}
                onClick={abrirBasculaPopup}
                className="w-full flex items-center gap-3 px-3 lg:px-4 py-3 mx-2 rounded-xl transition-colors text-slate-400 hover:text-white hover:bg-iados-card"
              >
                <item.icon size={22} />
                <span className="hidden lg:block text-sm font-medium">{item.label}</span>
              </button>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 lg:px-4 py-3 mx-2 rounded-xl transition-colors relative ${
                    isActive ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white hover:bg-iados-card'
                  }`
                }
              >
                <item.icon size={22} />
                <span className="hidden lg:block text-sm font-medium">{item.label}</span>
                {'badge' in item && item.badge && pedidosPendientes > 0 && (
                  <span className="absolute top-1 left-8 lg:right-2 lg:left-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {pedidosPendientes > 9 ? '9+' : pedidosPendientes}
                  </span>
                )}
              </NavLink>
            )
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <div className="hidden lg:block mb-2 px-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Database size={12} className={isExterno ? 'text-amber-400' : 'text-green-400'} />
              <span className={`text-[10px] font-bold ${isExterno ? 'text-amber-400' : 'text-green-400'}`}>{modoConexion}</span>
            </div>
            <div className="text-[9px] text-slate-500 leading-relaxed space-y-0.5">
              <div>BD: <span className={isDbExterno ? 'text-amber-400/70' : 'text-green-400/70'}>{dbHost}</span>{appVersion && <span className="ml-1 text-slate-600">v{appVersion}</span>}</div>
              <div>API: {backendHost}</div>
              <div>Front: {window.location.host}</div>
            </div>
          </div>
          <div className="hidden lg:block text-xs text-slate-500 mb-2 truncate">{user?.nombre}</div>
          <button onClick={lock} className="flex items-center gap-2 text-slate-400 hover:text-yellow-400 w-full px-3 py-2 rounded-xl hover:bg-iados-card mb-1">
            <Lock size={18} /> <span className="hidden lg:block text-sm">Bloquear</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 w-full px-3 py-2 rounded-xl hover:bg-iados-card">
            <LogOut size={18} /> <span className="hidden lg:block text-sm">Salir</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-iados-surface border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-1"><Menu size={24} /></button>
        <div className="flex items-center gap-2">
          {user?.empresa_logo && <img src={resolveUploadUrl(user.empresa_logo)} alt="" className="w-6 h-6 rounded object-cover" />}
          <span className="font-bold text-sm">{user?.empresa_nombre || 'POS-iaDoS'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={lock} className="p-1 text-slate-400 hover:text-yellow-400"><Lock size={20} /></button>
          <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-red-400"><LogOut size={20} /></button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-iados-surface flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {user?.empresa_logo && <img src={resolveUploadUrl(user.empresa_logo)} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                <div className="leading-tight">
                  <span className="font-bold text-sm block">{user?.empresa_nombre || 'POS-iaDoS'}</span>
                  <span className="text-[10px] text-slate-500">POS-iaDoS</span>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)}><X size={24} /></button>
            </div>
            <nav className="flex-1 py-2">
              {filtered.map((item) => (
                'popup' in item && item.popup ? (
                  <button
                    key={item.to}
                    onClick={() => { setSidebarOpen(false); abrirBasculaPopup(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-colors text-slate-400 hover:text-white hover:bg-iados-card"
                  >
                    <item.icon size={22} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-colors relative ${
                        isActive ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white hover:bg-iados-card'
                      }`
                    }
                  >
                    <item.icon size={22} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {'badge' in item && item.badge && pedidosPendientes > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                        {pedidosPendientes > 9 ? '9+' : pedidosPendientes}
                      </span>
                    )}
                  </NavLink>
                )
              ))}
            </nav>
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-1.5 mb-1">
                <Database size={12} className={isExterno ? 'text-amber-400' : 'text-green-400'} />
                <span className={`text-[10px] font-bold ${isExterno ? 'text-amber-400' : 'text-green-400'}`}>{modoConexion}</span>
              </div>
              <div className="text-[9px] text-slate-500 leading-relaxed mb-2">
                <div>BD: <span className={isDbExterno ? 'text-amber-400/70' : 'text-green-400/70'}>{dbHost}</span>{appVersion && <span className="ml-1 text-slate-600">v{appVersion}</span>}</div>
                <div>API: {backendHost}</div>
                <div>Front: {window.location.host}</div>
              </div>
              <div className="text-xs text-slate-500 mb-3">
                {user?.nombre} | {user?.rol} <br />
                iaDoS - iados.mx
              </div>
              <button
                onClick={() => { setSidebarOpen(false); lock(); }}
                className="flex items-center gap-2 text-slate-400 hover:text-yellow-400 w-full px-3 py-2 rounded-xl hover:bg-iados-card mb-1 text-sm"
              >
                <Lock size={16} /> Bloquear sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ViewAsBanner />
        <LicenciaBanner />
        <StockAlertBanner />
        <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
          <Outlet />
        </main>
      </div>

      {/* Lock screen overlay */}
      {isLocked && <LockScreen />}
    </div>
  );
}
