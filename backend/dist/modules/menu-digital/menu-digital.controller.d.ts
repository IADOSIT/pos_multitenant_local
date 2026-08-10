import { MenuDigitalService } from './menu-digital.service';
export declare class MenuDigitalController {
    private readonly service;
    constructor(service: MenuDigitalService);
    getStatus(tiendaId: number, req: any): Promise<{
        config: import("./entities/menu-digital-config.entity").MenuDigitalConfig;
        pending_changes: number;
        should_auto_sync: boolean | "";
        productos_count: number;
        productos_limit: number;
        over_limit: boolean;
    }>;
    updateConfig(tiendaId: number, dto: any, req: any): Promise<import("./entities/menu-digital-config.entity").MenuDigitalConfig>;
    regenerateKey(tiendaId: number, req: any): Promise<{
        api_key: string;
    }>;
    publish(tiendaId: number, req: any): Promise<any>;
    getLogs(tiendaId: number): Promise<import("./entities/menu-digital-log.entity").MenuDigitalLog[]>;
    getPendingOrders(tiendaId: number, scope: any): Promise<import("./entities/menu-digital-order.entity").MenuDigitalOrder[]>;
    updateOrderStatus(orderId: number, status: string, scope: any): Promise<import("./entities/menu-digital-order.entity").MenuDigitalOrder>;
    receive(dto: any): Promise<{
        ok: boolean;
    }>;
    receiveImage(dto: any): Promise<{
        url: string;
    }>;
    getServerInfo(): {
        backendUrl: string;
        frontendUrl: string;
    };
    getPublicMenu(slug: string): Promise<{
        slug: string;
        modo_menu: string;
        plantilla: string;
        tienda: any;
        categorias: any;
        productos: any;
        published_at: Date;
    }>;
    createOrder(slug: string, dto: any): Promise<import("./entities/menu-digital-order.entity").MenuDigitalOrder>;
    getOrderStatus(token: string): Promise<{
        numero_orden: string;
        status: string;
    }>;
}
