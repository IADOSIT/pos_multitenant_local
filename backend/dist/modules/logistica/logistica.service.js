"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const repartidor_entity_1 = require("./repartidor.entity");
const entrega_pedido_entity_1 = require("./entrega-pedido.entity");
const config_logistica_entity_1 = require("./config-logistica.entity");
const log_notif_entrega_entity_1 = require("./log-notif-entrega.entity");
const notificaciones_service_1 = require("../notificaciones/notificaciones.service");
let LogisticaService = class LogisticaService {
    constructor(repartidorRepo, entregaRepo, configRepo, logRepo, notificacionesService, dataSource) {
        this.repartidorRepo = repartidorRepo;
        this.entregaRepo = entregaRepo;
        this.configRepo = configRepo;
        this.logRepo = logRepo;
        this.notificacionesService = notificacionesService;
        this.dataSource = dataSource;
    }
    async getRepartidores(scope) {
        return this.repartidorRepo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
            order: { nombre: 'ASC' },
        });
    }
    async createRepartidor(data, scope) {
        const { v4: uuidv4 } = require('uuid');
        const rep = this.repartidorRepo.create({
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            nombre: data.nombre,
            telefono: data.telefono || null,
            token: uuidv4(),
            activo: true,
        });
        return this.repartidorRepo.save(rep);
    }
    async updateRepartidor(id, data, scope) {
        const rep = await this.repartidorRepo.findOne({
            where: { id, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
        });
        if (!rep)
            throw new common_1.NotFoundException('Repartidor no encontrado');
        if (data.nombre !== undefined)
            rep.nombre = data.nombre;
        if (data.telefono !== undefined)
            rep.telefono = data.telefono;
        return this.repartidorRepo.save(rep);
    }
    async toggleRepartidor(id, scope) {
        const rep = await this.repartidorRepo.findOne({
            where: { id, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
        });
        if (!rep)
            throw new common_1.NotFoundException('Repartidor no encontrado');
        rep.activo = !rep.activo;
        return this.repartidorRepo.save(rep);
    }
    async asignarRepartidor(pedido_id, repartidor_id, scope) {
        const rows = await this.dataSource.query('SELECT * FROM pedidos WHERE id = ? AND tenant_id = ?', [pedido_id, scope.tenant_id]);
        if (!rows || rows.length === 0)
            throw new common_1.NotFoundException('Pedido no encontrado');
        const pedido = rows[0];
        const repartidor = await this.repartidorRepo.findOne({
            where: { id: repartidor_id, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true },
        });
        if (!repartidor)
            throw new common_1.NotFoundException('Repartidor no encontrado o inactivo');
        const existente = await this.entregaRepo.findOne({
            where: [
                { pedido_id, tenant_id: scope.tenant_id, estado: entrega_pedido_entity_1.EstadoEntrega.ASIGNADO },
                { pedido_id, tenant_id: scope.tenant_id, estado: entrega_pedido_entity_1.EstadoEntrega.EN_CAMINO },
            ],
        });
        if (existente)
            throw new common_1.BadRequestException('Este pedido ya tiene una entrega asignada');
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
            estado: entrega_pedido_entity_1.EstadoEntrega.ASIGNADO,
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
    async updateEstadoEntrega(entrega_id, estado, notas, scope) {
        const entrega = await this.entregaRepo.findOne({
            where: { id: entrega_id, tenant_id: scope.tenant_id },
        });
        if (!entrega)
            throw new common_1.NotFoundException('Entrega no encontrada');
        const allowed = {
            asignado: [entrega_pedido_entity_1.EstadoEntrega.EN_CAMINO, entrega_pedido_entity_1.EstadoEntrega.CON_PROBLEMA],
            en_camino: [entrega_pedido_entity_1.EstadoEntrega.ENTREGADO, entrega_pedido_entity_1.EstadoEntrega.CON_PROBLEMA],
            con_problema: [entrega_pedido_entity_1.EstadoEntrega.EN_CAMINO, entrega_pedido_entity_1.EstadoEntrega.ASIGNADO],
        };
        if (!allowed[entrega.estado]?.includes(estado)) {
            throw new common_1.BadRequestException(`No se puede pasar de ${entrega.estado} a ${estado}`);
        }
        entrega.estado = estado;
        if (notas)
            entrega.notas_repartidor = notas;
        if (estado === entrega_pedido_entity_1.EstadoEntrega.ENTREGADO)
            entrega.entregado_at = new Date();
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
    async updateEstadoByToken(token, entrega_id, estado, notas) {
        const repartidor = await this.repartidorRepo.findOne({ where: { token, activo: true } });
        if (!repartidor)
            throw new common_1.UnauthorizedException('Token inválido');
        const entrega = await this.entregaRepo.findOne({
            where: { id: entrega_id, repartidor_id: repartidor.id },
        });
        if (!entrega)
            throw new common_1.NotFoundException('Entrega no encontrada');
        const scope = { tenant_id: repartidor.tenant_id, empresa_id: repartidor.empresa_id };
        return this.updateEstadoEntrega(entrega_id, estado, notas, scope);
    }
    async getRepartidorByToken(token) {
        const repartidor = await this.repartidorRepo.findOne({ where: { token, activo: true } });
        if (!repartidor)
            throw new common_1.NotFoundException('Token inválido o repartidor inactivo');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const todas = await this.entregaRepo.find({
            where: { repartidor_id: repartidor.id },
            order: { created_at: 'DESC' },
            take: 100,
        });
        const entregas = todas.filter((e) => {
            const esDeHoy = new Date(e.created_at) >= hoy;
            const esActiva = e.estado === entrega_pedido_entity_1.EstadoEntrega.ASIGNADO || e.estado === entrega_pedido_entity_1.EstadoEntrega.EN_CAMINO;
            return esDeHoy || esActiva;
        });
        return { repartidor, entregas };
    }
    async getEntregas(scope, params) {
        const where = { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id };
        if (params.estado)
            where.estado = params.estado;
        if (params.repartidor_id)
            where.repartidor_id = Number(params.repartidor_id);
        if (params.desde && params.hasta) {
            where.created_at = (0, typeorm_2.Between)(new Date(params.desde), new Date(params.hasta));
        }
        return this.entregaRepo.find({ where, order: { created_at: 'DESC' }, take: 200 });
    }
    async getEntregaByPedido(pedido_id, scope) {
        return this.entregaRepo.findOne({
            where: { pedido_id, tenant_id: scope.tenant_id },
            order: { created_at: 'DESC' },
        });
    }
    async getMetricas(scope, desde, hasta) {
        const desdeDate = desde ? new Date(desde) : new Date(new Date().setDate(new Date().getDate() - 7));
        const hastaDate = hasta ? new Date(hasta) : new Date();
        const whereBase = {
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            created_at: (0, typeorm_2.Between)(desdeDate, hastaDate),
        };
        const [total, entregadas, en_camino, con_problema] = await Promise.all([
            this.entregaRepo.count({ where: whereBase }),
            this.entregaRepo.count({ where: { ...whereBase, estado: entrega_pedido_entity_1.EstadoEntrega.ENTREGADO } }),
            this.entregaRepo.count({ where: { ...whereBase, estado: entrega_pedido_entity_1.EstadoEntrega.EN_CAMINO } }),
            this.entregaRepo.count({ where: { ...whereBase, estado: entrega_pedido_entity_1.EstadoEntrega.CON_PROBLEMA } }),
        ]);
        const porRepartidor = await this.dataSource.query(`SELECT
         repartidor_id,
         repartidor_nombre,
         COUNT(*) AS total,
         SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) AS entregadas,
         SUM(CASE WHEN estado = 'con_problema' THEN 1 ELSE 0 END) AS con_problema
       FROM entregas_pedido
       WHERE tenant_id = ? AND empresa_id = ?
         AND created_at BETWEEN ? AND ?
       GROUP BY repartidor_id, repartidor_nombre
       ORDER BY entregadas DESC`, [scope.tenant_id, scope.empresa_id, desdeDate, hastaDate]);
        const tiemposResult = await this.dataSource.query(`SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, entregado_at)) AS promedio
       FROM entregas_pedido
       WHERE tenant_id = ? AND empresa_id = ?
         AND estado = 'entregado' AND entregado_at IS NOT NULL
         AND created_at BETWEEN ? AND ?`, [scope.tenant_id, scope.empresa_id, desdeDate, hastaDate]);
        return {
            total,
            entregadas,
            en_camino,
            con_problema,
            tiempo_promedio_min: tiemposResult[0]?.promedio ? Math.round(Number(tiemposResult[0].promedio)) : 0,
            por_repartidor: porRepartidor.map((r) => ({
                repartidor_id: r.repartidor_id,
                repartidor_nombre: r.repartidor_nombre,
                total: Number(r.total),
                entregadas: Number(r.entregadas),
                con_problema: Number(r.con_problema),
            })),
        };
    }
    async getConfig(scope) {
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
    async upsertConfig(data, scope) {
        const config = await this.getConfig(scope);
        const { empresa_id, tenant_id, id, created_at, updated_at, ...rest } = data;
        Object.assign(config, rest);
        return this.configRepo.save(config);
    }
    async getLogNotif(scope, pedido_id) {
        const where = { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id };
        if (pedido_id)
            where.pedido_id = pedido_id;
        return this.logRepo.find({ where, order: { created_at: 'DESC' }, take: 100 });
    }
    async registrarLogNotif(entrega, scope) {
        try {
            const config = await this.getConfig(scope);
            const templates = {
                [entrega_pedido_entity_1.EstadoEntrega.ASIGNADO]: config.msg_asignado || '',
                [entrega_pedido_entity_1.EstadoEntrega.EN_CAMINO]: config.msg_en_camino || '',
                [entrega_pedido_entity_1.EstadoEntrega.ENTREGADO]: config.msg_entregado || '',
                [entrega_pedido_entity_1.EstadoEntrega.CON_PROBLEMA]: config.msg_con_problema || '',
            };
            const mensaje = (templates[entrega.estado] || '').replace('#{folio}', entrega.pedido_folio);
            const log = this.logRepo.create({
                tenant_id: entrega.tenant_id,
                empresa_id: entrega.empresa_id,
                pedido_id: entrega.pedido_id,
                pedido_folio: entrega.pedido_folio,
                estado_entrega: entrega.estado,
                destinatario: (entrega.cliente_telefono || null),
                mensaje,
                status: config.notif_whatsapp_enabled && entrega.cliente_telefono ? 'pendiente' : 'omitido',
            });
            await this.logRepo.save(log);
        }
        catch (err) {
            console.error('[LogisticaService] registrarLogNotif error:', err);
        }
    }
};
exports.LogisticaService = LogisticaService;
exports.LogisticaService = LogisticaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(repartidor_entity_1.Repartidor)),
    __param(1, (0, typeorm_1.InjectRepository)(entrega_pedido_entity_1.EntregaPedido)),
    __param(2, (0, typeorm_1.InjectRepository)(config_logistica_entity_1.ConfigLogistica)),
    __param(3, (0, typeorm_1.InjectRepository)(log_notif_entrega_entity_1.LogNotifEntrega)),
    __param(5, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notificaciones_service_1.NotificacionesService,
        typeorm_2.DataSource])
], LogisticaService);
//# sourceMappingURL=logistica.service.js.map