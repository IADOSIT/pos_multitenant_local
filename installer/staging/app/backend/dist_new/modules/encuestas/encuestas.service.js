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
exports.EncuestasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const encuesta_entity_1 = require("./encuesta.entity");
let EncuestasService = class EncuestasService {
    constructor(repo) {
        this.repo = repo;
    }
    create(data) {
        return this.repo.save(this.repo.create(data));
    }
    findByPedido(pedido_id) {
        return this.repo.findOne({ where: { pedido_id } });
    }
    async responder(pedido_id, data) {
        const encuesta = await this.repo.findOne({ where: { pedido_id } });
        if (!encuesta)
            return null;
        if (encuesta.completada)
            return encuesta;
        encuesta.calificacion_servicio = data.calificacion_servicio;
        encuesta.calificacion_comida = data.calificacion_comida;
        encuesta.comentario = data.comentario || null;
        encuesta.completada = true;
        return this.repo.save(encuesta);
    }
    async getKPIs(scope, desde, hasta) {
        const where = {
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            tienda_id: scope.tienda_id,
            completada: true,
        };
        if (desde && hasta) {
            where.created_at = (0, typeorm_2.Between)(new Date(desde), new Date(hasta + 'T23:59:59'));
        }
        const encuestas = await this.repo.find({ where });
        if (!encuestas.length)
            return { total: 0, promedio_servicio: 0, promedio_comida: 0, por_mesero: [] };
        const promedio_servicio = encuestas.reduce((a, e) => a + e.calificacion_servicio, 0) / encuestas.length;
        const promedio_comida = encuestas.reduce((a, e) => a + e.calificacion_comida, 0) / encuestas.length;
        const porMesero = {};
        for (const e of encuestas) {
            if (!e.mesero_id)
                continue;
            if (!porMesero[e.mesero_id]) {
                porMesero[e.mesero_id] = { mesero_nombre: e.mesero_nombre || 'Sin nombre', total: 0, suma_servicio: 0, suma_comida: 0 };
            }
            porMesero[e.mesero_id].total++;
            porMesero[e.mesero_id].suma_servicio += e.calificacion_servicio;
            porMesero[e.mesero_id].suma_comida += e.calificacion_comida;
        }
        const por_mesero = Object.entries(porMesero).map(([id, d]) => ({
            mesero_id: Number(id),
            mesero_nombre: d.mesero_nombre,
            total_encuestas: d.total,
            promedio_servicio: +(d.suma_servicio / d.total).toFixed(2),
            promedio_comida: +(d.suma_comida / d.total).toFixed(2),
        }));
        return {
            total: encuestas.length,
            promedio_servicio: +promedio_servicio.toFixed(2),
            promedio_comida: +promedio_comida.toFixed(2),
            por_mesero,
        };
    }
    findAll(scope, limit = 50) {
        return this.repo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, tienda_id: scope.tienda_id },
            order: { created_at: 'DESC' },
            take: limit,
        });
    }
};
exports.EncuestasService = EncuestasService;
exports.EncuestasService = EncuestasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(encuesta_entity_1.EncuestaServicio)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EncuestasService);
//# sourceMappingURL=encuestas.service.js.map