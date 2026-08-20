export declare class TipoCambioHistorial {
    id: number;
    empresa_id: number;
    codigo: string;
    tipo_cambio: number;
    origen: 'manual' | 'automatico';
    created_at: Date;
}
