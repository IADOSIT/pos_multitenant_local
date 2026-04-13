import { PedidosService } from './pedidos.service';
export declare class PedidosController {
    private service;
    constructor(service: PedidosService);
    crear(data: any, scope: any): Promise<import("./pedido.entity").Pedido | null>;
    findAll(scope: any, estado?: string): Promise<import("./pedido.entity").Pedido[]>;
    findPendientes(scope: any): Promise<import("./pedido.entity").Pedido[]>;
    countPendientes(scope: any): Promise<{
        count: number;
    }>;
    findOne(id: number): Promise<import("./pedido.entity").Pedido | null>;
    actualizarItems(id: number, data: any): Promise<import("./pedido.entity").Pedido | null>;
    updateEstado(id: number, estado: any, scope: any): Promise<import("./pedido.entity").Pedido>;
    cobrar(id: number, pagoData: any, scope: any): Promise<{
        pedido: import("./pedido.entity").Pedido;
        venta: import("../ventas/venta.entity").Venta;
    }>;
    cobrarParcial(id: number, pagoData: any, scope: any): Promise<{
        pedido: import("./pedido.entity").Pedido;
        venta: import("../ventas/venta.entity").Venta;
    }>;
    cancelar(id: number, motivo: string, scope: any): Promise<import("./pedido.entity").Pedido>;
}
