import { Controller, Get, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
export class NotificacionesController {
  private logger = new Logger('NotificacionesController');

  constructor(
    private service: NotificacionesService,
    private jwtService: JwtService,
  ) {}

  @Get('sse')
  sse(@Req() req: Request, @Res() res: Response) {
    // Auth via query param (EventSource doesn't support headers)
    const token = req.query.token as string;
    if (!token) {
      res.status(401).json({ message: 'Token requerido' });
      return;
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      res.status(401).json({ message: 'Token invalido' });
      return;
    }

    const tiendaId = payload.tienda_id;
    if (!tiendaId) {
      res.status(400).json({ message: 'tienda_id no encontrado en token' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'ok', tienda_id: tiendaId })}\n\n`);

    this.service.addConnection(tiendaId, res);
    this.logger.log(`SSE client connected: user ${payload.sub} tienda ${tiendaId}`);
  }
}
