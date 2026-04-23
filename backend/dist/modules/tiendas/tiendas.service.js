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
exports.TiendasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tienda_entity_1 = require("./tienda.entity");
const user_entity_1 = require("../users/user.entity");
let TiendasService = class TiendasService {
    constructor(repo) {
        this.repo = repo;
    }
    generateSlug(nombre, id) {
        const normalized = nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        const slug = `${normalized}-${id}`.substring(0, 80);
        return slug;
    }
    findAll(scope) {
        const where = {};
        if (scope.rol !== user_entity_1.UserRole.SUPERADMIN) {
            where.tenant_id = scope.tenant_id;
            if (scope.rol !== user_entity_1.UserRole.ADMIN)
                where.empresa_id = scope.empresa_id;
        }
        return this.repo.find({ where, order: { nombre: 'ASC' } });
    }
    async findOne(id) {
        const tienda = await this.repo.findOne({ where: { id } });
        if (tienda && !tienda.slug) {
            tienda.slug = this.generateSlug(tienda.nombre, tienda.id);
            await this.repo.save(tienda);
        }
        return tienda;
    }
    async create(data) {
        const saved = await this.repo.save(this.repo.create(data));
        if (!saved.slug) {
            saved.slug = this.generateSlug(saved.nombre, saved.id);
            await this.repo.save(saved);
        }
        return saved;
    }
    async update(id, data) {
        const { id: _id, created_at, updated_at, ...clean } = data;
        if (clean.config_pos !== undefined) {
            const existing = await this.repo.findOne({ where: { id } });
            if (existing?.config_pos) {
                clean.config_pos = { ...existing.config_pos, ...clean.config_pos };
            }
        }
        if (clean.config_impresora !== undefined) {
            const existing = await this.repo.findOne({ where: { id } });
            if (existing?.config_impresora) {
                clean.config_impresora = { ...existing.config_impresora, ...clean.config_impresora };
            }
        }
        await this.repo.update(id, clean);
        const tienda = await this.repo.findOne({ where: { id } });
        if (tienda && !tienda.slug) {
            tienda.slug = this.generateSlug(tienda.nombre, tienda.id);
            await this.repo.save(tienda);
        }
        return tienda;
    }
    async remove(id) {
        await this.repo.delete(id);
        return { deleted: true };
    }
    async findBySlug(slug) {
        return this.repo.findOne({ where: { slug, activo: true } });
    }
};
exports.TiendasService = TiendasService;
exports.TiendasService = TiendasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tienda_entity_1.Tienda)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TiendasService);
//# sourceMappingURL=tiendas.service.js.map