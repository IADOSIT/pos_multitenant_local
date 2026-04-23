import { Repository } from 'typeorm';
import { GatewayConfig } from './gateway-config.entity';
import { GatewayTransaccion } from './gateway-transaccion.entity';
export declare class PagosGatewayService {
    private configRepo;
    private txRepo;
    constructor(configRepo: Repository<GatewayConfig>, txRepo: Repository<GatewayTransaccion>);
    getConfig(tienda_id: number): Promise<any>;
    saveConfig(tienda_id: number, data: any): Promise<GatewayConfig>;
    crearQrMP(tienda_id: number, body: {
        total: number;
        folio: string;
        items?: any[];
    }): Promise<any>;
    getEstadoMP(tienda_id: number, external_id: string): Promise<any>;
    crearPointMP(tienda_id: number, body: {
        total: number;
        folio: string;
    }): Promise<any>;
    getEstadoPoint(tienda_id: number, intent_id: string): Promise<any>;
    crearStripeIntent(tienda_id: number, body: {
        total: number;
        folio: string;
    }): Promise<any>;
    getEstadoStripe(tienda_id: number, intent_id: string): Promise<any>;
    webhookMP(payload: any): Promise<void>;
    webhookStripe(payload: any): Promise<void>;
    getTransacciones(tienda_id: number, limit?: number): Promise<GatewayTransaccion[]>;
    private maskKey;
}
