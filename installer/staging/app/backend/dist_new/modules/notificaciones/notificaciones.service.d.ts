import { Response } from 'express';
export declare class NotificacionesService {
    private logger;
    private connections;
    private keepaliveInterval;
    constructor();
    addConnection(tiendaId: number, res: Response): void;
    emitToTienda(tiendaId: number, event: string, data: any): void;
}
