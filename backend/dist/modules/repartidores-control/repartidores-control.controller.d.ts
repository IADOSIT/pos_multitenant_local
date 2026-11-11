import { RepartidoresControlService } from './repartidores-control.service';
export declare class RepartidoresControlController {
    private service;
    constructor(service: RepartidoresControlService);
    estado(scope: any): Promise<{
        habilitado: boolean;
        preguntar: string;
    }>;
    listar(scope: any): Promise<any[]>;
    crear(data: any, scope: any): Promise<{
        id: number;
        nombre: string;
        telefono: string | null;
        activo: boolean;
        codigo: string;
    }>;
    actualizar(id: number, data: any, scope: any): Promise<{
        id: number;
        nombre: string;
        telefono: string | null;
        activo: boolean;
        codigo: string;
    }>;
    regenerar(id: number, scope: any): Promise<{
        id: number;
        nombre: string;
        telefono: string | null;
        activo: boolean;
        codigo: string;
    }>;
    asignar(data: any, scope: any): Promise<{
        asignacion: import("./repartidor-asignacion.entity").RepartidorAsignacion;
        repartidor: {
            id: number;
            nombre: string;
        };
        resumen: {
            pedidos: number;
            efectivo: number;
        };
        ya_estaba: boolean;
    } | {
        asignacion: any;
        repartidor: {
            id: number;
            nombre: string;
        };
        resumen: {
            pedidos: number;
            efectivo: number;
        };
        ya_estaba?: undefined;
    }>;
    reasignar(id: number, data: any, scope: any): Promise<{
        asignacion: any;
        anterior: number;
    }>;
    quitar(id: number, data: any, scope: any): Promise<import("./repartidor-asignacion.entity").RepartidorAsignacion>;
    tablero(scope: any): Promise<{
        repartidores: {
            id: number;
            nombre: string;
            telefono: string | null;
            activo: boolean;
            pedidos: number;
            efectivo: number;
            total: number;
            canceladas: number;
            desde: any;
            ultima_liquidacion: {} | null;
        }[];
        totales: {
            pedidos: number;
            efectivo: number;
            total: number;
        };
    }>;
    pendientes(id: number, scope: any): Promise<{
        repartidor: {
            id: number;
            nombre: string;
            telefono: string | null;
            activo: boolean;
        };
        pedidos: any;
    }>;
    liquidar(data: any, scope: any): Promise<any>;
    liquidaciones(q: any, scope: any): Promise<any>;
    liquidacion(id: number, scope: any): Promise<any>;
    historial(q: any, scope: any): Promise<any>;
}
