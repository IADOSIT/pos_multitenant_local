import { DataSource, Repository } from 'typeorm';
import { TransferenciaInventario } from './transferencia.entity';
import { Producto } from '../productos/producto.entity';
import { EmpresasService } from '../empresas/empresas.service';
export declare class TransferenciasService {
    private repo;
    private prodRepo;
    private dataSource;
    private empresasService;
    constructor(repo: Repository<TransferenciaInventario>, prodRepo: Repository<Producto>, dataSource: DataSource, empresasService: EmpresasService);
    private verificarHabilitado;
    crear(data: {
        tienda_destino_id: number;
        producto_id: number;
        cantidad: number;
        notas?: string;
    }, scope: any): Promise<TransferenciaInventario>;
    listPendientesRecibir(scope: any): Promise<TransferenciaInventario[]>;
    listEnviadas(scope: any): Promise<TransferenciaInventario[]>;
    buscarPorFolio(folio: string, scope: any): Promise<TransferenciaInventario>;
    recibir(id: number, scope: any): Promise<TransferenciaInventario>;
    cancelar(id: number, motivo: string, scope: any): Promise<TransferenciaInventario>;
}
