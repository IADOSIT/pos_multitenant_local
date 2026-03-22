import { Repository } from 'typeorm';
import { Tienda } from './tienda.entity';
export declare class TiendasService {
    private repo;
    constructor(repo: Repository<Tienda>);
    private generateSlug;
    findAll(scope: any): Promise<Tienda[]>;
    findOne(id: number): Promise<Tienda | null>;
    create(data: Partial<Tienda>): Promise<Tienda>;
    update(id: number, data: Partial<Tienda>): Promise<Tienda | null>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
    findBySlug(slug: string): Promise<Tienda | null>;
}
