import { Response } from 'express';
import { Repository } from 'typeorm';
import { ConfigBascula } from './config-bascula.entity';
import { BasculaService } from './bascula.service';
export declare class BridgeDescargaController {
    private readonly service;
    private readonly configRepo;
    constructor(service: BasculaService, configRepo: Repository<ConfigBascula>);
    descargar(token: string, res: Response): Promise<void>;
}
