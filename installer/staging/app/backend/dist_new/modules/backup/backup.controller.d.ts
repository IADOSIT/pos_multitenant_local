import { Response } from 'express';
import { BackupService } from './backup.service';
export declare class BackupController {
    private readonly backupService;
    constructor(backupService: BackupService);
    getConfig(): Promise<import("./entities/backup-config.entity").BackupConfig>;
    updateConfig(body: any): Promise<import("./entities/backup-config.entity").BackupConfig>;
    getLogs(): Promise<import("./entities/backup-log.entity").BackupLog[]>;
    listFiles(): {
        archivo: string;
        tamano: number;
        fecha: Date;
    }[];
    ejecutar(body: {
        tipo: 'db' | 'excel' | 'completo';
        tienda_id?: number;
    }, req: any): Promise<import("./entities/backup-log.entity").BackupLog[]>;
    download(filename: string, res: Response): Response<any, Record<string, any>> | undefined;
    deleteLog(id: number): Promise<{
        deleted: boolean;
    }>;
    restaurar(body: {
        filename: string;
    }): Promise<{
        ok: boolean;
        mensaje: string;
    }>;
    importarSQL(file: Express.Multer.File): Promise<{
        ok: boolean;
        mensaje: string;
    }>;
    limpiarDemo(body: {
        ventas: boolean;
        pedidos: boolean;
        caja: boolean;
        inventario: boolean;
        productos?: boolean;
        categorias?: boolean;
    }): Promise<Record<string, number>>;
}
