import { LogisticaService } from './logistica.service';
import { EstadoEntrega } from './entrega-pedido.entity';
export declare class LogisticaController {
    private service;
    constructor(service: LogisticaService);
    getRepartidores(scope: any): Promise<import("./repartidor.entity").Repartidor[]>;
    createRepartidor(data: any, scope: any): Promise<import("./repartidor.entity").Repartidor>;
    updateRepartidor(id: number, data: any, scope: any): Promise<import("./repartidor.entity").Repartidor>;
    toggleRepartidor(id: number, scope: any): Promise<import("./repartidor.entity").Repartidor>;
    asignar(body: {
        pedido_id: number;
        repartidor_id: number;
    }, scope: any): Promise<import("./entrega-pedido.entity").EntregaPedido>;
    getEntregas(scope: any, params: any): Promise<import("./entrega-pedido.entity").EntregaPedido[]>;
    getEntregaByPedido(pedido_id: number, scope: any): Promise<import("./entrega-pedido.entity").EntregaPedido | null>;
    updateEstado(id: number, body: {
        estado: EstadoEntrega;
        notas?: string;
    }, scope: any): Promise<import("./entrega-pedido.entity").EntregaPedido>;
    getConfig(scope: any): Promise<import("./config-logistica.entity").ConfigLogistica>;
    upsertConfig(data: any, scope: any): Promise<import("./config-logistica.entity").ConfigLogistica>;
    getMetricas(scope: any, desde: string, hasta: string): Promise<any>;
    getLogNotif(scope: any, pedido_id?: string): Promise<import("./log-notif-entrega.entity").LogNotifEntrega[]>;
}
