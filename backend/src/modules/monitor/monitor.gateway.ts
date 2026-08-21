import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MonitorService } from './monitor.service';
import { parseUserAgent } from './user-agent.util';
import { IdentidadSesion } from './monitor.types';

/** Room a la que se unen los superadmins que tienen el monitor abierto. */
export const ROOM_MONITOR = 'monitor';

// Con `namespace: '/presencia'`, Nest inyecta en @WebSocketServer() un Namespace
// de socket.io, NO un Server (lo hace decorateWithNamespace, en
// @nestjs/websockets/socket-server-provider). El Namespace expone `.sockets`
// como un Map de sockets, que NO tiene `.adapter`: las rooms viven en
// `nsp.adapter.rooms`. Declararlo `Server` y leer `server.sockets.adapter.rooms`
// compila sin quejas y devuelve undefined SIEMPRE, o sea que no se difunde nada.
// Se aisla aqui para que check-monitor.ts pueda verificarlo contra un socket.io
// real y detectar el dia que la biblioteca cambie de forma.
export function roomsDelNamespace(nsp: Namespace | undefined): Map<string, Set<string>> | undefined {
  return nsp?.adapter?.rooms as any;
}

// Presencia en vivo del POS. A diferencia de BiometricoGateway y BasculaGateway,
// que confian en un token de tienda, aqui SI se verifica el JWT: se maneja
// identidad de personas, y un cliente no debe poder decir "soy Juan".
//
// La IP no se lee del handshake a proposito: quedo fuera de alcance.
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/presencia' })
export class MonitorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // Namespace, no Server: es lo que Nest inyecta cuando el gateway declara
  // `namespace`. `.to(room).emit(...)` funciona igual sobre un Namespace.
  @WebSocketServer() server: Namespace;

  constructor(
    private readonly monitor: MonitorService,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      client.disconnect(true);
      return;
    }

    const identidad: IdentidadSesion = {
      usuario_id: payload.sub,
      nombre: payload.nombre || payload.email || 'Sin nombre',
      rol: payload.rol,
      tenant_id: payload.tenant_id,
      empresa_id: payload.empresa_id,
      tienda_id: payload.tienda_id ?? null,
    };

    const dispositivo = parseUserAgent(client.handshake.headers['user-agent']);
    const rutaInicial = client.handshake.auth?.ruta || '/';

    const sesion = this.monitor.alta(client.id, identidad, dispositivo, rutaInicial);
    this.emitirSiHayMonitores('presencia:alta', sesion);
  }

  handleDisconnect(client: Socket) {
    const sesion = this.monitor.baja(client.id);
    if (sesion) this.emitirSiHayMonitores('presencia:baja', { socket_id: client.id });
  }

  @SubscribeMessage('pantalla')
  handlePantalla(@ConnectedSocket() client: Socket, @MessageBody() data: { ruta?: string }) {
    if (!data?.ruta) return;
    const delta = this.monitor.cambiarPantalla(client.id, data.ruta);
    if (delta) this.emitirSiHayMonitores('presencia:pantalla', delta);
  }

  @SubscribeMessage('monitor-join')
  handleMonitorJoin(@ConnectedSocket() client: Socket) {
    // El rol sale de la sesion, que se construyo con el JWT verificado.
    // No se le pregunta al cliente que rol tiene.
    const sesion = this.monitor.getSesion(client.id);
    if (sesion?.rol !== 'superadmin') return;
    client.join(ROOM_MONITOR);
    client.emit('presencia:snapshot', this.monitor.snapshot());
  }

  // Al cerrar el monitor, el socket sigue vivo (lo abrio MainLayout) pero ya no
  // debe recibir deltas: sin esto la room nunca se vacia y "difusion con el
  // monitor cerrado: 0" deja de ser cierto tras la primera visita.
  @SubscribeMessage('monitor-leave')
  handleMonitorLeave(@ConnectedSocket() client: Socket) {
    client.leave(ROOM_MONITOR);
  }

  // El Map se actualiza siempre; difundir solo cuesta cuando alguien mira.
  // Con el monitor cerrado — lo normal — esto no emite nada.
  private emitirSiHayMonitores(evento: string, carga: any) {
    const room = roomsDelNamespace(this.server)?.get(ROOM_MONITOR);
    if (!room || room.size === 0) return;
    this.server.to(ROOM_MONITOR).emit(evento, carga);
  }
}
