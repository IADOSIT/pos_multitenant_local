import { TiendasService } from './tiendas.service';
export declare class TiendasController {
    private service;
    constructor(service: TiendasService);
    findAll(scope: any): Promise<import("./tienda.entity").Tienda[]>;
    findOne(id: number): Promise<import("./tienda.entity").Tienda | null>;
    create(data: any): Promise<import("./tienda.entity").Tienda>;
    update(id: number, data: any): Promise<import("./tienda.entity").Tienda | null>;
    delete(id: number): Promise<{
        deleted: boolean;
    }>;
}
