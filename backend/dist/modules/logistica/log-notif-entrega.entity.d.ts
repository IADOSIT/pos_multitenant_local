export declare class LogNotifEntrega {
    id: number;
    tenant_id: number;
    empresa_id: number;
    pedido_id: number;
    pedido_folio: string;
    estado_entrega: string;
    destinatario: string | null;
    mensaje: string;
    status: string;
    error_msg: string;
    created_at: Date;
}
