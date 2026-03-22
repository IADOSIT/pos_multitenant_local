export declare enum CajaEstado {
    ABIERTA = "abierta",
    CERRADA = "cerrada"
}
export declare enum MovimientoCajaTipo {
    ENTRADA = "entrada",
    SALIDA = "salida"
}
export declare class Caja {
    id: number;
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    usuario_id: number;
    nombre: string;
    estado: CajaEstado;
    fondo_apertura: number;
    total_ventas: number;
    total_entradas: number;
    total_salidas: number;
    total_esperado: number;
    total_real: number;
    diferencia: number;
    fecha_apertura: Date;
    fecha_cierre: Date;
    notas_cierre: string;
    created_at: Date;
    updated_at: Date;
    movimientos: MovimientoCaja[];
}
export declare class MovimientoCaja {
    id: number;
    caja_id: number;
    usuario_id: number;
    tipo: MovimientoCajaTipo;
    monto: number;
    concepto: string;
    notas: string;
    created_at: Date;
    caja: Caja;
}
