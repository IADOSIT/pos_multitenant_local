export interface CotizacionItem {
    producto_id: number;
    nombre: string;
    sku: string;
    qty: number;
    precio_unitario: number;
    subtotal: number;
}
export declare class CotizacionVersion {
    id: number;
    cotizacion_id: number;
    version: number;
    items: CotizacionItem[];
    subtotal: number;
    descuento: number;
    total: number;
    vigencia_hasta: string;
    mensaje_cliente: string | null;
    enviada_at: Date;
    respuesta: 'aceptada' | 'rechazada' | null;
    respuesta_motivo: string | null;
    respondida_at: Date | null;
    respondida_ip: string | null;
}
