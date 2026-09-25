import { Repository } from 'typeorm';
import { Cotizacion } from './cotizacion.entity';
import { CotizacionVersion, CotizacionItem } from './cotizacion-version.entity';
import { EcommerceConfig } from '../ecommerce/ecommerce-config.entity';
import { PedidosService } from '../pedidos/pedidos.service';
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
    private pedidosService;
    constructor(cotRepo: Repository<Cotizacion>, verRepo: Repository<CotizacionVersion>, configRepo: Repository<EcommerceConfig>, pedidosService: PedidosService);
    listar(scope: any, filtros?: {
        estado?: string;
        q?: string;
        desde?: string;
        hasta?: string;
    }): Promise<Cotizacion[]>;
    private rangoFechas;
    private finDelDia;
    private buscar;
    detalle(scope: any, id: number): Promise<{
        cotizacion: Cotizacion;
        versiones: CotizacionVersion[];
    }>;
    cotizar(scope: any, id: number, dto: CotizarDto): Promise<{
        cotizacion: Cotizacion;
        version: {
            cotizacion_id: number;
            version: number;
            items: CotizacionItem[];
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
        } & CotizacionVersion;
    }>;
    private itemsBase;
    private vigenciaDeTienda;
    cerrar(scope: any, id: number, motivo: string): Promise<Cotizacion>;
    actualizarNotas(scope: any, id: number, notas_internas: string): Promise<Cotizacion>;
    materializarPedido(id: number): Promise<{
        pedido_id: number;
        folio: string;
    }>;
}
