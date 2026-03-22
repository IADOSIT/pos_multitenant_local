export declare class GatewayConfig {
    id: number;
    tienda_id: number;
    mp_access_token: string;
    mp_public_key: string;
    mp_user_id: string;
    mp_point_device_id: string;
    stripe_secret_key: string;
    stripe_publishable_key: string;
    stripe_webhook_secret: string;
    opciones: {
        mp_qr_habilitado: boolean;
        mp_point_habilitado: boolean;
        stripe_habilitado: boolean;
        confirmacion_automatica: boolean;
        comision_mp_porcentaje: number;
        comision_stripe_porcentaje: number;
    };
    activo: boolean;
    created_at: Date;
    updated_at: Date;
}
