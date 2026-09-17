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
exports.CotizacionesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cotizacion_entity_1 = require("./cotizacion.entity");
const cotizacion_version_entity_1 = require("./cotizacion-version.entity");
const ecommerce_config_entity_1 = require("../ecommerce/ecommerce-config.entity");
const cotizacion_logic_1 = require("./cotizacion.logic");
const VIGENCIA_DEFAULT = 15;
let CotizacionesService = class CotizacionesService {
    constructor(cotRepo, verRepo, configRepo) {
        this.cotRepo = cotRepo;
        this.verRepo = verRepo;
        this.configRepo = configRepo;
    }
    async listar(scope, filtros = {}) {
        const where = { empresa_id: scope.empresa_id, tenant_id: scope.tenant_id };
        if (filtros.estado)
            where.estado = filtros.estado;
        return this.cotRepo.find({ where, order: { created_at: 'DESC' }, take: 200 });
    }
    async buscar(scope, id) {
        const c = await this.cotRepo.findOne({
            where: { id, empresa_id: scope.empresa_id, tenant_id: scope.tenant_id },
        });
        if (!c)
            throw new common_1.NotFoundException('Cotización no encontrada');
        return c;
    }
    async detalle(scope, id) {
        const cotizacion = await this.buscar(scope, id);
        const versiones = await this.verRepo.find({
            where: { cotizacion_id: cotizacion.id },
            order: { version: 'ASC' },
        });
        return { cotizacion, versiones };
    }
    async cotizar(scope, id, dto) {
        const cotizacion = await this.buscar(scope, id);
        if (!(0, cotizacion_logic_1.puedeCotizar)(cotizacion.estado)) {
            throw new common_1.BadRequestException(`Una cotización ${cotizacion.estado} no se puede cotizar`);
        }
        const tienda_id = dto.tienda_id || cotizacion.tienda_id || scope.tienda_id;
        if (!tienda_id) {
            throw new common_1.BadRequestException('Selecciona la tienda que cobrará la cotización');
        }
        const precios = new Map();
        for (const it of dto.items || []) {
            const precio = Number(it.precio_unitario);
            if (!Number.isFinite(precio) || precio < 0) {
                throw new common_1.BadRequestException('Precio invalido en la cotización');
            }
            precios.set(Number(it.producto_id), precio);
        }
        const base = await this.itemsBase(cotizacion);
        const descuento = Number(dto.descuento || 0);
        const { items, subtotal, total } = (0, cotizacion_logic_1.calcularTotales)(base, precios, descuento);
        if (!items.length)
            throw new common_1.BadRequestException('La cotización no tiene productos');
        if (subtotal <= 0)
            throw new common_1.BadRequestException('Captura al menos un precio mayor a cero');
        const dias = Number(dto.vigencia_dias || (await this.vigenciaDeTienda(cotizacion)) || VIGENCIA_DEFAULT);
        const ahora = new Date();
        const version = await this.verRepo.save(this.verRepo.create({
            cotizacion_id: cotizacion.id,
            version: cotizacion.version_actual + 1,
            items,
            subtotal,
            descuento,
            total,
            vigencia_hasta: (0, cotizacion_logic_1.vigenciaHasta)(ahora, dias),
            mensaje_cliente: dto.mensaje_cliente || null,
            enviada_at: ahora,
            respuesta: null,
            respuesta_motivo: null,
            respondida_at: null,
            respondida_ip: null,
        }));
        cotizacion.estado = 'enviada';
        cotizacion.version_actual = version.version;
        cotizacion.tienda_id = tienda_id;
        await this.cotRepo.save(cotizacion);
        return { cotizacion, version };
    }
    async itemsBase(c) {
        const ultima = await this.verRepo.findOne({
            where: { cotizacion_id: c.id },
            order: { version: 'DESC' },
        });
        return ultima?.items || [];
    }
    async vigenciaDeTienda(c) {
        const config = await this.configRepo.findOne({ where: { empresa_id: c.empresa_id } });
        const dias = Number(config?.preferencias?.cotizaciones?.vigencia_dias || 0);
        return dias > 0 ? dias : null;
    }
    async cerrar(scope, id, motivo) {
        const c = await this.buscar(scope, id);
        if (c.estado === 'aceptada') {
            throw new common_1.BadRequestException('Una cotización aceptada ya generó su pedido');
        }
        c.estado = 'cerrada';
        c.motivo_cierre = motivo || null;
        return this.cotRepo.save(c);
    }
    async actualizarNotas(scope, id, notas_internas) {
        const c = await this.buscar(scope, id);
        c.notas_internas = notas_internas;
        return this.cotRepo.save(c);
    }
};
exports.CotizacionesService = CotizacionesService;
exports.CotizacionesService = CotizacionesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cotizacion_entity_1.Cotizacion)),
    __param(1, (0, typeorm_1.InjectRepository)(cotizacion_version_entity_1.CotizacionVersion)),
    __param(2, (0, typeorm_1.InjectRepository)(ecommerce_config_entity_1.EcommerceConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CotizacionesService);
//# sourceMappingURL=cotizaciones.service.js.map