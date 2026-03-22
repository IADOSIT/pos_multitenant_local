import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Empresa } from '../empresas/empresa.entity';
import { Tienda } from '../tiendas/tienda.entity';
import { CreateUserWizardDto } from './dto/create-user.dto';
export declare class UsersService {
    private usersRepo;
    private tenantsRepo;
    private empresasRepo;
    private tiendasRepo;
    constructor(usersRepo: Repository<User>, tenantsRepo: Repository<Tenant>, empresasRepo: Repository<Empresa>, tiendasRepo: Repository<Tienda>);
    findAll(scope: any): Promise<User[]>;
    findOne(id: number, scope: any): Promise<User>;
    createWithWizard(dto: CreateUserWizardDto, scope: any): Promise<{
        id: number;
        tenant_id: number;
        empresa_id: number;
        tienda_id: number;
        nombre: string;
        email: string;
        rol: UserRole;
        pin: string;
        activo: boolean;
        ultimo_login: Date;
        created_at: Date;
        updated_at: Date;
        tenant: Tenant;
    }>;
    update(id: number, data: Partial<User>, scope: any): Promise<{
        id: number;
        tenant_id: number;
        empresa_id: number;
        tienda_id: number;
        nombre: string;
        email: string;
        rol: UserRole;
        pin: string;
        activo: boolean;
        ultimo_login: Date;
        created_at: Date;
        updated_at: Date;
        tenant: Tenant;
    }>;
    toggleActive(id: number, scope: any): Promise<User>;
    hardDelete(id: number, scope: any): Promise<{
        deleted: boolean;
    }>;
}
