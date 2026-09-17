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
        version: {
            cotizacion_id: number;
            version: number;
            items: import("./cotizacion-version.entity").CotizacionItem[];
            subtotal: number;
            descuento: number;
            total: number;
            vigencia_hasta: string;
            mensaje_cliente: string | null;
            enviada_at: Date;
            respuesta: null;
            respuesta_motivo: null;
            respondida_at: null;
            respondida_ip: null;
        } & import("./cotizacion-version.entity").CotizacionVersion;
    }>;
    cerrar(scope: any, id: number, body: any): Promise<import("./cotizacion.entity").Cotizacion>;
    notas(scope: any, id: number, body: any): Promise<import("./cotizacion.entity").Cotizacion>;
}
