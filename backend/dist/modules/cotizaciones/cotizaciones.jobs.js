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
exports.CotizacionesJobs = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cotizaciones_service_1 = require("./cotizaciones.service");
let CotizacionesJobs = class CotizacionesJobs {
    constructor(ds, service) {
        this.ds = ds;
        this.service = service;
        this.log = new common_1.Logger('CotizacionesJobs');
    }
    async marcarVencidas() {
        const r = await this.ds.query(`UPDATE cotizaciones c
         JOIN cotizacion_versiones v
           ON v.cotizacion_id = c.id AND v.version = c.version_actual
        SET c.estado = 'vencida', c.updated_at = NOW()
      WHERE c.estado = 'enviada'
        AND v.respuesta IS NULL
        AND v.vigencia_hasta < CURDATE()`);
        if (r?.affectedRows)
            this.log.warn(`Cotizaciones vencidas: ${r.affectedRows}`);
    }
    async materializarPendientes() {
        const filas = await this.ds.query(`SELECT id FROM cotizaciones
        WHERE estado = 'aceptada' AND pedido_id IS NULL
        ORDER BY updated_at ASC
        LIMIT 20`);
        for (const f of filas) {
            try {
                const r = await this.service.materializarPedido(f.id);
                this.log.log(`Cotización ${f.id} materializada como pedido ${r.folio || r.pedido_id}`);
            }
            catch (e) {
                this.log.error(`Cotización ${f.id} no se pudo materializar: ${e.message}`);
            }
        }
    }
};
exports.CotizacionesJobs = CotizacionesJobs;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CotizacionesJobs.prototype, "marcarVencidas", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CotizacionesJobs.prototype, "materializarPendientes", null);
exports.CotizacionesJobs = CotizacionesJobs = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        cotizaciones_service_1.CotizacionesService])
], CotizacionesJobs);
//# sourceMappingURL=cotizaciones.jobs.js.map