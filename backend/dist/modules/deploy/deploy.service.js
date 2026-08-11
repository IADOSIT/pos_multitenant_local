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
exports.DeployService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const app_deploy_entity_1 = require("./app-deploy.entity");
let DeployService = class DeployService {
    constructor(repo) {
        this.repo = repo;
        this.logger = new common_1.Logger('DeployService');
    }
    async onModuleInit() {
        try {
            const version = process.env.APP_VERSION || '';
            await this.repo.save({ id: 1, version, estado: 'completada', mensaje: null });
            this.logger.log(`Versión desplegada registrada: ${version} (completada)`);
        }
        catch (e) {
            this.logger.warn(`No se pudo registrar la versión de despliegue: ${e.message}`);
        }
    }
    async get() {
        let row = await this.repo.findOne({ where: { id: 1 } });
        if (!row) {
            row = await this.repo.save({ id: 1, version: process.env.APP_VERSION || '', estado: 'completada', mensaje: null });
        }
        return { version: row.version, estado: row.estado, mensaje: row.mensaje, updated_at: row.updated_at };
    }
    async setEstado(estado, opts = {}) {
        const row = (await this.repo.findOne({ where: { id: 1 } })) || this.repo.create({ id: 1, version: process.env.APP_VERSION || '' });
        row.estado = estado;
        if (opts.version !== undefined)
            row.version = opts.version;
        if (opts.mensaje !== undefined)
            row.mensaje = opts.mensaje;
        await this.repo.save(row);
        return this.get();
    }
};
exports.DeployService = DeployService;
exports.DeployService = DeployService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(app_deploy_entity_1.AppDeploy)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DeployService);
//# sourceMappingURL=deploy.service.js.map