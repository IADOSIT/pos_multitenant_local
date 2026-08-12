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
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ticket_config_entity_1 = require("./ticket-config.entity");
let TicketsService = class TicketsService {
    constructor(repo) {
        this.repo = repo;
    }
    async getConfig(tenant_id, empresa_id, tienda_id) {
        const tiendaConfig = await this.repo.findOne({ where: { tenant_id, empresa_id, tienda_id } });
        if (tiendaConfig)
            return tiendaConfig;
        const empresaConfig = await this.repo.findOne({ where: { tenant_id, empresa_id, tienda_id: undefined } });
        if (empresaConfig)
            return empresaConfig;
        const tenantConfig = await this.repo.findOne({ where: { tenant_id, empresa_id: undefined, tienda_id: undefined } });
        return tenantConfig || this.getDefault(tenant_id);
    }
    getDefault(tenant_id) {
        const config = new ticket_config_entity_1.TicketConfig();
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
        config.modo_impresion = 'navegador';
        config.comanda_enabled = false;
        config.comanda_header = 'ORDEN';
        config.comanda_ancho = 80;
        config.comanda_auto_print = false;
        config.comanda_mostrar_precio = true;
        config.comanda_copias = 1;
        return config;
    }
    saveConfig(data) {
        return this.repo.save(this.repo.create(data));
    }
    async updateConfig(id, data) {
        const { id: _id, created_at, updated_at, tenant_id, empresa_id, tienda_id, ...rest } = data;
        const clean = {};
        for (const [k, v] of Object.entries(rest)) {
            if (v !== undefined)
                clean[k] = v;
        }
        const intDefaults = {
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
    s(text) {
        if (!text)
            return '';
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x00-\x7F]/g, '?');
    }
    generateTicketData(venta, config) {
        const lines = [];
        const w = config.columnas || 42;
        if (config.encabezado_linea1)
            lines.push(this.center(this.s(config.encabezado_linea1), w));
        if (config.encabezado_linea2)
            lines.push(this.center(this.s(config.encabezado_linea2), w));
        if (config.encabezado_linea3)
            lines.push(this.center(this.s(config.encabezado_linea3), w));
        lines.push('='.repeat(w));
        if (venta.tipo_servicio === 'para_llevar') {
            lines.push(this.center('*** PARA LLEVAR ***', w));
            lines.push('');
        }
        lines.push(`Folio: ${venta.folio}`);
        lines.push(`Fecha: ${new Date(venta.created_at).toLocaleString('es-MX')}`);
        if (config.mostrar_cajero)
            lines.push(`Cajero: ${this.s(venta.usuario_nombre || 'N/A')}`);
        lines.push('-'.repeat(w));
        if (venta.cliente_nombre || venta.cliente_telefono || venta.cliente_direccion) {
            if (venta.cliente_nombre)
                lines.push(`Cliente: ${this.s(venta.cliente_nombre)}`);
            if (venta.cliente_telefono)
                lines.push(`Tel:     ${this.s(venta.cliente_telefono)}`);
            if (venta.cliente_direccion)
                lines.push(`Dir:     ${this.s(venta.cliente_direccion)}`);
            lines.push('-'.repeat(w));
        }
        if (venta.notas)
            lines.push(`Nota: ${this.s(venta.notas)}`);
        lines.push(this.formatLine('Producto', 'Cant', 'Precio', 'Subt', w));
        lines.push('-'.repeat(w));
        venta.detalles?.forEach((d) => {
            lines.push(this.formatLine(this.s(d.producto_nombre).substring(0, 20), d.cantidad.toString(), `$${this.money(d.precio_unitario)}`, `$${this.money(d.subtotal)}`, w));
            if (d.notas)
                lines.push(`  > ${this.s(d.notas).substring(0, w - 4)}`);
        });
        lines.push('-'.repeat(w));
        lines.push(this.right(`Subtotal: $${this.money(venta.subtotal)}`, w));
        if (venta.descuento > 0)
            lines.push(this.right(`Descuento: -$${this.money(venta.descuento)}`, w));
        if (venta.impuestos > 0)
            lines.push(this.right(`Impuestos: $${this.money(venta.impuestos)}`, w));
        if (venta.propina > 0 && config.propina_en_ticket !== false) {
            lines.push(this.right(`Propina: $${this.money(venta.propina)}`, w));
        }
        lines.push(this.right(`TOTAL: $${this.money(venta.total)}`, w));
        lines.push('='.repeat(w));
        if (venta.pago_efectivo)
            lines.push(`Efectivo: $${this.money(venta.pago_efectivo)}`);
        if (venta.pago_tarjeta)
            lines.push(`Tarjeta: $${this.money(venta.pago_tarjeta)}`);
        if (venta.cambio > 0)
            lines.push(`Cambio: $${this.money(venta.cambio)}`);
        lines.push('');
        if (config.pie_linea1)
            lines.push(this.center(this.s(config.pie_linea1), w));
        if (config.pie_linea2)
            lines.push(this.center(this.s(config.pie_linea2), w));
        if (config.mostrar_marca_iados)
            lines.push(this.center('Desarrollado por iaDoS - iados.mx', w));
        return { lines, raw: lines.join('\n') };
    }
    generatePreCuentaData(data, config) {
        const lines = [];
        const w = config.columnas || 42;
        if (config.encabezado_linea1)
            lines.push(this.center(this.s(config.encabezado_linea1), w));
        if (config.encabezado_linea2)
            lines.push(this.center(this.s(config.encabezado_linea2), w));
        if (config.encabezado_linea3)
            lines.push(this.center(this.s(config.encabezado_linea3), w));
        lines.push('='.repeat(w));
        lines.push(this.center('*** PRE-CUENTA ***', w));
        lines.push('');
        if (data.mesa)
            lines.push(`Mesa: ${data.mesa}`);
        lines.push(`Fecha: ${new Date().toLocaleString('es-MX')}`);
        if (data.cliente_nombre)
            lines.push(`Cliente: ${this.s(data.cliente_nombre)}`);
        if (data.notas)
            lines.push(`Nota: ${this.s(data.notas)}`);
        lines.push('-'.repeat(w));
        lines.push(this.formatLine('Producto', 'Cant', 'Precio', 'Subt', w));
        lines.push('-'.repeat(w));
        (data.items || []).forEach((d) => {
            lines.push(this.formatLine(this.s(d.nombre || d.producto_nombre || '').substring(0, 20), String(d.cantidad), `$${this.money(d.precio || d.precio_unitario || 0)}`, `$${this.money(Number(d.cantidad) * Number(d.precio || d.precio_unitario || 0) - Number(d.descuento || 0))}`, w));
            if (d.notas)
                lines.push(`  > ${this.s(d.notas).substring(0, w - 4)}`);
        });
        lines.push('-'.repeat(w));
        lines.push(this.right(`Subtotal: $${this.money(data.subtotal || 0)}`, w));
        if (Number(data.descuento) > 0)
            lines.push(this.right(`Descuento: -$${this.money(data.descuento)}`, w));
        if (Number(data.impuestos) > 0)
            lines.push(this.right(`Impuestos: $${this.money(data.impuestos)}`, w));
        lines.push(this.right(`TOTAL: $${this.money(data.total || 0)}`, w));
        lines.push('='.repeat(w));
        lines.push('');
        lines.push(this.center('** Precio sujeto a cambio **', w));
        lines.push('');
        if (config.pie_linea1)
            lines.push(this.center(this.s(config.pie_linea1), w));
        if (config.pie_linea2)
            lines.push(this.center(this.s(config.pie_linea2), w));
        return { lines, raw: lines.join('\n') };
    }
    center(text, w) {
        const pad = Math.max(0, Math.floor((w - text.length) / 2));
        return ' '.repeat(pad) + text;
    }
    right(text, w) {
        return text.padStart(w);
    }
    money(n) {
        return Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    formatLine(col1, col2, col3, col4, w) {
        const c1 = 20, c2 = 4, c3 = 8, c4 = 10;
        return col1.padEnd(c1) + col2.padStart(c2) + col3.padStart(c3) + col4.padStart(c4);
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ticket_config_entity_1.TicketConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map