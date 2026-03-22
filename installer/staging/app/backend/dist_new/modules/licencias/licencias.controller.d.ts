import { LicenciasService } from './licencias.service';
export declare class LicenciasController {
    private service;
    constructor(service: LicenciasService);
    getEstado(scope: any): Promise<{
        id: number;
        tenant_id: number;
        codigo_instalacion: string;
        plan: string;
        features: string[];
        max_tiendas: number;
        max_usuarios: number;
        fecha_inicio: string;
        fecha_fin: string;
        grace_days: number;
        estado: string;
        dias_restantes: number;
        en_grace: boolean;
        dias_grace_restantes: number;
        expirada: boolean;
        solo_lectura: boolean;
        bloqueada: boolean;
        offline_allowed: boolean;
    }>;
    activar(scope: any, body: {
        codigo: string;
    }): Promise<import("./licencia.entity").Licencia>;
    heartbeat(scope: any): Promise<{
        id: number;
        tenant_id: number;
        codigo_instalacion: string;
        plan: string;
        features: string[];
        max_tiendas: number;
        max_usuarios: number;
        fecha_inicio: string;
        fecha_fin: string;
        grace_days: number;
        estado: string;
        dias_restantes: number;
        en_grace: boolean;
        dias_grace_restantes: number;
        expirada: boolean;
        solo_lectura: boolean;
        bloqueada: boolean;
        offline_allowed: boolean;
    }>;
    findAll(): Promise<import("./licencia.entity").Licencia[]>;
    findOne(id: number): Promise<import("./licencia.entity").Licencia | null>;
    generarCodigo(body: {
        tenant_id: number;
        plan: string;
        meses: number;
        max_tiendas?: number;
        max_usuarios?: number;
        features?: string[];
        grace_days?: number;
        offline_allowed?: boolean;
    }): {
        codigo_raw: string;
        codigo_formateado: string;
    };
    suspender(id: number): Promise<import("./licencia.entity").Licencia>;
    reactivar(id: number): Promise<import("./licencia.entity").Licencia>;
    update(id: number, data: any): Promise<import("./licencia.entity").Licencia | null>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}
