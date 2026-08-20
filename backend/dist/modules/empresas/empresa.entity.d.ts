import { Tenant } from '../tenants/tenant.entity';
import { Tienda } from '../tiendas/tienda.entity';
export declare class Empresa {
    id: number;
    tenant_id: number;
    nombre: string;
    razon_social: string;
    rfc: string;
    direccion: string;
    telefono: string;
    email: string;
    logo_url: string;
    config_apariencia: {
        tema: string;
        paleta: string;
    };
    config_especial: {
        mostrar_precios?: boolean;
        precio_manual?: boolean;
        notif_cliente_estados?: boolean;
        empleados_enabled?: boolean;
        inventario_compartido?: boolean;
        transferencias_activo?: boolean;
        moneda?: {
            activa?: boolean;
            codigo?: string;
            modo_tipo_cambio?: 'manual' | 'automatico';
            tipo_cambio_manual?: number;
            tipo_cambio_actual?: number;
            tipo_cambio_actualizado_at?: string;
            modo_visualizacion?: 'ambas' | 'solo_base' | 'solo_secundaria';
        };
    } | null;
    activo: boolean;
    created_at: Date;
    updated_at: Date;
    tenant: Tenant;
    tiendas: Tienda[];
}
