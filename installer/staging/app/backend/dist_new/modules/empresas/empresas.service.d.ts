import { Repository } from 'typeorm';
import { Empresa } from './empresa.entity';
export declare class EmpresasService {
    private repo;
    constructor(repo: Repository<Empresa>);
    findAll(scope: any): Promise<Empresa[]>;
    findOne(id: number): Promise<Empresa | null>;
    create(data: Partial<Empresa>): Promise<Empresa>;
    update(id: number, data: Partial<Empresa>): Promise<Empresa | null>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
}
