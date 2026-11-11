export declare class RepartidorLiquidacion {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    repartidor_id: number;
    repartidor_nombre: string;
    caja_id: number | null;
    tipo: string;
    num_pedidos: number;
    total_vendido: number;
    efectivo_esperado: number;
    efectivo_recibido: number;
    diferencia: number;
    notas: string | null;
    usuario_id: number | null;
    usuario_nombre: string | null;
    created_at: Date;
}
