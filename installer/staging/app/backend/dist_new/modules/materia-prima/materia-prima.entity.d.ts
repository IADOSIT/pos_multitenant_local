export declare class MateriaPrima {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    sku: string;
    nombre: string;
    descripcion?: string;
    categoria?: string;
    unidad: string;
    costo: number;
    stock_actual: number;
    stock_minimo: number;
    proveedor?: string;
    notas?: string;
    created_at: Date;
    updated_at: Date;
}
