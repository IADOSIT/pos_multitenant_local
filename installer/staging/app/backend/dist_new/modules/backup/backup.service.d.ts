import { OnModuleInit } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { BackupConfig } from './entities/backup-config.entity';
import { BackupLog } from './entities/backup-log.entity';
export declare class BackupService implements OnModuleInit {
    private configRepo;
    private logRepo;
    private dataSource;
    private readonly logger;
    readonly backupsDir: string;
    constructor(configRepo: Repository<BackupConfig>, logRepo: Repository<BackupLog>, dataSource: DataSource);
    onModuleInit(): Promise<void>;
    getConfig(): Promise<BackupConfig>;
    updateConfig(data: Partial<BackupConfig>): Promise<BackupConfig>;
    getLogs(limit?: number): Promise<BackupLog[]>;
    listFiles(): {
        archivo: string;
        tamano: number;
        fecha: Date;
    }[];
    private escape;
    private rowsToSQL;
    private dumpTable;
    private sanitizeName;
    private dumpDeleteInsert;
    private realizarBackupSQL;
    private realizarBackupExcel;
    private fbSignal;
    private fileBrowserLogin;
    private fileBrowserMkdir;
    private uploadViaFileBrowser;
    testSFTP(): Promise<{
        ok: boolean;
        mensaje: string;
        detalle?: string;
    }>;
    validarBackup(filename: string): Promise<{
        ok: boolean;
        info: any;
        error?: string;
    }>;
    ejecutarBackup(tipo: 'db' | 'excel' | 'completo', user?: any, tiendaFilter?: number): Promise<BackupLog[]>;
    limpiarAntiguos(dias: number): Promise<void>;
    getFilePath(filename: string): string | null;
    deleteLog(id: number): Promise<{
        deleted: boolean;
    }>;
    restaurarBackup(filename: string): Promise<{
        ok: boolean;
        mensaje: string;
    }>;
    importarSQLBuffer(buffer: Buffer): Promise<{
        ok: boolean;
        mensaje: string;
    }>;
    limpiarDemoData(opciones: {
        ventas: boolean;
        pedidos: boolean;
        caja: boolean;
        inventario: boolean;
        productos?: boolean;
        categorias?: boolean;
    }): Promise<Record<string, number>>;
    scheduledBackup(): Promise<void>;
}
