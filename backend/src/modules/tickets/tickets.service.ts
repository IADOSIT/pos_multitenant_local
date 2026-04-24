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

    const empresaConfig = await this.repo.findOne({ where: { tenant_id, empresa_id, tienda_id: undefined as any } });
    if (empresaConfig) return empresaConfig;

    const tenantConfig = await this.repo.findOne({ where: { tenant_id, empresa_id: undefined as any, tienda_id: undefined as any } });
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
    config.fuente_familia = 'Consolas';
    config.fuente_tamano = 11;
    config.logo_posicion = 'centro';
    config.copias = 1;
    config.impresion_enabled = true;
    config.comanda_enabled = false;
    config.comanda_header = 'ORDEN';
    config.comanda_ancho = 80;
    config.comanda_auto_print = false;
    config.comanda_mostrar_precio = true;
    config.comanda_copias = 1;
    return config;
  }

  saveConfig(data: Partial<TicketConfig>) {
    return this.repo.save(this.repo.create(data));
  }

  async updateConfig(id: number, data: Partial<TicketConfig>) {
    // Strip auto-managed and immutable fields; replace null/undefined numerics with their defaults
    const { id: _id, created_at, updated_at, tenant_id, empresa_id, tienda_id, ...rest } = data as any;
    const clean: any = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) clean[k] = v;
    }
    // Garantizar que campos int no sean null (causaría constraint violation en MariaDB)
    const intDefaults: Record<string, number> = {
      ancho_papel: 80, columnas: 42, fuente_tamano: 11,
      copias: 1, comanda_ancho: 80, comanda_copias: 1,
    };
    for (const [col, def] of Object.entries(intDefaults)) {
      if (clean[col] === null || clean[col] === '' || isNaN(Number(clean[col]))) {
        clean[col] = def;
      }
    }
    await this.repo.update(id, clean);
    return this.repo.findOne({ where: { id } });
  }

  // Convierte texto con acentos/caracteres especiales a ASCII puro
  // para compatibilidad con impresoras térmicas (evita simbolos ???)
  private s(text: string): string {
    if (!text) return '';
    return text
      .normalize('NFD')                      // descompone á → a + ́
      .replace(/[\u0300-\u036f]/g, '')        // elimina diacríticos (tildes, diéresis, etc.)
      .replace(/[^\x00-\x7F]/g, '?');         // cualquier otro no-ASCII → ?
  }

  generateTicketData(venta: any, config: TicketConfig) {
    const lines: string[] = [];
    const w = config.columnas || 42;

    if (config.encabezado_linea1) lines.push(this.center(this.s(config.encabezado_linea1), w));
    if (config.encabezado_linea2) lines.push(this.center(this.s(config.encabezado_linea2), w));
    if (config.encabezado_linea3) lines.push(this.center(this.s(config.encabezado_linea3), w));
    lines.push('='.repeat(w));
    if (venta.tipo_servicio === 'para_llevar') {
      lines.push(this.center('*** PARA LLEVAR ***', w));
      lines.push('');
    }
    lines.push(`Folio: ${venta.folio}`);
    lines.push(`Fecha: ${new Date(venta.created_at).toLocaleString('es-MX')}`);
    if (config.mostrar_cajero) lines.push(`Cajero: ${this.s(venta.usuario_nombre || 'N/A')}`);
    lines.push('-'.repeat(w));

    // Datos de entrega (para llevar)
    if (venta.tipo_servicio === 'para_llevar' && (venta.cliente_nombre || venta.cliente_telefono || venta.cliente_direccion)) {
      if (venta.cliente_nombre) lines.push(`Cliente: ${this.s(venta.cliente_nombre)}`);
      if (venta.cliente_telefono) lines.push(`Tel:     ${this.s(venta.cliente_telefono)}`);
      if (venta.cliente_direccion) lines.push(`Dir:     ${this.s(venta.cliente_direccion)}`);
      lines.push('-'.repeat(w));
    }

    if (venta.notas) lines.push(`Nota: ${this.s(venta.notas)}`);

    // Encabezado productos
    lines.push(this.formatLine('Producto', 'Cant', 'Precio', 'Subt', w));
    lines.push('-'.repeat(w));

    venta.detalles?.forEach((d: any) => {
      lines.push(this.formatLine(
        this.s(d.producto_nombre).substring(0, 20),
        d.cantidad.toString(),
        `$${Number(d.precio_unitario).toFixed(2)}`,
        `$${Number(d.subtotal).toFixed(2)}`,
        w,
      ));
      if (d.notas) lines.push(`  > ${this.s(d.notas).substring(0, w - 4)}`);
    });

    lines.push('-'.repeat(w));
    lines.push(this.right(`Subtotal: $${Number(venta.subtotal).toFixed(2)}`, w));
    if (venta.descuento > 0) lines.push(this.right(`Descuento: -$${Number(venta.descuento).toFixed(2)}`, w));
    if (venta.impuestos > 0) lines.push(this.right(`Impuestos: $${Number(venta.impuestos).toFixed(2)}`, w));
    if (venta.propina > 0 && config.propina_en_ticket !== false) {
      lines.push(this.right(`Propina: $${Number(venta.propina).toFixed(2)}`, w));
    }
    lines.push(this.right(`TOTAL: $${Number(venta.total).toFixed(2)}`, w));
    lines.push('='.repeat(w));

    if (venta.pago_efectivo) lines.push(`Efectivo: $${Number(venta.pago_efectivo).toFixed(2)}`);
    if (venta.pago_tarjeta) lines.push(`Tarjeta: $${Number(venta.pago_tarjeta).toFixed(2)}`);
    if (venta.cambio > 0) lines.push(`Cambio: $${Number(venta.cambio).toFixed(2)}`);

    lines.push('');
    if (config.pie_linea1) lines.push(this.center(this.s(config.pie_linea1), w));
    if (config.pie_linea2) lines.push(this.center(this.s(config.pie_linea2), w));
    if (config.mostrar_marca_iados) lines.push(this.center('Desarrollado por iaDoS - iados.mx', w));

    return { lines, raw: lines.join('\n') };
  }

  generatePreCuentaData(data: any, config: TicketConfig) {
    const lines: string[] = [];
    const w = config.columnas || 42;

    if (config.encabezado_linea1) lines.push(this.center(this.s(config.encabezado_linea1), w));
    if (config.encabezado_linea2) lines.push(this.center(this.s(config.encabezado_linea2), w));
    if (config.encabezado_linea3) lines.push(this.center(this.s(config.encabezado_linea3), w));
    lines.push('='.repeat(w));
    lines.push(this.center('*** PRE-CUENTA ***', w));
    lines.push('');
    if (data.mesa) lines.push(`Mesa: ${data.mesa}`);
    lines.push(`Fecha: ${new Date().toLocaleString('es-MX')}`);
    if (data.cliente_nombre) lines.push(`Cliente: ${this.s(data.cliente_nombre)}`);
    if (data.notas) lines.push(`Nota: ${this.s(data.notas)}`);
    lines.push('-'.repeat(w));

    lines.push(this.formatLine('Producto', 'Cant', 'Precio', 'Subt', w));
    lines.push('-'.repeat(w));

    (data.items || []).forEach((d: any) => {
      lines.push(this.formatLine(
        this.s(d.nombre || d.producto_nombre || '').substring(0, 20),
        String(d.cantidad),
        `$${Number(d.precio || d.precio_unitario || 0).toFixed(2)}`,
        `$${(Number(d.cantidad) * Number(d.precio || d.precio_unitario || 0) - Number(d.descuento || 0)).toFixed(2)}`,
        w,
      ));
      if (d.notas) lines.push(`  > ${this.s(d.notas).substring(0, w - 4)}`);
    });

    lines.push('-'.repeat(w));
    lines.push(this.right(`Subtotal: $${Number(data.subtotal || 0).toFixed(2)}`, w));
    if (Number(data.descuento) > 0) lines.push(this.right(`Descuento: -$${Number(data.descuento).toFixed(2)}`, w));
    if (Number(data.impuestos) > 0) lines.push(this.right(`Impuestos: $${Number(data.impuestos).toFixed(2)}`, w));
    lines.push(this.right(`TOTAL: $${Number(data.total || 0).toFixed(2)}`, w));
    lines.push('='.repeat(w));
    lines.push('');
    lines.push(this.center('** Precio sujeto a cambio **', w));
    lines.push('');
    if (config.pie_linea1) lines.push(this.center(this.s(config.pie_linea1), w));
    if (config.pie_linea2) lines.push(this.center(this.s(config.pie_linea2), w));

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
