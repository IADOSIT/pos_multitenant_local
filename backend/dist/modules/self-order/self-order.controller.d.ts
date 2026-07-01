import { Response, Request } from 'express';
import { SelfOrderService } from './self-order.service';
export declare class SelfOrderPublicController {
    private service;
    constructor(service: SelfOrderService);
    getTiendaBySlug(slug: string, mesa_numero: number): Promise<{
        tienda_nombre: any;
        empresa_nombre: any;
        empresa_logo: any;
        mesa_numero: number;
        mesa_nombre: string;
        mesa_id: number;
    }>;
    getMenuBySlug(slug: string): Promise<{
        categorias: any;
        productos: any;
        config_especial: {
            mostrar_precios: boolean;
            notif_cliente_estados: boolean;
        };
    }>;
    crearPedidoBySlug(slug: string, mesa_numero: number, body: any): Promise<{
        pedido_id: number;
        folio: string;
        encuesta_token: string;
        estado: import("../pedidos/pedido.entity").PedidoEstado;
    }>;
    getTiendaPublica(tienda_id: number, mesa_numero: number): Promise<{
        tienda_nombre: any;
        empresa_nombre: any;
        empresa_logo: any;
        mesa_numero: number;
        mesa_nombre: string;
        mesa_id: number;
    }>;
    getMenuPublico(tienda_id: number): Promise<{
        categorias: any;
        productos: any;
        config_especial: {
            mostrar_precios: boolean;
            notif_cliente_estados: boolean;
        };
    }>;
    crearPedido(tienda_id: number, mesa_numero: number, body: any): Promise<{
        pedido_id: number;
        folio: string;
        encuesta_token: string;
        estado: import("../pedidos/pedido.entity").PedidoEstado;
    }>;
    getEstado(token: string): Promise<{
        estado: import("../pedidos/pedido.entity").PedidoEstado;
        mesero_confirmado: boolean;
        venta_id: number;
        encuesta_lista: boolean;
    }>;
    responderEncuesta(token: string, body: any): Promise<import("../encuestas/encuesta.entity").EncuestaServicio | null>;
    printQR(tienda_id: number, mesa_id: number, baseParam: string, req: Request, res: Response): Promise<void>;
}
export declare class SelfOrderController {
    private service;
    constructor(service: SelfOrderService);
    confirmarPedido(id: number, scope: any): Promise<import("../pedidos/pedido.entity").Pedido | null>;
    rechazarPedido(id: number, body: {
        motivo: string;
    }, scope: any): Promise<import("../pedidos/pedido.entity").Pedido>;
    getKPIs(scope: any, desde?: string, hasta?: string): Promise<any>;
}
