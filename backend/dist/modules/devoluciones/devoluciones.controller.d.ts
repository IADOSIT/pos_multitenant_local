import { DevolucionesService } from './devoluciones.service';
export declare class DevolucionesController {
    private readonly service;
    constructor(service: DevolucionesService);
    private checkPermiso;
    findAll(req: any, desde?: string, hasta?: string): Promise<import("./devolucion.entity").Devolucion[]>;
    findByVenta(ventaId: string, req: any): Promise<import("./devolucion.entity").Devolucion[]>;
    findOne(id: string, req: any): Promise<import("./devolucion.entity").Devolucion>;
    crear(body: any, req: any): Promise<import("./devolucion.entity").Devolucion>;
}
