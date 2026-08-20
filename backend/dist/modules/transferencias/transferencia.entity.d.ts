export declare enum TransferenciaEstado {
    PENDIENTE = "pendiente",
    RECIBIDO = "recibido",
    CANCELADO = "cancelado"
}
export declare class TransferenciaInventario {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_origen_id: number;
    tienda_origen_nombre: string;
    tienda_destino_id: number;
    tienda_destino_nombre: string;
    folio: string;
    producto_id: number;
    producto_nombre: string;
    producto_sku: string;
    cantidad: number;
    notas: string;
    estado: TransferenciaEstado;
    usuario_envio_id: number;
    usuario_envio_nombre: string;
    usuario_recibio_id: number;
    usuario_recibio_nombre: string;
    created_at: Date;
    recibido_at: Date;
}
