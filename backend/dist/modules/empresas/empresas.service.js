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
exports.EmpresasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const empresa_entity_1 = require("./empresa.entity");
const user_entity_1 = require("../users/user.entity");
let EmpresasService = class EmpresasService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(scope) {
        const where = {};
        if (scope.rol !== user_entity_1.UserRole.SUPERADMIN)
            where.tenant_id = scope.tenant_id;
        return this.repo.find({ where, relations: ['tiendas'], order: { nombre: 'ASC' } });
    }
    findOne(id) {
        return this.repo.findOne({ where: { id }, relations: ['tiendas'] });
    }
    create(data) {
        return this.repo.save(this.repo.create(data));
    }
    async update(id, data) {
        const { id: _id, created_at, updated_at, tiendas, ...clean } = data;
        await this.repo.update(id, clean);
        return this.findOne(id);
    }
    async remove(id) {
        await this.repo.delete(id);
        return { deleted: true };
    }
    async setConfigEspecial(id, data, scope) {
        const where = { id };
        if (scope.rol !== user_entity_1.UserRole.SUPERADMIN)
            where.tenant_id = scope.tenant_id;
        const empresa = await this.repo.findOne({ where });
        if (!empresa)
            throw new common_1.NotFoundException('Empresa no encontrada');
        const { empleados_enabled, ...rest } = data;
        const safeData = scope.rol === user_entity_1.UserRole.SUPERADMIN ? data : rest;
        empresa.config_especial = {
            ...(empresa.config_especial || {}),
            ...safeData,
        };
        const saved = await this.repo.save(empresa);
        return { config_especial: saved.config_especial };
    }
    async getConfigEspecial(empresa_id) {
        const empresa = await this.repo.findOne({ where: { id: empresa_id } });
        const cfg = empresa?.config_especial || {};
        return {
            mostrar_precios: cfg.mostrar_precios !== false,
            precio_manual: cfg.precio_manual === true,
            notif_cliente_estados: cfg.notif_cliente_estados === true,
        };
    }
};
exports.EmpresasService = EmpresasService;
exports.EmpresasService = EmpresasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(empresa_entity_1.Empresa)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EmpresasService);
//# sourceMappingURL=empresas.service.js.map