import { create } from 'zustand';
import { offlineActions, pedirPersistencia } from './offline.store';
import { ventasApi } from '../api/endpoints';

/**
 * Sincronizacion de las ventas hechas sin internet.
 *
 * La cola vive en IndexedDB (`offline.store.ts`); aqui esta lo unico que la vacia:
 * al volver la red, al abrir el POS, al volver la pestana al frente y cada minuto
 * mientras quede algo pendiente. El backend (`POST /ventas/sync`) es idempotente
 * por `folio_offline`, asi que reintentar de mas nunca duplica una venta.
 */

const LOTE = 20;                 // ventas por peticion
const REINTENTO_MS = 60_000;     // mientras haya cola, se reintenta cada minuto

interface SyncState {
  online: boolean;
  pendientes: number;
  sincronizando: boolean;
  ultimaSync: Date | null;
  ultimoError: string | null;
  refrescarPendientes: () => Promise<number>;
  sincronizar: (silencioso?: boolean) => Promise<{ subidas: number; fallidas: number }>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  pendientes: 0,
  sincronizando: false,
  ultimaSync: null,
  ultimoError: null,

  refrescarPendientes: async () => {
    const n = await offlineActions.contarPendientes();
    set({ pendientes: n });
    return n;
  },

  sincronizar: async () => {
    const estado = get();
    if (estado.sincronizando) return { subidas: 0, fallidas: 0 };
    if (!navigator.onLine) { set({ online: false }); return { subidas: 0, fallidas: 0 }; }
    // Sin sesion no hay a donde subirlas: se quedan en cola hasta el proximo login.
    if (!localStorage.getItem('pos_token')) return { subidas: 0, fallidas: 0 };

    const pendientes = await offlineActions.getPendientes();
    if (!pendientes.length) { set({ pendientes: 0 }); return { subidas: 0, fallidas: 0 }; }

    set({ sincronizando: true, ultimoError: null });
    let subidas = 0;
    let fallidas = 0;
    const procesadas = new Set<number>();

    try {
      for (let i = 0; i < pendientes.length; i += LOTE) {
        const lote = pendientes.slice(i, i + LOTE);
        const { data } = await ventasApi.sync(lote.map((v) => v.data));
        const porFolio = new Map<string, any>((data || []).map((r: any) => [r.folio_offline, r]));

        for (const v of lote) {
          const r = porFolio.get(v.folio_offline);
          // 'synced' y 'already_synced' cuentan igual: la venta ya esta en el servidor.
          procesadas.add(v.id!);
          if (r && r.status !== 'error') {
            await offlineActions.markSynced(v.id!, r.folio);
            subidas++;
          } else {
            await offlineActions.marcarIntento(v.id!, r?.message || 'El servidor no la acepto');
            fallidas++;
          }
        }
      }
      set({ ultimaSync: new Date(), ultimoError: fallidas ? `${fallidas} venta(s) no se pudieron subir` : null });
      offlineActions.purgarSincronizadas(7).catch(() => { });
    } catch (e: any) {
      // Error de red o de sesion: la cola queda intacta y se reintenta despues.
      const msg = e?.response?.data?.message || (e?.response ? 'El servidor rechazo la sincronizacion' : 'Sin conexion con el servidor');
      set({ ultimoError: msg });
      const sinProcesar = pendientes.filter((v) => !procesadas.has(v.id!));
      for (const v of sinProcesar) {
        await offlineActions.marcarIntento(v.id!, msg).catch(() => { });
      }
      fallidas += sinProcesar.length;
    } finally {
      set({ sincronizando: false });
      await get().refrescarPendientes();
    }

    return { subidas, fallidas };
  },
}));

let iniciado = false;

/**
 * Se engancha una sola vez (desde el layout del POS). Deja la cola drenandose sola
 * sin que el cajero tenga que hacer nada.
 */
export function iniciarSincronizacion() {
  if (iniciado || typeof window === 'undefined') return;
  iniciado = true;

  const { refrescarPendientes, sincronizar } = useSyncStore.getState();

  pedirPersistencia();
  refrescarPendientes().then((n) => { if (n) sincronizar(); });

  window.addEventListener('online', () => {
    useSyncStore.setState({ online: true });
    sincronizar();
  });
  window.addEventListener('offline', () => useSyncStore.setState({ online: false }));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) sincronizar();
  });

  setInterval(() => {
    if (navigator.onLine && useSyncStore.getState().pendientes > 0) sincronizar();
  }, REINTENTO_MS);

  // Cerrar el navegador con ventas sin subir es la forma real de perderlas.
  window.addEventListener('beforeunload', (e) => {
    if (useSyncStore.getState().pendientes > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Una venta recien guardada offline avisa por aqui para actualizar el contador.
  window.addEventListener('offline:venta-encolada', () => { refrescarPendientes(); });
}
