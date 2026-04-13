import { Empresa } from '../empresas/empresa.entity';
import { User } from '../users/user.entity';
export declare class Tenant {
    id: number;
    nombre: string;
    slug: string;
    razon_social: string;
    rfc: string;
    direccion: string;
    telefono: string;
    email: string;
    logo_url: string;
    activo: boolean;
    created_at: Date;
    updated_at: Date;
    empresas: Empresa[];
    users: User[];
}
