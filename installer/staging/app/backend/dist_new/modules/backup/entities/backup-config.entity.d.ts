export declare class BackupConfig {
    id: number;
    auto_backup_enabled: boolean;
    auto_backup_hora: string;
    retencion_dias: number;
    incluir_db: boolean;
    incluir_excel: boolean;
    onedrive_enabled: boolean;
    onedrive_carpeta: string;
    sftp_enabled: boolean;
    sftp_host: string;
    sftp_port: number;
    sftp_usuario: string;
    sftp_password: string;
    sftp_directorio: string;
    ultimo_backup_at: Date;
    ultimo_backup_estado: string;
}
