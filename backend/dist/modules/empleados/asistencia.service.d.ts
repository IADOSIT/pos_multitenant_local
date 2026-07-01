import { Repository } from 'typeorm';
import { RegistroAsistencia } from './registro-asistencia.entity';
import { HorarioEmpleado } from './horario-empleado.entity';
import { EmpleadosService } from './empleados.service';
export declare class AsistenciaService {
    private readonly repo;
    private readonly horarioRepo;
    private readonly empleadosService;
    constructor(repo: Repository<RegistroAsistencia>, horarioRepo: Repository<HorarioEmpleado>, empleadosService: EmpleadosService);
    registrarEntrada(empleado_id: number, empresa_id: number, tenant_id: number, timestamp: Date, tipo: string): Promise<{
        registro: RegistroAsistencia;
        nuevo: boolean;
    }>;
    registrarManual(empleado_id: number, fecha: string, hora: string, notas: string, scope: any): Promise<RegistroAsistencia>;
    getAsistencias(scope: any, params: any): Promise<RegistroAsistencia[]>;
    deleteRegistro(id: number, scope: any): Promise<RegistroAsistencia>;
    getKPIs(scope: any, desde: string, hasta: string): Promise<{
        total_registros: number;
        puntuales: number;
        tardanzas: number;
        sin_horario: number;
        pct_puntualidad: number;
        promedio_minutos_tarde: number;
        empleados_presentes_hoy: number;
        empleados_tardanza_hoy: number;
        top_impuntuales: any;
        por_dia: any;
    }>;
}
