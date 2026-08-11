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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const auth_service_1 = require("../auth.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(authService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'CAMBIAR_EN_PRODUCCION_iados_jwt_secret_key_2024',
            passReqToCallback: true,
        });
        this.authService = authService;
    }
    async validate(req, payload) {
        const user = await this.authService.validateUser(payload);
        if (!user)
            throw new common_1.UnauthorizedException();
        const base = {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol,
            tenant_id: user.tenant_id,
            empresa_id: user.empresa_id,
            tienda_id: user.tienda_id,
            modulo: user.modulo || null,
        };
        if (user.rol === 'superadmin') {
            const vTenant = parseInt(req.headers['x-view-tenant-id'], 10);
            const vEmpresa = parseInt(req.headers['x-view-empresa-id'], 10);
            const vTienda = parseInt(req.headers['x-view-tienda-id'], 10);
            if (Number.isInteger(vTenant) && Number.isInteger(vEmpresa) && Number.isInteger(vTienda)) {
                return { ...base, tenant_id: vTenant, empresa_id: vEmpresa, tienda_id: vTienda, viendo_como: true };
            }
            return { ...base, tenant_id: null, empresa_id: null, tienda_id: null };
        }
        return base;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map