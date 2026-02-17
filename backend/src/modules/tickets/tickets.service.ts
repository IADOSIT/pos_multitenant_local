import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketConfig } from './ticket-config.entity';

@Injectable()
export class TicketsService {
  constructor(@InjectRepository(TicketConfig) private repo: Repository<TicketConfig>) {}

  // Herencia: Tienda > Empresa > Tenant
  async getConfig(tenant_id: number, empresa_id: number, tienda_id: number): Promise<TicketConfig> {
    const tiendaConfig = await this.repo.findOne({ where: { tenant_id, empresa_id, tienda_id } });
    if (tiendaConfig) return tiendaConfig;

    const empresaConfig = await this.repo.findOne({ where: { tenant_id, empresa_id, tienda_id: null } });
    if (empresaConfig) return empresaConfig;

    const tenantConfig = await this.repo.findOne({ where: { tenant_id, empresa_id: null, tienda_id: null } });
    return tenantConfig || this.getDefault(tenant_id);
  }

  private getDefault(tenant_id: number): TicketConfig {
    const config = new TicketConfig();
    config.tenant_id = tenant_id;
    config.encabezado_linea1 = 'POS-iaDoS';
    config.pie_linea1 = 'Gracias por su compra';
    config.pie_linea2 = 'Desarrollado por iaDoS - iados.mx';
    config.ancho_papel = 80;
    config.columnas = 42;
    config.mostrar_marca_iados = true;
    return config;
  }

  saveConfig(data: Partial<TicketConfig>) {
    return this.repo.save(this.repo.create(data));
  }

  async updateConfig(id: number, data: Partial<TicketConfig>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  generateTicketData(venta: any, config: TicketConfig) {
    const lines: string[] = [];
    const w = config.columnas || 42;

    if (config.encabezado_linea1) lines.push(this.center(config.encabezado_linea1, w));
    if (config.encabezado_linea2) lines.push(this.center(config.encabezado_linea2, w));
    if (config.encabezado_linea3) lines.push(this.center(config.encabezado_linea3, w));
    lines.push('='.repeat(w));
    lines.push(`Folio: ${venta.folio}`);
    lines.push(`Fecha: ${new Date(venta.created_at).toLocaleString('es-MX')}`);
    if (config.mostrar_cajero) lines.push(`Cajero: ${venta.usuario_nombre || 'N/A'}`);
    lines.push('-'.repeat(w));

    // Encabezado productos
    lines.push(this.formatLine('Producto', 'Cant', 'Precio', 'Subt', w));
    lines.push('-'.repeat(w));

    venta.detalles?.forEach((d: any) => {
      lines.push(this.formatLine(
        d.producto_nombre.substring(0, 20),
        d.cantidad.toString(),
        `$${Number(d.precio_unitario).toFixed(2)}`,
        `$${Number(d.subtotal).toFixed(2)}`,
        w,
      ));
    });

    lines.push('-'.repeat(w));
    lines.push(this.right(`Subtotal: $${Number(venta.subtotal).toFixed(2)}`, w));
    if (venta.descuento > 0) lines.push(this.right(`Descuento: -$${Number(venta.descuento).toFixed(2)}`, w));
    if (venta.impuestos > 0) lines.push(this.right(`Impuestos: $${Number(venta.impuestos).toFixed(2)}`, w));
    lines.push(this.right(`TOTAL: $${Number(venta.total).toFixed(2)}`, w));
    lines.push('='.repeat(w));

    if (venta.pago_efectivo) lines.push(`Efectivo: $${Number(venta.pago_efectivo).toFixed(2)}`);
    if (venta.pago_tarjeta) lines.push(`Tarjeta: $${Number(venta.pago_tarjeta).toFixed(2)}`);
    if (venta.cambio > 0) lines.push(`Cambio: $${Number(venta.cambio).toFixed(2)}`);

    lines.push('');
    if (config.pie_linea1) lines.push(this.center(config.pie_linea1, w));
    if (config.mostrar_marca_iados) lines.push(this.center('Desarrollado por iaDoS - iados.mx', w));

    return { lines, raw: lines.join('\n') };
  }

  private center(text: string, w: number): string {
    const pad = Math.max(0, Math.floor((w - text.length) / 2));
    return ' '.repeat(pad) + text;
  }

  private right(text: string, w: number): string {
    return text.padStart(w);
  }

  private formatLine(col1: string, col2: string, col3: string, col4: string, w: number): string {
    const c1 = 20, c2 = 4, c3 = 8, c4 = 10;
    return col1.padEnd(c1) + col2.padStart(c2) + col3.padStart(c3) + col4.padStart(c4);
  }
}
