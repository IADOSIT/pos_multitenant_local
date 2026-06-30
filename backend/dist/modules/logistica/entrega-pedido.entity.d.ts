export declare enum EstadoEntrega {
    ASIGNADO = "asignado",
    EN_CAMINO = "en_camino",
    ENTREGADO = "entregado",
    CON_PROBLEMA = "con_problema"
}
export declare class EntregaPedido {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    pedido_id: number;
    repartidor_id: number;
    repartidor_nombre: string;
    pedido_folio: string;
    cliente_nombre: string;
    cliente_telefono: string;
    cliente_direccion: string;
    total: number;
    estado: EstadoEntrega;
    notas_repartidor: string;
    entregado_at: Date;
    created_at: Date;
    updated_at: Date;
}
