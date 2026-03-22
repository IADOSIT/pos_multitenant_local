import { UserRole } from '../user.entity';
declare class NuevoTenantDto {
    nombre: string;
    razon_social?: string;
    rfc?: string;
}
declare class NuevaEmpresaDto {
    nombre: string;
    razon_social?: string;
}
declare class NuevaTiendaDto {
    nombre: string;
    direccion?: string;
}
export declare class CreateUserWizardDto {
    nombre: string;
    email: string;
    password: string;
    rol?: UserRole;
    pin?: string;
    tenant_id?: number;
    empresa_id?: number;
    tienda_id?: number;
    nuevo_tenant?: NuevoTenantDto;
    nueva_empresa?: NuevaEmpresaDto;
    nueva_tienda?: NuevaTiendaDto;
}
export {};
