import { Repository, DataSource } from 'typeorm';
import { Pedido, PedidoEstado } from './pedido.entity';
import { VentasService } from '../ventas/ventas.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import type { SelfOrderService } from '../self-order/self-order.service';
export declare class PedidosService {
    private pedidosRepo;
    private ventasService;
    private notificacionesService;
    private dataSource;
    private selfOrderService?;
    private logger;
    constructor(pedidosRepo: Repository<Pedido>, ventasService: VentasService, notificacionesService: NotificacionesService, dataSource: DataSource, selfOrderService?: SelfOrderService | undefined);
    private generateFolio;
    crear(data: any, scope: any): Promise<Pedido | null>;
    findAll(scope: any, estado?: string): Promise<Pedido[]>;
    findPendientes(scope: any): Promise<Pedido[]>;
    countPendientes(scope: any): Promise<{
        count: number;
    }>;
    findOne(id: number): Promise<Pedido | null>;
    updateEstado(id: number, nuevoEstado: PedidoEstado, scope: any): Promise<Pedido>;
    cobrar(id: number, pagoData: any, scope: any): Promise<{
        pedido: Pedido;
        venta: import("../ventas/venta.entity").Venta;
    }>;
    cobrarParcial(id: number, pagoData: any, scope: any): Promise<{
        pedido: Pedido;
        venta: import("../ventas/venta.entity").Venta;
    }>;
    actualizarItems(id: number, data: any): Promise<Pedido | null>;
    cancelar(id: number, motivo: string, scope: any): Promise<Pedido>;
    buscarClientes(scope: any, q: string): Promise<any>;
}
