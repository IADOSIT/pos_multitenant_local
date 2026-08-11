import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { tiendasApi } from '../../api/endpoints';
import POSPage from './POSPage';
import POSRetailPage from './POSRetailPage';

// Decide qué layout de POS mostrar según config_pos.pos_layout de la tienda.
// Por defecto (o sin tienda) → POSPage (restaurante). Solo 'retail' explícito
// muestra el layout tipo tienda/supermercado.
export default function PosSwitcher() {
  const { user } = useAuthStore();
  // Render INSTANTÁNEO con el layout cacheado (evita bloquear con "Cargando POS…");
  // se revalida en segundo plano y se corrige si cambió.
  const cached = (typeof localStorage !== 'undefined' && localStorage.getItem('pos_layout')) as 'retail' | 'restaurante' | null;
  const [layout, setLayout] = useState<'restaurante' | 'retail'>(cached === 'retail' ? 'retail' : 'restaurante');

  useEffect(() => {
    let activo = true;
    if (!user?.tienda_id) return;
    tiendasApi.get(user.tienda_id)
      .then(({ data }) => {
        if (!activo) return;
        const l: 'retail' | 'restaurante' = data?.config_pos?.pos_layout === 'retail' ? 'retail' : 'restaurante';
        setLayout(l);
        try { localStorage.setItem('pos_layout', l); } catch { /* ignore */ }
      })
      .catch(() => { /* mantiene el cacheado */ });
    return () => { activo = false; };
  }, [user?.tienda_id]);

  return layout === 'retail' ? <POSRetailPage /> : <POSPage />;
}
