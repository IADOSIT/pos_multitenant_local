import { PerfilesService } from './perfiles.service';
export declare class PerfilesController {
    private readonly service;
    constructor(service: PerfilesService);
    getActivo(scope: any): Promise<any>;
    activar(body: {
        perfil_clave: string;
    }, scope: any): Promise<any>;
    desactivar(clave: string, scope: any): Promise<void>;
    alertasStock(scope: any, modulo?: string): Promise<any[]>;
    resumenModulo(modulo: string, scope: any): Promise<any>;
}
