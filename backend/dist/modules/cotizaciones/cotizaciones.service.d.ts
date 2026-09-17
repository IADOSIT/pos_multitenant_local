import { Repository } from 'typeorm';
import { Cotizacion } from './cotizacion.entity';
import { CotizacionVersion } from './cotizacion-version.entity';
import { EcommerceConfig } from '../ecommerce/ecommerce-config.entity';
export interface CotizarDto {
    items: {
        producto_id: number;
        precio_unitario: number;
    }[];
    descuento?: number;
    vigencia_dias?: number;
    mensaje_cliente?: string;
    tienda_id?: number;
}
export declare class CotizacionesService {
    private cotRepo;
    private verRepo;
    private configRepo;
    constructor(cotRepo: Repository<Cotizacion>, verRepo: Repository<CotizacionVersion>, configRepo: Repository<EcommerceConfig>);
    listar(scope: any, filtros?: {
        estado?: string;
        q?: string;
    }): Promise<Cotizacion[]>;
    private buscar;
    detalle(scope: any, id: number): Promise<{
        cotizacion: Cotizacion;
        versiones: CotizacionVersion[];
    }>;
    cotizar(scope: any, id: number, dto: CotizarDto): Promise<{
        cotizacion: Cotizacion;
        version: CotizacionVersion;
    }>;
    private itemsBase;
    private vigenciaDeTienda;
    cerrar(scope: any, id: number, motivo: string): Promise<Cotizacion>;
    actualizarNotas(scope: any, id: number, notas_internas: string): Promise<Cotizacion>;
}
