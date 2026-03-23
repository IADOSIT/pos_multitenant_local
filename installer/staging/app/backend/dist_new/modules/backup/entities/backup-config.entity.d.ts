export declare class BackupConfig {
    id: number;
    auto_backup_enabled: boolean;
    auto_backup_hora: string;
    retencion_dias: number;
    incluir_db: boolean;
    incluir_excel: boolean;
    onedrive_enabled: boolean;
    onedrive_carpeta: string;
    ultimo_backup_at: Date;
    ultimo_backup_estado: string;
}
