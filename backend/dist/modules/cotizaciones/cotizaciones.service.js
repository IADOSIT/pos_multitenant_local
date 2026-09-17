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
const pedidos_service_1 = require("../pedidos/pedidos.service");
const pedido_entity_1 = require("../pedidos/pedido.entity");
const VIGENCIA_DEFAULT = 15;
let CotizacionesService = class CotizacionesService {
    constructor(cotRepo, verRepo, configRepo, pedidosService) {
        this.cotRepo = cotRepo;
        this.verRepo = verRepo;
        this.configRepo = configRepo;
        this.pedidosService = pedidosService;
    }
    async listar(scope, filtros = {}) {
        const base = { empresa_id: scope.empresa_id, tenant_id: scope.tenant_id };
        if (filtros.estado)
            base.estado = filtros.estado;
        const rango = this.rangoFechas(filtros.desde, filtros.hasta);
        if (rango)
            base.created_at = rango;
        const where = filtros.q
            ? [
                { ...base, numero: (0, typeorm_2.Like)(`%${filtros.q}%`) },
                { ...base, cliente_nombre: (0, typeorm_2.Like)(`%${filtros.q}%`) },
            ]
            : base;
        return this.cotRepo.find({ where, order: { created_at: 'DESC' }, take: 200 });
    }
    rangoFechas(desde, hasta) {
        const hastaExclusivo = hasta ? this.finDelDia(hasta) : null;
        if (desde && hastaExclusivo)
            return (0, typeorm_2.And)((0, typeorm_2.MoreThanOrEqual)(desde), (0, typeorm_2.LessThan)(hastaExclusivo));
        if (desde)
            return (0, typeorm_2.MoreThanOrEqual)(desde);
        if (hastaExclusivo)
            return (0, typeorm_2.LessThan)(hastaExclusivo);
        return null;
    }
    finDelDia(fecha) {
        const d = new Date(`${fecha}T00:00:00.000Z`);
        d.setUTCDate(d.getUTCDate() + 1);
        return d.toISOString().slice(0, 10);
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
        const { cotizacion: cotizacionGuardada, version } = await this.cotRepo.manager.transaction(async (manager) => {
            const version = await manager.save(cotizacion_version_entity_1.CotizacionVersion, {
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
            });
            cotizacion.estado = 'enviada';
            cotizacion.version_actual = version.version;
            cotizacion.tienda_id = tienda_id;
            const cotizacionGuardada = await manager.save(cotizacion_entity_1.Cotizacion, cotizacion);
            return { cotizacion: cotizacionGuardada, version };
        });
        return { cotizacion: cotizacionGuardada, version };
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
    async materializarPedido(id) {
        const c = await this.cotRepo.findOne({ where: { id } });
        if (!c)
            throw new common_1.NotFoundException('Cotización no encontrada');
        if (c.pedido_id) {
            return { pedido_id: c.pedido_id, folio: '' };
        }
        if (c.estado !== 'aceptada') {
            throw new common_1.BadRequestException('Solo se materializa una cotización aceptada');
        }
        if (!c.tienda_id) {
            throw new common_1.BadRequestException('La cotización no tiene tienda asignada');
        }
        const version = await this.verRepo.findOne({
            where: { cotizacion_id: c.id, version: c.version_actual },
        });
        if (!version)
            throw new common_1.BadRequestException('La cotización no tiene versión vigente');
        const pedido = await this.pedidosService.crear({
            mesa: 0,
            subtotal: version.subtotal,
            descuento: version.descuento,
            impuestos: 0,
            total: version.total,
            notas: `Cotización ${c.numero}${c.notas_cliente ? ' | ' + c.notas_cliente : ''}`,
            cliente_nombre: c.cliente_nombre,
            cliente_telefono: c.cliente_tel,
            cliente_direccion: (0, cotizacion_logic_1.direccionPlana)(c.direccion_envio),
            cliente_email: c.cliente_email,
            cliente_empresa: c.cliente_empresa,
            tipo_servicio: 'para_llevar',
            estado: pedido_entity_1.PedidoEstado.LISTO_PARA_ENTREGA,
            cotizacion_id: c.id,
            items: (version.items || []).map((it) => ({
                producto_id: it.producto_id,
                nombre: it.nombre,
                sku: it.sku,
                cantidad: Number(it.qty || 0),
                precio: Number(it.precio_unitario || 0),
            })),
        }, {
            tenant_id: c.tenant_id,
            empresa_id: c.empresa_id,
            tienda_id: c.tienda_id,
            nombre: 'Tienda en línea',
        });
        c.pedido_id = pedido.id;
        await this.cotRepo.save(c);
        return { pedido_id: pedido.id, folio: pedido.folio };
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
        typeorm_2.Repository,
        pedidos_service_1.PedidosService])
], CotizacionesService);
//# sourceMappingURL=cotizaciones.service.js.map