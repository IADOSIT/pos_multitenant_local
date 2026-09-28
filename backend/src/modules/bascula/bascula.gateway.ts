import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ConfigBascula } from './config-bascula.entity';

/**
 * Mismo patron que BiometricoGateway: el bridge local (bascula-bridge) se conecta y se
 * autentica con un token por tienda; el kiosko (pantalla del cliente) se une a la misma
 * room para recibir el peso en vivo que retransmite el bridge.
 *
 * ── Por que el peso trae "estacion" ──────────────────────────────────────────
 * Una tienda puede tener VARIAS basculas, cada una por USB a una computadora
 * distinta: la caja de cobro, el kiosko de autoservicio, el mostrador de
 * salchichoneria. Todas usan el mismo `tienda_token` (config_bascula.tienda_id es
 * unique: hay una sola fila de configuracion por tienda), asi que todos los bridges
 * caen en la MISMA room. Sin distinguirlas, las lecturas de las tres se pisan y el
 * peso brinca entre basculas.
 *
 * La estacion es un dato LOCAL de cada computadora — se captura en la ventana del
 * bridge y viaja en el `bridge-join`. No se guarda en la base a proposito: no hay
 * donde, y tampoco tendria sentido, porque describe una PC y no al negocio.
 *
 * Compatibilidad: un bridge viejo que no mande estacion entra como 'Principal', y un
 * navegador viejo que no sepa de estaciones simplemente ignora los campos nuevos de
 * `weight-update` y sigue recibiendo el peso como siempre.
 *
 * -- Quien puede ESCUCHAR una tienda -----------------------------------------
 * `kiosk-join` no validaba nada: bastaba saber el tienda_id para oir el peso de una
 * tienda ajena desde cualquier red. La fuga es de solo lectura -- para PUBLICAR peso
 * hay que estar en `bridgeMap`, y a eso solo se entra con el `tienda_token` -- pero
 * aun asi no debe quedarse abierta.
 *
 * Se cierra en DOS PASOS, con `BASCULA_KIOSK_STRICT` como interruptor:
 *   Paso 1 (por omision, la variable apagada): se verifica el JWT igual, pero al que
 *     no lo trae o no cuadra se le deja pasar y queda escrito en el log con el
 *     prefijo `[kiosk-auth]`. Sirve para ver quien entraria rechazado ANTES de
 *     romper nada: una caja con el bundle viejo en cache sigue trabajando.
 *   Paso 2 (la variable en 'true'): esos mismos casos se rechazan.
 * Asi el cambio de comportamiento es una variable de entorno y no codigo nuevo, y
 * volver atras es apagarla y redesplegar.
 *
 * La verificacion NO puede vivir en handleConnection (como en MonitorGateway) porque
 * este namespace lo comparten dos clientes distintos: el bridge, que se autentica con
 * el token de tienda y no tiene JWT, y el navegador, que si.
 */
