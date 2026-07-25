export declare class ConfigLogistica {
    id: number;
    empresa_id: number;
    tenant_id: number;
    modulo_habilitado: boolean;
    notif_whatsapp_enabled: boolean;
    notif_whatsapp_token: string;
    notif_whatsapp_numero: string;
    notif_whatsapp_account_sid: string;
    notif_proveedor: string;
    msg_asignado: string;
    msg_en_camino: string;
    msg_entregado: string;
    msg_con_problema: string;
    msg_pedido_confirmado: string;
    msg_pedido_listo: string;
    msg_pedido_entregado: string;
    msg_pedido_rechazado: string;
    created_at: Date;
    updated_at: Date;
}
