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
exports.ApartadosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const apartado_entity_1 = require("./apartado.entity");
let ApartadosService = class ApartadosService {
    constructor(repo, dataSource) {
        this.repo = repo;
        this.dataSource = dataSource;
    }
    async crearDentroDeTransaccion(manager, data) {
        return manager.getRepository(apartado_entity_1.ApartadoInventario).save(manager.getRepository(apartado_entity_1.ApartadoInventario).create({
            ...data,
            estado: apartado_entity_1.ApartadoEstado.PENDIENTE,
        }));
    }
    listPendientes(scope) {
        return this.repo.find({
            where: { empresa_id: scope.empresa_id, tienda_destino_id: scope.tienda_id, estado: apartado_entity_1.ApartadoEstado.PENDIENTE },
            order: { created_at: 'ASC' },
        });
    }
    async buscarPorFolio(folio, scope) {
        const apartado = await this.repo.findOne({ where: { folio, empresa_id: scope.empresa_id } });
        if (!apartado)
            throw new common_1.NotFoundException('No se encontro ningun apartado con ese folio');
        return apartado;
    }
    async entregar(id, scope) {
        const apartado = await this.repo.findOne({ where: { id, empresa_id: scope.empresa_id } });
        if (!apartado)
            throw new common_1.NotFoundException('Apartado no encontrado');
        if (apartado.estado !== apartado_entity_1.ApartadoEstado.PENDIENTE)
            throw new common_1.BadRequestException('Este apartado ya fue procesado');
        const adminRoles = ['superadmin', 'admin', 'manager'];
        if (apartado.tienda_destino_id !== scope.tienda_id && !adminRoles.includes(scope.rol)) {
            throw new common_1.ForbiddenException('Este apartado se entrega en otra tienda');
        }
        apartado.estado = apartado_entity_1.ApartadoEstado.ENTREGADO;
        apartado.usuario_entrego_id = scope.id || scope.sub;
        apartado.usuario_entrego_nombre = scope.nombre || 'Sistema';
        apartado.entregado_at = new Date();
        return this.repo.save(apartado);
    }
    async cancelar(id, motivo, scope) {
        const apartado = await this.repo.findOne({ where: { id, empresa_id: scope.empresa_id } });
        if (!apartado)
            throw new common_1.NotFoundException('Apartado no encontrado');
        if (apartado.estado !== apartado_entity_1.ApartadoEstado.PENDIENTE)
            throw new common_1.BadRequestException('Este apartado ya fue procesado');
        return this.dataSource.transaction(async (manager) => {
            const [pt] = await manager.query('SELECT id, stock FROM producto_tienda WHERE producto_id = ? AND tienda_id = ? FOR UPDATE', [apartado.producto_id, apartado.tienda_destino_id]);
            const stockAnterior = Number(pt?.stock || 0);
            const stockNuevo = stockAnterior + Number(apartado.cantidad);
            if (pt) {
                await manager.query('UPDATE producto_tienda SET stock = ? WHERE id = ?', [stockNuevo, pt.id]);
            }
            else {
                await manager.query('INSERT INTO producto_tienda (tenant_id, tienda_id, producto_id, stock, disponible) VALUES (?, ?, ?, ?, 1)', [apartado.tenant_id, apartado.tienda_destino_id, apartado.producto_id, stockNuevo]);
            }
            await manager.query(`INSERT INTO movimientos_inventario
          (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
           tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
         VALUES (?, ?, ?, ?, ?, '', 'entrada', ?, ?, ?, ?, ?, ?)`, [
                apartado.tenant_id, apartado.empresa_id, apartado.tienda_destino_id,
                apartado.producto_id, apartado.producto_nombre,
                Number(apartado.cantidad), stockAnterior, stockNuevo,
                `Cancelacion apartado ${apartado.folio}: ${motivo || 'sin motivo'}`,
                scope.id || scope.sub, scope.nombre || 'Sistema',
            ]);
            apartado.estado = apartado_entity_1.ApartadoEstado.CANCELADO;
            return manager.getRepository(apartado_entity_1.ApartadoInventario).save(apartado);
        });
    }
};
exports.ApartadosService = ApartadosService;
exports.ApartadosService = ApartadosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(apartado_entity_1.ApartadoInventario)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], ApartadosService);
//# sourceMappingURL=apartados.service.js.map