/** Que tan legitimo es un navegador que pide escuchar una tienda. */
type VeredictoOyente = 'ok' | 'sin-token' | 'invalido' | 'otra-tienda';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/bascula' })
export class BasculaGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger('BasculaGateway');

  private bridgeMap = new Map<string, { tienda_id: number; estacion: string }>();

  constructor(
    @InjectRepository(ConfigBascula) private readonly configRepo: Repository<ConfigBascula>,
    private readonly jwt: JwtService,
  ) {}

  /** Paso 2 encendido. Se lee en cada llamada para que no quede capturado al arranque. */
  private modoEstricto(): boolean {
    return String(process.env.BASCULA_KIOSK_STRICT || '').trim().toLowerCase() === 'true';
  }

  /**
   * Que credencial trae el navegador que quiere oir `tiendaId`. El JWT viaja en el
   * handshake (`auth.token`), igual que en MonitorGateway, y no en el cuerpo del
   * evento: asi no termina escrito en ningun log de payloads.
   */
  private verificarOyente(client: Socket, tiendaId: number): VeredictoOyente {
    const token = (client.handshake as any)?.auth?.token;
    if (!token) return 'sin-token';
    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      return 'invalido';
    }
    // El superadmin entra a cualquier tienda: opera con "ver como tienda", que viaja
    // en una cabecera HTTP que un socket no tiene con que reproducir.
    if (payload?.rol === 'superadmin') return 'ok';
    return Number(payload?.tienda_id) === Number(tiendaId) ? 'ok' : 'otra-tienda';
  }

  /**
   * Portero de los eventos de escucha. Devuelve si se le deja entrar; en el paso 1
   * eso es SIEMPRE que si, y lo unico que cambia es que queda escrito en el log.
   */
  private permitirOyente(client: Socket, tiendaId: number, evento: string): boolean {
    const veredicto = this.verificarOyente(client, tiendaId);
    if (veredicto === 'ok') return true;

    const estricto = this.modoEstricto();
    const origen = (client.handshake as any)?.headers?.origin || 'sin-origin';
    const ua = String((client.handshake as any)?.headers?.['user-agent'] || '').slice(0, 80);
    this.logger.warn(
      `[kiosk-auth] ${evento} ${estricto ? 'RECHAZADO' : 'TOLERADO'} ` +
      `veredicto=${veredicto} tienda_id=${tiendaId} socket=${client.id} ` +
      `origin=${origen} ua="${ua}"`,
    );

    if (!estricto) return true;
    client.emit('kiosk-error', {
      veredicto,
      message: veredicto === 'otra-tienda'
        ? 'Tu sesion no pertenece a esta tienda'
        : 'Sesion no valida para escuchar la bascula',
    });
    return false;
  }

  handleDisconnect(client: Socket) {
    const info = this.bridgeMap.get(client.id);
    this.bridgeMap.delete(client.id);
    // Si el que se fue era un bridge, las pantallas tienen que enterarse de que esa
    // bascula ya no esta: si alguien la tenia elegida, debe poder capturar a mano.
    if (info) this.difundirBasculas(info.tienda_id);
  }

  /** Basculas conectadas ahora mismo en una tienda. Es la lista "en vivo", no un catalogo. */
  private basculasDe(tiendaId: number) {
    const out: { bridge_id: string; estacion: string }[] = [];
    for (const [socketId, info] of this.bridgeMap) {
      if (info.tienda_id === tiendaId) out.push({ bridge_id: socketId, estacion: info.estacion });
    }
    return out.sort((a, b) => a.estacion.localeCompare(b.estacion));
  }

  private difundirBasculas(tiendaId: number) {
    this.server.to(`tienda:${tiendaId}`).emit('basculas-update', { basculas: this.basculasDe(tiendaId) });
  }

  // ── El bridge local se conecta y se autentica con el token de la tienda ──
  @SubscribeMessage('bridge-join')
  async handleBridgeJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tienda_token: string; estacion?: string },
  ) {
    const config = await this.configRepo.findOne({ where: { tienda_token: data.tienda_token } });
    // El bridge ya no sirve solo al kiosko: tambien alimenta la bascula dentro del POS
    // y abre el cajon de dinero. Exigir `activo` dejaba fuera a una tienda que solo
    // quiere el cajon, que es justo el caso de la fruteria.
    const habilitado = !!config && (config.activo || config.usar_en_pos || config.cajon_activo);
    if (!habilitado) {
      client.emit('bridge-error', { message: 'Token invalido o hardware local desactivado' });
      return;
    }
    const estacion = (data.estacion || '').toString().trim().slice(0, 40) || 'Principal';
    client.join(`tienda:${config.tienda_id}`);
    this.bridgeMap.set(client.id, { tienda_id: config.tienda_id, estacion });
    client.emit('bridge-welcome', { tienda_id: config.tienda_id, estacion });
    this.difundirBasculas(config.tienda_id);
  }

  // ── El kiosko (pantalla del cliente, ya autenticado con JWT) se une para escuchar ──
  @SubscribeMessage('kiosk-join')
  handleKioskJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { tienda_id: number }) {
    const tiendaId = Number(data?.tienda_id);
    if (!Number.isInteger(tiendaId) || tiendaId <= 0) return;
    if (!this.permitirOyente(client, tiendaId, 'kiosk-join')) return;

    client.join(`tienda:${tiendaId}`);
    client.emit('kiosk-welcome', { tienda_id: tiendaId });
    // Que sepa de una vez cuales basculas hay prendidas, sin esperar a que alguna pese.
    client.emit('basculas-update', { basculas: this.basculasDe(tiendaId) });
  }

  /** Repreguntar la lista sin reconectar (la pantalla de configuracion la refresca). */
  @SubscribeMessage('basculas-listar')
  handleBasculasListar(@ConnectedSocket() client: Socket, @MessageBody() data: { tienda_id: number }) {
    const tiendaId = Number(data?.tienda_id);
    if (!Number.isInteger(tiendaId) || tiendaId <= 0) return;
    // Mismo portero: la lista de basculas prendidas tambien dice algo de la tienda.
    if (!this.permitirOyente(client, tiendaId, 'basculas-listar')) return;

    client.emit('basculas-update', { basculas: this.basculasDe(tiendaId) });
  }

  // ── El bridge retransmite el peso en vivo de la bascula ──
  @SubscribeMessage('bridge-weight')
  handleBridgeWeight(@ConnectedSocket() client: Socket, @MessageBody() data: { peso_kg: number; estable: boolean }) {
    const info = this.bridgeMap.get(client.id);
    if (!info) return;
    // Los campos nuevos van ADEMAS de los de siempre: quien no los entienda, los ignora.
    this.server.to(`tienda:${info.tienda_id}`).emit('weight-update', {
      ...data,
      estacion: info.estacion,
      bridge_id: client.id,
    });
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
