import { Repository } from 'typeorm';
import { MateriaPrima } from './materia-prima.entity';
export declare class MateriaPrimaService {
    private repo;
    constructor(repo: Repository<MateriaPrima>);
    findAll(scope: any): Promise<MateriaPrima[]>;
    findOne(id: number, scope: any): Promise<MateriaPrima | null>;
    create(data: Partial<MateriaPrima>, scope: any): Promise<MateriaPrima>;
    update(id: number, data: Partial<MateriaPrima>, scope: any): Promise<MateriaPrima>;
    delete(id: number, scope: any): Promise<{
        deleted: boolean;
    }>;
    deleteAll(scope: any): Promise<{
        deleted: number;
    }>;
    getCSVTemplate(): string;
    exportCSV(scope: any): Promise<string>;
    private decodeCSV;
    private detectDelimiter;
    importCSV(buffer: Buffer, scope: any): Promise<{
        success: number;
        updated: number;
        errors: any[];
        total: any;
        columns: string[];
    }>;
}
