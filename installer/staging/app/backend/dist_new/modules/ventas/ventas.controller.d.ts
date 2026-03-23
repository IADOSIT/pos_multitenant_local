import { VentasService } from './ventas.service';
export declare class VentasController {
    private service;
    constructor(service: VentasService);
    crear(data: any, scope: any): Promise<import("./venta.entity").Venta>;
    syncOffline(data: {
        ventas: any[];
    }, scope: any): Promise<any[]>;
    cancelar(id: number, motivo: string, scope: any): Promise<import("./venta.entity").Venta>;
    findAll(scope: any, desde?: string, hasta?: string): Promise<import("./venta.entity").Venta[]>;
    findOne(id: number): Promise<import("./venta.entity").Venta | null>;
}
