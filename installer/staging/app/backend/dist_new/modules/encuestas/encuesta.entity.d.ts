export declare class EncuestaServicio {
    id: number;
    pedido_id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    mesa_numero: number;
    mesero_id: number;
    mesero_nombre: string;
    cliente_nombre: string;
    calificacion_servicio: number;
    calificacion_comida: number;
    comentario: string | null;
    completada: boolean;
    created_at: Date;
}
