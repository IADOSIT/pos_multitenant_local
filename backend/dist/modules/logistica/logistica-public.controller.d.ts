import { LogisticaService } from './logistica.service';
import { EstadoEntrega } from './entrega-pedido.entity';
export declare class LogisticaPublicController {
    private service;
    constructor(service: LogisticaService);
    getRepartidorView(token: string): Promise<{
        repartidor: import("./repartidor.entity").Repartidor;
        entregas: import("./entrega-pedido.entity").EntregaPedido[];
    }>;
    updateEstadoByToken(token: string, entrega_id: number, body: {
        estado: EstadoEntrega;
        notas?: string;
    }): Promise<import("./entrega-pedido.entity").EntregaPedido>;
}
