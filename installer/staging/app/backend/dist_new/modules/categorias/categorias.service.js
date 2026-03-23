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
exports.CategoriasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const categoria_entity_1 = require("./categoria.entity");
let CategoriasService = class CategoriasService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(scope) {
        return this.repo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true },
            order: { orden: 'ASC', nombre: 'ASC' },
        });
    }
    findOne(id) {
        return this.repo.findOne({ where: { id }, relations: ['productos'] });
    }
    create(data) {
        return this.repo.save(this.repo.create(data));
    }
    async update(id, data) {
        const { id: _id, created_at, updated_at, ...rest } = data;
        const clean = { ...rest };
        if (clean.imagen_url === '')
            clean.imagen_url = null;
        delete clean.productos;
        await this.repo.update(id, clean);
        return this.findOne(id);
    }
    async softDelete(id) {
        await this.repo.update(id, { activo: false });
        return { deleted: true };
    }
};
exports.CategoriasService = CategoriasService;
exports.CategoriasService = CategoriasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(categoria_entity_1.Categoria)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriasService);
//# sourceMappingURL=categorias.service.js.map