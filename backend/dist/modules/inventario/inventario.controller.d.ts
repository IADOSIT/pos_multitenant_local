import { InventarioService } from './inventario.service';
import { Response } from 'express';
export declare class InventarioController {
    private service;
    constructor(service: InventarioService);
    listStock(scope: any, tiendaId?: string): Promise<import("../productos/producto.entity").Producto[]>;
    listMovimientos(scope: any): Promise<import("./inventario.entity").MovimientoInventario[]>;
    getMovimientos(id: number, scope: any): Promise<import("./inventario.entity").MovimientoInventario[]>;
    registrarMovimiento(data: any, scope: any): Promise<{
        movimiento: import("./inventario.entity").MovimientoInventario;
        stock_actual: number;
    }>;
    updateProducto(id: number, data: any, scope: any): Promise<import("../productos/producto.entity").Producto>;
    csvTemplate(res: Response): void;
    csvExport(scope: any, res: Response, tiendaId?: string): Promise<void>;
    csvImport(file: Express.Multer.File, scope: any, tiendaId?: string): Promise<{
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
    listStockPorModulo(scope: any, modulo?: string): Promise<import("../productos/producto.entity").Producto[]>;
}
