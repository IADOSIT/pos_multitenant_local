export declare class Devolucion {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    venta_id: number;
    folio: string;
    numero_orden: number;
    venta_folio: string;
    usuario_id: number;
    usuario_nombre: string;
    motivo: string;
    items: {
        producto_id: number;
        nombre: string;
        sku: string;
        cantidad: number;
        precio_unitario: number;
        subtotal: number;
    }[];
    monto_total: number;
    created_at: Date;
    updated_at: Date;
}
