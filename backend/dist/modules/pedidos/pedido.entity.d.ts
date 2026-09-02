export declare enum PedidoEstado {
    RECIBIDO = "recibido",
    EN_ELABORACION = "en_elaboracion",
    LISTO_PARA_ENTREGA = "listo_para_entrega",
    ENTREGADO = "entregado",
    CANCELADO = "cancelado"
}
export declare class Pedido {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    usuario_id: number;
    folio: string;
    numero_orden: number;
    mesa: number;
    estado: PedidoEstado;
    subtotal: number;
    descuento: number;
    impuestos: number;
    total: number;
    notas: string;
    cliente_nombre: string;
    cliente_telefono: string;
    cliente_direccion: string;
    cliente_email: string | null;
    cliente_empresa: string | null;
    venta_id: number;
    usuario_nombre: string;
    self_order: boolean;
    mesero_id: number;
    mesero_nombre: string;
    mesero_confirmado: boolean;
    encuesta_token: string;
    tipo_servicio: string;
    cuenta_abierta: boolean;
    ecommerce_pedido_id: number | null;
    created_at: Date;
    updated_at: Date;
    detalles: PedidoDetalle[];
}
export declare class PedidoDetalle {
    id: number;
    pedido_id: number;
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
    pedido: Pedido;
}
