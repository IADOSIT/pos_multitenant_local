import { create } from 'zustand';

// "Ver como tienda": permite al superadmin elegir una tienda especifica (selector en
// MainLayout) y que TODO el resto del app (POS, Dashboard, Productos, Caja, etc.) opere
// sobre esa tienda — el api client (src/api/client.ts) manda estos ids como headers en
// cada peticion, y el backend (jwt.strategy.ts) los usa para resolver el scope real.
export interface ViewAsTienda {
  tienda_id: number;
  empresa_id: number;
  tenant_id: number;
  nombre: string;
}

interface AdminContextState {
  viewAs: ViewAsTienda | null;
  setViewAs: (t: ViewAsTienda | null) => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'pos_view_as_tienda';

export const useAdminContextStore = create<AdminContextState>((set) => ({
  viewAs: null,

  setViewAs: (t) => {
    if (t) localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
    else localStorage.removeItem(STORAGE_KEY);
    set({ viewAs: t });
  },

  loadFromStorage: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { set({ viewAs: JSON.parse(raw) }); } catch { localStorage.removeItem(STORAGE_KEY); }
    }
  },
}));
