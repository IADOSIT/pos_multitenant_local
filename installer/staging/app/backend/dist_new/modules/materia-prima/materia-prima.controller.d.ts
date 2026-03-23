import { MateriaPrimaService } from './materia-prima.service';
import { Response } from 'express';
export declare class MateriaPrimaController {
    private service;
    constructor(service: MateriaPrimaService);
    findAll(scope: any): Promise<import("./materia-prima.entity").MateriaPrima[]>;
    csvTemplate(res: Response): void;
    csvExport(scope: any, res: Response): Promise<void>;
    findOne(id: number, scope: any): Promise<import("./materia-prima.entity").MateriaPrima | null>;
    create(data: any, scope: any): Promise<import("./materia-prima.entity").MateriaPrima>;
    csvImport(file: Express.Multer.File, scope: any): Promise<{
        success: number;
        updated: number;
        errors: any[];
        total: any;
        columns: string[];
    }>;
    deleteAll(scope: any): Promise<{
        deleted: number;
    }>;
    update(id: number, data: any, scope: any): Promise<import("./materia-prima.entity").MateriaPrima>;
    delete(id: number, scope: any): Promise<{
        deleted: boolean;
    }>;
}
