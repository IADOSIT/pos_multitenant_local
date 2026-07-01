import { BiometricoService } from './biometrico.service';
export declare class BiometricoPublicController {
    private readonly bio;
    constructor(bio: BiometricoService);
    getTemplates(token: string): Promise<{
        empleado_id: number;
        nombre: string;
        fmd_template: string | null;
    }[]>;
    heartbeat(token: string): Promise<{
        ok: boolean;
        refresh_templates: boolean;
        activo: boolean;
    }>;
}
