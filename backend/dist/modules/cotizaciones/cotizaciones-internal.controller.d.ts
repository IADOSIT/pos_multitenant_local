import { CotizacionesService } from './cotizaciones.service';
export declare class CotizacionesInternalController {
    private readonly service;
    constructor(service: CotizacionesService);
    materializar(id: number): Promise<{
        pedido_id: number;
        folio: string;
    }>;
}
