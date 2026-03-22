import { TenantsService } from './tenants.service';
export declare class TenantsController {
    private service;
    constructor(service: TenantsService);
    findAll(): Promise<import("./tenant.entity").Tenant[]>;
    findOne(id: number): Promise<import("./tenant.entity").Tenant | null>;
    create(data: any): Promise<import("./tenant.entity").Tenant>;
    update(id: number, data: any): Promise<import("./tenant.entity").Tenant | null>;
    delete(id: number): Promise<{
        deleted: boolean;
    }>;
}
