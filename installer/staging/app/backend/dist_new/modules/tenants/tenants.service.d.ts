import { Repository, DataSource } from 'typeorm';
import { Tenant } from './tenant.entity';
export declare class TenantsService {
    private repo;
    private dataSource;
    constructor(repo: Repository<Tenant>, dataSource: DataSource);
    findAll(): Promise<Tenant[]>;
    findOne(id: number): Promise<Tenant | null>;
    create(data: Partial<Tenant>): Promise<Tenant>;
    update(id: number, data: Partial<Tenant>): Promise<Tenant | null>;
    softDelete(id: number): Promise<{
        deleted: boolean;
    }>;
}
