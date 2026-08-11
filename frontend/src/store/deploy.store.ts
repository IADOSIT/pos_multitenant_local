import { create } from 'zustand';
import { deployApi } from '../api/endpoints';

// Versión/estado de despliegue (autoritativo, en BD). Un solo poll compartido por toda
// la app (sidebar + aviso de "actualización en progreso"). `buildId` es el sello del
// bundle del frontend, para detectar caché vieja del PWA.
interface DeployState {
  version: string;
  estado: string;
  buildId: string;
  _timer: ReturnType<typeof setInterval> | null;
  start: () => void;
}

export const useDeployStore = create<DeployState>((set, get) => ({
  version: '',
  estado: '',
  buildId: typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : '',
  _timer: null,
  start: () => {
    if (get()._timer) return;
    const load = () => deployApi.version()
      .then(({ data }) => set({ version: data?.version || '', estado: data?.estado || '' }))
      .catch(() => { /* silencioso */ });
    load();
    const t = setInterval(load, 60000);
    set({ _timer: t });
  },
}));
