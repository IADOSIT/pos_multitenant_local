export declare class BackupLog {
    id: number;
    tipo: string;
    archivo: string;
    tamano_bytes: number;
    estado: string;
    error_msg: string;
    onedrive_copiado: boolean;
    created_at: Date;
}
