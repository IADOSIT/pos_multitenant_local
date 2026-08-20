import { Repository, DataSource } from 'typeorm';
import { Venta } from './venta.entity';
import { Auditoria } from './auditoria.entity';
import { Caja } from '../caja/caja.entity';
import { EmpresasService } from '../empresas/empresas.service';
import { ApartadosService } from '../apartados/apartados.service';
export declare class VentasService {
    private ventasRepo;
    private auditoriaRepo;
    private cajaRepo;
    private dataSource;
    private empresasService;
    private apartadosService;
    private logger;
    constructor(ventasRepo: Repository<Venta>, auditoriaRepo: Repository<Auditoria>, cajaRepo: Repository<Caja>, dataSource: DataSource, empresasService: EmpresasService, apartadosService: ApartadosService);
    private generateFolio;
    crear(data: any, scope: any): Promise<Venta>;
    cancelar(id: number, motivo: string, scope: any): Promise<Venta>;
    findAll(scope: any, fecha_inicio?: string, fecha_fin?: string): Promise<Venta[]>;
    findOne(id: number): Promise<Venta | null>;
    buscar(scope: any, q: string): Promise<any>;
    getClientes(scope: any, q?: string): Promise<any>;
    private sendStockAlerts;
    syncOffline(ventas: any[], scope: any): Promise<any[]>;
}
