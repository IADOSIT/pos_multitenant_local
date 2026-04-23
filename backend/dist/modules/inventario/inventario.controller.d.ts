import { InventarioService } from './inventario.service';
import { Response } from 'express';
export declare class InventarioController {
    private service;
    constructor(service: InventarioService);
    listStock(scope: any): Promise<import("../productos/producto.entity").Producto[]>;
    listMovimientos(scope: any): Promise<import("./inventario.entity").MovimientoInventario[]>;
    getMovimientos(id: number, scope: any): Promise<import("./inventario.entity").MovimientoInventario[]>;
    registrarMovimiento(data: any, scope: any): Promise<{
        movimiento: import("./inventario.entity").MovimientoInventario;
        stock_actual: number;
    }>;
    updateProducto(id: number, data: any, scope: any): Promise<import("../productos/producto.entity").Producto>;
    csvTemplate(res: Response): void;
    csvExport(scope: any, res: Response): Promise<void>;
    csvImport(file: Express.Multer.File, scope: any): Promise<{
        success: number;
        errors: any[];
        total: any;
    }>;
    listStockPorModulo(scope: any, modulo?: string): Promise<import("../productos/producto.entity").Producto[]>;
}
