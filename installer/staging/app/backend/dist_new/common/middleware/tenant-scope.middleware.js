"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantScopeMiddleware = void 0;
const common_1 = require("@nestjs/common");
let TenantScopeMiddleware = class TenantScopeMiddleware {
    use(req, res, next) {
        if (req['user']) {
            const user = req['user'];
            req.tenantScope = {
                tenant_id: user.tenant_id,
                empresa_id: user.empresa_id,
                tienda_id: user.tienda_id,
                rol: user.rol,
            };
        }
        next();
    }
};
exports.TenantScopeMiddleware = TenantScopeMiddleware;
exports.TenantScopeMiddleware = TenantScopeMiddleware = __decorate([
    (0, common_1.Injectable)()
], TenantScopeMiddleware);
//# sourceMappingURL=tenant-scope.middleware.js.map