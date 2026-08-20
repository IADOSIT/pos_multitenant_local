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
var EmpresasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpresasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const empresa_entity_1 = require("./empresa.entity");
const tipo_cambio_historial_entity_1 = require("./tipo-cambio-historial.entity");
const user_entity_1 = require("../users/user.entity");
let EmpresasService = EmpresasService_1 = class EmpresasService {
    constructor(repo, historialRepo, dataSource) {
        this.repo = repo;
        this.historialRepo = historialRepo;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(EmpresasService_1.name);
    }
    async migrarStockPorTienda(empresa_id) {
        const productos = await this.dataSource.query('SELECT id, stock_actual FROM productos WHERE empresa_id = ? AND controla_stock = 1', [empresa_id]);
        if (!productos.length)
            return;
        const tiendas = await this.dataSource.query('SELECT id FROM tiendas WHERE empresa_id = ?', [empresa_id]);
        if (!tiendas.length)
            return;
        for (const prod of productos) {
            for (const tienda of tiendas) {
                const [existing] = await this.dataSource.query('SELECT id FROM producto_tienda WHERE producto_id = ? AND tienda_id = ?', [prod.id, tienda.id]);
                if (existing)
                    continue;
                await this.dataSource.query(`INSERT INTO producto_tienda (tenant_id, tienda_id, producto_id, stock, disponible)
           SELECT p.tenant_id, ?, p.id, ?, 1 FROM productos p WHERE p.id = ?`, [tienda.id, prod.stock_actual, prod.id]);
            }
        }
        this.logger.log(`Inventario compartido activado: stock sembrado para empresa ${empresa_id} (${productos.length} productos x ${tiendas.length} tiendas)`);
    }
    async actualizarTiposCambioAutomaticos() {
        const token = process.env.BANXICO_TOKEN;
        if (!token)
            return;
        const empresas = await this.findEmpresasConTipoCambioAutomatico();
        if (empresas.length === 0)
            return;
        let tipoCambio = null;
        try {
            const res = await fetch(`https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno?token=${token}`, { headers: { Accept: 'application/json' } });
            if (!res.ok)
                throw new Error(`Banxico respondio ${res.status}`);
            const json = await res.json();
            const dato = json?.bmx?.series?.[0]?.datos?.[0]?.dato;
            tipoCambio = dato ? parseFloat(String(dato).replace(/,/g, '')) : null;
        }
        catch (err) {
            this.logger.warn(`No se pudo obtener el tipo de cambio de Banxico: ${err}`);
            return;
        }
        if (!tipoCambio || Number.isNaN(tipoCambio))
            return;
        for (const empresa of empresas) {
            await this.actualizarTipoCambioAutomatico(empresa.id, tipoCambio);
        }
    }
    findAll(scope) {
        const where = {};
        if (scope.rol !== user_entity_1.UserRole.SUPERADMIN)
            where.tenant_id = scope.tenant_id;
        return this.repo.find({ where, relations: ['tiendas'], order: { nombre: 'ASC' } });
    }
    findOne(id) {
        return this.repo.findOne({ where: { id }, relations: ['tiendas'] });
    }
    create(data) {
        return this.repo.save(this.repo.create(data));
    }
    async update(id, data) {
        const { id: _id, created_at, updated_at, tiendas, ...clean } = data;
        await this.repo.update(id, clean);
        return this.findOne(id);
    }
    async remove(id) {
        await this.repo.delete(id);
        return { deleted: true };
    }
    async setConfigEspecial(id, data, scope) {
        const where = { id };
        if (scope.rol !== user_entity_1.UserRole.SUPERADMIN)
            where.tenant_id = scope.tenant_id;
        const empresa = await this.repo.findOne({ where });
        if (!empresa)
            throw new common_1.NotFoundException('Empresa no encontrada');
        const { empleados_enabled, ...rest } = data;
        const safeData = scope.rol === user_entity_1.UserRole.SUPERADMIN ? data : rest;
        const activandoInventarioCompartido = safeData.inventario_compartido === true && empresa.config_especial?.inventario_compartido !== true;
        const tipoCambioAnterior = empresa.config_especial?.moneda?.tipo_cambio_actual;
        let registrarHistorialManual = null;
        if (safeData.moneda) {
            const m = safeData.moneda;
            if (m.modo_tipo_cambio === 'manual' && typeof m.tipo_cambio_manual === 'number') {
                m.tipo_cambio_actual = m.tipo_cambio_manual;
                if (m.tipo_cambio_manual !== tipoCambioAnterior) {
                    registrarHistorialManual = { codigo: m.codigo || empresa.config_especial?.moneda?.codigo || 'USD', tipo_cambio: m.tipo_cambio_manual };
                }
            }
        }
        empresa.config_especial = {
            ...(empresa.config_especial || {}),
            ...safeData,
            ...(safeData.moneda ? { moneda: { ...(empresa.config_especial?.moneda || {}), ...safeData.moneda } } : {}),
        };
        const saved = await this.repo.save(empresa);
        if (activandoInventarioCompartido) {
            await this.migrarStockPorTienda(id);
        }
        if (registrarHistorialManual) {
            await this.historialRepo.save(this.historialRepo.create({
                empresa_id: id,
                codigo: registrarHistorialManual.codigo,
                tipo_cambio: registrarHistorialManual.tipo_cambio,
                origen: 'manual',
            }));
        }
        return { config_especial: saved.config_especial };
    }
    async actualizarTipoCambioAutomatico(empresa_id, tipo_cambio) {
        const empresa = await this.repo.findOne({ where: { id: empresa_id } });
        if (!empresa)
            return;
        const codigo = empresa.config_especial?.moneda?.codigo || 'USD';
        empresa.config_especial = {
            ...(empresa.config_especial || {}),
            moneda: {
                ...(empresa.config_especial?.moneda || {}),
                tipo_cambio_actual: tipo_cambio,
                tipo_cambio_actualizado_at: new Date().toISOString(),
            },
        };
        await this.repo.save(empresa);
        await this.historialRepo.save(this.historialRepo.create({ empresa_id, codigo, tipo_cambio, origen: 'automatico' }));
    }
    async getHistorialTipoCambio(empresa_id, periodo) {
        let periodoExpr;
        let dias;
        switch (periodo) {
            case 'semana':
                periodoExpr = "DATE_FORMAT(created_at, '%x-W%v')";
                dias = 7 * 26;
                break;
            case 'mes':
                periodoExpr = "DATE_FORMAT(created_at, '%Y-%m')";
                dias = 366 * 2;
                break;
            case 'anio':
                periodoExpr = "DATE_FORMAT(created_at, '%Y')";
                dias = 366 * 6;
                break;
            case 'dia':
            default:
                periodoExpr = "DATE_FORMAT(created_at, '%Y-%m-%d')";
                dias = 60;
                break;
        }
        const rows = await this.dataSource.query(`SELECT ${periodoExpr} AS periodo, AVG(tipo_cambio) AS tipo_cambio, MAX(created_at) AS fecha
       FROM tipo_cambio_historial
       WHERE empresa_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY periodo
       ORDER BY fecha ASC`, [empresa_id, dias]);
        return rows.map((r) => ({ periodo: r.periodo, tipo_cambio: parseFloat(r.tipo_cambio), fecha: r.fecha }));
    }
    async findEmpresasConTipoCambioAutomatico() {
        const todas = await this.repo.find();
        return todas.filter((e) => e.config_especial?.moneda?.activa && e.config_especial?.moneda?.modo_tipo_cambio === 'automatico');
    }
    async getConfigEspecial(empresa_id) {
        const empresa = await this.repo.findOne({ where: { id: empresa_id } });
        const cfg = empresa?.config_especial || {};
        return {
            mostrar_precios: cfg.mostrar_precios !== false,
            precio_manual: cfg.precio_manual === true,
            notif_cliente_estados: cfg.notif_cliente_estados === true,
            inventario_compartido: cfg.inventario_compartido === true,
            transferencias_activo: cfg.transferencias_activo === true,
            moneda: {
                activa: cfg.moneda?.activa === true,
                codigo: cfg.moneda?.codigo || 'USD',
                tipo_cambio_actual: cfg.moneda?.tipo_cambio_actual || 0,
                modo_visualizacion: cfg.moneda?.modo_visualizacion || 'ambas',
            },
        };
    }
};
exports.EmpresasService = EmpresasService;
__decorate([
    (0, schedule_1.Cron)('0 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmpresasService.prototype, "actualizarTiposCambioAutomaticos", null);
exports.EmpresasService = EmpresasService = EmpresasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(empresa_entity_1.Empresa)),
    __param(1, (0, typeorm_1.InjectRepository)(tipo_cambio_historial_entity_1.TipoCambioHistorial)),
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], EmpresasService);
//# sourceMappingURL=empresas.service.js.map