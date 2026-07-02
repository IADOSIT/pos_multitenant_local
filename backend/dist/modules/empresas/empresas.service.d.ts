import { Repository } from 'typeorm';
import { Empresa } from './empresa.entity';
export declare class EmpresasService {
    private repo;
    constructor(repo: Repository<Empresa>);
    findAll(scope: any): Promise<Empresa[]>;
    findOne(id: number): Promise<Empresa | null>;
    create(data: Partial<Empresa>): Promise<Empresa>;
    update(id: number, data: Partial<Empresa>): Promise<Empresa | null>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
    setConfigEspecial(id: number, data: {
        mostrar_precios?: boolean;
        precio_manual?: boolean;
        notif_cliente_estados?: boolean;
        empleados_enabled?: boolean;
        campos_formulario?: any;
    }, scope: any): Promise<{
        config_especial: {
            mostrar_precios?: boolean;
            precio_manual?: boolean;
            notif_cliente_estados?: boolean;
        } | null;
    }>;
    getConfigEspecial(empresa_id: number): Promise<{
        mostrar_precios: boolean;
        precio_manual: boolean;
        notif_cliente_estados: boolean;
    }>;
}
