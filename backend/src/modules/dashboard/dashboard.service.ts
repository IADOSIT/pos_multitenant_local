import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, In, DataSource } from 'typeorm';
import { Venta, VentaEstado } from '../ventas/venta.entity';
import { VentaDetalle } from '../ventas/venta.entity';
import { Pedido, PedidoEstado } from '../pedidos/pedido.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Venta) private ventasRepo: Repository<Venta>,
    @InjectRepository(VentaDetalle) private detallesRepo: Repository<VentaDetalle>,
    @InjectRepository(Pedido) private pedidosRepo: Repository<Pedido>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getKPI(scope: any, desde: string, hasta: string, tienda_id?: number) {
    const where: any = {
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      estado: VentaEstado.COMPLETADA,
      created_at: Between(new Date(desde), new Date(hasta)),
    };
    if (tienda_id) where.tienda_id = tienda_id;

    const ventas = await this.ventasRepo.find({ where, relations: ['detalles'] });

    const totalVentas = ventas.reduce((s, v) => s + Number(v.total), 0);
    const numTickets = ventas.length;
    const ticketPromedio = numTickets > 0 ? totalVentas / numTickets : 0;

    // Top productos
    const productosMap = new Map<string, { nombre: string; cantidad: number; total: number }>();
    ventas.forEach(v => v.detalles?.forEach(d => {
      const key = d.producto_sku;
      const curr = productosMap.get(key) || { nombre: d.producto_nombre, cantidad: 0, total: 0 };
      curr.cantidad += Number(d.cantidad);
      curr.total += Number(d.subtotal);
      productosMap.set(key, curr);
    }));
    const topProductos = [...productosMap.values()].sort((a, b) => b.total - a.total).slice(0, 10);

    // Ventas por hora
    const ventasPorHora = Array(24).fill(0);
    ventas.forEach(v => {
      const h = new Date(v.created_at).getHours();
      ventasPorHora[h] += Number(v.total);
    });

    // Métodos de pago
    const metodosPago = { efectivo: 0, tarjeta: 0, transferencia: 0, mixto: 0 };
    ventas.forEach(v => { metodosPago[v.metodo_pago] = (metodosPago[v.metodo_pago] || 0) + Number(v.total); });

    // Cancelaciones
    const cancelaciones = await this.ventasRepo.count({
      where: { ...where, estado: VentaEstado.CANCELADA },
    });

    // Top clientes
    const topClientes = await this.dataSource.query(
      `SELECT telefono, MAX(nombre) AS nombre, COUNT(*) AS total_compras, SUM(total) AS total_gastado
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
       LIMIT 10`,
      [scope.tenant_id, scope.empresa_id, desde, hasta,
       scope.tenant_id, scope.empresa_id, desde, hasta],
    );

    return {
      total_ventas: totalVentas,
      num_tickets: numTickets,
      ticket_promedio: ticketPromedio,
      cancelaciones,
      top_productos: topProductos,
      ventas_por_hora: ventasPorHora,
      metodos_pago: metodosPago,
      top_clientes: topClientes.map((c: any) => ({
        telefono: c.telefono,
        nombre: c.nombre,
        total_compras: Number(c.total_compras),
        total_gastado: Number(c.total_gastado),
      })),
    };
  }

  async getTendencia(scope: any, semanas: number = 4) {
    const desde = new Date();
    desde.setDate(desde.getDate() - semanas * 7);

    const ventas = await this.ventasRepo.find({
      where: {
        tenant_id: scope.tenant_id,
        empresa_id: scope.empresa_id,
        estado: VentaEstado.COMPLETADA,
        created_at: MoreThanOrEqual(desde),
      },
    });

    const semanaMap = new Map<string, { total: number; tickets: number }>();
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

  async getPedidosPendientes(scope: any) {
    const count = await this.pedidosRepo.count({
      where: {
        tenant_id: scope.tenant_id,
        empresa_id: scope.empresa_id,
        estado: In([PedidoEstado.RECIBIDO, PedidoEstado.EN_ELABORACION, PedidoEstado.LISTO_PARA_ENTREGA]),
      },
    });
    return { count };
  }

  async getVentasPorProducto(scope: any, desde: string, hasta: string, categoriaId?: number) {
    const catFilter = categoriaId ? 'AND p.categoria_id = ?' : '';
    const params: any[] = [scope.tenant_id, scope.empresa_id, scope.tienda_id, desde, hasta];
    if (categoriaId) params.push(categoriaId);
    const rows = await this.dataSource.query(
      `SELECT
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
       LIMIT 200`,
      params,
    );
    return rows.map((r: any) => ({
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

  async getVentasPorUnidad(scope: any, desde: string, hasta: string) {
    const rows = await this.dataSource.query(
      `SELECT
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
       ORDER BY total_ventas DESC`,
      [scope.tenant_id, scope.empresa_id, scope.tienda_id, desde, hasta],
    );
    return rows.map((r: any) => ({
      unidad: r.unidad,
      categoria: r.categoria,
      num_ventas: Number(r.num_ventas),
      total_unidades: Number(r.total_unidades),
      total_ventas: Number(r.total_ventas),
    }));
  }

  async getVentasPorCategoria(scope: any, desde: string, hasta: string) {
    const rows = await this.dataSource.query(
      `SELECT
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
       ORDER BY total_ventas DESC`,
      [scope.tenant_id, scope.empresa_id, scope.tienda_id, desde, hasta],
    );
    return rows.map((r: any) => ({
      categoria: r.categoria,
      num_ventas: Number(r.num_ventas),
      total_unidades: Number(r.total_unidades),
      total_ventas: Number(r.total_ventas),
    }));
  }
}
