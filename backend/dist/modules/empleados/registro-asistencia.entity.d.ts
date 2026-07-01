export declare enum EstadoAsistencia {
    PUNTUAL = "puntual",
    TARDE = "tarde",
    SIN_HORARIO = "sin_horario"
}
export declare class RegistroAsistencia {
    id: number;
    empleado_id: number;
    tenant_id: number;
    empresa_id: number;
    empleado_nombre: string;
    fecha: string;
    timestamp_entrada: Date;
    tipo: string;
    estado: EstadoAsistencia;
    minutos_tarde: number | null;
    notas: string | null;
    created_at: Date;
}
