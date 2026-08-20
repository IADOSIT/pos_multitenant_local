import { Repository, DataSource } from 'typeorm';
import { Empresa } from './empresa.entity';
export declare class EmpresasService {
    private repo;
    private dataSource;
    private readonly logger;
    constructor(repo: Repository<Empresa>, dataSource: DataSource);
    private migrarStockPorTienda;
    actualizarTiposCambioAutomaticos(): Promise<void>;
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
        inventario_compartido?: boolean;
        transferencias_activo?: boolean;
        moneda?: {
            activa?: boolean;
            codigo?: string;
            modo_tipo_cambio?: 'manual' | 'automatico';
            tipo_cambio_manual?: number;
            tipo_cambio_actual?: number;
            modo_visualizacion?: 'ambas' | 'solo_base' | 'solo_secundaria';
        };
    }, scope: any): Promise<{
        config_especial: {
            mostrar_precios?: boolean;
            precio_manual?: boolean;
            notif_cliente_estados?: boolean;
            empleados_enabled?: boolean;
            inventario_compartido?: boolean;
            transferencias_activo?: boolean;
            moneda?: {
                activa?: boolean;
                codigo?: string;
                modo_tipo_cambio?: "manual" | "automatico";
                tipo_cambio_manual?: number;
                tipo_cambio_actual?: number;
                tipo_cambio_actualizado_at?: string;
                modo_visualizacion?: "ambas" | "solo_base" | "solo_secundaria";
            };
        } | null;
    }>;
    actualizarTipoCambioAutomatico(empresa_id: number, tipo_cambio: number): Promise<void>;
    findEmpresasConTipoCambioAutomatico(): Promise<Empresa[]>;
    getConfigEspecial(empresa_id: number): Promise<{
        mostrar_precios: boolean;
        precio_manual: boolean;
        notif_cliente_estados: boolean;
        inventario_compartido: boolean;
        transferencias_activo: boolean;
        moneda: {
            activa: boolean;
            codigo: string;
            tipo_cambio_actual: number;
            modo_visualizacion: 'ambas' | 'solo_base' | 'solo_secundaria';
        };
    }>;
}
