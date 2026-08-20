export declare enum ApartadoEstado {
    PENDIENTE = "pendiente",
    ENTREGADO = "entregado",
    CANCELADO = "cancelado"
}
export declare class ApartadoInventario {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_origen_id: number;
    tienda_destino_id: number;
    venta_id: number;
    folio: string;
    producto_id: number;
    producto_nombre: string;
    cantidad: number;
    cliente_nombre: string;
    cliente_telefono: string;
    estado: ApartadoEstado;
    usuario_creo_id: number;
    usuario_creo_nombre: string;
    usuario_entrego_id: number;
    usuario_entrego_nombre: string;
    created_at: Date;
    entregado_at: Date;
}
