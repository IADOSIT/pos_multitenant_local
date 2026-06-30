export declare class ConfigLogistica {
    id: number;
    empresa_id: number;
    tenant_id: number;
    modulo_habilitado: boolean;
    notif_whatsapp_enabled: boolean;
    notif_whatsapp_token: string;
    notif_whatsapp_numero: string;
    notif_proveedor: string;
    msg_asignado: string;
    msg_en_camino: string;
    msg_entregado: string;
    msg_con_problema: string;
    created_at: Date;
    updated_at: Date;
}
