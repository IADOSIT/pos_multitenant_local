import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class NotificacionesService {
  private logger = new Logger('NotificacionesService');
  private connections = new Map<number, Set<Response>>();
  private keepaliveInterval: NodeJS.Timeout;

  constructor() {
    // Keepalive every 30s to prevent timeout
    this.keepaliveInterval = setInterval(() => {
      this.connections.forEach((conns) => {
        conns.forEach((res) => {
          try { res.write(': keepalive\n\n'); } catch {}
        });
      });
    }, 30000);
  }

  addConnection(tiendaId: number, res: Response): void {
    if (!this.connections.has(tiendaId)) {
      this.connections.set(tiendaId, new Set());
    }
    this.connections.get(tiendaId)!.add(res);
    this.logger.log(`SSE connection added for tienda ${tiendaId} (total: ${this.connections.get(tiendaId)!.size})`);

    res.on('close', () => {
      this.connections.get(tiendaId)?.delete(res);
      this.logger.log(`SSE connection removed for tienda ${tiendaId}`);
    });
  }

  emitToTienda(tiendaId: number, event: string, data: any): void {
    const conns = this.connections.get(tiendaId);
    if (!conns || conns.size === 0) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    conns.forEach((res) => {
      try { res.write(payload); } catch {}
    });
    this.logger.log(`SSE event '${event}' emitted to tienda ${tiendaId} (${conns.size} clients)`);
  }
}
