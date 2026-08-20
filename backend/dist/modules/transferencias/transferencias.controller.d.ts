import { TransferenciasService } from './transferencias.service';
export declare class TransferenciasController {
    private service;
    constructor(service: TransferenciasService);
    crear(data: {
        tienda_destino_id: number;
        producto_id: number;
        cantidad: number;
        notas?: string;
    }, scope: any): Promise<import("./transferencia.entity").TransferenciaInventario>;
    listPendientesRecibir(scope: any): Promise<import("./transferencia.entity").TransferenciaInventario[]>;
    listEnviadas(scope: any): Promise<import("./transferencia.entity").TransferenciaInventario[]>;
    buscarPorFolio(folio: string, scope: any): Promise<import("./transferencia.entity").TransferenciaInventario>;
    recibir(id: number, scope: any): Promise<import("./transferencia.entity").TransferenciaInventario>;
    cancelar(id: number, body: {
        motivo?: string;
    }, scope: any): Promise<import("./transferencia.entity").TransferenciaInventario>;
}
