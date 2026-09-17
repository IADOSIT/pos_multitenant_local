export type CotizacionEstado = 'solicitada' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida' | 'cerrada';
export declare class Cotizacion {
    id: number;
    empresa_id: number;
    tenant_id: number;
    cliente_id: number | null;
    numero: string;
    cliente_nombre: string;
    cliente_email: string;
    cliente_tel: string | null;
    cliente_empresa: string | null;
    direccion_envio: any;
    notas_cliente: string | null;
    estado: CotizacionEstado;
    version_actual: number;
    tienda_id: number | null;
    pedido_id: number | null;
    notas_internas: string | null;
    motivo_cierre: string | null;
    created_at: Date;
    updated_at: Date;
}
