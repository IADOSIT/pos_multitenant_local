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
  const [layout, setLayout] = useState<'restaurante' | 'retail' | null>(null);

  useEffect(() => {
    let activo = true;
    if (!user?.tienda_id) { setLayout('restaurante'); return; }
    tiendasApi.get(user.tienda_id)
      .then(({ data }) => { if (activo) setLayout(data?.config_pos?.pos_layout === 'retail' ? 'retail' : 'restaurante'); })
      .catch(() => { if (activo) setLayout('restaurante'); });
    return () => { activo = false; };
  }, [user?.tienda_id]);

  if (layout === null) {
    return <div className="h-full flex items-center justify-center text-slate-400">Cargando POS…</div>;
  }
  return layout === 'retail' ? <POSRetailPage /> : <POSPage />;
}
