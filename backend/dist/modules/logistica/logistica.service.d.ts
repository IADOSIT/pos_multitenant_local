import { Repository, DataSource } from 'typeorm';
import { Repartidor } from './repartidor.entity';
import { EntregaPedido, EstadoEntrega } from './entrega-pedido.entity';
import { ConfigLogistica } from './config-logistica.entity';
import { LogNotifEntrega } from './log-notif-entrega.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
export declare class LogisticaService {
    private repartidorRepo;
    private entregaRepo;
    private configRepo;
    private logRepo;
    private notificacionesService;
    private dataSource;
    constructor(repartidorRepo: Repository<Repartidor>, entregaRepo: Repository<EntregaPedido>, configRepo: Repository<ConfigLogistica>, logRepo: Repository<LogNotifEntrega>, notificacionesService: NotificacionesService, dataSource: DataSource);
    getRepartidores(scope: any): Promise<Repartidor[]>;
    createRepartidor(data: {
        nombre: string;
        telefono?: string;
    }, scope: any): Promise<Repartidor>;
    updateRepartidor(id: number, data: any, scope: any): Promise<Repartidor>;
    toggleRepartidor(id: number, scope: any): Promise<Repartidor>;
    asignarRepartidor(pedido_id: number, repartidor_id: number, scope: any): Promise<EntregaPedido>;
    updateEstadoEntrega(entrega_id: number, estado: EstadoEntrega, notas: string | undefined, scope: any): Promise<EntregaPedido>;
    updateEstadoByToken(token: string, entrega_id: number, estado: EstadoEntrega, notas?: string): Promise<EntregaPedido>;
    getRepartidorByToken(token: string): Promise<{
        repartidor: Repartidor;
        entregas: EntregaPedido[];
    }>;
    getEntregas(scope: any, params: {
        estado?: string;
        repartidor_id?: number;
        desde?: string;
        hasta?: string;
    }): Promise<EntregaPedido[]>;
    getEntregaByPedido(pedido_id: number, scope: any): Promise<EntregaPedido | null>;
    getMetricas(scope: any, desde: string, hasta: string): Promise<any>;
    getConfig(scope: any): Promise<ConfigLogistica>;
    upsertConfig(data: Partial<ConfigLogistica>, scope: any): Promise<ConfigLogistica>;
    getLogNotif(scope: any, pedido_id?: number): Promise<LogNotifEntrega[]>;
    private registrarLogNotif;
    private enviarWhatsappYActualizarLog;
    notificarPedidoWhatsapp(pedido: {
        tenant_id: number;
        empresa_id: number;
        id: number;
        folio: string;
        cliente_telefono?: string | null;
    }, tipo: 'confirmado' | 'listo' | 'entregado' | 'rechazado', scope: any): Promise<void>;
}
