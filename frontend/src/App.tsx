import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import Login from './pages/auth/Login';
import MainLayout from './components/layout/MainLayout';
import DeployWatermark from './components/DeployWatermark';

// Code-splitting por ruta: cada pantalla es su propio chunk. Así el POS no descarga
// el código de Dashboard/Reportes/etc. (recharts, xlsx, jspdf…) al arrancar.
const PosSwitcher = lazy(() => import('./pages/pos/PosSwitcher'));
const CajaPage = lazy(() => import('./pages/caja/CajaPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProductosAdmin = lazy(() => import('./pages/admin/ProductosAdmin'));
const CategoriasAdmin = lazy(() => import('./pages/admin/CategoriasAdmin'));
const UsuariosAdmin = lazy(() => import('./pages/superadmin/UsuariosAdmin'));
const TenantsAdmin = lazy(() => import('./pages/superadmin/TenantsAdmin'));
const TicketsConfig = lazy(() => import('./pages/admin/TicketsConfig'));
const PedidosPage = lazy(() => import('./pages/pedidos/PedidosPage'));
const ConfiguracionPage = lazy(() => import('./pages/admin/ConfiguracionPage'));
const TiendaEnLineaPage = lazy(() => import('./pages/admin/TiendaEnLineaPage'));
const ReportesPage = lazy(() => import('./pages/reportes/ReportesPage'));
const LicenciasAdmin = lazy(() => import('./pages/admin/LicenciasAdmin'));
const KioscoPage = lazy(() => import('./pages/kiosk/KioscoPage'));
const InventarioPage = lazy(() => import('./pages/inventario/InventarioPage'));
const MateriaPrimaPage = lazy(() => import('./pages/admin/MateriaPrimaPage'));
const MenuDigitalPage = lazy(() => import('./pages/public/MenuDigitalPage'));
const MantenimientoPage = lazy(() => import('./pages/admin/MantenimientoPage'));
const MesasAdmin = lazy(() => import('./pages/admin/MesasAdmin'));
const SelfOrderDashboard = lazy(() => import('./pages/admin/SelfOrderDashboard'));
const SelfOrderPage = lazy(() => import('./pages/public/SelfOrderPage'));
const BasculaKioskoPage = lazy(() => import('./pages/public/BasculaKioskoPage'));
const CatalogosPage = lazy(() => import('./pages/admin/CatalogosPage'));
const InventarioDualPage = lazy(() => import('./pages/inventario/InventarioDualPage'));
const PerfilNegocioPage = lazy(() => import('./pages/admin/PerfilNegocioPage'));
const ActivarLicenciaPage = lazy(() => import('./pages/ActivarLicenciaPage'));
const LogisticaPage = lazy(() => import('./pages/logistica/LogisticaPage'));
const RepartidorPage = lazy(() => import('./pages/public/RepartidorPage'));
const BiometricoLivePage = lazy(() => import('./pages/public/BiometricoLivePage'));

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
      <Suspense fallback={<div className="h-screen flex items-center justify-center text-slate-400">Cargando…</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/activar" element={<ActivarLicenciaPage />} />
        <Route path="/kiosco" element={<KioscoPage />} />
        <Route path="/menu/:slug" element={<MenuDigitalPage />} />
        <Route path="/self-order/:tienda_id/:mesa_numero" element={<SelfOrderPage />} />
        <Route path="/s/:slug/:mesa_numero" element={<SelfOrderPage />} />
        <Route path="/bascula-kiosko" element={<BasculaKioskoPage />} />
        <Route path="/repartidor/:token" element={<RepartidorPage />} />
        <Route path="/biometrico-live/:empresa_token" element={<BiometricoLivePage />} />

        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/pos" />} />
          <Route path="pos" element={<PosSwitcher />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="caja" element={<CajaPage />} />
          <Route path="reportes" element={
            <PrivateRoute roles={['superadmin', 'admin', 'manager', 'cajero']}><ReportesPage /></PrivateRoute>
          } />
          <Route path="inventario" element={
            <PrivateRoute roles={['superadmin', 'admin', 'manager', 'cajero']}><InventarioPage /></PrivateRoute>
          } />
          <Route path="dashboard" element={
            <PrivateRoute roles={['superadmin', 'admin', 'manager', 'cajero']}><DashboardPage /></PrivateRoute>
          } />
          <Route path="admin/materia-prima" element={
            <PrivateRoute roles={['superadmin', 'admin']}><MateriaPrimaPage /></PrivateRoute>
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
          <Route path="admin/configuracion" element={
            <PrivateRoute roles={['superadmin', 'admin']}><ConfiguracionPage /></PrivateRoute>
          } />
          <Route path="admin/tienda-en-linea" element={
            <PrivateRoute roles={['superadmin', 'admin']}><TiendaEnLineaPage /></PrivateRoute>
          } />
          <Route path="admin/mantenimiento" element={
            <PrivateRoute roles={['superadmin', 'admin']}><MantenimientoPage /></PrivateRoute>
          } />
          <Route path="admin/mesas" element={
            <PrivateRoute roles={['superadmin', 'admin']}><MesasAdmin /></PrivateRoute>
          } />
          <Route path="admin/self-order" element={
            <PrivateRoute roles={['superadmin', 'admin']}><SelfOrderDashboard /></PrivateRoute>
          } />
          <Route path="catalogos" element={
            <PrivateRoute roles={['superadmin', 'admin']}><CatalogosPage /></PrivateRoute>
          } />
          <Route path="admin/usuarios" element={
            <PrivateRoute roles={['superadmin', 'admin']}><UsuariosAdmin /></PrivateRoute>
          } />
          <Route path="admin/licencias" element={
            <PrivateRoute roles={['superadmin']}><LicenciasAdmin /></PrivateRoute>
          } />
          <Route path="admin/tenants" element={
            <PrivateRoute roles={['superadmin']}><TenantsAdmin /></PrivateRoute>
          } />
          <Route path="inventario-dual" element={
            <PrivateRoute roles={['superadmin', 'admin', 'manager', 'cajero']}>
              <InventarioDualPage />
            </PrivateRoute>
          } />
          <Route path="admin/perfil-negocio" element={
            <PrivateRoute roles={['superadmin', 'admin']}>
              <PerfilNegocioPage />
            </PrivateRoute>
          } />
          <Route path="logistica" element={
            <PrivateRoute roles={['superadmin', 'admin', 'manager', 'cajero']}>
              <LogisticaPage />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
      </Suspense>
      {/* Marca de agua: versión autoritativa (BD) + estado de despliegue + sello del build. */}
      <DeployWatermark />
    </>
  );
}
