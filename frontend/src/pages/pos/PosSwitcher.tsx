import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useAdminContextStore } from '../../store/adminContext.store';
import { tiendasApi } from '../../api/endpoints';

// Cada layout es su propio chunk: una tienda 'restaurante' nunca descarga el
// código del POS retail y viceversa.
const POSPage = lazy(() => import('./POSPage'));
const POSRetailPage = lazy(() => import('./POSRetailPage'));

// Decide qué layout de POS mostrar según config_pos.pos_layout de la tienda ACTIVA.
// Si el superadmin está "viendo como" una tienda, se usa esa tienda (viewAs), no la
// de su propia cuenta. Por defecto → POSPage (restaurante). Solo 'retail' explícito
// muestra el layout tipo tienda/supermercado.
export default function PosSwitcher() {
  const { user } = useAuthStore();
  const { viewAs } = useAdminContextStore();
  const tiendaId = viewAs?.tienda_id ?? user?.tienda_id;

  // Render INSTANTÁNEO con el layout cacheado POR TIENDA (evita bloquear con
  // "Cargando POS…" y evita mostrar el layout de otra tienda al cambiar de contexto);
  // se revalida en segundo plano y se corrige si cambió.
  const cacheKey = tiendaId ? `pos_layout_${tiendaId}` : null;
  const leerCache = (): 'restaurante' | 'retail' =>
    (cacheKey && typeof localStorage !== 'undefined' && localStorage.getItem(cacheKey) === 'retail')
      ? 'retail' : 'restaurante';
  const [layout, setLayout] = useState<'restaurante' | 'retail'>(leerCache());

  useEffect(() => {
    let activo = true;
    if (!tiendaId) return;
    setLayout(leerCache()); // al cambiar de tienda, parte del cache de ESA tienda
    tiendasApi.get(tiendaId)
      .then(({ data }) => {
        if (!activo) return;
        const l: 'retail' | 'restaurante' = data?.config_pos?.pos_layout === 'retail' ? 'retail' : 'restaurante';
        setLayout(l);
        try { if (cacheKey) localStorage.setItem(cacheKey, l); } catch { /* ignore */ }
      })
      .catch(() => { /* mantiene el cacheado */ });
    return () => { activo = false; };
  }, [tiendaId]);

  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-slate-400">Cargando POS…</div>}>
      {layout === 'retail' ? <POSRetailPage /> : <POSPage />}
    </Suspense>
  );
}
