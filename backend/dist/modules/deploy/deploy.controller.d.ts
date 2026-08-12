import { DeployService } from './deploy.service';
export declare class DeployController {
    private svc;
    constructor(svc: DeployService);
    version(): Promise<{
        version: string;
        estado: "completada" | "en_progreso";
        mensaje: string | null;
        updated_at: Date;
    }>;
    enProgreso(body: {
        mensaje?: string;
        version?: string;
    }): Promise<{
        version: string;
        estado: "completada" | "en_progreso";
        mensaje: string | null;
        updated_at: Date;
    }>;
    completada(body: {
        mensaje?: string;
        version?: string;
    }): Promise<{
        version: string;
        estado: "completada" | "en_progreso";
        mensaje: string | null;
        updated_at: Date;
    }>;
}
