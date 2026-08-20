import { EmpresasService } from './empresas.service';
export declare class EmpresasController {
    private service;
    constructor(service: EmpresasService);
    findAll(scope: any): Promise<import("./empresa.entity").Empresa[]>;
    findOne(id: number): Promise<import("./empresa.entity").Empresa | null>;
    getMonedaHistorial(id: number, periodo?: 'dia' | 'semana' | 'mes' | 'anio'): Promise<any>;
    create(data: any): Promise<import("./empresa.entity").Empresa>;
    update(id: number, data: any): Promise<import("./empresa.entity").Empresa | null>;
    uploadLogo(id: number, file: Express.Multer.File): Promise<{
        logo_url: string;
    }>;
    delete(id: number): Promise<{
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
}
