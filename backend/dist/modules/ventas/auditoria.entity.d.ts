export declare class Auditoria {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    usuario_id: number;
    usuario_nombre: string;
    accion: string;
    entidad: string;
    entidad_id: number;
    datos_anteriores: any;
    datos_nuevos: any;
    ip: string;
    created_at: Date;
}
