import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { NotificacionesService } from './notificaciones.service';
export declare class NotificacionesController {
    private service;
    private jwtService;
    private logger;
    constructor(service: NotificacionesService, jwtService: JwtService);
    sse(req: Request, res: Response): void;
}
