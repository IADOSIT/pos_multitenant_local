import { DataSource, EntityManager, Repository } from 'typeorm';
import { ApartadoInventario } from './apartado.entity';
export declare class ApartadosService {
    private repo;
    private dataSource;
    constructor(repo: Repository<ApartadoInventario>, dataSource: DataSource);
    crearDentroDeTransaccion(manager: EntityManager, data: {
        tenant_id: number;
        empresa_id: number;
        tienda_origen_id: number;
        tienda_destino_id: number;
        venta_id: number;
        folio: string;
        producto_id: number;
        producto_nombre: string;
        cantidad: number;
        cliente_nombre?: string;
        cliente_telefono?: string;
        usuario_creo_id?: number;
        usuario_creo_nombre?: string;
    }): Promise<ApartadoInventario>;
    listPendientes(scope: any): Promise<ApartadoInventario[]>;
    buscarPorFolio(folio: string, scope: any): Promise<ApartadoInventario>;
    entregar(id: number, scope: any): Promise<ApartadoInventario>;
    cancelar(id: number, motivo: string, scope: any): Promise<ApartadoInventario>;
}
