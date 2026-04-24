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
exports.WorkerPollService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const menu_digital_config_entity_1 = require("../menu-digital/entities/menu-digital-config.entity");
const self_order_service_1 = require("./self-order.service");
let WorkerPollService = class WorkerPollService {
    constructor(cfgRepo, selfOrderService, dataSource) {
        this.cfgRepo = cfgRepo;
        this.selfOrderService = selfOrderService;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger('WorkerPollService');
        this.timer = null;
        this.polling = false;
    }
    onModuleInit() {
        this.timer = setInterval(() => this.poll(), 3000);
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    async poll() {
        if (this.polling)
            return;
        this.polling = true;
        try {
            const configs = await this.cfgRepo.find({ where: { is_active: true } });
            for (const cfg of configs) {
                if (!cfg.worker_url || !cfg.api_key)
                    continue;
                await this.pollOne(cfg);
            }
        }
        catch (e) {
            this.logger.error('Error en ciclo de polling: ' + e.message);
        }
        finally {
            this.polling = false;
        }
    }
    async pollOne(cfg) {
        const base = cfg.worker_url.replace(/\/$/, '');
        const slugsToPoll = new Set([cfg.slug]);
        try {
            const [tienda] = await this.dataSource.query('SELECT slug FROM tiendas WHERE id = ?', [cfg.tienda_id]);
            if (tienda?.slug && tienda.slug !== cfg.slug) {
                slugsToPoll.add(tienda.slug);
            }
        }
        catch { }
        for (const slug of slugsToPoll) {
            await this.pollSlug(cfg, base, slug);
        }
    }
    async pollSlug(cfg, base, slug) {
        let orders;
        try {
            const res = await fetch(`${base}/orders/${slug}`, {
                headers: { 'x-api-key': cfg.api_key },
            });
            if (!res.ok)
                return;
            orders = await res.json();
        }
        catch {
            return;
        }
        if (!orders?.length)
            return;
        for (const order of orders) {
            try {
                const body = {
                    cliente_nombre: order.cliente_nombre || 'Cliente',
                    items: order.items,
                    subtotal: order.total,
                    total: order.total,
                    notas: order.notas || null,
                };
                await this.selfOrderService.crearPedidoCliente(cfg.tienda_id, order.mesa_numero, body);
                this.logger.log(`Pedido Worker recibido: mesa ${order.mesa_numero} tienda ${cfg.tienda_id} slug=${slug}`);
            }
            catch (e) {
                this.logger.warn(`No se pudo insertar pedido ${order.id} (slug=${slug}): ${e.message}`);
            }
            try {
                await fetch(`${base}/orders/${slug}/${order.id}/ack`, {
                    method: 'POST',
                    headers: { 'x-api-key': cfg.api_key },
                });
            }
            catch { }
        }
    }
};
exports.WorkerPollService = WorkerPollService;
exports.WorkerPollService = WorkerPollService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(menu_digital_config_entity_1.MenuDigitalConfig)),
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        self_order_service_1.SelfOrderService,
        typeorm_2.DataSource])
], WorkerPollService);
//# sourceMappingURL=worker-poll.service.js.map