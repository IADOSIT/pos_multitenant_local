"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantScope = void 0;
const common_1 = require("@nestjs/common");
exports.TenantScope = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const scope = request.tenantScope || request.user;
    return data ? scope?.[data] : scope;
});
//# sourceMappingURL=tenant.decorator.js.map