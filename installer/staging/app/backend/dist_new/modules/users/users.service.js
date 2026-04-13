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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("./user.entity");
const tenant_entity_1 = require("../tenants/tenant.entity");
const empresa_entity_1 = require("../empresas/empresa.entity");
const tienda_entity_1 = require("../tiendas/tienda.entity");
let UsersService = class UsersService {
    constructor(usersRepo, tenantsRepo, empresasRepo, tiendasRepo) {
        this.usersRepo = usersRepo;
        this.tenantsRepo = tenantsRepo;
        this.empresasRepo = empresasRepo;
        this.tiendasRepo = tiendasRepo;
    }
    async findAll(scope) {
        const where = {};
        if (scope.rol !== user_entity_1.UserRole.SUPERADMIN) {
            where.tenant_id = scope.tenant_id;
            if (scope.rol !== user_entity_1.UserRole.ADMIN) {
                where.empresa_id = scope.empresa_id;
            }
        }
        return this.usersRepo.find({ where, order: { created_at: 'DESC' } });
    }
    async findOne(id, scope) {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.BadRequestException('Usuario no encontrado');
        if (scope.rol !== user_entity_1.UserRole.SUPERADMIN && user.tenant_id !== scope.tenant_id) {
            throw new common_1.ForbiddenException();
        }
        return user;
    }
    async createWithWizard(dto, scope) {
        if (scope.rol !== user_entity_1.UserRole.SUPERADMIN && scope.rol !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Solo SuperAdmin o Admin pueden crear usuarios');
        }
        let tenant_id = dto.tenant_id;
        let empresa_id = dto.empresa_id;
        let tienda_id = dto.tienda_id;
        if (scope.rol === user_entity_1.UserRole.SUPERADMIN) {
            if (dto.nuevo_tenant) {
                const tenant = this.tenantsRepo.create({
                    nombre: dto.nuevo_tenant.nombre,
                    slug: dto.nuevo_tenant.nombre.toLowerCase().replace(/\s+/g, '-'),
                    razon_social: dto.nuevo_tenant.razon_social,
                    rfc: dto.nuevo_tenant.rfc,
                });
                const saved = await this.tenantsRepo.save(tenant);
                tenant_id = saved.id;
            }
            if (dto.nueva_empresa && tenant_id) {
                const empresa = this.empresasRepo.create({
                    tenant_id,
                    nombre: dto.nueva_empresa.nombre,
                    razon_social: dto.nueva_empresa.razon_social,
                });
                const saved = await this.empresasRepo.save(empresa);
                empresa_id = saved.id;
            }
            if (dto.nueva_tienda && tenant_id && empresa_id) {
                const tienda = this.tiendasRepo.create({
                    tenant_id,
                    empresa_id,
                    nombre: dto.nueva_tienda.nombre,
                    direccion: dto.nueva_tienda.direccion,
                });
                const saved = await this.tiendasRepo.save(tienda);
                tienda_id = saved.id;
            }
        }
        else {
            tenant_id = scope.tenant_id;
            if (!empresa_id)
                empresa_id = scope.empresa_id;
            if (dto.nueva_tienda && tenant_id && empresa_id) {
                const tienda = this.tiendasRepo.create({
                    tenant_id,
                    empresa_id,
                    nombre: dto.nueva_tienda.nombre,
                    direccion: dto.nueva_tienda.direccion,
                });
                const saved = await this.tiendasRepo.save(tienda);
                tienda_id = saved.id;
            }
        }
        const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
        if (exists)
            throw new common_1.BadRequestException('Email ya registrado');
        const hashedPass = await bcrypt.hash(dto.password, 10);
        const user = this.usersRepo.create({
            nombre: dto.nombre,
            email: dto.email,
            password: hashedPass,
            rol: dto.rol || user_entity_1.UserRole.CAJERO,
            pin: dto.pin,
            tenant_id,
            empresa_id,
            tienda_id,
        });
        const saved = await this.usersRepo.save(user);
        const { password, ...result } = saved;
        return result;
    }
    async update(id, data, scope) {
        const user = await this.findOne(id, scope);
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        if (scope.rol === user_entity_1.UserRole.SUPERADMIN) {
        }
        else if (scope.rol === user_entity_1.UserRole.ADMIN) {
            data.tenant_id = scope.tenant_id;
        }
        else {
            if (data.tenant_id !== undefined || data.empresa_id !== undefined || data.tienda_id !== undefined) {
                throw new common_1.ForbiddenException('No tienes permisos para cambiar la asignación de este usuario');
            }
        }
        Object.assign(user, data);
        const saved = await this.usersRepo.save(user);
        const { password, ...result } = saved;
        return result;
    }
    async toggleActive(id, scope) {
        const user = await this.findOne(id, scope);
        user.activo = !user.activo;
        return this.usersRepo.save(user);
    }
    async hardDelete(id, scope) {
        const user = await this.findOne(id, scope);
        if (user.id === scope.sub) {
            throw new common_1.BadRequestException('No puedes eliminarte a ti mismo');
        }
        await this.usersRepo.remove(user);
        return { deleted: true };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __param(2, (0, typeorm_1.InjectRepository)(empresa_entity_1.Empresa)),
    __param(3, (0, typeorm_1.InjectRepository)(tienda_entity_1.Tienda)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map