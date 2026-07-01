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
exports.BiometricoService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const config_biometrico_entity_1 = require("./config-biometrico.entity");
const empleados_service_1 = require("./empleados.service");
const asistencia_service_1 = require("./asistencia.service");
const fmdMatcher_1 = require("./fmdMatcher");
let BiometricoService = class BiometricoService {
    constructor(configRepo, empleadosService, asistenciaService) {
        this.configRepo = configRepo;
        this.empleadosService = empleadosService;
        this.asistenciaService = asistenciaService;
    }
    async getOrCreateConfig(empresa_id, tenant_id) {
        let c = await this.configRepo.findOne({ where: { empresa_id } });
        if (!c) {
            c = this.configRepo.create({ empresa_id, tenant_id, empresa_token: (0, uuid_1.v4)(), activo: true });
            await this.configRepo.save(c);
        }
        return c;
    }
    async getConfig(scope) {
        return this.getOrCreateConfig(scope.empresa_id, scope.tenant_id);
    }
    async upsertConfig(data, scope) {
        const c = await this.getConfig(scope);
        if (data.activo !== undefined)
            c.activo = data.activo;
        if (data.open_device_enabled !== undefined)
            c.open_device_enabled = data.open_device_enabled;
        if (data.device_ip !== undefined)
            c.device_ip = data.device_ip;
        if (data.device_timer_s !== undefined)
            c.device_timer_s = data.device_timer_s;
        return this.configRepo.save(c);
    }
    async regenerarToken(scope) {
        const c = await this.getConfig(scope);
        c.empresa_token = (0, uuid_1.v4)();
        return this.configRepo.save(c);
    }
    async getTemplates(empresa_token) {
        const config = await this.configRepo.findOne({ where: { empresa_token } });
        if (!config || !config.activo)
            throw new common_1.UnauthorizedException('Token invalido o modulo inactivo');
        const templates = await this.empleadosService.getTemplates(config.empresa_id);
        return templates.map((e) => ({
            empleado_id: e.id,
            nombre: `${e.nombre} ${e.apellido || ''}`.trim(),
            fmd_template: e.fmd_template || null,
        }));
    }
    async heartbeat(empresa_token) {
        const config = await this.configRepo.findOne({ where: { empresa_token } });
        if (!config)
            throw new common_1.UnauthorizedException();
        return { ok: true, refresh_templates: true, activo: config.activo };
    }
    async validarEnrollment(fmdB64, empresa_id, excluir_empleado_id) {
        if (!(0, fmdMatcher_1.isFmd)(fmdB64))
            return { ok: false, reason: 'Formato de huella inválido. Usar SampleFormat.Compressed.' };
        const decoded = (0, fmdMatcher_1.decodeFMD)(fmdB64);
        if (!decoded || decoded.length < 8)
            return { ok: false, reason: 'Huella incompleta (muy pocas minucias). Reintentar.' };
        const templates = (await this.empleadosService.getTemplates(empresa_id))
            .filter((e) => e.fmd_template && (!excluir_empleado_id || e.id !== excluir_empleado_id))
            .map((e) => ({ empleado_id: e.id, fmd_template: e.fmd_template }));
        const matchId = (0, fmdMatcher_1.findMatch)(fmdB64, templates, 55, 8);
        if (matchId)
            return { ok: false, reason: 'Huella ya registrada para otro empleado.' };
        return { ok: true };
    }
    async matchFmd(empresa_id, fmdB64) {
        const templates = (await this.empleadosService.getTemplates(empresa_id)).map((e) => ({
            empleado_id: e.id,
            fmd_template: e.fmd_template,
        }));
        return (0, fmdMatcher_1.findMatch)(fmdB64, templates);
    }
    async procesarMatch(empresa_token, empleado_id, timestamp) {
        const config = await this.configRepo.findOne({ where: { empresa_token } });
        if (!config || !config.activo)
            throw new common_1.UnauthorizedException();
        const ts = timestamp || new Date();
        return this.asistenciaService.registrarEntrada(empleado_id, config.empresa_id, config.tenant_id, ts, 'biometrico');
    }
};
exports.BiometricoService = BiometricoService;
exports.BiometricoService = BiometricoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(config_biometrico_entity_1.ConfigBiometrico)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        empleados_service_1.EmpleadosService,
        asistencia_service_1.AsistenciaService])
], BiometricoService);
//# sourceMappingURL=biometrico.service.js.map