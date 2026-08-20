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
exports.InventarioService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventario_entity_1 = require("./inventario.entity");
const producto_entity_1 = require("../productos/producto.entity");
const empresas_service_1 = require("../empresas/empresas.service");
const sync_1 = require("csv-parse/sync");
let InventarioService = class InventarioService {
    constructor(movRepo, prodRepo, ptRepo, empresasService) {
        this.movRepo = movRepo;
        this.prodRepo = prodRepo;
        this.ptRepo = ptRepo;
        this.empresasService = empresasService;
    }
    async listStock(scope) {
        const adminRoles = ['superadmin', 'admin', 'manager'];
        const where = { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true };
        if (scope.modulo && !adminRoles.includes(scope.rol)) {
            where.modulo = scope.modulo;
        }
        const productos = await this.prodRepo.find({
            where,
            select: ['id', 'sku', 'nombre', 'stock_actual', 'stock_minimo', 'controla_stock', 'unidad', 'costo', 'precio', 'imagen_url'],
            order: { nombre: 'ASC' },
        });
        const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
        if (!inventario_compartido || !scope.tienda_id || productos.length === 0)
            return productos;
        const ptRows = await this.ptRepo.find({ where: { tienda_id: scope.tienda_id, producto_id: (0, typeorm_2.In)(productos.map((p) => p.id)) } });
        const ptMap = new Map(ptRows.map((pt) => [pt.producto_id, Number(pt.stock)]));
        return productos.map((p) => (p.controla_stock ? { ...p, stock_actual: ptMap.get(p.id) ?? 0 } : p));
    }
    async getMovimientos(productoId, scope) {
        return this.movRepo.find({
            where: { producto_id: productoId, tenant_id: scope.tenant_id },
            order: { created_at: 'DESC' },
            take: 100,
        });
    }
    async listMovimientos(scope) {
        return this.movRepo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
            order: { created_at: 'DESC' },
            take: 200,
        });
    }
    async registrarMovimiento(data, scope) {
        const prod = await this.prodRepo.findOne({ where: { id: data.producto_id, tenant_id: scope.tenant_id } });
        if (!prod)
            throw new common_1.BadRequestException('Producto no encontrado');
        const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
        const usaPorTienda = inventario_compartido && !!scope.tienda_id;
        let pt = null;
        let stockAnterior;
        if (usaPorTienda) {
            pt = await this.ptRepo.findOne({ where: { producto_id: prod.id, tienda_id: scope.tienda_id } });
            stockAnterior = Number(pt?.stock || 0);
        }
        else {
            stockAnterior = Number(prod.stock_actual || 0);
        }
        let stockNuevo;
        switch (data.tipo) {
            case inventario_entity_1.MovimientoTipo.ENTRADA:
            case inventario_entity_1.MovimientoTipo.DEVOLUCION:
                stockNuevo = stockAnterior + Number(data.cantidad);
                break;
            case inventario_entity_1.MovimientoTipo.SALIDA:
                stockNuevo = stockAnterior - Number(data.cantidad);
                break;
            case inventario_entity_1.MovimientoTipo.AJUSTE:
                stockNuevo = Number(data.cantidad);
                break;
            default:
                throw new common_1.BadRequestException('Tipo invalido');
        }
        const mov = await this.movRepo.save(this.movRepo.create({
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
            producto_id: prod.id,
            producto_nombre: prod.nombre,
            producto_sku: prod.sku,
            tipo: data.tipo,
            cantidad: data.cantidad,
            stock_anterior: stockAnterior,
            stock_nuevo: stockNuevo,
            concepto: data.concepto || undefined,
            usuario_id: scope.id || scope.sub,
            usuario_nombre: scope.nombre || 'Sistema',
        }));
        if (usaPorTienda) {
            if (!pt)
                pt = this.ptRepo.create({ tenant_id: scope.tenant_id, tienda_id: scope.tienda_id, producto_id: prod.id, disponible: true });
            pt.stock = stockNuevo;
            await this.ptRepo.save(pt);
        }
        else {
            prod.stock_actual = stockNuevo;
        }
        prod.controla_stock = true;
        await this.prodRepo.save(prod);
        return { movimiento: mov, stock_actual: stockNuevo };
    }
    async updateProducto(id, data, scope) {
        const prod = await this.prodRepo.findOne({ where: { id, tenant_id: scope.tenant_id } });
        if (!prod)
            throw new common_1.BadRequestException('Producto no encontrado');
        if (data.controla_stock !== undefined)
            prod.controla_stock = data.controla_stock;
        if (data.stock_minimo !== undefined)
            prod.stock_minimo = data.stock_minimo;
        return this.prodRepo.save(prod);
    }
    getCSVTemplate() {
        return 'sku,stock_actual,stock_minimo,controla_stock\nPROD001,50,5,true\nPROD002,100,10,true';
    }
    decodeCSV(buffer) {
        let str = buffer.toString('utf-8');
        if (str.charCodeAt(0) === 0xFEFF)
            str = str.slice(1);
        if (str.includes('\ufffd'))
            str = buffer.toString('latin1');
        return str;
    }
    detectDelimiter(csvStr) {
        const firstLine = csvStr.split(/\r?\n/)[0] || '';
        const commas = (firstLine.match(/,/g) || []).length;
        const semicolons = (firstLine.match(/;/g) || []).length;
        const tabs = (firstLine.match(/\t/g) || []).length;
        if (semicolons > commas && semicolons > tabs)
            return ';';
        if (tabs > commas && tabs > semicolons)
            return '\t';
        return ',';
    }
    async importCSV(buffer, scope) {
        const csvStr = this.decodeCSV(buffer);
        const delimiter = this.detectDelimiter(csvStr);
        const records = (0, sync_1.parse)(csvStr, { columns: true, skip_empty_lines: true, trim: true, delimiter });
        const results = { success: 0, errors: [], total: records.length };
        const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
        const usaPorTienda = inventario_compartido && !!scope.tienda_id;
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            try {
                if (!row.sku) {
                    results.errors.push({ fila: i + 2, error: 'SKU obligatorio' });
                    continue;
                }
                const prod = await this.prodRepo.findOne({
                    where: { sku: row.sku, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
                });
                if (!prod) {
                    results.errors.push({ fila: i + 2, error: `SKU ${row.sku} no encontrado` });
                    continue;
                }
                let pt = null;
                const stockAnterior = usaPorTienda
                    ? Number((pt = await this.ptRepo.findOne({ where: { producto_id: prod.id, tienda_id: scope.tienda_id } }))?.stock || 0)
                    : Number(prod.stock_actual || 0);
                const stockNuevo = row.stock_actual !== undefined && row.stock_actual !== '' ? parseFloat(row.stock_actual) : stockAnterior;
                if (stockNuevo !== stockAnterior) {
                    await this.movRepo.save(this.movRepo.create({
                        tenant_id: scope.tenant_id,
                        empresa_id: scope.empresa_id,
                        tienda_id: scope.tienda_id,
                        producto_id: prod.id,
                        producto_nombre: prod.nombre,
                        producto_sku: prod.sku,
                        tipo: inventario_entity_1.MovimientoTipo.AJUSTE,
                        cantidad: stockNuevo,
                        stock_anterior: stockAnterior,
                        stock_nuevo: stockNuevo,
                        concepto: 'Importacion CSV',
                        usuario_id: scope.id || scope.sub,
                        usuario_nombre: scope.nombre || 'Sistema',
                    }));
                }
                if (usaPorTienda) {
                    if (!pt)
                        pt = this.ptRepo.create({ tenant_id: scope.tenant_id, tienda_id: scope.tienda_id, producto_id: prod.id, disponible: true });
                    pt.stock = stockNuevo;
                    await this.ptRepo.save(pt);
                }
                else {
                    prod.stock_actual = stockNuevo;
                }
                if (row.stock_minimo !== undefined && row.stock_minimo !== '')
                    prod.stock_minimo = parseFloat(row.stock_minimo);
                if (row.controla_stock !== undefined && row.controla_stock !== '')
                    prod.controla_stock = row.controla_stock === 'true';
                await this.prodRepo.save(prod);
                results.success++;
            }
            catch (err) {
                results.errors.push({ fila: i + 2, error: err.message });
            }
        }
        return results;
    }
    async getVistaGeneral(scope) {
        const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
        if (!inventario_compartido) {
            throw new common_1.BadRequestException('El inventario compartido no esta habilitado para esta empresa');
        }
        const tiendas = await this.ptRepo.manager.query('SELECT id, nombre FROM tiendas WHERE empresa_id = ? AND activo = 1 ORDER BY id ASC', [scope.empresa_id]);
        const productos = await this.prodRepo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true },
            select: ['id', 'sku', 'nombre', 'stock_minimo', 'unidad', 'precio', 'categoria_id'],
            order: { orden: 'ASC', nombre: 'ASC' },
        });
        if (productos.length === 0 || tiendas.length === 0)
            return { tiendas, productos: [] };
        const categoriaIds = [...new Set(productos.map((p) => p.categoria_id).filter(Boolean))];
        const categorias = categoriaIds.length
            ? await this.ptRepo.manager.query(`SELECT id, nombre, orden FROM categorias WHERE id IN (${categoriaIds.map(() => '?').join(',')}) ORDER BY orden ASC, nombre ASC`, categoriaIds)
            : [];
        const catMap = new Map(categorias.map((c) => [c.id, c.nombre]));
        const catOrdenMap = new Map(categorias.map((c, idx) => [c.id, idx]));
        const tiendaIds = tiendas.map((t) => t.id);
        const ptRows = await this.ptRepo.find({
            where: { producto_id: (0, typeorm_2.In)(productos.map((p) => p.id)), tienda_id: (0, typeorm_2.In)(tiendaIds) },
        });
        const ptMap = new Map();
        for (const pt of ptRows) {
            ptMap.set(`${pt.producto_id}:${pt.tienda_id}`, {
                stock: Number(pt.stock),
                precio_local: pt.precio_local != null ? Number(pt.precio_local) : null,
            });
        }
        const result = productos.map((p) => {
            const precioBase = Number(p.precio);
            const porTienda = tiendas.map((t) => {
                const row = ptMap.get(`${p.id}:${t.id}`);
                return {
                    tienda_id: t.id,
                    tienda_nombre: t.nombre,
                    stock: row?.stock ?? 0,
                    precio: row?.precio_local ?? precioBase,
                };
            });
            const stockTotal = porTienda.reduce((sum, t) => sum + t.stock, 0);
            return {
                id: p.id, sku: p.sku, nombre: p.nombre, stock_minimo: Number(p.stock_minimo || 0), unidad: p.unidad,
                precio: precioBase, stock_total: stockTotal, por_tienda: porTienda,
                categoria_id: p.categoria_id || 0,
                categoria_nombre: p.categoria_id ? (catMap.get(p.categoria_id) || 'Sin categoria') : 'Sin categoria',
            };
        });
        result.sort((a, b) => {
            const oa = catOrdenMap.get(a.categoria_id) ?? 9999;
            const ob = catOrdenMap.get(b.categoria_id) ?? 9999;
            return oa - ob;
        });
        return { tiendas, productos: result };
    }
    async listStockPorModulo(scope, modulo) {
        const where = {
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            activo: true,
        };
        if (modulo)
            where.modulo = modulo;
        return this.prodRepo.find({
            where,
            select: ['id', 'sku', 'nombre', 'stock_actual', 'stock_minimo', 'controla_stock', 'unidad', 'costo', 'precio', 'imagen_url', 'modulo'],
            order: { nombre: 'ASC' },
        });
    }
    async exportCSV(scope) {
        const productos = await this.prodRepo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true },
            order: { nombre: 'ASC' },
        });
        const { inventario_compartido } = await this.empresasService.getConfigEspecial(scope.empresa_id);
        let ptMap = new Map();
        if (inventario_compartido && scope.tienda_id && productos.length > 0) {
            const ptRows = await this.ptRepo.find({ where: { tienda_id: scope.tienda_id, producto_id: (0, typeorm_2.In)(productos.map((p) => p.id)) } });
            ptMap = new Map(ptRows.map((pt) => [pt.producto_id, Number(pt.stock)]));
        }
        let csv = 'sku,nombre,stock_actual,stock_minimo,controla_stock,costo,precio,unidad\n';
        for (const p of productos) {
            const stock = inventario_compartido && scope.tienda_id ? (ptMap.get(p.id) ?? 0) : (p.stock_actual || 0);
            csv += `${p.sku},"${p.nombre}",${stock},${p.stock_minimo || 0},${p.controla_stock},${p.costo || 0},${p.precio},${p.unidad || 'pza'}\n`;
        }
        return csv;
    }
};
exports.InventarioService = InventarioService;
exports.InventarioService = InventarioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventario_entity_1.MovimientoInventario)),
    __param(1, (0, typeorm_1.InjectRepository)(producto_entity_1.Producto)),
    __param(2, (0, typeorm_1.InjectRepository)(producto_entity_1.ProductoTienda)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        empresas_service_1.EmpresasService])
], InventarioService);
//# sourceMappingURL=inventario.service.js.map