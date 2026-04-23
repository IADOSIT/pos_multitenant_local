import { Repository, DataSource } from 'typeorm';
import { Venta } from '../ventas/venta.entity';
import { VentaDetalle } from '../ventas/venta.entity';
import { Pedido } from '../pedidos/pedido.entity';
export declare class DashboardService {
    private ventasRepo;
    private detallesRepo;
    private pedidosRepo;
    private dataSource;
    constructor(ventasRepo: Repository<Venta>, detallesRepo: Repository<VentaDetalle>, pedidosRepo: Repository<Pedido>, dataSource: DataSource);
    getKPI(scope: any, desde: string, hasta: string, tienda_id?: number): Promise<{
        total_ventas: number;
        num_tickets: number;
        ticket_promedio: number;
        cancelaciones: number;
        top_productos: {
            nombre: string;
            cantidad: number;
            total: number;
        }[];
        ventas_por_hora: any[];
        metodos_pago: {
            efectivo: number;
            tarjeta: number;
            transferencia: number;
            mixto: number;
        };
        top_clientes: any;
    }>;
    getTendencia(scope: any, semanas?: number): Promise<{
        total: number;
        tickets: number;
        semana: string;
    }[]>;
    getPedidosPendientes(scope: any): Promise<{
        count: number;
    }>;
    getVentasPorProducto(scope: any, desde: string, hasta: string, categoriaId?: number): Promise<any>;
    getVentasPorUnidad(scope: any, desde: string, hasta: string): Promise<any>;
    getVentasPorCategoria(scope: any, desde: string, hasta: string): Promise<any>;
}
