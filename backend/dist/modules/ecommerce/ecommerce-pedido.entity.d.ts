export declare class EcommercePedido {
    id: number;
    empresa_id: number;
    tenant_id: number;
    numero_pedido: string;
    tipo_venta: 'menudeo' | 'mayoreo';
    cliente_nombre: string;
    cliente_email: string;
    cliente_tel: string;
    direccion_envio: any;
    items: any[];
    subtotal: number;
    descuento: number;
    iva: number;
    total: number;
    estado: string;
    notas_cliente: string;
    cliente_empresa: string | null;
    notas_internas: string;
    created_at: Date;
    updated_at: Date;
}
