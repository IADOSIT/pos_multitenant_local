import { CajaService } from './caja.service';
export declare class CajaController {
    private service;
    constructor(service: CajaService);
    abrir(data: any, scope: any): Promise<import("./caja.entity").Caja>;
    cerrar(id: number, data: any, scope: any): Promise<import("./caja.entity").Caja>;
    movimiento(id: number, data: any, scope: any): Promise<import("./caja.entity").MovimientoCaja>;
    corteX(id: number): Promise<{
        caja: import("./caja.entity").Caja;
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
    reporte(id: number): Promise<{
        caja: import("./caja.entity").Caja;
        ventas: import("../ventas/venta.entity").Venta[];
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
        ventas_online: {
            pedidos: import("../ecommerce/ecommerce-pedido.entity").EcommercePedido[];
            resumen: {
                num_pedidos: number;
                num_cancelados: number;
                total: number;
            };
        };
    }>;
    getActiva(scope: any): Promise<import("./caja.entity").Caja | null>;
    findAll(scope: any): Promise<import("./caja.entity").Caja[]>;
}
