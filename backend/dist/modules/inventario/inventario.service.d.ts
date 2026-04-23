import { Repository } from 'typeorm';
import { MovimientoInventario, MovimientoTipo } from './inventario.entity';
import { Producto } from '../productos/producto.entity';
export declare class InventarioService {
    private movRepo;
    private prodRepo;
    constructor(movRepo: Repository<MovimientoInventario>, prodRepo: Repository<Producto>);
    listStock(scope: any): Promise<Producto[]>;
    getMovimientos(productoId: number, scope: any): Promise<MovimientoInventario[]>;
    listMovimientos(scope: any): Promise<MovimientoInventario[]>;
    registrarMovimiento(data: {
        producto_id: number;
        tipo: MovimientoTipo;
        cantidad: number;
        concepto?: string;
    }, scope: any): Promise<{
        movimiento: MovimientoInventario;
        stock_actual: number;
    }>;
    updateProducto(id: number, data: {
        controla_stock?: boolean;
        stock_minimo?: number;
    }, scope: any): Promise<Producto>;
    getCSVTemplate(): string;
    private decodeCSV;
    private detectDelimiter;
    importCSV(buffer: Buffer, scope: any): Promise<{
        success: number;
        errors: any[];
        total: any;
    }>;
    listStockPorModulo(scope: any, modulo?: string): Promise<Producto[]>;
    exportCSV(scope: any): Promise<string>;
}
