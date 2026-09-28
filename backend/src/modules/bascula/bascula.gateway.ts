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
    // El bridge ya no sirve solo al kiosko: tambien alimenta la bascula dentro del POS
    // y abre el cajon de dinero. Exigir `activo` dejaba fuera a una tienda que solo
    // quiere el cajon, que es justo el caso de la fruteria.
    const habilitado = !!config && (config.activo || config.usar_en_pos || config.cajon_activo);
    if (!habilitado) {
      client.emit('bridge-error', { message: 'Token invalido o hardware local desactivado' });
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
  /**
   * Camino de RESPALDO para abrir el cajon.
   *
   * El camino bueno es el puente local (el navegador llama a 127.0.0.1 y no depende
   * de internet). Esto existe para cuando el POS corre en otra computadora de la
   * tienda, o el puente no levanto: entonces se pide por la nube y el bridge la
   * recibe. Si no hay internet, este camino simplemente no esta — por eso no es el
   * principal.
   */
  emitOpenDrawer(tiendaId: number, payload: { cmd?: string } = {}) {
    this.server.to(`tienda:${tiendaId}`).emit('open-drawer', payload);
  }

  emitPrintLabel(tiendaId: number, payload: {
    producto_nombre: string; peso_kg: number; precio_total: number; precio_kg: number; barcode: string;
    label_width_mm: number; label_height_mm: number;
    printer_modo: string; printer_ip: string | null; printer_port: number;
    printer_nombre: string | null;
  }) {
    this.server.to(`tienda:${tiendaId}`).emit('print-label', payload);
  }
}
