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
    activo: boolean;
    created_at: Date;
    updated_at: Date;
    tenant: Tenant;
    tiendas: Tienda[];
}
