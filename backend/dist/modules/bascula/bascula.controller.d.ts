import { BasculaService } from './bascula.service';
export declare class BasculaController {
    private readonly service;
    constructor(service: BasculaService);
    getConfig(tiendaId: number, req: any): Promise<import("./config-bascula.entity").ConfigBascula>;
    updateConfig(tiendaId: number, dto: any, req: any): Promise<import("./config-bascula.entity").ConfigBascula>;
    regenerateToken(tiendaId: number, req: any): Promise<{
        tienda_token: string;
    }>;
    getProductos(tiendaId: number, req: any): Promise<any>;
    registrarPesaje(dto: {
        tienda_id: number;
        producto_id: number;
        peso_kg: number;
    }, req: any): Promise<{
        producto_nombre: any;
        peso_kg: number;
        precio_total: number;
        barcode: string;
        log_id: number;
        printer_modo: string;
        precio_kg: number;
        label_width_mm: number;
        label_height_mm: number;
    }>;
}
