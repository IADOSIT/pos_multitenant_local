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
exports.LicenciaGuard = void 0;
const common_1 = require("@nestjs/common");
const licencias_service_1 = require("../../modules/licencias/licencias.service");
const BYPASS_PATHS = ['/api/auth', '/api/licencias', '/api/health', '/api/notificaciones', '/api/uploads', '/api/menu-digital/view', '/api/menu-digital/receive', '/api/public/logistica'];
let LicenciaGuard = class LicenciaGuard {
    constructor(licenciasService) {
        this.licenciasService = licenciasService;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const path = req.path || req.url;
        if (BYPASS_PATHS.some(p => path.startsWith(p)))
            return true;
        if (req.user?.rol === 'superadmin')
            return true;
        const tenantId = req.user?.tenant_id;
        if (!tenantId)
            return true;
        const estado = await this.licenciasService.getEstado(tenantId);
        req.licencia = estado;
        if (estado.bloqueada) {
            if (req.method === 'GET')
                return true;
            throw new common_1.ForbiddenException({
                message: 'Licencia expirada. Solo lectura habilitada.',
                code: 'LICENSE_EXPIRED',
                licencia: estado,
            });
        }
        return true;
    }
};
exports.LicenciaGuard = LicenciaGuard;
exports.LicenciaGuard = LicenciaGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [licencias_service_1.LicenciasService])
], LicenciaGuard);
//# sourceMappingURL=licencia.guard.js.map