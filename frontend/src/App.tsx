import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import Login from './pages/auth/Login';
import MainLayout from './components/layout/MainLayout';
import POSPage from './pages/pos/POSPage';
import CajaPage from './pages/caja/CajaPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductosAdmin from './pages/admin/ProductosAdmin';
import CategoriasAdmin from './pages/admin/CategoriasAdmin';
import UsuariosAdmin from './pages/superadmin/UsuariosAdmin';
import TenantsAdmin from './pages/superadmin/TenantsAdmin';
import TicketsConfig from './pages/admin/TicketsConfig';
import KioscoPage from './pages/kiosk/KioscoPage';

function PrivateRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/pos" />;
  return children;
}

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#334155', color: '#fff', borderRadius: '12px' },
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/kiosco" element={<KioscoPage />} />

        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/pos" />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="caja" element={<CajaPage />} />
          <Route path="dashboard" element={
            <PrivateRoute roles={['superadmin', 'admin', 'manager']}><DashboardPage /></PrivateRoute>
          } />
          <Route path="admin/productos" element={
            <PrivateRoute roles={['superadmin', 'admin']}><ProductosAdmin /></PrivateRoute>
          } />
          <Route path="admin/categorias" element={
            <PrivateRoute roles={['superadmin', 'admin']}><CategoriasAdmin /></PrivateRoute>
          } />
          <Route path="admin/tickets" element={
            <PrivateRoute roles={['superadmin', 'admin']}><TicketsConfig /></PrivateRoute>
          } />
          <Route path="admin/usuarios" element={
            <PrivateRoute roles={['superadmin', 'admin']}><UsuariosAdmin /></PrivateRoute>
          } />
          <Route path="admin/tenants" element={
            <PrivateRoute roles={['superadmin']}><TenantsAdmin /></PrivateRoute>
          } />
        </Route>
      </Routes>
    </>
  );
}
