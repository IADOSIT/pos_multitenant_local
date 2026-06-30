import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Repartidor } from './repartidor.entity';
import { EntregaPedido, EstadoEntrega } from './entrega-pedido.entity';
import { ConfigLogistica } from './config-logistica.entity';
import { LogNotifEntrega } from './log-notif-entrega.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class LogisticaService {
  constructor(
    @InjectRepository(Repartidor)
    private repartidorRepo: Repository<Repartidor>,
    @InjectRepository(EntregaPedido)
    private entregaRepo: Repository<EntregaPedido>,
    @InjectRepository(ConfigLogistica)
    private configRepo: Repository<ConfigLogistica>,
    @InjectRepository(LogNotifEntrega)
    private logRepo: Repository<LogNotifEntrega>,
    private notificacionesService: NotificacionesService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // ── Repartidores ────────────────────────────────────────────────────

  async getRepartidores(scope: any): Promise<Repartidor[]> {
    return this.repartidorRepo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
      order: { nombre: 'ASC' },
    });
  }

  async createRepartidor(data: { nombre: string; telefono?: string }, scope: any): Promise<Repartidor> {
    const { v4: uuidv4 } = require('uuid');
    const rep = this.repartidorRepo.create({
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      nombre: data.nombre,
      telefono: data.telefono || null as any,
      token: uuidv4(),
      activo: true,
    });
    return this.repartidorRepo.save(rep) as any as Promise<Repartidor>;
  }

  async updateRepartidor(id: number, data: any, scope: any): Promise<Repartidor> {
    const rep = await this.repartidorRepo.findOne({
      where: { id, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
    });
    if (!rep) throw new NotFoundException('Repartidor no encontrado');
    if (data.nombre !== undefined) rep.nombre = data.nombre;
    if (data.telefono !== undefined) rep.telefono = data.telefono;
    return this.repartidorRepo.save(rep);
  }

  async toggleRepartidor(id: number, scope: any): Promise<Repartidor> {
    const rep = await this.repartidorRepo.findOne({
      where: { id, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
    });
    if (!rep) throw new NotFoundException('Repartidor no encontrado');
    rep.activo = !rep.activo;
    return this.repartidorRepo.save(rep);
  }

  // ── Asignación ───────────────────────────────────────────────────────

  async asignarRepartidor(pedido_id: number, repartidor_id: number, scope: any): Promise<EntregaPedido> {
    const rows = await this.dataSource.query(
      'SELECT * FROM pedidos WHERE id = ? AND tenant_id = ?',
      [pedido_id, scope.tenant_id],
    );
    if (!rows || rows.length === 0) throw new NotFoundException('Pedido no encontrado');
    const pedido = rows[0];

    const repartidor = await this.repartidorRepo.findOne({
      where: { id: repartidor_id, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true },
    });
    if (!repartidor) throw new NotFoundException('Repartidor no encontrado o inactivo');

    const existente = await this.entregaRepo.findOne({
      where: [
        { pedido_id, tenant_id: scope.tenant_id, estado: EstadoEntrega.ASIGNADO },
        { pedido_id, tenant_id: scope.tenant_id, estado: EstadoEntrega.EN_CAMINO },
      ],
    });
    if (existente) throw new BadRequestException('Este pedido ya tiene una entrega asignada');

    const entrega = this.entregaRepo.create({
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      tienda_id: scope.tienda_id || pedido.tienda_id,
      pedido_id,
      repartidor_id,
      repartidor_nombre: repartidor.nombre,
      pedido_folio: pedido.folio,
      cliente_nombre: pedido.cliente_nombre || null,
      cliente_telefono: pedido.cliente_telefono || null,
      cliente_direccion: pedido.cliente_direccion || null,
      total: pedido.total,
      estado: EstadoEntrega.ASIGNADO,
    });
    const saved = await this.entregaRepo.save(entrega);

    this.notificacionesService.emitToTienda(saved.tienda_id, 'entrega_asignada', {
      pedido_id,
      repartidor_nombre: repartidor.nombre,
      entrega_id: saved.id,
    });
    await this.registrarLogNotif(saved, scope);
    return saved;
  }

  async updateEstadoEntrega(
    entrega_id: number,
    estado: EstadoEntrega,
    notas: string | undefined,
    scope: any,
  ): Promise<EntregaPedido> {
    const entrega = await this.entregaRepo.findOne({
      where: { id: entrega_id, tenant_id: scope.tenant_id },
    });
    if (!entrega) throw new NotFoundException('Entrega no encontrada');

    const allowed: Record<string, EstadoEntrega[]> = {
      asignado: [EstadoEntrega.EN_CAMINO, EstadoEntrega.CON_PROBLEMA],
      en_camino: [EstadoEntrega.ENTREGADO, EstadoEntrega.CON_PROBLEMA],
      con_problema: [EstadoEntrega.EN_CAMINO, EstadoEntrega.ASIGNADO],
    };
    if (!allowed[entrega.estado]?.includes(estado)) {
      throw new BadRequestException(`No se puede pasar de ${entrega.estado} a ${estado}`);
    }

    entrega.estado = estado;
    if (notas) entrega.notas_repartidor = notas;
    if (estado === EstadoEntrega.ENTREGADO) entrega.entregado_at = new Date();
    const saved = await this.entregaRepo.save(entrega);

    this.notificacionesService.emitToTienda(saved.tienda_id, 'entrega_actualizada', {
      entrega_id: saved.id,
      pedido_id: saved.pedido_id,
      estado: saved.estado,
      repartidor_nombre: saved.repartidor_nombre,
    });
    await this.registrarLogNotif(saved, scope);
    return saved;
  }

  async updateEstadoByToken(
    token: string,
    entrega_id: number,
    estado: EstadoEntrega,
    notas?: string,
  ): Promise<EntregaPedido> {
    const repartidor = await this.repartidorRepo.findOne({ where: { token, activo: true } });
    if (!repartidor) throw new UnauthorizedException('Token inválido');

    const entrega = await this.entregaRepo.findOne({
      where: { id: entrega_id, repartidor_id: repartidor.id },
    });
    if (!entrega) throw new NotFoundException('Entrega no encontrada');

    const scope = { tenant_id: repartidor.tenant_id, empresa_id: repartidor.empresa_id };
    return this.updateEstadoEntrega(entrega_id, estado, notas, scope);
  }

  async getRepartidorByToken(token: string): Promise<{ repartidor: Repartidor; entregas: EntregaPedido[] }> {
    const repartidor = await this.repartidorRepo.findOne({ where: { token, activo: true } });
    if (!repartidor) throw new NotFoundException('Token inválido o repartidor inactivo');

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const todas = await this.entregaRepo.find({
      where: { repartidor_id: repartidor.id },
      order: { created_at: 'DESC' },
      take: 100,
    });

    const entregas = todas.filter((e) => {
      const esDeHoy = new Date(e.created_at) >= hoy;
      const esActiva = e.estado === EstadoEntrega.ASIGNADO || e.estado === EstadoEntrega.EN_CAMINO;
      return esDeHoy || esActiva;
    });

    return { repartidor, entregas };
  }

  // ── Entregas ─────────────────────────────────────────────────────────

  async getEntregas(
    scope: any,
    params: { estado?: string; repartidor_id?: number; desde?: string; hasta?: string },
  ): Promise<EntregaPedido[]> {
    const where: any = { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id };
    if (params.estado) where.estado = params.estado;
    if (params.repartidor_id) where.repartidor_id = Number(params.repartidor_id);
    if (params.desde && params.hasta) {
      where.created_at = Between(new Date(params.desde), new Date(params.hasta));
    }
    return this.entregaRepo.find({ where, order: { created_at: 'DESC' }, take: 200 });
  }

  async getEntregaByPedido(pedido_id: number, scope: any): Promise<EntregaPedido | null> {
    return this.entregaRepo.findOne({
      where: { pedido_id, tenant_id: scope.tenant_id },
      order: { created_at: 'DESC' },
    });
  }

  // ── Métricas ─────────────────────────────────────────────────────────

  async getMetricas(scope: any, desde: string, hasta: string): Promise<any> {
    const desdeDate = desde ? new Date(desde) : new Date(new Date().setDate(new Date().getDate() - 7));
    const hastaDate = hasta ? new Date(hasta) : new Date();

    const whereBase = {
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      created_at: Between(desdeDate, hastaDate),
    };

    const [total, entregadas, en_camino, con_problema] = await Promise.all([
      this.entregaRepo.count({ where: whereBase }),
      this.entregaRepo.count({ where: { ...whereBase, estado: EstadoEntrega.ENTREGADO } }),
      this.entregaRepo.count({ where: { ...whereBase, estado: EstadoEntrega.EN_CAMINO } }),
      this.entregaRepo.count({ where: { ...whereBase, estado: EstadoEntrega.CON_PROBLEMA } }),
    ]);

    const porRepartidor = await this.dataSource.query(
      `SELECT
         repartidor_id,
         repartidor_nombre,
         COUNT(*) AS total,
         SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) AS entregadas,
         SUM(CASE WHEN estado = 'con_problema' THEN 1 ELSE 0 END) AS con_problema
       FROM entregas_pedido
       WHERE tenant_id = ? AND empresa_id = ?
         AND created_at BETWEEN ? AND ?
       GROUP BY repartidor_id, repartidor_nombre
       ORDER BY entregadas DESC`,
      [scope.tenant_id, scope.empresa_id, desdeDate, hastaDate],
    );

    const tiemposResult = await this.dataSource.query(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, entregado_at)) AS promedio
       FROM entregas_pedido
       WHERE tenant_id = ? AND empresa_id = ?
         AND estado = 'entregado' AND entregado_at IS NOT NULL
         AND created_at BETWEEN ? AND ?`,
      [scope.tenant_id, scope.empresa_id, desdeDate, hastaDate],
    );

    return {
      total,
      entregadas,
      en_camino,
      con_problema,
      tiempo_promedio_min: tiemposResult[0]?.promedio ? Math.round(Number(tiemposResult[0].promedio)) : 0,
      por_repartidor: porRepartidor.map((r: any) => ({
        repartidor_id: r.repartidor_id,
        repartidor_nombre: r.repartidor_nombre,
        total: Number(r.total),
        entregadas: Number(r.entregadas),
        con_problema: Number(r.con_problema),
      })),
    };
  }

  // ── Configuración ────────────────────────────────────────────────────

  async getConfig(scope: any): Promise<ConfigLogistica> {
    let config = await this.configRepo.findOne({
      where: { empresa_id: scope.empresa_id, tenant_id: scope.tenant_id },
    });
    if (!config) {
      config = this.configRepo.create({
        empresa_id: scope.empresa_id,
        tenant_id: scope.tenant_id,
        modulo_habilitado: false,
        notif_whatsapp_enabled: false,
        msg_asignado: 'Tu pedido #{folio} ha sido asignado a un repartidor y saldrá pronto.',
        msg_en_camino: 'Tu pedido #{folio} ya va en camino 🚚',
        msg_entregado: '¡Tu pedido #{folio} fue entregado! Gracias por tu compra.',
        msg_con_problema: 'Hubo un problema con la entrega del pedido #{folio}. Te contactaremos pronto.',
      });
      await this.configRepo.save(config);
    }
    return config;
  }

  async upsertConfig(data: Partial<ConfigLogistica>, scope: any): Promise<ConfigLogistica> {
    const config = await this.getConfig(scope);
    const { empresa_id, tenant_id, id, created_at, updated_at, ...rest } = data as any;
    Object.assign(config, rest);
    return this.configRepo.save(config);
  }

  // ── Log de notificaciones ────────────────────────────────────────────

  async getLogNotif(scope: any, pedido_id?: number): Promise<LogNotifEntrega[]> {
    const where: any = { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id };
    if (pedido_id) where.pedido_id = pedido_id;
    return this.logRepo.find({ where, order: { created_at: 'DESC' }, take: 100 });
  }

  private async registrarLogNotif(entrega: EntregaPedido, scope: any): Promise<void> {
    try {
      const config = await this.getConfig(scope);
      const templates: Record<string, string> = {
        [EstadoEntrega.ASIGNADO]: config.msg_asignado || '',
        [EstadoEntrega.EN_CAMINO]: config.msg_en_camino || '',
        [EstadoEntrega.ENTREGADO]: config.msg_entregado || '',
        [EstadoEntrega.CON_PROBLEMA]: config.msg_con_problema || '',
      };
      const mensaje = (templates[entrega.estado] || '').replace('#{folio}', entrega.pedido_folio);
      const log = this.logRepo.create({
        tenant_id: entrega.tenant_id,
        empresa_id: entrega.empresa_id,
        pedido_id: entrega.pedido_id,
        pedido_folio: entrega.pedido_folio,
        estado_entrega: entrega.estado,
        destinatario: (entrega.cliente_telefono || null) as any,
        mensaje,
        status: config.notif_whatsapp_enabled && entrega.cliente_telefono ? 'pendiente' : 'omitido',
      });
      await this.logRepo.save(log);
      // TODO Fase 2: if (log.status === 'pendiente') { await this.enviarWhatsapp(log, config); }
    } catch (err) {
      console.error('[LogisticaService] registrarLogNotif error:', err);
    }
  }
}
