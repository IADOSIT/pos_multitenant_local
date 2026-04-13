export declare enum MovimientoTipo {
    ENTRADA = "entrada",
    SALIDA = "salida",
    AJUSTE = "ajuste",
    DEVOLUCION = "devolucion"
}
export declare class MovimientoInventario {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    producto_id: number;
    producto_nombre: string;
    producto_sku: string;
    tipo: MovimientoTipo;
    cantidad: number;
    stock_anterior: number;
    stock_nuevo: number;
    concepto?: string;
    usuario_id: number;
    usuario_nombre: string;
    created_at: Date;
}
