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
exports.MesasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mesa_entity_1 = require("./mesa.entity");
let MesasService = class MesasService {
    constructor(mesaRepo, asignRepo, juntaRepo) {
        this.mesaRepo = mesaRepo;
        this.asignRepo = asignRepo;
        this.juntaRepo = juntaRepo;
    }
    findAll(scope) {
        return this.mesaRepo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, tienda_id: scope.tienda_id, activo: true },
            order: { numero: 'ASC' },
        });
    }
    findOne(id) {
        return this.mesaRepo.findOne({ where: { id } });
    }
    create(data, scope) {
        return this.mesaRepo.save(this.mesaRepo.create({
            ...data,
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
        }));
    }
    async update(id, data) {
        const { id: _id, created_at, updated_at, ...clean } = data;
        await this.mesaRepo.update(id, clean);
        return this.findOne(id);
    }
    async remove(id) {
        await this.asignRepo.delete({ mesa_id: id });
        await this.juntaRepo.delete({ mesa_principal_id: id });
        await this.juntaRepo.delete({ mesa_secundaria_id: id });
        await this.mesaRepo.update(id, { activo: false });
        return { deleted: true };
    }
    async getAsignaciones(tienda_id, tenant_id, empresa_id) {
        return this.asignRepo.find({
            where: { tienda_id, tenant_id, empresa_id, activo: true },
        });
    }
    async asignarMesero(mesa_id, user_id, user_nombre, scope) {
        const existing = await this.asignRepo.findOne({
            where: { mesa_id, tienda_id: scope.tienda_id, activo: true },
        });
        if (existing) {
            await this.asignRepo.update(existing.id, { user_id, user_nombre });
            return this.asignRepo.findOne({ where: { id: existing.id } });
        }
        return this.asignRepo.save(this.asignRepo.create({
            mesa_id, user_id, user_nombre,
            tienda_id: scope.tienda_id,
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
        }));
    }
    async desasignarMesero(mesa_id, scope) {
        await this.asignRepo.delete({ mesa_id, tienda_id: scope.tienda_id });
        return { ok: true };
    }
    async getMeseroAsignado(mesa_id, tienda_id) {
        return this.asignRepo.findOne({ where: { mesa_id, tienda_id, activo: true } });
    }
    async juntarMesas(mesa_principal_id, mesa_secundaria_id, scope) {
        const existe = await this.juntaRepo.findOne({
            where: { mesa_principal_id, mesa_secundaria_id, tienda_id: scope.tienda_id, activo: true },
        });
        if (existe)
            return existe;
        const asignacion = await this.getMeseroAsignado(mesa_principal_id, scope.tienda_id);
        if (asignacion) {
            await this.asignarMesero(mesa_secundaria_id, asignacion.user_id, asignacion.user_nombre, scope);
        }
        return this.juntaRepo.save(this.juntaRepo.create({
            mesa_principal_id, mesa_secundaria_id,
            tienda_id: scope.tienda_id,
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
        }));
    }
    async separarMesas(mesa_principal_id, mesa_secundaria_id, tienda_id) {
        await this.juntaRepo.delete({ mesa_principal_id, mesa_secundaria_id, tienda_id });
        return { ok: true };
    }
    getMesasJuntas(tienda_id) {
        return this.juntaRepo.find({ where: { tienda_id, activo: true } });
    }
    generateSelfOrderSlug(tienda_id) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `t${tienda_id}-${rand}`;
    }
};
exports.MesasService = MesasService;
exports.MesasService = MesasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mesa_entity_1.Mesa)),
    __param(1, (0, typeorm_1.InjectRepository)(mesa_entity_1.MesaAsignacion)),
    __param(2, (0, typeorm_1.InjectRepository)(mesa_entity_1.MesaJunta)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MesasService);
//# sourceMappingURL=mesas.service.js.map