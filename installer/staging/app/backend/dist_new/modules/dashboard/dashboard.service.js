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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const venta_entity_1 = require("../ventas/venta.entity");
const venta_entity_2 = require("../ventas/venta.entity");
const pedido_entity_1 = require("../pedidos/pedido.entity");
let DashboardService = class DashboardService {
    constructor(ventasRepo, detallesRepo, pedidosRepo) {
        this.ventasRepo = ventasRepo;
        this.detallesRepo = detallesRepo;
        this.pedidosRepo = pedidosRepo;
    }
    async getKPI(scope, desde, hasta, tienda_id) {
        const where = {
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            estado: venta_entity_1.VentaEstado.COMPLETADA,
            created_at: (0, typeorm_2.Between)(new Date(desde), new Date(hasta)),
        };
        if (tienda_id)
            where.tienda_id = tienda_id;
        const ventas = await this.ventasRepo.find({ where, relations: ['detalles'] });
        const totalVentas = ventas.reduce((s, v) => s + Number(v.total), 0);
        const numTickets = ventas.length;
        const ticketPromedio = numTickets > 0 ? totalVentas / numTickets : 0;
        const productosMap = new Map();
        ventas.forEach(v => v.detalles?.forEach(d => {
            const key = d.producto_sku;
            const curr = productosMap.get(key) || { nombre: d.producto_nombre, cantidad: 0, total: 0 };
            curr.cantidad += Number(d.cantidad);
            curr.total += Number(d.subtotal);
            productosMap.set(key, curr);
        }));
        const topProductos = [...productosMap.values()].sort((a, b) => b.total - a.total).slice(0, 10);
        const ventasPorHora = Array(24).fill(0);
        ventas.forEach(v => {
            const h = new Date(v.created_at).getHours();
            ventasPorHora[h] += Number(v.total);
        });
        const metodosPago = { efectivo: 0, tarjeta: 0, transferencia: 0, mixto: 0 };
        ventas.forEach(v => { metodosPago[v.metodo_pago] = (metodosPago[v.metodo_pago] || 0) + Number(v.total); });
        const cancelaciones = await this.ventasRepo.count({
            where: { ...where, estado: venta_entity_1.VentaEstado.CANCELADA },
        });
        return {
            total_ventas: totalVentas,
            num_tickets: numTickets,
            ticket_promedio: ticketPromedio,
            cancelaciones,
            top_productos: topProductos,
            ventas_por_hora: ventasPorHora,
            metodos_pago: metodosPago,
        };
    }
    async getTendencia(scope, semanas = 4) {
        const desde = new Date();
        desde.setDate(desde.getDate() - semanas * 7);
        const ventas = await this.ventasRepo.find({
            where: {
                tenant_id: scope.tenant_id,
                empresa_id: scope.empresa_id,
                estado: venta_entity_1.VentaEstado.COMPLETADA,
                created_at: (0, typeorm_2.MoreThanOrEqual)(desde),
            },
        });
        const semanaMap = new Map();
        ventas.forEach(v => {
            const d = new Date(v.created_at);
            const week = `${d.getFullYear()}-W${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7).toString().padStart(2, '0')}`;
            const curr = semanaMap.get(week) || { total: 0, tickets: 0 };
            curr.total += Number(v.total);
            curr.tickets++;
            semanaMap.set(week, curr);
        });
        return [...semanaMap.entries()].map(([semana, data]) => ({ semana, ...data })).sort((a, b) => a.semana.localeCompare(b.semana));
    }
    async getPedidosPendientes(scope) {
        const count = await this.pedidosRepo.count({
            where: {
                tenant_id: scope.tenant_id,
                empresa_id: scope.empresa_id,
                estado: (0, typeorm_2.In)([pedido_entity_1.PedidoEstado.RECIBIDO, pedido_entity_1.PedidoEstado.EN_ELABORACION, pedido_entity_1.PedidoEstado.LISTO_PARA_ENTREGA]),
            },
        });
        return { count };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(venta_entity_1.Venta)),
    __param(1, (0, typeorm_1.InjectRepository)(venta_entity_2.VentaDetalle)),
    __param(2, (0, typeorm_1.InjectRepository)(pedido_entity_1.Pedido)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map