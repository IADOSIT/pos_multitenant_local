import { DataSource } from 'typeorm';
import { CotizacionesService } from './cotizaciones.service';
export declare class CotizacionesJobs {
    private ds;
    private service;
    private readonly log;
    constructor(ds: DataSource, service: CotizacionesService);
    marcarVencidas(): Promise<void>;
    materializarPendientes(): Promise<void>;
}
