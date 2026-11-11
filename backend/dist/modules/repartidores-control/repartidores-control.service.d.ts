import { Repository, DataSource } from 'typeorm';
import { Repartidor } from '../logistica/repartidor.entity';
import { RepartidorQr } from './repartidor-qr.entity';
import { RepartidorAsignacion } from './repartidor-asignacion.entity';
import { RepartidorLiquidacion } from './repartidor-liquidacion.entity';
export declare function normalizarCodigo(c: any): string;
export declare class RepartidoresControlService {
    private repartidorRepo;
    private qrRepo;
    private asigRepo;
    private liqRepo;
    private dataSource;
    private logger;
    constructor(repartidorRepo: Repository<Repartidor>, qrRepo: Repository<RepartidorQr>, asigRepo: Repository<RepartidorAsignacion>, liqRepo: Repository<RepartidorLiquidacion>, dataSource: DataSource);
    private configTienda;
    estado(scope: any): Promise<{
        habilitado: boolean;
        preguntar: string;
    }>;
    private exigirHabilitado;
    private generarCodigoUnico;
    private qrDe;
    listarRepartidores(scope: any): Promise<any[]>;
    crearRepartidor(data: any, scope: any): Promise<{
        id: number;
        nombre: string;
        telefono: string | null;
        activo: boolean;
        codigo: string;
    }>;
    private repartidorDeEmpresa;
    actualizarRepartidor(id: number, data: any, scope: any): Promise<{
        id: number;
        nombre: string;
        telefono: string | null;
        activo: boolean;
        codigo: string;
    }>;
    regenerarCodigo(id: number, scope: any): Promise<{
        id: number;
        nombre: string;
        telefono: string | null;
        activo: boolean;
        codigo: string;
    }>;
    private resolverRepartidor;
    private resumenPendiente;
    private ventaDeTienda;
    private crearAsignacion;
    asignar(data: any, scope: any): Promise<{
        asignacion: RepartidorAsignacion;
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
    private asignacionPendiente;
    reasignar(id: number, data: any, scope: any): Promise<{
        asignacion: any;
        anterior: number;
    }>;
    quitar(id: number, data: any, scope: any): Promise<RepartidorAsignacion>;
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
    pendientesDe(repartidor_id: number, scope: any): Promise<{
        repartidor: {
            id: number;
            nombre: string;
            telefono: string | null;
            activo: boolean;
        };
        pedidos: any;
    }>;
    private filaAsignacion;
    liquidar(data: any, scope: any): Promise<any>;
    private detalleLiquidacionCon;
    liquidacion(id: number, scope: any): Promise<any>;
    private rangoFechas;
    liquidaciones(q: any, scope: any): Promise<any>;
    historial(q: any, scope: any): Promise<any>;
}
