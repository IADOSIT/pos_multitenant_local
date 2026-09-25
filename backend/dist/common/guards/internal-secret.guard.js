"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalSecretGuard = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let InternalSecretGuard = class InternalSecretGuard {
    canActivate(context) {
        const esperado = process.env.INTERNAL_API_SECRET || '';
        if (!esperado)
            return false;
        const req = context.switchToHttp().getRequest();
        const recibido = String(req?.headers?.['x-internal-secret'] || '');
        if (recibido.length !== esperado.length)
            return false;
        return crypto.timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
    }
};
exports.InternalSecretGuard = InternalSecretGuard;
exports.InternalSecretGuard = InternalSecretGuard = __decorate([
    (0, common_1.Injectable)()
], InternalSecretGuard);
//# sourceMappingURL=internal-secret.guard.js.map