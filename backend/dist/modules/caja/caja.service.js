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
exports.CajaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const caja_entity_1 = require("./caja.entity");
const venta_entity_1 = require("../ventas/venta.entity");
const ecommerce_pedido_entity_1 = require("../ecommerce/ecommerce-pedido.entity");
let CajaService = class CajaService {
    constructor(cajaRepo, movRepo, ventaRepo, pedidoWebRepo) {
        this.cajaRepo = cajaRepo;
        this.movRepo = movRepo;
        this.ventaRepo = ventaRepo;
        this.pedidoWebRepo = pedidoWebRepo;
    }
    async abrir(data, scope) {
        const abierta = await this.cajaRepo.findOne({
            where: { tienda_id: scope.tienda_id, estado: caja_entity_1.CajaEstado.ABIERTA },
        });
        if (abierta)
            throw new common_1.BadRequestException('Ya hay una caja abierta en esta tienda');
        return this.cajaRepo.save(this.cajaRepo.create({
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
            usuario_id: scope.id || scope.sub,
            nombre: data.nombre || `Caja-${Date.now()}`,
            estado: caja_entity_1.CajaEstado.ABIERTA,
            fondo_apertura: data.fondo || 0,
            fecha_apertura: new Date(),
        }));
    }
    async cerrar(id, data, scope) {
        const caja = await this.cajaRepo.findOne({ where: { id, estado: caja_entity_1.CajaEstado.ABIERTA } });
        if (!caja)
            throw new common_1.BadRequestException('Caja no encontrada o ya cerrada');
        const ventas = await this.ventaRepo.find({
            where: { caja_id: id, estado: venta_entity_1.VentaEstado.COMPLETADA },
        });
        const efectivoNeto = ventas
            .filter(v => v.pago_efectivo)
            .reduce((s, v) => s + Number(v.pago_efectivo) - Number(v.cambio || 0), 0);
        caja.total_real = data.total_real || 0;
        caja.total_esperado = Number(caja.fondo_apertura) + efectivoNeto + Number(caja.total_entradas) - Number(caja.total_salidas);
        caja.diferencia = Number(caja.total_real) - Number(caja.total_esperado);
        caja.estado = caja_entity_1.CajaEstado.CERRADA;
        caja.fecha_cierre = new Date();
        caja.notas_cierre = data.notas || null;
        return this.cajaRepo.save(caja);
    }
    async movimiento(cajaId, data, scope) {
        const caja = await this.cajaRepo.findOne({ where: { id: cajaId, estado: caja_entity_1.CajaEstado.ABIERTA } });
        if (!caja)
            throw new common_1.BadRequestException('Caja no abierta');
        const mov = await this.movRepo.save(this.movRepo.create({
            caja_id: cajaId,
            usuario_id: scope.id || scope.sub,
            tipo: data.tipo,
            monto: data.monto,
            concepto: data.concepto,
            notas: data.notas,
        }));
        if (data.tipo === caja_entity_1.MovimientoCajaTipo.ENTRADA) {
            caja.total_entradas = Number(caja.total_entradas) + Number(data.monto);
        }
        else {
            caja.total_salidas = Number(caja.total_salidas) + Number(data.monto);
        }
        await this.cajaRepo.save(caja);
        return mov;
    }
    async corteX(id) {
        const caja = await this.cajaRepo.findOne({ where: { id }, relations: ['movimientos'] });
        if (!caja)
            throw new common_1.BadRequestException('Caja no encontrada');
        const ventas = await this.ventaRepo.find({
            where: { caja_id: id, estado: venta_entity_1.VentaEstado.COMPLETADA },
        });
        const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);
        const totalEfectivo = ventas.filter(v => v.pago_efectivo).reduce((sum, v) => sum + Number(v.pago_efectivo) - Number(v.cambio || 0), 0);
        const totalTarjeta = ventas.filter(v => v.pago_tarjeta).reduce((sum, v) => sum + Number(v.pago_tarjeta), 0);
        const totalTransferencia = ventas.filter(v => v.pago_transferencia).reduce((sum, v) => sum + Number(v.pago_transferencia), 0);
        return {
            caja,
            resumen: {
                num_ventas: ventas.length,
                total_ventas: totalVentas,
                total_efectivo: totalEfectivo,
                total_tarjeta: totalTarjeta,
                total_transferencia: totalTransferencia,
                total_entradas: caja.total_entradas,
                total_salidas: caja.total_salidas,
                esperado_en_caja: Number(caja.fondo_apertura) + totalEfectivo + Number(caja.total_entradas) - Number(caja.total_salidas),
            },
        };
    }
    async reporteCaja(id) {
        const caja = await this.cajaRepo.findOne({ where: { id }, relations: ['movimientos'] });
        if (!caja)
            throw new common_1.BadRequestException('Caja no encontrada');
        const ventas = await this.ventaRepo.find({
            where: { caja_id: id },
            relations: ['detalles'],
            order: { created_at: 'ASC' },
        });
        const completadas = ventas.filter(v => v.estado === venta_entity_1.VentaEstado.COMPLETADA);
        const canceladas = ventas.filter(v => v.estado === venta_entity_1.VentaEstado.CANCELADA);
        const totalVentas = completadas.reduce((s, v) => s + Number(v.total), 0);
        const totalEfectivo = completadas.filter(v => v.pago_efectivo).reduce((s, v) => s + Number(v.pago_efectivo) - Number(v.cambio || 0), 0);
        const totalTarjeta = completadas.filter(v => v.pago_tarjeta).reduce((s, v) => s + Number(v.pago_tarjeta), 0);
        const totalTransferencia = completadas.filter(v => v.pago_transferencia).reduce((s, v) => s + Number(v.pago_transferencia), 0);
        const prodMap = new Map();
        completadas.forEach(v => v.detalles?.forEach(d => {
            const curr = prodMap.get(d.producto_sku) || { nombre: d.producto_nombre, cantidad: 0, total: 0 };
            curr.cantidad += Number(d.cantidad);
            curr.total += Number(d.subtotal);
            prodMap.set(d.producto_sku, curr);
        }));
        const pedidosWeb = await this.pedidoWebRepo.find({
            where: {
                empresa_id: caja.empresa_id,
                created_at: (0, typeorm_2.Between)(caja.fecha_apertura, caja.fecha_cierre || new Date()),
            },
            order: { created_at: 'ASC' },
        });
        const pedidosWebValidos = pedidosWeb.filter(p => p.estado !== 'cancelado');
        return {
            caja,
            ventas,
            resumen: {
                num_ventas: completadas.length,
                num_canceladas: canceladas.length,
                total_ventas: totalVentas,
                total_efectivo: totalEfectivo,
                total_tarjeta: totalTarjeta,
                total_transferencia: totalTransferencia,
                total_entradas: Number(caja.total_entradas || 0),
                total_salidas: Number(caja.total_salidas || 0),
                fondo_apertura: Number(caja.fondo_apertura || 0),
                esperado_en_caja: Number(caja.fondo_apertura || 0) + totalEfectivo + Number(caja.total_entradas || 0) - Number(caja.total_salidas || 0),
                total_real: Number(caja.total_real || 0),
                diferencia: Number(caja.diferencia || 0),
            },
            top_productos: [...prodMap.values()].sort((a, b) => b.total - a.total).slice(0, 20),
            ventas_online: {
                pedidos: pedidosWeb,
                resumen: {
                    num_pedidos: pedidosWebValidos.length,
                    num_cancelados: pedidosWeb.length - pedidosWebValidos.length,
                    total: pedidosWebValidos.reduce((s, p) => s + Number(p.total), 0),
                },
            },
        };
    }
    getActiva(scope) {
        return this.cajaRepo.findOne({
            where: { tienda_id: scope.tienda_id, estado: caja_entity_1.CajaEstado.ABIERTA },
        });
    }
    findAll(scope) {
        return this.cajaRepo.find({
            where: { tienda_id: scope.tienda_id },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }
};
exports.CajaService = CajaService;
exports.CajaService = CajaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(caja_entity_1.Caja)),
    __param(1, (0, typeorm_1.InjectRepository)(caja_entity_1.MovimientoCaja)),
    __param(2, (0, typeorm_1.InjectRepository)(venta_entity_1.Venta)),
    __param(3, (0, typeorm_1.InjectRepository)(ecommerce_pedido_entity_1.EcommercePedido)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CajaService);
//# sourceMappingURL=caja.service.js.map