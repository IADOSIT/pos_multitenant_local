import { Response } from 'express';
import { ProductosService } from './productos.service';
export declare class ProductosController {
    private service;
    private logger;
    constructor(service: ProductosService);
    findAll(scope: any, catId?: string): Promise<import("./producto.entity").Producto[]>;
    findForPOS(scope: any): Promise<import("./producto.entity").Producto[]>;
    downloadTemplate(res: Response): void;
    searchImages(query: string): Promise<any>;
    findOne(id: number): Promise<import("./producto.entity").Producto | null>;
    create(data: any, scope: any): Promise<import("./producto.entity").Producto[]>;
    importCSV(file: Express.Multer.File, scope: any, update?: string): Promise<{
        success: number;
        errors: any[];
        updated: number;
        total: number;
        columns: string[];
    }>;
    uploadImage(file: Express.Multer.File): Promise<string>;
    update(id: number, data: any): Promise<import("./producto.entity").Producto | null>;
    purge(scope: any): Promise<{
        purged: number;
    }>;
    delete(id: number): Promise<{
        deleted: boolean;
    }>;
}
