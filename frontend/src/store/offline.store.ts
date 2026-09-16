import Dexie, { Table } from 'dexie';

/**
 * Cola offline del POS (IndexedDB via Dexie).
 *
 * Una tienda con internet intermitente cobra igual: la venta se guarda aqui y se
 * sube cuando vuelve la red (ver `sync.store.ts`, que es quien drena esta cola
 * contra `POST /ventas/sync`).
 *
 * Dos detalles que no son obvios:
 *  - `synced` se guarda como 0/1, NO como booleano: IndexedDB no admite booleanos
 *    como clave de indice, asi que con `true/false` el registro no entraba al
 *    indice y `where('synced').equals(0)` devolvia siempre vacio.
 *  - la cola NO se borra al cerrar sesion (el dinero ya entro al cajon); solo se
 *    purgan las que ya subieron, y despues de varios dias.
 */
export interface OfflineVenta {
  id?: number;
  folio_offline: string;
  data: any;
  synced: number;            // 0 = pendiente, 1 = ya subida
  intentos: number;
  ultimo_error?: string | null;
  total?: number;
  created_at: Date;
  synced_at?: Date | null;
  folio_servidor?: string | null;
}

export interface CachedProducto {
  id: number;
  data: any;
  updated_at: Date;
}

export interface CachedCategoria {
  id: number;
  data: any;
  updated_at: Date;
}

class POSOfflineDB extends Dexie {
  ventasPendientes!: Table<OfflineVenta>;
  productos!: Table<CachedProducto>;
  categorias!: Table<CachedCategoria>;

  constructor() {
    super('POSiaDoS');
    this.version(1).stores({
      ventasPendientes: '++id, folio_offline, synced',
      productos: 'id',
      categorias: 'id',
    });
    this.version(2)
      .stores({
        ventasPendientes: '++id, folio_offline, synced, created_at',
        productos: 'id',
        categorias: 'id',
      })
      .upgrade((tx) =>
        tx.table('ventasPendientes').toCollection().modify((v: any) => {
          v.synced = v.synced ? 1 : 0;
          v.intentos = v.intentos || 0;
          v.total = v.total ?? Number(v?.data?.total || 0);
        }),
      );
  }
}

export const offlineDB = new POSOfflineDB();

/**
 * Le pide al navegador que no tire estos datos cuando ande escaso de espacio.
 * Sin esto, Chrome puede desalojar IndexedDB de un sitio "sin uso reciente" y
 * las ventas en cola se irian con el.
 */
export async function pedirPersistencia(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export const offlineActions = {
  async saveVentaOffline(venta: any): Promise<string> {
    // Hora + azar: dos cajas de la misma tienda pueden cobrar en el mismo milisegundo
    // y el folio es la llave con la que el servidor evita duplicar al sincronizar.
    const folio = `OFF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await offlineDB.ventasPendientes.add({
      folio_offline: folio,
      data: { ...venta, folio_offline: folio },
      synced: 0,
      intentos: 0,
      ultimo_error: null,
      total: Number(venta?.total || 0),
      created_at: new Date(),
      synced_at: null,
      folio_servidor: null,
    });
    // Guardarla ya no sirve de nada si el navegador puede borrarla despues.
    pedirPersistencia();
    // El semaforo de conexion y el sincronizador escuchan esto para actualizarse.
    try { window.dispatchEvent(new Event('offline:venta-encolada')); } catch { /* SSR */ }
    return folio;
  },

  async getPendientes(): Promise<OfflineVenta[]> {
    const pendientes = await offlineDB.ventasPendientes.where('synced').equals(0).toArray();
    return pendientes.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  },

  async contarPendientes(): Promise<number> {
    return offlineDB.ventasPendientes.where('synced').equals(0).count();
  },

  async markSynced(id: number, folio_servidor?: string | null) {
    await offlineDB.ventasPendientes.update(id, {
      synced: 1,
      synced_at: new Date(),
      ultimo_error: null,
      folio_servidor: folio_servidor || null,
    });
  },

  /** Deja constancia de por que no subio, para poder mostrarlo en pantalla. */
  async marcarIntento(id: number, error?: string | null) {
    const actual = await offlineDB.ventasPendientes.get(id);
    await offlineDB.ventasPendientes.update(id, {
      intentos: (actual?.intentos || 0) + 1,
      ultimo_error: error || null,
    });
  },

  /** Ultimas ventas de la cola (pendientes y ya subidas) para la pantalla de estado. */
  async listarRecientes(limite = 50): Promise<OfflineVenta[]> {
    const todas = await offlineDB.ventasPendientes.toArray();
    return todas
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, limite);
  },

  /** Limpia las que ya subieron hace mas de N dias; las pendientes nunca se tocan. */
  async purgarSincronizadas(dias = 7) {
    const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
    const viejas = await offlineDB.ventasPendientes.where('synced').equals(1).toArray();
    const ids = viejas
      .filter((v) => +new Date(v.synced_at || v.created_at) < limite)
      .map((v) => v.id!)
      .filter(Boolean);
    if (ids.length) await offlineDB.ventasPendientes.bulkDelete(ids);
    return ids.length;
  },

  async cacheProductos(productos: any[]) {
    await offlineDB.productos.clear();
    await offlineDB.productos.bulkAdd(
      productos.map((p) => ({ id: p.id, data: p, updated_at: new Date() })),
    );
  },

  async getCachedProductos(): Promise<any[]> {
    const items = await offlineDB.productos.toArray();
    return items.map((i) => i.data);
  },

  async cacheCategorias(categorias: any[]) {
    await offlineDB.categorias.clear();
    await offlineDB.categorias.bulkAdd(
      categorias.map((c) => ({ id: c.id, data: c, updated_at: new Date() })),
    );
  },

  async getCachedCategorias(): Promise<any[]> {
    const items = await offlineDB.categorias.toArray();
    return items.map((i) => i.data);
  },
};
