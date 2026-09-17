import { CotizacionesService, CotizarDto } from './cotizaciones.service';
export declare class CotizacionesController {
    private readonly service;
    constructor(service: CotizacionesService);
    listar(scope: any, query: any): Promise<import("./cotizacion.entity").Cotizacion[]>;
    detalle(scope: any, id: number): Promise<{
        cotizacion: import("./cotizacion.entity").Cotizacion;
        versiones: import("./cotizacion-version.entity").CotizacionVersion[];
    }>;
    cotizar(scope: any, id: number, dto: CotizarDto): Promise<{
        cotizacion: import("./cotizacion.entity").Cotizacion;
        version: import("./cotizacion-version.entity").CotizacionVersion;
    }>;
    cerrar(scope: any, id: number, body: any): Promise<import("./cotizacion.entity").Cotizacion>;
    notas(scope: any, id: number, body: any): Promise<import("./cotizacion.entity").Cotizacion>;
}
