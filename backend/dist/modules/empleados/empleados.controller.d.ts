import { DataSource } from 'typeorm';
import { EmpleadosService } from './empleados.service';
import { AsistenciaService } from './asistencia.service';
import { BiometricoService } from './biometrico.service';
export declare class EmpleadosController {
    private readonly emp;
    private readonly asist;
    private readonly bio;
    private readonly ds;
    constructor(emp: EmpleadosService, asist: AsistenciaService, bio: BiometricoService, ds: DataSource);
    private checkModulo;
    list(s: any): Promise<import("./empleado.entity").Empleado[]>;
    create(d: any, s: any): Promise<import("./empleado.entity").Empleado[]>;
    update(id: number, d: any, s: any): Promise<import("./empleado.entity").Empleado>;
    toggle(id: number, s: any): Promise<import("./empleado.entity").Empleado>;
    clearHuella(id: number, s: any): Promise<import("./empleado.entity").Empleado>;
    getHorario(id: number, s: any): Promise<import("./horario-empleado.entity").HorarioEmpleado[]>;
    setHorario(id: number, b: any, s: any): Promise<import("./horario-empleado.entity").HorarioEmpleado[]>;
    kpis(s: any, desde: string, hasta: string): Promise<{
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
    asistencias(s: any, p: any): Promise<import("./registro-asistencia.entity").RegistroAsistencia[]>;
    manual(b: any, s: any): Promise<import("./registro-asistencia.entity").RegistroAsistencia>;
    delRegistro(id: number, s: any): Promise<import("./registro-asistencia.entity").RegistroAsistencia>;
    getCfg(s: any): Promise<import("./config-biometrico.entity").ConfigBiometrico>;
    putCfg(d: any, s: any): Promise<import("./config-biometrico.entity").ConfigBiometrico>;
    regenToken(s: any): Promise<import("./config-biometrico.entity").ConfigBiometrico>;
}
