import { Repository } from 'typeorm';
import { ConfigBiometrico } from './config-biometrico.entity';
import { EmpleadosService } from './empleados.service';
import { AsistenciaService } from './asistencia.service';
export declare class BiometricoService {
    private readonly configRepo;
    private readonly empleadosService;
    private readonly asistenciaService;
    constructor(configRepo: Repository<ConfigBiometrico>, empleadosService: EmpleadosService, asistenciaService: AsistenciaService);
    getOrCreateConfig(empresa_id: number, tenant_id: number): Promise<ConfigBiometrico>;
    getConfig(scope: any): Promise<ConfigBiometrico>;
    upsertConfig(data: any, scope: any): Promise<ConfigBiometrico>;
    regenerarToken(scope: any): Promise<ConfigBiometrico>;
    getTemplates(empresa_token: string): Promise<{
        empleado_id: number;
        nombre: string;
        fmd_template: string | null;
    }[]>;
    heartbeat(empresa_token: string): Promise<{
        ok: boolean;
        refresh_templates: boolean;
        activo: boolean;
    }>;
    validarEnrollment(fmdB64: string, empresa_id: number, excluir_empleado_id?: number): Promise<{
        ok: boolean;
        reason: string;
    } | {
        ok: boolean;
        reason?: undefined;
    }>;
    matchFmd(empresa_id: number, fmdB64: string): Promise<any>;
    procesarMatch(empresa_token: string, empleado_id: number, timestamp?: Date): Promise<{
        registro: import("./registro-asistencia.entity").RegistroAsistencia;
        nuevo: boolean;
    }>;
}
