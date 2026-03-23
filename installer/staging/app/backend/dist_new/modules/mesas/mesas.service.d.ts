import { Repository } from 'typeorm';
import { Mesa, MesaAsignacion, MesaJunta } from './mesa.entity';
export declare class MesasService {
    private mesaRepo;
    private asignRepo;
    private juntaRepo;
    constructor(mesaRepo: Repository<Mesa>, asignRepo: Repository<MesaAsignacion>, juntaRepo: Repository<MesaJunta>);
    findAll(scope: any): Promise<Mesa[]>;
    findOne(id: number): Promise<Mesa | null>;
    create(data: Partial<Mesa>, scope: any): Promise<Mesa>;
    update(id: number, data: Partial<Mesa>): Promise<Mesa | null>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
    getAsignaciones(tienda_id: number, tenant_id: number, empresa_id: number): Promise<MesaAsignacion[]>;
    asignarMesero(mesa_id: number, user_id: number, user_nombre: string, scope: any): Promise<MesaAsignacion | null>;
    desasignarMesero(mesa_id: number, scope: any): Promise<{
        ok: boolean;
    }>;
    getMeseroAsignado(mesa_id: number, tienda_id: number): Promise<MesaAsignacion | null>;
    juntarMesas(mesa_principal_id: number, mesa_secundaria_id: number, scope: any): Promise<MesaJunta>;
    separarMesas(mesa_principal_id: number, mesa_secundaria_id: number, tienda_id: number): Promise<{
        ok: boolean;
    }>;
    getMesasJuntas(tienda_id: number): Promise<MesaJunta[]>;
    generateSelfOrderSlug(tienda_id: number): string;
}
