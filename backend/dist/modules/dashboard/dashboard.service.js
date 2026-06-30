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
const TZ = 'America/Mexico_City';
function isoToLocalSQL(isoStr) {
    const d = new Date(isoStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function getMXHour(dateValue) {
    const d = new Date(dateValue);
    return parseInt(d.toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }), 10) % 24;
}
let DashboardService = class DashboardService {
    constructor(ventasRepo, detallesRepo, pedidosRepo, dataSource) {
        this.ventasRepo = ventasRepo;
        this.detallesRepo = detallesRepo;
        this.pedidosRepo = pedidosRepo;
        this.dataSource = dataSource;
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
            const h = getMXHour(v.created_at);
            ventasPorHora[h] += Number(v.total);
        });
        const metodosPago = { efectivo: 0, tarjeta: 0, transferencia: 0, mixto: 0 };
        ventas.forEach(v => { metodosPago[v.metodo_pago] = (metodosPago[v.metodo_pago] || 0) + Number(v.total); });
        const whereBase = {
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            created_at: (0, typeorm_2.Between)(new Date(desde), new Date(hasta)),
            ...(tienda_id ? { tienda_id } : {}),
        };
        const cancelacionesVentas = await this.ventasRepo.count({
            where: { ...whereBase, estado: venta_entity_1.VentaEstado.CANCELADA },
        });
        const cancelacionesPedidos = await this.pedidosRepo.count({
            where: { ...whereBase, estado: pedido_entity_1.PedidoEstado.CANCELADO },
        });
        const cancelaciones = cancelacionesVentas + cancelacionesPedidos;
        const desdeSQL = isoToLocalSQL(desde);
        const hastaSQL = isoToLocalSQL(hasta);
        const topClientes = await this.dataSource.query(`SELECT telefono, MAX(nombre) AS nombre, COUNT(*) AS total_compras, SUM(total) AS total_gastado
       FROM (
         SELECT cliente_telefono AS telefono, cliente_nombre AS nombre, total
         FROM ventas
         WHERE tenant_id = ? AND empresa_id = ?
           AND estado = 'completada'
           AND created_at BETWEEN ? AND ?
           AND cliente_telefono IS NOT NULL AND cliente_telefono != ''
         UNION ALL
         SELECT cliente_telefono, cliente_nombre, total
         FROM pedidos
         WHERE tenant_id = ? AND empresa_id = ?
           AND created_at BETWEEN ? AND ?
           AND cliente_telefono IS NOT NULL AND cliente_telefono != ''
       ) t
       GROUP BY telefono
       ORDER BY total_gastado DESC
       LIMIT 10`, [scope.tenant_id, scope.empresa_id, desdeSQL, hastaSQL,
            scope.tenant_id, scope.empresa_id, desdeSQL, hastaSQL]);
        return {
            total_ventas: totalVentas,
            num_tickets: numTickets,
            ticket_promedio: ticketPromedio,
            cancelaciones,
            top_productos: topProductos,
            ventas_por_hora: ventasPorHora,
            metodos_pago: metodosPago,
            top_clientes: topClientes.map((c) => ({
                telefono: c.telefono,
                nombre: c.nombre,
                total_compras: Number(c.total_compras),
                total_gastado: Number(c.total_gastado),
            })),
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
    async getVentasPorProducto(scope, desde, hasta, categoriaId) {
        const catFilter = categoriaId ? 'AND p.categoria_id = ?' : '';
        const params = [scope.tenant_id, scope.empresa_id, scope.tienda_id, isoToLocalSQL(desde), isoToLocalSQL(hasta)];
        if (categoriaId)
            params.push(categoriaId);
        const rows = await this.dataSource.query(`SELECT
         vd.producto_id,
         vd.producto_nombre          AS nombre,
         p.unidad,
         COALESCE(c.nombre, 'Sin categoría') AS categoria,
         COUNT(DISTINCT v.id)        AS num_ventas,
         SUM(vd.cantidad)            AS total_unidades,
         SUM(vd.subtotal)            AS total_ventas,
         AVG(vd.precio_unitario)     AS precio_promedio
       FROM ventas v
       JOIN venta_detalles vd ON vd.venta_id = v.id
       LEFT JOIN productos p  ON p.id = vd.producto_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE v.tenant_id = ? AND v.empresa_id = ? AND v.tienda_id = ?
         AND v.estado = 'completada'
         AND v.created_at BETWEEN ? AND ?
         ${catFilter}
       GROUP BY vd.producto_id, vd.producto_nombre, p.unidad, c.id, c.nombre
       ORDER BY total_ventas DESC
       LIMIT 200`, params);
        return rows.map((r) => ({
            producto_id: r.producto_id,
            nombre: r.nombre,
            unidad: r.unidad || '',
            categoria: r.categoria,
            num_ventas: Number(r.num_ventas),
            total_unidades: Number(r.total_unidades),
            total_ventas: Number(r.total_ventas),
            precio_promedio: Number(r.precio_promedio),
        }));
    }
    async getVentasPorUnidad(scope, desde, hasta) {
        const rows = await this.dataSource.query(`SELECT
         COALESCE(p.unidad, 'Sin unidad')     AS unidad,
         COALESCE(c.nombre, 'Sin categoría')  AS categoria,
         COUNT(DISTINCT v.id)                 AS num_ventas,
         SUM(vd.cantidad)                     AS total_unidades,
         SUM(vd.subtotal)                     AS total_ventas
       FROM ventas v
       JOIN venta_detalles vd ON vd.venta_id = v.id
       LEFT JOIN productos p  ON p.id = vd.producto_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE v.tenant_id = ? AND v.empresa_id = ? AND v.tienda_id = ?
         AND v.estado = 'completada'
         AND v.created_at BETWEEN ? AND ?
       GROUP BY p.unidad, c.id, c.nombre
       ORDER BY total_ventas DESC`, [scope.tenant_id, scope.empresa_id, scope.tienda_id, isoToLocalSQL(desde), isoToLocalSQL(hasta)]);
        return rows.map((r) => ({
            unidad: r.unidad,
            categoria: r.categoria,
            num_ventas: Number(r.num_ventas),
            total_unidades: Number(r.total_unidades),
            total_ventas: Number(r.total_ventas),
        }));
    }
    async getVentasPorCategoria(scope, desde, hasta) {
        const rows = await this.dataSource.query(`SELECT
         COALESCE(c.nombre, 'Sin categoría') AS categoria,
         COUNT(DISTINCT v.id)                AS num_ventas,
         SUM(vd.cantidad)                    AS total_unidades,
         SUM(vd.subtotal)                    AS total_ventas
       FROM ventas v
       JOIN venta_detalles vd ON vd.venta_id = v.id
       LEFT JOIN productos p  ON p.id = vd.producto_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE v.tenant_id = ? AND v.empresa_id = ? AND v.tienda_id = ?
         AND v.estado = 'completada'
         AND v.created_at BETWEEN ? AND ?
       GROUP BY c.id, c.nombre
       ORDER BY total_ventas DESC`, [scope.tenant_id, scope.empresa_id, scope.tienda_id, isoToLocalSQL(desde), isoToLocalSQL(hasta)]);
        return rows.map((r) => ({
            categoria: r.categoria,
            num_ventas: Number(r.num_ventas),
            total_unidades: Number(r.total_unidades),
            total_ventas: Number(r.total_ventas),
        }));
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(venta_entity_1.Venta)),
    __param(1, (0, typeorm_1.InjectRepository)(venta_entity_2.VentaDetalle)),
    __param(2, (0, typeorm_1.InjectRepository)(pedido_entity_1.Pedido)),
    __param(3, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map