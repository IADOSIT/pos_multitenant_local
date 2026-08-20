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
exports.TransferenciasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transferencia_entity_1 = require("./transferencia.entity");
const producto_entity_1 = require("../productos/producto.entity");
const empresas_service_1 = require("../empresas/empresas.service");
function generarFolio() {
    return `TR-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
let TransferenciasService = class TransferenciasService {
    constructor(repo, prodRepo, dataSource, empresasService) {
        this.repo = repo;
        this.prodRepo = prodRepo;
        this.dataSource = dataSource;
        this.empresasService = empresasService;
    }
    async verificarHabilitado(empresa_id) {
        const { inventario_compartido, transferencias_activo } = await this.empresasService.getConfigEspecial(empresa_id);
        if (!inventario_compartido || !transferencias_activo) {
            throw new common_1.BadRequestException('Las transferencias entre tiendas no estan habilitadas para esta empresa');
        }
    }
    async crear(data, scope) {
        await this.verificarHabilitado(scope.empresa_id);
        if (!scope.tienda_id)
            throw new common_1.BadRequestException('Selecciona una tienda de origen');
        if (Number(data.tienda_destino_id) === Number(scope.tienda_id)) {
            throw new common_1.BadRequestException('La tienda destino debe ser distinta a la tienda origen');
        }
        const cantidad = Number(data.cantidad);
        if (!cantidad || cantidad <= 0)
            throw new common_1.BadRequestException('Cantidad invalida');
        const [tiendaDestino] = await this.repo.manager.query('SELECT id, nombre FROM tiendas WHERE id = ? AND empresa_id = ? AND activo = 1', [data.tienda_destino_id, scope.empresa_id]);
        if (!tiendaDestino)
            throw new common_1.NotFoundException('Tienda destino no encontrada');
        const [tiendaOrigen] = await this.repo.manager.query('SELECT id, nombre FROM tiendas WHERE id = ?', [scope.tienda_id]);
        const producto = await this.prodRepo.findOne({ where: { id: data.producto_id, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id } });
        if (!producto)
            throw new common_1.NotFoundException('Producto no encontrado');
        return this.dataSource.transaction(async (manager) => {
            const [pt] = await manager.query('SELECT id, stock FROM producto_tienda WHERE producto_id = ? AND tienda_id = ? FOR UPDATE', [producto.id, scope.tienda_id]);
            const stockDisponible = Number(pt?.stock || 0);
            if (stockDisponible < cantidad) {
                throw new common_1.BadRequestException(`Stock insuficiente en esta tienda (disponible: ${stockDisponible})`);
            }
            const stockNuevo = stockDisponible - cantidad;
            await manager.query('UPDATE producto_tienda SET stock = ? WHERE id = ?', [stockNuevo, pt.id]);
            const folio = generarFolio();
            await manager.query(`INSERT INTO movimientos_inventario
          (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
           tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
         VALUES (?, ?, ?, ?, ?, ?, 'salida', ?, ?, ?, ?, ?, ?)`, [
                scope.tenant_id, scope.empresa_id, scope.tienda_id,
                producto.id, producto.nombre, producto.sku || '',
                cantidad, stockDisponible, stockNuevo,
                `Transferencia ${folio} a ${tiendaDestino.nombre}`,
                scope.id || scope.sub, scope.nombre || 'Sistema',
            ]);
            return manager.getRepository(transferencia_entity_1.TransferenciaInventario).save(manager.getRepository(transferencia_entity_1.TransferenciaInventario).create({
                tenant_id: scope.tenant_id,
                empresa_id: scope.empresa_id,
                tienda_origen_id: scope.tienda_id,
                tienda_origen_nombre: tiendaOrigen?.nombre || '',
                tienda_destino_id: data.tienda_destino_id,
                tienda_destino_nombre: tiendaDestino.nombre,
                folio,
                producto_id: producto.id,
                producto_nombre: producto.nombre,
                producto_sku: producto.sku || '',
                cantidad,
                notas: data.notas || undefined,
                estado: transferencia_entity_1.TransferenciaEstado.PENDIENTE,
                usuario_envio_id: scope.id || scope.sub,
                usuario_envio_nombre: scope.nombre || 'Sistema',
            }));
        });
    }
    listPendientesRecibir(scope) {
        return this.repo.find({
            where: { empresa_id: scope.empresa_id, tienda_destino_id: scope.tienda_id, estado: transferencia_entity_1.TransferenciaEstado.PENDIENTE },
            order: { created_at: 'ASC' },
        });
    }
    listEnviadas(scope) {
        return this.repo.find({
            where: { empresa_id: scope.empresa_id, tienda_origen_id: scope.tienda_id },
            order: { created_at: 'DESC' },
            take: 100,
        });
    }
    async buscarPorFolio(folio, scope) {
        const t = await this.repo.findOne({ where: { folio, empresa_id: scope.empresa_id } });
        if (!t)
            throw new common_1.NotFoundException('No se encontro ninguna transferencia con ese folio');
        return t;
    }
    async recibir(id, scope) {
        const t = await this.repo.findOne({ where: { id, empresa_id: scope.empresa_id } });
        if (!t)
            throw new common_1.NotFoundException('Transferencia no encontrada');
        if (t.estado !== transferencia_entity_1.TransferenciaEstado.PENDIENTE)
            throw new common_1.BadRequestException('Esta transferencia ya fue procesada');
        const adminRoles = ['superadmin', 'admin', 'manager'];
        if (t.tienda_destino_id !== scope.tienda_id && !adminRoles.includes(scope.rol)) {
            throw new common_1.ForbiddenException('Esta transferencia se recibe en otra tienda');
        }
        return this.dataSource.transaction(async (manager) => {
            const [pt] = await manager.query('SELECT id, stock FROM producto_tienda WHERE producto_id = ? AND tienda_id = ? FOR UPDATE', [t.producto_id, t.tienda_destino_id]);
            const stockAnterior = Number(pt?.stock || 0);
            const stockNuevo = stockAnterior + Number(t.cantidad);
            if (pt) {
                await manager.query('UPDATE producto_tienda SET stock = ? WHERE id = ?', [stockNuevo, pt.id]);
            }
            else {
                await manager.query('INSERT INTO producto_tienda (tenant_id, tienda_id, producto_id, stock, disponible) VALUES (?, ?, ?, ?, 1)', [t.tenant_id, t.tienda_destino_id, t.producto_id, stockNuevo]);
            }
            await manager.query(`INSERT INTO movimientos_inventario
          (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
           tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
         VALUES (?, ?, ?, ?, ?, ?, 'entrada', ?, ?, ?, ?, ?, ?)`, [
                t.tenant_id, t.empresa_id, t.tienda_destino_id,
                t.producto_id, t.producto_nombre, t.producto_sku || '',
                Number(t.cantidad), stockAnterior, stockNuevo,
                `Transferencia recibida ${t.folio} de ${t.tienda_origen_nombre}`,
                scope.id || scope.sub, scope.nombre || 'Sistema',
            ]);
            t.estado = transferencia_entity_1.TransferenciaEstado.RECIBIDO;
            t.usuario_recibio_id = scope.id || scope.sub;
            t.usuario_recibio_nombre = scope.nombre || 'Sistema';
            t.recibido_at = new Date();
            return manager.getRepository(transferencia_entity_1.TransferenciaInventario).save(t);
        });
    }
    async cancelar(id, motivo, scope) {
        const t = await this.repo.findOne({ where: { id, empresa_id: scope.empresa_id } });
        if (!t)
            throw new common_1.NotFoundException('Transferencia no encontrada');
        if (t.estado !== transferencia_entity_1.TransferenciaEstado.PENDIENTE)
            throw new common_1.BadRequestException('Esta transferencia ya fue procesada');
        const adminRoles = ['superadmin', 'admin', 'manager'];
        if (t.tienda_origen_id !== scope.tienda_id && !adminRoles.includes(scope.rol)) {
            throw new common_1.ForbiddenException('Solo la tienda que envio la transferencia puede cancelarla');
        }
        return this.dataSource.transaction(async (manager) => {
            const [pt] = await manager.query('SELECT id, stock FROM producto_tienda WHERE producto_id = ? AND tienda_id = ? FOR UPDATE', [t.producto_id, t.tienda_origen_id]);
            const stockAnterior = Number(pt?.stock || 0);
            const stockNuevo = stockAnterior + Number(t.cantidad);
            if (pt) {
                await manager.query('UPDATE producto_tienda SET stock = ? WHERE id = ?', [stockNuevo, pt.id]);
            }
            else {
                await manager.query('INSERT INTO producto_tienda (tenant_id, tienda_id, producto_id, stock, disponible) VALUES (?, ?, ?, ?, 1)', [t.tenant_id, t.tienda_origen_id, t.producto_id, stockNuevo]);
            }
            await manager.query(`INSERT INTO movimientos_inventario
          (tenant_id, empresa_id, tienda_id, producto_id, producto_nombre, producto_sku,
           tipo, cantidad, stock_anterior, stock_nuevo, concepto, usuario_id, usuario_nombre)
         VALUES (?, ?, ?, ?, ?, ?, 'entrada', ?, ?, ?, ?, ?, ?)`, [
                t.tenant_id, t.empresa_id, t.tienda_origen_id,
                t.producto_id, t.producto_nombre, t.producto_sku || '',
                Number(t.cantidad), stockAnterior, stockNuevo,
                `Cancelacion transferencia ${t.folio}: ${motivo || 'sin motivo'}`,
                scope.id || scope.sub, scope.nombre || 'Sistema',
            ]);
            t.estado = transferencia_entity_1.TransferenciaEstado.CANCELADO;
            return manager.getRepository(transferencia_entity_1.TransferenciaInventario).save(t);
        });
    }
};
exports.TransferenciasService = TransferenciasService;
exports.TransferenciasService = TransferenciasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transferencia_entity_1.TransferenciaInventario)),
    __param(1, (0, typeorm_1.InjectRepository)(producto_entity_1.Producto)),
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        empresas_service_1.EmpresasService])
], TransferenciasService);
//# sourceMappingURL=transferencias.service.js.map