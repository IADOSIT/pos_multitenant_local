import { Repository } from 'typeorm';
import { MenuDigitalConfig } from './entities/menu-digital-config.entity';
import { MenuDigitalSnapshot } from './entities/menu-digital-snapshot.entity';
import { MenuDigitalLog } from './entities/menu-digital-log.entity';
import { MenuDigitalOrder } from './entities/menu-digital-order.entity';
import { Producto } from '../productos/producto.entity';
import { Categoria } from '../categorias/categoria.entity';
import { Tienda } from '../tiendas/tienda.entity';
import { Empresa } from '../empresas/empresa.entity';
export declare class MenuDigitalService {
    private configRepo;
    private snapshotRepo;
    private logRepo;
    private orderRepo;
    private productoRepo;
    private categoriaRepo;
    private tiendaRepo;
    private empresaRepo;
    private readonly logger;
    constructor(configRepo: Repository<MenuDigitalConfig>, snapshotRepo: Repository<MenuDigitalSnapshot>, logRepo: Repository<MenuDigitalLog>, orderRepo: Repository<MenuDigitalOrder>, productoRepo: Repository<Producto>, categoriaRepo: Repository<Categoria>, tiendaRepo: Repository<Tienda>, empresaRepo: Repository<Empresa>);
    getOrCreateConfig(tiendaId: number, scope: any): Promise<MenuDigitalConfig>;
    getServerInfo(): {
        backendUrl: string;
        frontendUrl: string;
    };
    updateConfig(tiendaId: number, dto: Partial<MenuDigitalConfig>, scope: any): Promise<MenuDigitalConfig>;
    regenerateApiKey(tiendaId: number, scope: any): Promise<{
        api_key: string;
    }>;
    getStatus(tiendaId: number, scope: any): Promise<{
        config: MenuDigitalConfig;
        pending_changes: number;
        should_auto_sync: boolean | "";
    }>;
    getLogs(tiendaId: number): Promise<MenuDigitalLog[]>;
    publish(tiendaId: number, scope: any): Promise<any>;
    receiveSnapshot(dto: any): Promise<{
        ok: boolean;
    }>;
    receiveImage(dto: any): Promise<{
        url: string;
    }>;
    getPublicMenu(slug: string): Promise<{
        slug: string;
        modo_menu: string;
        plantilla: string;
        tienda: any;
        categorias: any;
        productos: any;
        published_at: Date;
    }>;
    createOrder(slug: string, dto: any): Promise<MenuDigitalOrder>;
    getPendingOrders(tiendaId: number, apiKey: string): Promise<MenuDigitalOrder[]>;
    updateOrderStatus(orderId: number, status: string, tiendaId: number): Promise<MenuDigitalOrder>;
    syncToWorker(cfg: MenuDigitalConfig, tienda: any, categorias: any[], productos: any[]): Promise<void>;
    private saveSnapshotDirect;
    private generateSlug;
    private countPendingChanges;
    private validateApiKey;
    private minutesSince;
}
