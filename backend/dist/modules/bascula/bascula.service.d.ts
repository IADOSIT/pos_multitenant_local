import { Repository, DataSource } from 'typeorm';
import { ConfigBascula } from './config-bascula.entity';
import { PesajeLog } from './pesaje-log.entity';
import { BasculaGateway } from './bascula.gateway';
import { VentasService } from '../ventas/ventas.service';
export declare class BasculaService {
    private configRepo;
    private logRepo;
    private dataSource;
    private gateway;
    private ventasService;
    private readonly logger;
    constructor(configRepo: Repository<ConfigBascula>, logRepo: Repository<PesajeLog>, dataSource: DataSource, gateway: BasculaGateway, ventasService: VentasService);
    getOrCreateConfig(tiendaId: number, scope: any): Promise<ConfigBascula>;
    updateConfig(tiendaId: number, dto: Partial<ConfigBascula>, scope: any): Promise<ConfigBascula>;
    regenerateToken(tiendaId: number, scope: any): Promise<{
        tienda_token: string;
    }>;
    getProductosPorPeso(tiendaId: number, scope: any): Promise<any>;
    private getProductoOrThrow;
    registrarPesaje(dto: {
        tienda_id: number;
        producto_id: number;
        peso_kg: number;
    }, scope: any): Promise<{
        producto_nombre: any;
        peso_kg: number;
        precio_total: number;
        barcode: string;
        log_id: number;
    }>;
    cobrarPesaje(dto: {
        tienda_id: number;
        producto_id: number;
        peso_kg: number;
        caja_id: number;
        metodo_pago: string;
        pago_efectivo?: number;
        pago_tarjeta?: number;
        cambio?: number;
    }, scope: any): Promise<{
        producto_nombre: any;
        peso_kg: number;
        precio_total: number;
        folio: string;
        venta_id: number;
    }>;
}
