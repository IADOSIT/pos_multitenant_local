import { Repository } from 'typeorm';
import { Caja, MovimientoCaja } from './caja.entity';
import { Venta } from '../ventas/venta.entity';
export declare class CajaService {
    private cajaRepo;
    private movRepo;
    private ventaRepo;
    constructor(cajaRepo: Repository<Caja>, movRepo: Repository<MovimientoCaja>, ventaRepo: Repository<Venta>);
    abrir(data: any, scope: any): Promise<Caja>;
    cerrar(id: number, data: any, scope: any): Promise<Caja>;
    movimiento(cajaId: number, data: any, scope: any): Promise<MovimientoCaja>;
    corteX(id: number): Promise<{
        caja: Caja;
        resumen: {
            num_ventas: number;
            total_ventas: number;
            total_efectivo: number;
            total_tarjeta: number;
            total_transferencia: number;
            total_entradas: number;
            total_salidas: number;
            esperado_en_caja: number;
        };
    }>;
    reporteCaja(id: number): Promise<{
        caja: Caja;
        ventas: Venta[];
        resumen: {
            num_ventas: number;
            num_canceladas: number;
            total_ventas: number;
            total_efectivo: number;
            total_tarjeta: number;
            total_transferencia: number;
            total_entradas: number;
            total_salidas: number;
            fondo_apertura: number;
            esperado_en_caja: number;
            total_real: number;
            diferencia: number;
        };
        top_productos: {
            nombre: string;
            cantidad: number;
            total: number;
        }[];
    }>;
    getActiva(scope: any): Promise<Caja | null>;
    findAll(scope: any): Promise<Caja[]>;
}
