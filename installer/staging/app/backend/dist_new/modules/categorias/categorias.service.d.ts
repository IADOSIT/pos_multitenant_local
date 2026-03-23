import { Repository } from 'typeorm';
import { Categoria } from './categoria.entity';
export declare class CategoriasService {
    private repo;
    constructor(repo: Repository<Categoria>);
    findAll(scope: any): Promise<Categoria[]>;
    findOne(id: number): Promise<Categoria | null>;
    create(data: Partial<Categoria>): Promise<Categoria>;
    update(id: number, data: Partial<Categoria>): Promise<Categoria | null>;
    softDelete(id: number): Promise<{
        deleted: boolean;
    }>;
}
