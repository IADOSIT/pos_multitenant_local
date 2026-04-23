import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Producto, ProductoTienda } from './producto.entity';
import { Categoria } from '../categorias/categoria.entity';
export declare class ProductosService {
    private repo;
    private ptRepo;
    private catRepo;
    private configService;
    private logger;
    constructor(repo: Repository<Producto>, ptRepo: Repository<ProductoTienda>, catRepo: Repository<Categoria>, configService: ConfigService);
    findAll(scope: any, categoria_id?: number): Promise<Producto[]>;
    findForPOS(scope: any): Promise<Producto[]>;
    findOne(id: number): Promise<Producto | null>;
    create(data: Partial<Producto>): Promise<Producto[]>;
    update(id: number, data: Partial<Producto>): Promise<Producto | null>;
    getCSVTemplate(): string;
    private decodeCSV;
    private detectDelimiter;
    importCSV(buffer: Buffer, scope: any, updateExisting?: boolean): Promise<{
        success: number;
        errors: any[];
        updated: number;
        total: number;
        columns: string[];
        categorias_creadas: number;
    }>;
    deleteProduct(id: number): Promise<{
        deleted: boolean;
    }>;
    purgeInactive(scope: any): Promise<{
        purged: number;
    }>;
    searchImages(query: string): Promise<any>;
    uploadImage(file: Express.Multer.File): Promise<string>;
}
