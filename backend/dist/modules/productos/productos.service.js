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
exports.ProductosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const typeorm_2 = require("typeorm");
const sync_1 = require("csv-parse/sync");
const producto_entity_1 = require("./producto.entity");
const categoria_entity_1 = require("../categorias/categoria.entity");
const config_ia_imagenes_entity_1 = require("./config-ia-imagenes.entity");
let ProductosService = class ProductosService {
    constructor(repo, ptRepo, catRepo, iaImagenesRepo, configService) {
        this.repo = repo;
        this.ptRepo = ptRepo;
        this.catRepo = catRepo;
        this.iaImagenesRepo = iaImagenesRepo;
        this.configService = configService;
        this.logger = new common_1.Logger('ProductosService');
    }
    findAll(scope, categoria_id) {
        const where = { activo: true, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id };
        if (categoria_id)
            where.categoria_id = categoria_id;
        return this.repo.find({ where, relations: ['categoria'], order: { orden: 'ASC', nombre: 'ASC' } });
    }
    findForPOS(scope) {
        const adminRoles = ['admin', 'superadmin', 'manager'];
        const qb = this.repo.createQueryBuilder('p')
            .leftJoinAndSelect('p.categoria', 'c')
            .where('p.tenant_id = :tid AND p.empresa_id = :eid AND p.activo = :activo AND p.disponible = :disponible', {
            tid: scope.tenant_id,
            eid: scope.empresa_id,
            activo: true,
            disponible: true,
        })
            .orderBy('c.orden', 'ASC')
            .addOrderBy('p.orden', 'ASC');
        if (scope.modulo && !adminRoles.includes(scope.rol)) {
            qb.andWhere('c.modulo = :modulo', { modulo: scope.modulo });
        }
        return qb.getMany();
    }
    findOne(id) {
        return this.repo.findOne({ where: { id }, relations: ['categoria'] });
    }
    create(data) {
        const clean = { ...data };
        if (clean.categoria_id === '' || clean.categoria_id === null)
            clean.categoria_id = null;
        if (clean.costo === '' || clean.costo === undefined)
            delete clean.costo;
        if (clean.imagen_url === '')
            clean.imagen_url = null;
        delete clean.created_at;
        delete clean.updated_at;
        return this.repo.save(this.repo.create(clean));
    }
    async update(id, data) {
        const { id: _id, created_at, updated_at, ...rest } = data;
        const clean = { ...rest };
        if (clean.categoria_id === '' || clean.categoria_id === null)
            clean.categoria_id = null;
        if (clean.costo === '' || clean.costo === undefined)
            delete clean.costo;
        if (clean.imagen_url === '')
            clean.imagen_url = null;
        delete clean.categoria;
        delete clean.tiendas;
        await this.repo.update(id, clean);
        return this.findOne(id);
    }
    getCSVTemplate() {
        return 'sku,nombre,descripcion,precio,costo,categoria,unidad,impuesto_pct,codigo_barras,controla_stock,stock_actual,stock_minimo,imagen_url\n'
            + 'PROD001,Hamburguesa Clásica,Carne 150g con lechuga y tomate,89.00,35.00,Hamburguesas,pza,16,7501234567890,false,0,0,\n'
            + 'PROD002,Refresco Cola 600ml,Refresco de cola,25.00,12.00,Bebidas,pza,16,,false,0,0,';
    }
    decodeCSV(buffer) {
        if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
            return buffer.slice(2).toString('utf16le');
        }
        if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
            const swapped = Buffer.alloc(buffer.length - 2);
            for (let i = 2; i < buffer.length; i += 2) {
                swapped[i - 2] = buffer[i + 1];
                swapped[i - 1] = buffer[i];
            }
            return swapped.toString('utf16le');
        }
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
    async importCSV(buffer, scope, updateExisting = false) {
        if (!buffer || buffer.length === 0) {
            throw new common_1.BadRequestException('Archivo vacío o no recibido');
        }
        const magic = buffer.slice(0, 4).toString('hex');
        if (magic === '504b0304') {
            throw new common_1.BadRequestException('El archivo parece ser un Excel .xlsx. Exportalo como CSV (.csv) antes de importar');
        }
        let csvStr;
        let rawRecords;
        try {
            csvStr = this.decodeCSV(buffer);
            const delimiter = this.detectDelimiter(csvStr);
            this.logger.log(`CSV import: delimiter='${delimiter === '\t' ? 'TAB' : delimiter}', tenant=${scope.tenant_id}, empresa=${scope.empresa_id}, updateExisting=${updateExisting}`);
            const normalizeKey = (k) => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
            const rawRecordsRaw = (0, sync_1.parse)(csvStr, { columns: true, skip_empty_lines: true, trim: true, delimiter });
            rawRecords = rawRecordsRaw.map((r) => {
                const norm = {};
                for (const [k, v] of Object.entries(r))
                    norm[normalizeKey(k)] = v;
                return norm;
            });
        }
        catch (e) {
            throw new common_1.BadRequestException(`No se pudo leer el archivo CSV: ${e.message}`);
        }
        const records = rawRecords;
        const results = { success: 0, errors: [], updated: 0, total: records.length, columns: [], categorias_creadas: 0 };
        if (records.length > 0) {
            results.columns = Object.keys(records[0]);
            this.logger.log(`CSV columns detected: ${results.columns.join(', ')} | rows: ${records.length}`);
        }
        const categorias = await this.catRepo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
            order: { orden: 'DESC' },
        });
        const catMap = new Map();
        let maxOrden = 0;
        for (const c of categorias) {
            catMap.set(c.nombre.toLowerCase(), c.id);
            if (c.orden > maxOrden)
                maxOrden = c.orden;
        }
        await this.purgeInactive(scope);
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            try {
                if (!row.sku || !row.nombre || !row.precio) {
                    results.errors.push({ fila: i + 2, error: 'sku, nombre y precio son obligatorios', datos: row });
                    continue;
                }
                const existing = await this.repo.findOne({
                    where: { sku: row.sku, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
                });
                if (existing && !updateExisting) {
                    results.errors.push({ fila: i + 2, error: `SKU ${row.sku} ya existe`, datos: row });
                    continue;
                }
                let categoriaId = null;
                if (row.categoria) {
                    const catId = catMap.get(row.categoria.toLowerCase());
                    if (catId) {
                        categoriaId = catId;
                    }
                    else {
                        maxOrden += 10;
                        const catEntity = new categoria_entity_1.Categoria();
                        catEntity.tenant_id = scope.tenant_id;
                        catEntity.empresa_id = scope.empresa_id;
                        catEntity.nombre = row.categoria;
                        catEntity.orden = maxOrden;
                        catEntity.activo = true;
                        const newCat = await this.catRepo.save(catEntity);
                        catMap.set(newCat.nombre.toLowerCase(), newCat.id);
                        categoriaId = newCat.id;
                        results.categorias_creadas++;
                        this.logger.log(`CSV: categoría auto-creada '${row.categoria}' (id=${newCat.id}, orden=${maxOrden})`);
                    }
                }
                const prodData = {
                    tenant_id: scope.tenant_id,
                    empresa_id: scope.empresa_id,
                    sku: row.sku,
                    nombre: row.nombre,
                    descripcion: row.descripcion || null,
                    precio: parseFloat(row.precio),
                    costo: row.costo ? parseFloat(row.costo) : 0,
                    unidad: row.unidad || 'pza',
                    impuesto_pct: row.impuesto_pct ? parseFloat(row.impuesto_pct) : 0,
                    codigo_barras: row.codigo_barras || null,
                    imagen_url: row.imagen_url || null,
                    controla_stock: row.controla_stock === 'true' || row.controla_stock === 'si' || row.controla_stock === '1',
                    stock_actual: row.stock_actual ? parseFloat(row.stock_actual) : 0,
                    stock_minimo: row.stock_minimo ? parseFloat(row.stock_minimo) : 0,
                    activo: true,
                    disponible: true,
                };
                if (categoriaId)
                    prodData.categoria_id = categoriaId;
                if (existing) {
                    await this.repo.save({ ...existing, ...prodData });
                    results.updated++;
                }
                else {
                    await this.repo.save(this.repo.create(prodData));
                    results.success++;
                }
            }
            catch (err) {
                results.errors.push({ fila: i + 2, error: err.message, datos: row });
            }
        }
        return results;
    }
    async deleteProduct(id) {
        await this.ptRepo.delete({ producto_id: id });
        await this.repo.delete(id);
        return { deleted: true };
    }
    async purgeInactive(scope) {
        const inactivos = await this.repo.find({ where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: false } });
        for (const p of inactivos) {
            await this.ptRepo.delete({ producto_id: p.id });
            await this.repo.delete(p.id);
        }
        return { purged: inactivos.length };
    }
    async searchImages(query) {
        try {
            const apiKey = process.env.PEXELS_API_KEY;
            if (!apiKey)
                return [];
            const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=16&locale=es-MX`;
            const res = await fetch(url, { headers: { Authorization: apiKey } });
            if (!res.ok)
                return [];
            const json = await res.json();
            return (json.photos || []).map((p, i) => ({
                id: i,
                url: p.src.large || p.src.original,
                thumb: p.src.medium,
                alt: p.alt || query,
            }));
        }
        catch (err) {
            this.logger.error('Error buscando imagenes en Pexels', err);
            return [];
        }
    }
    async uploadImage(file) {
        const { saveUploadedImage } = await Promise.resolve().then(() => require('../../common/utils/upload-image.util'));
        return saveUploadedImage(file, 'producto');
    }
    async getIaImagenesConfig(empresa_id) {
        const cfg = await this.iaImagenesRepo.findOne({ where: { empresa_id } });
        return {
            provider: cfg?.provider || 'pollinations',
            openai_api_key: cfg?.openai_api_key ? this.maskKey(cfg.openai_api_key) : '',
        };
    }
    async saveIaImagenesConfig(scope, data) {
        let cfg = await this.iaImagenesRepo.findOne({ where: { empresa_id: scope.empresa_id } });
        if (!cfg) {
            cfg = this.iaImagenesRepo.create({ empresa_id: scope.empresa_id, tenant_id: scope.tenant_id });
        }
        if (data.provider === 'pollinations' || data.provider === 'openai')
            cfg.provider = data.provider;
        if (data.openai_api_key !== undefined && !data.openai_api_key.includes('***')) {
            cfg.openai_api_key = data.openai_api_key || null;
        }
        const saved = await this.iaImagenesRepo.save(cfg);
        return { provider: saved.provider, openai_api_key: saved.openai_api_key ? this.maskKey(saved.openai_api_key) : '' };
    }
    async generateImage(scope, prompt) {
        const cfg = await this.iaImagenesRepo.findOne({ where: { empresa_id: scope.empresa_id } });
        if (!cfg?.provider || cfg.provider !== 'openai' || !cfg.openai_api_key) {
            throw new common_1.BadRequestException('Esta empresa no tiene configurada una API key de OpenAI — usa el modo gratis del navegador');
        }
        const res = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${cfg.openai_api_key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-image-1',
                prompt: `Fotografia de catalogo de producto: ${prompt}. Fondo blanco liso, iluminacion de estudio, un solo producto centrado, sin texto, sin marca de agua.`,
                size: '1024x1024',
                n: 1,
            }),
        });
        const json = await res.json();
        if (!res.ok) {
            this.logger.error('Error generando imagen con OpenAI', JSON.stringify(json));
            throw new common_1.BadRequestException(json?.error?.message || 'Error al generar la imagen con IA');
        }
        const b64 = json?.data?.[0]?.b64_json;
        if (!b64)
            throw new common_1.BadRequestException('OpenAI no devolvio una imagen');
        return { image_base64: b64 };
    }
    maskKey(key) {
        if (!key || key.length < 8)
            return '***';
        return key.substring(0, 3) + '***' + key.substring(key.length - 4);
    }
};
exports.ProductosService = ProductosService;
exports.ProductosService = ProductosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(producto_entity_1.Producto)),
    __param(1, (0, typeorm_1.InjectRepository)(producto_entity_1.ProductoTienda)),
    __param(2, (0, typeorm_1.InjectRepository)(categoria_entity_1.Categoria)),
    __param(3, (0, typeorm_1.InjectRepository)(config_ia_imagenes_entity_1.ConfigIaImagenes)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], ProductosService);
//# sourceMappingURL=productos.service.js.map