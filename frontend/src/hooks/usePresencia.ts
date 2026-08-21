import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import {
  iniciarPresencia, reportarPantalla, detenerPresencia, reanudarPresencia,
} from '../api/presencia';

/** Ventana para agrupar navegaciones rapidas en un solo mensaje. */
const COALESCE_MS = 400;

// Se monta UNA sola vez, en MainLayout, que ya vive dentro de PrivateRoute.
// Reporta la ruta actual al backend para el monitor del superadmin.
export function usePresencia(): void {
  const token = useAuthStore(s => s.token);
  const location = useLocation();
  const rutaRef = useRef(location.pathname);
  rutaRef.current = location.pathname;

  // Conexion: atada al token, no a la ruta, para no reconectar al navegar.
  useEffect(() => {
    if (!token) return;
    iniciarPresencia(token, rutaRef.current);
    return () => detenerPresencia();
  }, [token]);

  // La red se va y vuelve: desconectar a proposito y reconectar sin ruido.
  useEffect(() => {
    const alVolver = () => reanudarPresencia(rutaRef.current);
    const alCaerse = () => detenerPresencia();
    window.addEventListener('online', alVolver);
    window.addEventListener('offline', alCaerse);
    return () => {
      window.removeEventListener('online', alVolver);
      window.removeEventListener('offline', alCaerse);
    };
  }, []);

  // Cambio de ruta, agrupado: tres navegaciones en un segundo = un mensaje.
  useEffect(() => {
    const t = setTimeout(() => reportarPantalla(location.pathname), COALESCE_MS);
    return () => clearTimeout(t);
  }, [location.pathname]);
}
