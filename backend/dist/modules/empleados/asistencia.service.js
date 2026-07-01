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
exports.AsistenciaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const registro_asistencia_entity_1 = require("./registro-asistencia.entity");
const horario_empleado_entity_1 = require("./horario-empleado.entity");
const empleados_service_1 = require("./empleados.service");
let AsistenciaService = class AsistenciaService {
    constructor(repo, horarioRepo, empleadosService) {
        this.repo = repo;
        this.horarioRepo = horarioRepo;
        this.empleadosService = empleadosService;
    }
    async registrarEntrada(empleado_id, empresa_id, tenant_id, timestamp, tipo) {
        const fecha = timestamp.toISOString().split('T')[0];
        const existing = await this.repo.findOne({ where: { empleado_id, fecha } });
        if (existing)
            return { registro: existing, nuevo: false };
        const empleado = await this.empleadosService.findById(empleado_id);
        const dia = timestamp.getDay();
        const horario = await this.horarioRepo.findOne({ where: { empleado_id, dia_semana: dia, activo: true } });
        let estado = registro_asistencia_entity_1.EstadoAsistencia.SIN_HORARIO;
        let minutos_tarde = null;
        if (horario) {
            const [hH, hM] = horario.hora_entrada.split(':').map(Number);
            const limite = new Date(timestamp);
            limite.setHours(hH, hM + horario.tolerancia_minutos, 0, 0);
            const diff = timestamp.getTime() - limite.getTime();
            minutos_tarde = Math.max(0, Math.floor(diff / 60000));
            estado = minutos_tarde === 0 ? registro_asistencia_entity_1.EstadoAsistencia.PUNTUAL : registro_asistencia_entity_1.EstadoAsistencia.TARDE;
        }
        const registro = await this.repo.save(this.repo.create({
            empleado_id,
            tenant_id,
            empresa_id,
            empleado_nombre: `${empleado?.nombre || ''} ${empleado?.apellido || ''}`.trim(),
            fecha,
            timestamp_entrada: timestamp,
            tipo,
            estado,
            minutos_tarde: minutos_tarde ?? undefined,
        }));
        return { registro, nuevo: true };
    }
    async registrarManual(empleado_id, fecha, hora, notas, scope) {
        const empleado = await this.empleadosService.findOne(empleado_id, scope);
        const timestamp = new Date(`${fecha}T${hora}:00`);
        const result = await this.registrarEntrada(empleado.id, scope.empresa_id, scope.tenant_id, timestamp, 'manual');
        if (notas && result.registro) {
            result.registro.notas = notas;
            await this.repo.save(result.registro);
        }
        return result.registro;
    }
    getAsistencias(scope, params) {
        const where = { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id };
        if (params.empleado_id)
            where.empleado_id = parseInt(params.empleado_id, 10);
        if (params.estado)
            where.estado = params.estado;
        if (params.fecha)
            where.fecha = params.fecha;
        return this.repo.find({ where, order: { fecha: 'DESC', timestamp_entrada: 'DESC' }, take: 500 });
    }
    async deleteRegistro(id, scope) {
        const r = await this.repo.findOne({ where: { id, tenant_id: scope.tenant_id } });
        if (!r)
            throw new common_1.NotFoundException();
        return this.repo.remove(r);
    }
    async getKPIs(scope, desde, hasta) {
        const base = [scope.tenant_id, scope.empresa_id, desde, hasta];
        const [res] = await this.repo.query(`SELECT COUNT(*) as total, SUM(estado='puntual') as p, SUM(estado='tarde') as t, SUM(estado='sin_horario') as s,
       AVG(CASE WHEN minutos_tarde>0 THEN minutos_tarde END) as avg_t
       FROM registros_asistencia WHERE tenant_id=? AND empresa_id=? AND fecha BETWEEN ? AND ?`, base);
        const hoy = new Date().toISOString().split('T')[0];
        const [hoyS] = await this.repo.query(`SELECT COUNT(DISTINCT empleado_id) as presentes, SUM(estado='tarde') as tarde_hoy
       FROM registros_asistencia WHERE tenant_id=? AND empresa_id=? AND fecha=?`, [scope.tenant_id, scope.empresa_id, hoy]);
        const topImp = await this.repo.query(`SELECT empleado_id, empleado_nombre, COUNT(*) as tardanzas, AVG(minutos_tarde) as avg_min
       FROM registros_asistencia WHERE tenant_id=? AND empresa_id=? AND fecha BETWEEN ? AND ? AND estado='tarde'
       GROUP BY empleado_id, empleado_nombre ORDER BY tardanzas DESC LIMIT 5`, base);
        const porDia = await this.repo.query(`SELECT fecha, SUM(estado='puntual') as puntuales, SUM(estado='tarde') as tardanzas
       FROM registros_asistencia WHERE tenant_id=? AND empresa_id=? AND fecha BETWEEN ? AND ?
       GROUP BY fecha ORDER BY fecha ASC`, base);
        const p = Number(res.p || 0);
        const t = Number(res.t || 0);
        return {
            total_registros: Number(res.total),
            puntuales: p,
            tardanzas: t,
            sin_horario: Number(res.s || 0),
            pct_puntualidad: p + t > 0 ? Math.round((p / (p + t)) * 1000) / 10 : 0,
            promedio_minutos_tarde: Math.round(Number(res.avg_t || 0)),
            empleados_presentes_hoy: Number(hoyS.presentes || 0),
            empleados_tardanza_hoy: Number(hoyS.tarde_hoy || 0),
            top_impuntuales: topImp.map((r) => ({
                empleado_id: r.empleado_id,
                empleado_nombre: r.empleado_nombre,
                tardanzas: Number(r.tardanzas),
                avg_minutos_tarde: Math.round(Number(r.avg_min || 0)),
            })),
            por_dia: porDia.map((r) => ({ fecha: r.fecha, puntuales: Number(r.puntuales), tardanzas: Number(r.tardanzas) })),
        };
    }
};
exports.AsistenciaService = AsistenciaService;
exports.AsistenciaService = AsistenciaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(registro_asistencia_entity_1.RegistroAsistencia)),
    __param(1, (0, typeorm_1.InjectRepository)(horario_empleado_entity_1.HorarioEmpleado)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        empleados_service_1.EmpleadosService])
], AsistenciaService);
//# sourceMappingURL=asistencia.service.js.map