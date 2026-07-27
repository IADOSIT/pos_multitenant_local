import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigBascula } from './config-bascula.entity';

// Mismo patron que BiometricoGateway: el bridge local (bascula-bridge) se conecta y se
// autentica con un token por tienda; el kiosko (pantalla del cliente) se une a la misma
// room para recibir el peso en vivo que retransmite el bridge.
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/bascula' })
export class BasculaGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private bridgeMap = new Map<string, { tienda_id: number }>();

  constructor(
    @InjectRepository(ConfigBascula) private readonly configRepo: Repository<ConfigBascula>,
  ) {}

  handleDisconnect(client: Socket) {
    this.bridgeMap.delete(client.id);
  }

  // ── El bridge local se conecta y se autentica con el token de la tienda ──
  @SubscribeMessage('bridge-join')
  async handleBridgeJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { tienda_token: string }) {
    const config = await this.configRepo.findOne({ where: { tienda_token: data.tienda_token } });
    if (!config || !config.activo) {
      client.emit('bridge-error', { message: 'Token invalido o bascula inactiva' });
      return;
    }
    client.join(`tienda:${config.tienda_id}`);
    this.bridgeMap.set(client.id, { tienda_id: config.tienda_id });
    client.emit('bridge-welcome', { tienda_id: config.tienda_id });
  }

  // ── El kiosko (pantalla del cliente, ya autenticado con JWT) se une para escuchar ──
  @SubscribeMessage('kiosk-join')
  handleKioskJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { tienda_id: number }) {
    client.join(`tienda:${data.tienda_id}`);
    client.emit('kiosk-welcome', { tienda_id: data.tienda_id });
  }

  // ── El bridge retransmite el peso en vivo de la bascula ──
  @SubscribeMessage('bridge-weight')
  handleBridgeWeight(@ConnectedSocket() client: Socket, @MessageBody() data: { peso_kg: number; estable: boolean }) {
    const info = this.bridgeMap.get(client.id);
    if (!info) return;
    this.server.to(`tienda:${info.tienda_id}`).emit('weight-update', data);
  }

  // ── Backend pide al bridge que imprima la etiqueta (llamado desde BasculaService) ──
  emitPrintLabel(tiendaId: number, payload: {
    producto_nombre: string; peso_kg: number; precio_total: number; barcode: string;
    label_width_mm: number; label_height_mm: number;
    printer_ip: string | null; printer_port: number;
  }) {
    this.server.to(`tienda:${tiendaId}`).emit('print-label', payload);
  }
}
