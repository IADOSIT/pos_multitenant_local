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
    getIaImagenesConfig(scope: any): Promise<{
        provider: "pollinations" | "openai";
        openai_api_key: string;
    }>;
    saveIaImagenesConfig(data: {
        provider?: string;
        openai_api_key?: string;
    }, scope: any): Promise<{
        provider: "pollinations" | "openai";
        openai_api_key: string;
    }>;
    generateImage(body: {
        prompt: string;
    }, scope: any): Promise<{
        image_base64: string;
    }>;
    findOne(id: number): Promise<import("./producto.entity").Producto | null>;
    stockOtrasTiendas(id: number, scope: any): Promise<{
        tienda_id: number;
        tienda_nombre: string;
        stock: number;
    }[]>;
    create(data: any, scope: any): Promise<import("./producto.entity").Producto>;
    importCSV(file: Express.Multer.File, scope: any, update?: string): Promise<{
        success: number;
        errors: any[];
        updated: number;
        total: number;
        columns: string[];
        categorias_creadas: number;
    }>;
    uploadImage(file: Express.Multer.File): Promise<string>;
    update(id: number, data: any): Promise<import("./producto.entity").Producto | null>;
    purge(scope: any): Promise<{
        purged: number;
    }>;
    reassignBySkuPrefix(body: {
        prefixes: string[];
        target_tenant_id: number;
        target_empresa_id: number;
    }): Promise<{
        reassigned: number;
    }>;
    delete(id: number): Promise<{
        deleted: boolean;
    }>;
}
