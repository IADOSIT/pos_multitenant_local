import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { pedidosApi } from '../../api/endpoints';
import { resolveUploadUrl } from '../../api/client';
import toast from 'react-hot-toast';
import {
  ShoppingCart, LayoutDashboard, CreditCard, Package, Tag,
  Users, Building2, Settings, LogOut, Menu, X, Receipt, ClipboardList, FileBarChart, Shield, Warehouse, Beef
} from 'lucide-react';
import LicenciaBanner from './LicenciaBanner';

const navItems = [
  { to: '/pos', icon: ShoppingCart, label: 'POS', roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'] },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['superadmin', 'admin', 'manager'] },
  { to: '/pedidos', icon: ClipboardList, label: 'Pedidos', roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'], badge: true },
  { to: '/caja', icon: CreditCard, label: 'Caja', roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/reportes', icon: FileBarChart, label: 'Reportes', roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/inventario', icon: Warehouse, label: 'Inventario', roles: ['superadmin', 'admin', 'manager'] },
  { to: '/admin/materia-prima', icon: Beef, label: 'Materia Prima', roles: ['superadmin', 'admin'] },
  { to: '/admin/productos', icon: Package, label: 'Productos', roles: ['superadmin', 'admin'] },
  { to: '/admin/categorias', icon: Tag, label: 'Categorias', roles: ['superadmin', 'admin'] },
  { to: '/admin/tickets', icon: Receipt, label: 'Tickets', roles: ['superadmin', 'admin'] },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios', roles: ['superadmin', 'admin'] },
  { to: '/admin/configuracion', icon: Settings, label: 'Config', roles: ['superadmin', 'admin'] },
  { to: '/admin/licencias', icon: Shield, label: 'Licencias', roles: ['superadmin'] },
  { to: '/admin/tenants', icon: Building2, label: 'Tenants', roles: ['superadmin'] },
];

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const filtered = navItems.filter((n) => user && n.roles.includes(user.rol));

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
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <div className="hidden lg:block text-xs text-slate-500 mb-2 truncate">{user?.nombre}</div>
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
        <button onClick={handleLogout} className="p-1 text-slate-400"><LogOut size={20} /></button>
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
              ))}
            </nav>
            <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
              {user?.nombre} | {user?.rol} <br />
              iaDoS - iados.mx
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <LicenciaBanner />
        <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
