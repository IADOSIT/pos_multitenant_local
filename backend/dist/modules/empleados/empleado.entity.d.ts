export declare class Empleado {
    id: number;
    tenant_id: number;
    empresa_id: number;
    nombre: string;
    apellido: string | null;
    cargo: string | null;
    departamento: string | null;
    email: string | null;
    telefono: string | null;
    imagen_url: string | null;
    fmd_template: string | null;
    fmd_enrolled_at: Date | null;
    activo: boolean;
    created_at: Date;
    updated_at: Date;
}
