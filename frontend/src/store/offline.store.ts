import Dexie, { Table } from 'dexie';

export interface OfflineVenta {
  id?: number;
  folio_offline: string;
  data: any;
  synced: boolean;
  created_at: Date;
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
  }
}

export const offlineDB = new POSOfflineDB();

// Funciones utilitarias offline
export const offlineActions = {
  async saveVentaOffline(venta: any): Promise<string> {
    const folio = `OFF-${Date.now().toString(36).toUpperCase()}`;
    await offlineDB.ventasPendientes.add({
      folio_offline: folio,
      data: { ...venta, folio_offline: folio },
      synced: false,
      created_at: new Date(),
    });
    return folio;
  },

  async getPendientes(): Promise<OfflineVenta[]> {
    return offlineDB.ventasPendientes.where('synced').equals(0).toArray();
  },

  async markSynced(id: number) {
    await offlineDB.ventasPendientes.update(id, { synced: true });
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
