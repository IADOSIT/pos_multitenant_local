import { Repository } from 'typeorm';
import { MovimientoInventario, MovimientoTipo } from './inventario.entity';
import { Producto, ProductoTienda } from '../productos/producto.entity';
import { EmpresasService } from '../empresas/empresas.service';
export declare class InventarioService {
    private movRepo;
    private prodRepo;
    private ptRepo;
    private empresasService;
    constructor(movRepo: Repository<MovimientoInventario>, prodRepo: Repository<Producto>, ptRepo: Repository<ProductoTienda>, empresasService: EmpresasService);
    private adminRoles;
    private resolveTiendaId;
    listStock(scope: any, tiendaIdOverride?: number): Promise<Producto[]>;
    getMovimientos(productoId: number, scope: any): Promise<MovimientoInventario[]>;
    listMovimientos(scope: any): Promise<MovimientoInventario[]>;
    registrarMovimiento(data: {
        producto_id: number;
        tipo: MovimientoTipo;
        cantidad: number;
        concepto?: string;
        tienda_id?: number;
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
    importCSV(buffer: Buffer, scope: any, tiendaIdOverride?: number): Promise<{
        success: number;
        errors: any[];
        total: any;
    }>;
    getVistaGeneral(scope: any): Promise<{
        tiendas: {
            id: number;
            nombre: string;
        }[];
        productos: {
            id: number;
            sku: string;
            nombre: string;
            stock_minimo: number;
            unidad: string;
            precio: number;
            stock_total: number;
            por_tienda: {
                tienda_id: number;
                tienda_nombre: string;
                stock: number;
                precio: number;
            }[];
            categoria_id: number;
            categoria_nombre: string;
        }[];
    }>;
    listStockPorModulo(scope: any, modulo?: string): Promise<Producto[]>;
    exportCSV(scope: any, tiendaIdOverride?: number): Promise<string>;
}
