export declare class Mesa {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    numero: number;
    nombre: string;
    zona: string;
    capacidad: number;
    activo: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare class MesaAsignacion {
    id: number;
    mesa_id: number;
    tienda_id: number;
    tenant_id: number;
    empresa_id: number;
    user_id: number;
    user_nombre: string;
    activo: boolean;
    created_at: Date;
}
export declare class MesaJunta {
    id: number;
    mesa_principal_id: number;
    mesa_secundaria_id: number;
    tienda_id: number;
    tenant_id: number;
    empresa_id: number;
    activo: boolean;
    created_at: Date;
}
