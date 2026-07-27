export declare class ConfigBascula {
    id: number;
    tienda_id: number;
    empresa_id: number;
    tenant_id: number;
    activo: boolean;
    usar_en_pos: boolean;
    tienda_token: string;
    printer_ip: string | null;
    printer_port: number;
    label_width_mm: number;
    label_height_mm: number;
    scale_port: string | null;
    scale_baud_rate: number;
    scale_protocol: string;
    created_at: Date;
    updated_at: Date;
}
