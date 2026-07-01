import { EmpresasService } from './empresas.service';
export declare class EmpresasController {
    private service;
    constructor(service: EmpresasService);
    findAll(scope: any): Promise<import("./empresa.entity").Empresa[]>;
    findOne(id: number): Promise<import("./empresa.entity").Empresa | null>;
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
    }, scope: any): Promise<{
        config_especial: {
            mostrar_precios?: boolean;
            precio_manual?: boolean;
            notif_cliente_estados?: boolean;
        } | null;
    }>;
}
