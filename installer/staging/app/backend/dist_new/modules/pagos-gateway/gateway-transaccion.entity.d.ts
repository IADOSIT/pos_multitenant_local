export declare class GatewayTransaccion {
    id: number;
    tienda_id: number;
    venta_id: number;
    pedido_id: number;
    gateway: string;
    tipo: string;
    referencia_gateway: string;
    referencia_interna: string;
    estado: string;
    monto: number;
    comision: number;
    neto: number;
    metadata: any;
    created_at: Date;
    updated_at: Date;
}
