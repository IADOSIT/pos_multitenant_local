import { MesasService } from './mesas.service';
export declare class MesasController {
    private service;
    constructor(service: MesasService);
    findAll(scope: any): Promise<import("./mesa.entity").Mesa[]>;
    create(data: any, scope: any): Promise<import("./mesa.entity").Mesa>;
    update(id: number, data: any): Promise<import("./mesa.entity").Mesa | null>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
    getAsignaciones(scope: any): Promise<import("./mesa.entity").MesaAsignacion[]>;
    asignarMesero(id: number, body: {
        user_id: number;
        user_nombre: string;
    }, scope: any): Promise<import("./mesa.entity").MesaAsignacion | null>;
    desasignarMesero(id: number, scope: any): Promise<{
        ok: boolean;
    }>;
    getMesasJuntas(scope: any): Promise<import("./mesa.entity").MesaJunta[]>;
    juntarMesas(body: {
        mesa_principal_id: number;
        mesa_secundaria_id: number;
    }, scope: any): Promise<import("./mesa.entity").MesaJunta>;
    separarMesas(body: {
        mesa_principal_id: number;
        mesa_secundaria_id: number;
    }, scope: any): Promise<{
        ok: boolean;
    }>;
}
