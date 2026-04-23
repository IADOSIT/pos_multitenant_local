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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const os = require("os");
let HealthController = class HealthController {
    constructor(ds) {
        this.ds = ds;
    }
    async check() {
        try {
            await this.ds.query('SELECT 1');
            return {
                status: 'ok',
                app: 'POS-iaDoS',
                brand: 'iaDoS',
                db: 'connected',
                db_host: process.env.DB_HOST || 'localhost',
                version: process.env.APP_VERSION || '',
                timestamp: new Date().toISOString(),
            };
        }
        catch (err) {
            return {
                status: 'error',
                db: 'disconnected',
                error: err.message,
            };
        }
    }
    getInfo() {
        const hostname = os.hostname();
        const port = Number(process.env.APP_PORT) || 3000;
        const mode = process.env.INSTALL_MODE || 'local';
        const ips = [];
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of (interfaces[name] || [])) {
                if (iface.family === 'IPv4' && !iface.internal &&
                    !iface.address.startsWith('169.254')) {
                    ips.push(iface.address);
                }
            }
        }
        return {
            hostname,
            port,
            mode,
            ips,
            urls: {
                local: `http://localhost:${port}`,
                hostname: `http://${hostname}:${port}`,
                network: ips.map(ip => `http://${ip}:${port}`),
            },
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "getInfo", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], HealthController);
//# sourceMappingURL=health.controller.js.map