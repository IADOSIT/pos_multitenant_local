export declare enum VentaEstado {
    COMPLETADA = "completada",
    CANCELADA = "cancelada",
    PENDIENTE = "pendiente"
}
export declare enum MetodoPago {
    EFECTIVO = "efectivo",
    TARJETA = "tarjeta",
    TRANSFERENCIA = "transferencia",
    MIXTO = "mixto"
}
export declare class Venta {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    caja_id: number;
    usuario_id: number;
    pedido_id: number;
    folio: string;
    folio_offline: string;
    subtotal: number;
    descuento: number;
    impuestos: number;
    total: number;
    metodo_pago: MetodoPago;
    pago_efectivo: number;
    pago_tarjeta: number;
    pago_transferencia: number;
    cambio: number;
    propina: number;
    estado: VentaEstado;
    notas: string;
    cliente_nombre: string;
    cliente_telefono: string;
    cliente_direccion: string;
    tipo_servicio: string;
    sincronizado: boolean;
    created_at: Date;
    updated_at: Date;
    detalles: VentaDetalle[];
    pagos: VentaPago[];
}
export declare class VentaDetalle {
    id: number;
    venta_id: number;
    producto_id: number;
    producto_nombre: string;
    producto_sku: string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    impuesto: number;
    subtotal: number;
    modificadores: any;
    notas: string;
    venta: Venta;
}
export declare class VentaPago {
    id: number;
    venta_id: number;
    metodo: MetodoPago;
    monto: number;
    referencia: string;
    venta: Venta;
}
