import { PagosGatewayService } from './pagos-gateway.service';
export declare class PagosGatewayController {
    private readonly service;
    constructor(service: PagosGatewayService);
    getConfig(tiendaId: number): Promise<any>;
    saveConfig(body: any, tiendaId: number): Promise<import("./gateway-config.entity").GatewayConfig>;
    crearQrMP(body: any, tiendaId: number): Promise<any>;
    getEstadoMP(externalId: string, tiendaId: number): Promise<any>;
    crearPointMP(body: any, tiendaId: number): Promise<any>;
    getEstadoPoint(intentId: string, tiendaId: number): Promise<any>;
    crearStripeIntent(body: any, tiendaId: number): Promise<any>;
    getEstadoStripe(intentId: string, tiendaId: number): Promise<any>;
    getTransacciones(limit: string, tiendaId: number): Promise<import("./gateway-transaccion.entity").GatewayTransaccion[]>;
}
export declare class PagosGatewayWebhookController {
    private readonly service;
    constructor(service: PagosGatewayService);
    webhookMP(body: any): Promise<void>;
    webhookStripe(body: any): Promise<void>;
}
