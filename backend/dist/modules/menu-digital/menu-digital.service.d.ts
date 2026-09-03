import { Repository } from 'typeorm';
import { MenuDigitalConfig } from './entities/menu-digital-config.entity';
import { MenuDigitalSnapshot } from './entities/menu-digital-snapshot.entity';
import { MenuDigitalLog } from './entities/menu-digital-log.entity';
import { MenuDigitalOrder } from './entities/menu-digital-order.entity';
import { Producto } from '../productos/producto.entity';
import { Categoria } from '../categorias/categoria.entity';
import { Tienda } from '../tiendas/tienda.entity';
import { Empresa } from '../empresas/empresa.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
export declare class MenuDigitalService {
    private configRepo;
    private snapshotRepo;
    private logRepo;
    private orderRepo;
    private productoRepo;
    private categoriaRepo;
    private tiendaRepo;
    private empresaRepo;
    private notificacionesService;
    private readonly logger;
    private readonly MAX_PRODUCTOS_MENU_DIGITAL;
    constructor(configRepo: Repository<MenuDigitalConfig>, snapshotRepo: Repository<MenuDigitalSnapshot>, logRepo: Repository<MenuDigitalLog>, orderRepo: Repository<MenuDigitalOrder>, productoRepo: Repository<Producto>, categoriaRepo: Repository<Categoria>, tiendaRepo: Repository<Tienda>, empresaRepo: Repository<Empresa>, notificacionesService: NotificacionesService);
    getOrCreateConfig(tiendaId: number, scope: any): Promise<MenuDigitalConfig>;
    getServerInfo(): {
        backendUrl: string;
        frontendUrl: string;
    };
    updateConfig(tiendaId: number, dto: Partial<MenuDigitalConfig>, scope: any): Promise<MenuDigitalConfig>;
    regenerateApiKey(tiendaId: number, scope: any): Promise<{
        api_key: string;
    }>;
    private countProductosActivos;
    private resolveTenantEmpresa;
    getStatus(tiendaId: number, scope: any): Promise<{
        config: MenuDigitalConfig;
        pending_changes: number;
        should_auto_sync: boolean | "";
        productos_count: number;
        productos_limit: number;
        over_limit: boolean;
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
        cantidades_enabled: boolean;
        cantidades_rapidas: string;
        tienda: any;
        categorias: any;
        productos: any;
        published_at: Date;
    }>;
    createOrder(slug: string, dto: any): Promise<MenuDigitalOrder>;
    getPendingOrders(tiendaId: number, scope: any): Promise<MenuDigitalOrder[]>;
    updateOrderStatus(orderId: number, status: string, scope: any): Promise<MenuDigitalOrder>;
    getOrderStatus(token: string): Promise<{
        numero_orden: string;
        status: string;
    }>;
    syncToWorker(cfg: MenuDigitalConfig, tienda: any, categorias: any[], productos: any[]): Promise<void>;
    private uploadImagesToWorker;
    private uploadSingleImageToWorker;
    private saveSnapshotDirect;
    private generateSlug;
    private countPendingChanges;
    private validateApiKey;
    private minutesSince;
}
