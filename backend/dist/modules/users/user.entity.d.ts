import { Tenant } from '../tenants/tenant.entity';
export declare enum UserRole {
    SUPERADMIN = "superadmin",
    ADMIN = "admin",
    MANAGER = "manager",
    CAJERO = "cajero",
    MESERO = "mesero"
}
export declare class User {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    nombre: string;
    email: string;
    password: string;
    rol: UserRole;
    pin: string;
    activo: boolean;
    modulo: string;
    ultimo_login: Date;
    created_at: Date;
    updated_at: Date;
    tenant: Tenant;
}
