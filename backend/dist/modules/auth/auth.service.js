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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../users/user.entity");
const empresa_entity_1 = require("../empresas/empresa.entity");
let AuthService = class AuthService {
    constructor(usersRepo, empresaRepo, jwtService) {
        this.usersRepo = usersRepo;
        this.empresaRepo = empresaRepo;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger('AuthService');
    }
    async findOneWithRetry(repo, opts, ctx) {
        try {
            return await repo.findOne(opts);
        }
        catch (err) {
            const connErr = ['ECONNRESET', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ENOTFOUND', 'EPIPE'].includes(err.code);
            if (!connErr)
                throw err;
            this.logger.warn(`[${ctx}] conexión MySQL caída (${err.code}) — reintentando...`);
            return await repo.findOne(opts);
        }
    }
    async login(email, password) {
        let user;
        try {
            user = await this.findOneWithRetry(this.usersRepo, { where: { email, activo: true } }, 'login');
        }
        catch (err) {
            this.logger.error(`[login] DB error en findOne(email=${email}): ${err.message}`, err.stack);
            throw new common_1.InternalServerErrorException(`DB error: ${err.message}`);
        }
        if (!user)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        user.ultimo_login = new Date();
        try {
            await this.usersRepo.save(user);
        }
        catch (err) {
            this.logger.error(`[login] DB error en save(user.id=${user.id}): ${err.message}`, err.stack);
        }
        const payload = {
            sub: user.id,
            email: user.email,
            rol: user.rol,
            tenant_id: user.tenant_id,
            empresa_id: user.empresa_id,
            tienda_id: user.tienda_id,
            nombre: user.nombre,
            modulo: user.modulo || null,
        };
        let empresa = null;
        try {
            empresa = user.empresa_id
                ? await this.findOneWithRetry(this.empresaRepo, { where: { id: user.empresa_id } }, 'login-empresa')
                : null;
        }
        catch (err) {
            this.logger.error(`[login] DB error en findOne empresa(id=${user.empresa_id}): ${err.message}`, err.stack);
        }
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                tenant_id: user.tenant_id,
                empresa_id: user.empresa_id,
                tienda_id: user.tienda_id,
                modulo: user.modulo || null,
                empresa_nombre: empresa?.nombre || null,
                empresa_logo: empresa?.logo_url || null,
                config_apariencia: empresa?.config_apariencia || null,
            },
        };
    }
    async loginPin(pin, tienda_id, user_id) {
        const where = { pin, tienda_id, activo: true };
        if (user_id)
            where.id = user_id;
        const user = await this.usersRepo.findOne({ where });
        if (!user)
            throw new common_1.UnauthorizedException('PIN inválido');
        user.ultimo_login = new Date();
        await this.usersRepo.save(user);
        const payload = {
            sub: user.id,
            email: user.email,
            rol: user.rol,
            tenant_id: user.tenant_id,
            empresa_id: user.empresa_id,
            tienda_id: user.tienda_id,
            nombre: user.nombre,
            modulo: user.modulo || null,
        };
        const empresa2 = user.empresa_id ? await this.empresaRepo.findOne({ where: { id: user.empresa_id } }) : null;
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                tenant_id: user.tenant_id,
                empresa_id: user.empresa_id,
                tienda_id: user.tienda_id,
                modulo: user.modulo || null,
                empresa_nombre: empresa2?.nombre || null,
                empresa_logo: empresa2?.logo_url || null,
                config_apariencia: empresa2?.config_apariencia || null,
            },
        };
    }
    async getUsersByTienda(tienda_id) {
        const users = await this.usersRepo.find({
            where: { tienda_id, activo: true },
            select: ['id', 'nombre', 'rol'],
            order: { nombre: 'ASC' },
        });
        return users;
    }
    async verifyPin(pin, tienda_id) {
        const user = await this.usersRepo.findOne({
            where: { pin, tienda_id, activo: true },
        });
        if (!user)
            return { ok: false, user: null };
        return { ok: true, user: { id: user.id, nombre: user.nombre, rol: user.rol } };
    }
    async validateUser(payload) {
        return this.usersRepo.findOne({ where: { id: payload.sub, activo: true } });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(empresa_entity_1.Empresa)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map