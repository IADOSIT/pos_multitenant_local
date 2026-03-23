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
exports.MateriaPrimaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const materia_prima_entity_1 = require("./materia-prima.entity");
const sync_1 = require("csv-parse/sync");
let MateriaPrimaService = class MateriaPrimaService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(scope) {
        return this.repo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
            order: { categoria: 'ASC', nombre: 'ASC' },
        });
    }
    findOne(id, scope) {
        return this.repo.findOne({ where: { id, tenant_id: scope.tenant_id } });
    }
    async create(data, scope) {
        return this.repo.save(this.repo.create({
            ...data,
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
        }));
    }
    async update(id, data, scope) {
        const item = await this.repo.findOne({ where: { id, tenant_id: scope.tenant_id } });
        if (!item)
            throw new common_1.BadRequestException('No encontrado');
        Object.assign(item, data);
        return this.repo.save(item);
    }
    async delete(id, scope) {
        await this.repo.delete({ id, tenant_id: scope.tenant_id });
        return { deleted: true };
    }
    async deleteAll(scope) {
        const result = await this.repo.delete({ tenant_id: scope.tenant_id, empresa_id: scope.empresa_id });
        return { deleted: result.affected || 0 };
    }
    getCSVTemplate() {
        return 'sku,nombre,descripcion,categoria,unidad,costo,stock_actual,stock_minimo,proveedor,notas\n'
            + 'MP-CAM001,Camaron Grande,Camaron fresco 16/20,Mariscos,kg,185.00,50,10,Proveedor Mar,\n'
            + 'MP-LIM001,Limon Verde,Limon fresco,Verduras,kg,25.00,40,10,Central Abastos,';
    }
    async exportCSV(scope) {
        const items = await this.findAll(scope);
        let csv = 'sku,nombre,descripcion,categoria,unidad,costo,stock_actual,stock_minimo,proveedor,notas\n';
        for (const i of items) {
            csv += `${i.sku},"${i.nombre}","${i.descripcion || ''}","${i.categoria || ''}",${i.unidad},${i.costo || 0},${i.stock_actual || 0},${i.stock_minimo || 0},"${i.proveedor || ''}","${i.notas || ''}"\n`;
        }
        return csv;
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
        const normalizeKey = (k) => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
        const rawRecords = (0, sync_1.parse)(csvStr, { columns: true, skip_empty_lines: true, trim: true, delimiter });
        const records = rawRecords.map((r) => {
            const norm = {};
            for (const [k, v] of Object.entries(r))
                norm[normalizeKey(k)] = v;
            return norm;
        });
        const results = { success: 0, updated: 0, errors: [], total: records.length, columns: [] };
        if (records.length > 0) {
            results.columns = Object.keys(records[0]);
        }
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            try {
                if (!row.sku || !row.nombre) {
                    results.errors.push({ fila: i + 2, error: 'sku y nombre son obligatorios' });
                    continue;
                }
                const existing = await this.repo.findOne({
                    where: { sku: row.sku, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
                });
                const data = {
                    tenant_id: scope.tenant_id,
                    empresa_id: scope.empresa_id,
                    tienda_id: scope.tienda_id,
                    sku: row.sku,
                    nombre: row.nombre,
                    descripcion: row.descripcion || undefined,
                    categoria: row.categoria || undefined,
                    unidad: row.unidad || 'pza',
                    costo: row.costo ? parseFloat(row.costo) : 0,
                    stock_actual: row.stock_actual ? parseFloat(row.stock_actual) : 0,
                    stock_minimo: row.stock_minimo ? parseFloat(row.stock_minimo) : 0,
                    proveedor: row.proveedor || undefined,
                    notas: row.notas || undefined,
                };
                if (existing) {
                    await this.repo.save({ ...existing, ...data });
                    results.updated++;
                }
                else {
                    await this.repo.save(this.repo.create(data));
                    results.success++;
                }
            }
            catch (err) {
                results.errors.push({ fila: i + 2, error: err.message });
            }
        }
        return results;
    }
};
exports.MateriaPrimaService = MateriaPrimaService;
exports.MateriaPrimaService = MateriaPrimaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(materia_prima_entity_1.MateriaPrima)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MateriaPrimaService);
//# sourceMappingURL=materia-prima.service.js.map