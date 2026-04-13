import { Repository, DataSource } from 'typeorm';
import { Venta } from './venta.entity';
import { Auditoria } from './auditoria.entity';
import { Caja } from '../caja/caja.entity';
export declare class VentasService {
    private ventasRepo;
    private auditoriaRepo;
    private cajaRepo;
    private dataSource;
    constructor(ventasRepo: Repository<Venta>, auditoriaRepo: Repository<Auditoria>, cajaRepo: Repository<Caja>, dataSource: DataSource);
    private generateFolio;
    crear(data: any, scope: any): Promise<Venta>;
    cancelar(id: number, motivo: string, scope: any): Promise<Venta>;
    findAll(scope: any, fecha_inicio?: string, fecha_fin?: string): Promise<Venta[]>;
    findOne(id: number): Promise<Venta | null>;
    syncOffline(ventas: any[], scope: any): Promise<any[]>;
}
