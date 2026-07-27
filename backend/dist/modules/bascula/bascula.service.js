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
exports.BasculaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const config_bascula_entity_1 = require("./config-bascula.entity");
const pesaje_log_entity_1 = require("./pesaje-log.entity");
const ean13_util_1 = require("../../common/utils/ean13.util");
const bascula_gateway_1 = require("./bascula.gateway");
let BasculaService = class BasculaService {
    constructor(configRepo, logRepo, dataSource, gateway) {
        this.configRepo = configRepo;
        this.logRepo = logRepo;
        this.dataSource = dataSource;
        this.gateway = gateway;
        this.logger = new common_1.Logger('BasculaService');
    }
    async getOrCreateConfig(tiendaId, scope) {
        let config = await this.configRepo.findOne({ where: { tienda_id: tiendaId } });
        if (!config) {
            const [tienda] = await this.dataSource.query(`SELECT tenant_id, empresa_id FROM tiendas WHERE id = ?`, [tiendaId]);
            if (!tienda)
                throw new common_1.NotFoundException('Tienda no encontrada');
            const tenantId = scope.tenant_id ?? tienda.tenant_id;
            const empresaId = scope.empresa_id ?? tienda.empresa_id;
            config = this.configRepo.create({
                tienda_id: tiendaId,
                tenant_id: tenantId,
                empresa_id: empresaId,
                activo: false,
                usar_en_pos: false,
                tienda_token: (0, crypto_1.randomBytes)(24).toString('hex'),
            });
            config = await this.configRepo.save(config);
        }
        return config;
    }
    async updateConfig(tiendaId, dto, scope) {
        const config = await this.getOrCreateConfig(tiendaId, scope);
        const allowed = [
            'activo', 'usar_en_pos', 'printer_ip', 'printer_port', 'label_width_mm', 'label_height_mm',
            'scale_port', 'scale_baud_rate', 'scale_protocol',
        ];
        for (const key of allowed) {
            if (dto[key] !== undefined)
                config[key] = dto[key];
        }
        return this.configRepo.save(config);
    }
    async regenerateToken(tiendaId, scope) {
        const config = await this.getOrCreateConfig(tiendaId, scope);
        config.tienda_token = (0, crypto_1.randomBytes)(24).toString('hex');
        await this.configRepo.save(config);
        return { tienda_token: config.tienda_token };
    }
    async getProductosPorPeso(tiendaId, scope) {
        const [tienda] = await this.dataSource.query(`SELECT empresa_id FROM tiendas WHERE id = ?`, [tiendaId]);
        if (!tienda)
            throw new common_1.NotFoundException('Tienda no encontrada');
        return this.dataSource.query(`SELECT id, nombre, precio, imagen_url, categoria_id
       FROM productos
       WHERE empresa_id = ? AND unidad = 'kg' AND activo = 1 AND disponible = 1
       ORDER BY nombre ASC`, [tienda.empresa_id]);
    }
    async getProductoOrThrow(productoId) {
        const [producto] = await this.dataSource.query(`SELECT id, nombre, sku, precio, tenant_id, empresa_id FROM productos WHERE id = ?`, [productoId]);
        if (!producto)
            throw new common_1.NotFoundException('Producto no encontrado');
        return producto;
    }
    async registrarPesaje(dto, scope) {
        if (!dto.peso_kg || dto.peso_kg <= 0)
            throw new common_1.BadRequestException('Peso invalido');
        const config = await this.getOrCreateConfig(dto.tienda_id, scope);
        if (!config.activo)
            throw new common_1.BadRequestException('La bascula de autoservicio no esta activa en esta tienda');
        const producto = await this.getProductoOrThrow(dto.producto_id);
        const precioTotal = Math.round(dto.peso_kg * Number(producto.precio) * 100) / 100;
        const precioCentavos = Math.round(precioTotal * 100);
        const barcode = (0, ean13_util_1.generarBarcodeEan13)(producto.id, precioCentavos);
        const log = await this.logRepo.save(this.logRepo.create({
            tenant_id: config.tenant_id,
            empresa_id: config.empresa_id,
            tienda_id: dto.tienda_id,
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            peso_kg: dto.peso_kg,
            precio_total: precioTotal,
            barcode,
        }));
        this.gateway.emitPrintLabel(dto.tienda_id, {
            producto_nombre: producto.nombre,
            peso_kg: dto.peso_kg,
            precio_total: precioTotal,
            barcode,
            label_width_mm: config.label_width_mm,
            label_height_mm: config.label_height_mm,
            printer_ip: config.printer_ip,
            printer_port: config.printer_port,
        });
        this.logger.log(`Pesaje registrado: ${producto.nombre} ${dto.peso_kg}kg = $${precioTotal} (${barcode})`);
        return { producto_nombre: producto.nombre, peso_kg: dto.peso_kg, precio_total: precioTotal, barcode, log_id: log.id };
    }
};
exports.BasculaService = BasculaService;
exports.BasculaService = BasculaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(config_bascula_entity_1.ConfigBascula)),
    __param(1, (0, typeorm_1.InjectRepository)(pesaje_log_entity_1.PesajeLog)),
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        bascula_gateway_1.BasculaGateway])
], BasculaService);
//# sourceMappingURL=bascula.service.js.map