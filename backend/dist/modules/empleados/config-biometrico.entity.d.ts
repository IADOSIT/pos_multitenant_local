export declare class ConfigBiometrico {
    id: number;
    empresa_id: number;
    tenant_id: number;
    empresa_token: string;
    activo: boolean;
    open_device_enabled: boolean;
    device_ip: string | null;
    device_timer_s: number | null;
    created_at: Date;
    updated_at: Date;
}
