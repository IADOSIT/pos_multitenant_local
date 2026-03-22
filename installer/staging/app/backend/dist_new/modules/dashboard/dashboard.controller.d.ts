import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private service;
    constructor(service: DashboardService);
    getKPI(scope: any, desde: string, hasta: string, tiendaId?: string): Promise<{
        total_ventas: number;
        num_tickets: number;
        ticket_promedio: number;
        cancelaciones: number;
        top_productos: {
            nombre: string;
            cantidad: number;
            total: number;
        }[];
        ventas_por_hora: any[];
        metodos_pago: {
            efectivo: number;
            tarjeta: number;
            transferencia: number;
            mixto: number;
        };
    }>;
    getTendencia(scope: any, semanas?: string): Promise<{
        total: number;
        tickets: number;
        semana: string;
    }[]>;
    getPedidosCount(scope: any): Promise<{
        count: number;
    }>;
}
