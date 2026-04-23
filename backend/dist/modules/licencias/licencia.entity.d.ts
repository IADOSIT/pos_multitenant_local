export declare enum LicenciaPlan {
    BASICO = "basico",
    PRO = "pro",
    ENTERPRISE = "enterprise"
}
export declare enum LicenciaEstado {
    TRIAL = "trial",
    ACTIVA = "activa",
    SUSPENDIDA = "suspendida",
    EXPIRADA = "expirada"
}
export declare class Licencia {
    id: number;
    tenant_id: number;
    codigo_instalacion: string;
    codigo_activacion: string;
    plan: string;
    features: string[];
    max_tiendas: number;
    max_usuarios: number;
    fecha_inicio: string;
    fecha_fin: string;
    grace_days: number;
    offline_allowed: boolean;
    estado: string;
    activated_at: Date;
    last_heartbeat: Date;
    notas: string;
    permanente: boolean;
    machine_locked: boolean;
    machine_fingerprint: string;
    activation_token: string;
    activation_token_code: string;
    activation_token_expires: Date;
    activation_token_used: boolean;
    created_at: Date;
    updated_at: Date;
}
