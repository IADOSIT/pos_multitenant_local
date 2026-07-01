import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BiometricoService } from './biometrico.service';
import { EmpleadosService } from './empleados.service';
import { ConfigBiometrico } from './config-biometrico.entity';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/biometrico' })
export class BiometricoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // Map de socket.id → empresa_id (para bridge y live screens autenticados)
  private bridgeMap = new Map<string, { empresa_id: number; empresa_token: string }>();

  constructor(
    private readonly biometricoService: BiometricoService,
    private readonly empleadosService: EmpleadosService,
    @InjectRepository(ConfigBiometrico) private readonly configRepo: Repository<ConfigBiometrico>,
  ) {}

  handleConnection(client: Socket) {
    // Connection registrada; autenticación en 'bridge-join' o 'live-join'
    void client;
  }

  handleDisconnect(client: Socket) {
    this.bridgeMap.delete(client.id);
  }

  // ── Bridge se conecta y se autentica ──────────────────────────────
  @SubscribeMessage('bridge-join')
  async handleBridgeJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { empresa_token: string }) {
    const config = await this.configRepo.findOne({ where: { empresa_token: data.empresa_token } });
    if (!config || !config.activo) {
      client.emit('bridge-error', { message: 'Token inválido o módulo inactivo' });
      return;
    }
    client.join(`empresa:${config.empresa_id}`);
    this.bridgeMap.set(client.id, { empresa_id: config.empresa_id, empresa_token: data.empresa_token });
    client.emit('bridge-welcome', { empresa_id: config.empresa_id });
  }

  // ── Pantalla live se conecta para escuchar eventos ────────────────
  @SubscribeMessage('live-join')
  async handleLiveJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { empresa_token: string }) {
    const config = await this.configRepo.findOne({ where: { empresa_token: data.empresa_token } });
    if (!config) { client.disconnect(); return; }
    client.join(`empresa:${config.empresa_id}`);
    client.emit('live-welcome', { empresa_id: config.empresa_id });
  }

  // ── Bridge reporta: huella capturada y matcheada localmente ───────
  @SubscribeMessage('bridge-match')
  async handleBridgeMatch(@ConnectedSocket() client: Socket, @MessageBody() data: { empleado_id: number; timestamp?: string }) {
    const info = this.bridgeMap.get(client.id);
    if (!info) return;
    const ts = data.timestamp ? new Date(data.timestamp) : new Date();
    try {
      const result = await this.biometricoService.procesarMatch(info.empresa_token, data.empleado_id, ts);
      // Broadcast a todos en la room (incluyendo pantalla live y admins)
      this.server.to(`empresa:${info.empresa_id}`).emit('attendance-event', {
        ...result.registro,
        nuevo: result.nuevo,
      });
      // Stub para torniquete futuro
      // if (config.open_device_enabled && config.device_ip) {
      //   client.emit('open_device', { ip_address: config.device_ip, auto_timer_s: config.device_timer_s || 3 });
      // }
    } catch (err: any) {
      client.emit('bridge-error', { message: err.message });
    }
  }

  // ── Bridge sin match local — fallback matching en backend ─────────
  @SubscribeMessage('bridge-fmd')
  async handleBridgeFmd(@ConnectedSocket() client: Socket, @MessageBody() data: { fmdB64: string; timestamp?: string }) {
    const info = this.bridgeMap.get(client.id);
    if (!info) return;
    const matchId = await this.biometricoService.matchFmd(info.empresa_id, data.fmdB64);
    if (!matchId) {
      this.server.to(`empresa:${info.empresa_id}`).emit('attendance-event', { resultado: 'no_match', timestamp: new Date() });
      return;
    }
    await this.handleBridgeMatch(client, { empleado_id: matchId, timestamp: data.timestamp });
  }

  // ── Admin inicia enrollment desde frontend ────────────────────────
  @SubscribeMessage('enroll-start')
  async handleEnrollStart(@ConnectedSocket() client: Socket, @MessageBody() data: { empleado_id: number; empresa_token: string }) {
    const config = await this.configRepo.findOne({ where: { empresa_token: data.empresa_token } });
    if (!config) { client.emit('enroll-error', { message: 'Configuración no encontrada' }); return; }
    // Unir al admin al room de la empresa (para recibir el resultado del enrollment)
    client.join(`empresa:${config.empresa_id}`);
    // Reenviar al bridge
    this.server.to(`empresa:${config.empresa_id}`).emit('bridge-enroll-start', { empleado_id: data.empleado_id });
  }

  // ── Bridge devuelve FMD capturado ─────────────────────────────────
  @SubscribeMessage('bridge-enroll-done')
  async handleEnrollDone(@ConnectedSocket() client: Socket, @MessageBody() data: { empleado_id: number; fmdB64: string }) {
    const info = this.bridgeMap.get(client.id);
    if (!info) return;
    try {
      const validacion = await this.biometricoService.validarEnrollment(data.fmdB64, info.empresa_id, data.empleado_id);
      if (!validacion.ok) {
        this.server.to(`empresa:${info.empresa_id}`).emit('enroll-result', { success: false, reason: validacion.reason });
        return;
      }
      const empleado = await this.empleadosService.findById(data.empleado_id);
      const scope = { tenant_id: empleado?.tenant_id, empresa_id: info.empresa_id };
      await this.empleadosService.setFmdTemplate(data.empleado_id, data.fmdB64, scope);
      this.server.to(`empresa:${info.empresa_id}`).emit('enroll-result', { success: true, empleado_id: data.empleado_id });
    } catch (err: any) {
      this.server.to(`empresa:${info.empresa_id}`).emit('enroll-result', { success: false, reason: err.message });
    }
  }
}
