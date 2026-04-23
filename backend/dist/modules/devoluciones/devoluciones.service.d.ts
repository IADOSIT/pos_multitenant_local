import { Repository, DataSource } from 'typeorm';
import { Devolucion } from './devolucion.entity';
export declare class DevolucionesService {
    private repo;
    private dataSource;
    private readonly logger;
    constructor(repo: Repository<Devolucion>, dataSource: DataSource);
    private generateFolio;
    findByVenta(ventaId: number, scope: any): Promise<Devolucion[]>;
    findAll(scope: any, desde?: string, hasta?: string): Promise<Devolucion[]>;
    crear(dto: {
        venta_id: number;
        motivo?: string;
        items: {
            producto_id: number;
            cantidad: number;
        }[];
    }, scope: any): Promise<Devolucion>;
    findOne(id: number, scope: any): Promise<Devolucion>;
}
