import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, In } from 'typeorm';
import { Venta, VentaEstado } from '../ventas/venta.entity';
import { VentaDetalle } from '../ventas/venta.entity';
import { Pedido, PedidoEstado } from '../pedidos/pedido.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Venta) private ventasRepo: Repository<Venta>,
    @InjectRepository(VentaDetalle) private detallesRepo: Repository<VentaDetalle>,
    @InjectRepository(Pedido) private pedidosRepo: Repository<Pedido>,
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
}
