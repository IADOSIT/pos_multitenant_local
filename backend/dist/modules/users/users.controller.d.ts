import { UsersService } from './users.service';
import { CreateUserWizardDto } from './dto/create-user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(scope: any): Promise<import("./user.entity").User[]>;
    findOne(id: number, scope: any): Promise<import("./user.entity").User>;
    createWizard(dto: CreateUserWizardDto, scope: any): Promise<{
        id: number;
        tenant_id: number;
        empresa_id: number;
        tienda_id: number;
        nombre: string;
        email: string;
        rol: import("./user.entity").UserRole;
        pin: string;
        activo: boolean;
        modulo: string;
        ultimo_login: Date;
        created_at: Date;
        updated_at: Date;
        tenant: import("../tenants/tenant.entity").Tenant;
    }>;
    update(id: number, data: any, scope: any): Promise<{
        id: number;
        tenant_id: number;
        empresa_id: number;
        tienda_id: number;
        nombre: string;
        email: string;
        rol: import("./user.entity").UserRole;
        pin: string;
        activo: boolean;
        modulo: string;
        ultimo_login: Date;
        created_at: Date;
        updated_at: Date;
        tenant: import("../tenants/tenant.entity").Tenant;
    }>;
    toggle(id: number, scope: any): Promise<import("./user.entity").User>;
    delete(id: number, scope: any): Promise<{
        deleted: boolean;
    }>;
}
