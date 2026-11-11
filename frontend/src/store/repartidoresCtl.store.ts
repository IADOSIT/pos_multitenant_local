import { create } from 'zustand';

// Control de Repartidores: interruptor POR TIENDA (config_pos de la tienda en contexto).
// Lo llena MainLayout con la misma lectura de config_pos que ya hacia; apagado por omision.
export type PreguntarRepartidor = 'todas' | 'para_llevar';

interface RepartidoresCtlState {
  habilitado: boolean;
  preguntar: PreguntarRepartidor;
  setDesdeConfig: (cp: any) => void;
  apagar: () => void;
}

export const useRepartidoresCtlStore = create<RepartidoresCtlState>((set) => ({
  habilitado: false,
  preguntar: 'todas',
  setDesdeConfig: (cp) => set({
    habilitado: cp?.repartidores_control_enabled === true,
    preguntar: cp?.repartidores_preguntar === 'para_llevar' ? 'para_llevar' : 'todas',
  }),
  apagar: () => set({ habilitado: false, preguntar: 'todas' }),
}));
