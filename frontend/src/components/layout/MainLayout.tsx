import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  ShoppingCart, LayoutDashboard, CreditCard, Package, Tag,
  Users, Building2, Settings, LogOut, Menu, X, Receipt
} from 'lucide-react';

const navItems = [
  { to: '/pos', icon: ShoppingCart, label: 'POS', roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'] },
  { to: '/caja', icon: CreditCard, label: 'Caja', roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['superadmin', 'admin', 'manager'] },
  { to: '/admin/productos', icon: Package, label: 'Productos', roles: ['superadmin', 'admin'] },
  { to: '/admin/categorias', icon: Tag, label: 'Categorías', roles: ['superadmin', 'admin'] },
  { to: '/admin/tickets', icon: Receipt, label: 'Tickets', roles: ['superadmin', 'admin'] },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios', roles: ['superadmin', 'admin'] },
  { to: '/admin/tenants', icon: Building2, label: 'Tenants', roles: ['superadmin'] },
];

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <div className="w-10 h-10 bg-iados-primary rounded-xl flex items-center justify-center font-bold text-lg">P</div>
          <span className="hidden lg:block font-bold text-lg">POS-iaDoS</span>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {filtered.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 lg:px-4 py-3 mx-2 rounded-xl transition-colors ${
                  isActive ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white hover:bg-iados-card'
                }`
              }
            >
              <item.icon size={22} />
              <span className="hidden lg:block text-sm font-medium">{item.label}</span>
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
        <span className="font-bold">POS-iaDoS</span>
        <button onClick={handleLogout} className="p-1 text-slate-400"><LogOut size={20} /></button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-iados-surface flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <span className="font-bold text-lg">POS-iaDoS</span>
              <button onClick={() => setSidebarOpen(false)}><X size={24} /></button>
            </div>
            <nav className="flex-1 py-2">
              {filtered.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-colors ${
                      isActive ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white hover:bg-iados-card'
                    }`
                  }
                >
                  <item.icon size={22} />
                  <span className="text-sm font-medium">{item.label}</span>
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
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  );
}
