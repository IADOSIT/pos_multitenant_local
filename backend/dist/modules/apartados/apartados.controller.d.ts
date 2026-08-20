import { ApartadosService } from './apartados.service';
export declare class ApartadosController {
    private service;
    constructor(service: ApartadosService);
    listPendientes(scope: any): Promise<import("./apartado.entity").ApartadoInventario[]>;
    buscarPorFolio(folio: string, scope: any): Promise<import("./apartado.entity").ApartadoInventario>;
    entregar(id: number, scope: any): Promise<import("./apartado.entity").ApartadoInventario>;
    cancelar(id: number, body: {
        motivo?: string;
    }, scope: any): Promise<import("./apartado.entity").ApartadoInventario>;
}
