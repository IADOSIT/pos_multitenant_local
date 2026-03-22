import { CategoriasService } from './categorias.service';
export declare class CategoriasController {
    private service;
    constructor(service: CategoriasService);
    findAll(scope: any): Promise<import("./categoria.entity").Categoria[]>;
    findOne(id: number): Promise<import("./categoria.entity").Categoria | null>;
    create(data: any, scope: any): Promise<import("./categoria.entity").Categoria>;
    update(id: number, data: any): Promise<import("./categoria.entity").Categoria | null>;
    delete(id: number): Promise<{
        deleted: boolean;
    }>;
}
