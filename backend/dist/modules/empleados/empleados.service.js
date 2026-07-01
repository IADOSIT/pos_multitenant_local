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
exports.EmpleadosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
const horario_empleado_entity_1 = require("./horario-empleado.entity");
let EmpleadosService = class EmpleadosService {
    constructor(repo, horarioRepo) {
        this.repo = repo;
        this.horarioRepo = horarioRepo;
    }
    findAll(scope) {
        return this.repo.find({ where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id }, order: { nombre: 'ASC' } });
    }
    async findOne(id, scope) {
        const e = await this.repo.findOne({ where: { id, tenant_id: scope.tenant_id } });
        if (!e)
            throw new common_1.NotFoundException('Empleado no encontrado');
        return e;
    }
    create(data, scope) {
        return this.repo.save(this.repo.create({ ...data, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id }));
    }
    async update(id, data, scope) {
        const e = await this.findOne(id, scope);
        const { fmd_template, fmd_enrolled_at, tenant_id, empresa_id, ...safe } = data;
        Object.assign(e, safe);
        return this.repo.save(e);
    }
    async toggle(id, scope) {
        const e = await this.findOne(id, scope);
        e.activo = !e.activo;
        return this.repo.save(e);
    }
    async setFmdTemplate(id, fmdB64, scope) {
        const e = await this.findOne(id, scope);
        e.fmd_template = fmdB64;
        e.fmd_enrolled_at = new Date();
        return this.repo.save(e);
    }
    async clearFmdTemplate(id, scope) {
        const e = await this.findOne(id, scope);
        e.fmd_template = null;
        e.fmd_enrolled_at = null;
        return this.repo.save(e);
    }
    getTemplates(empresa_id) {
        return this.repo.find({
            where: { empresa_id, activo: true },
            select: ['id', 'nombre', 'apellido', 'fmd_template'],
        });
    }
    findById(id) {
        return this.repo.findOne({ where: { id } });
    }
    async setHorario(empleado_id, horarios, scope) {
        await this.findOne(empleado_id, scope);
        await this.horarioRepo.delete({ empleado_id });
        const news = horarios
            .filter((h) => h.activo && h.hora_entrada)
            .map((h) => this.horarioRepo.create({
            empleado_id,
            empresa_id: scope.empresa_id,
            tenant_id: scope.tenant_id,
            dia_semana: h.dia_semana,
            hora_entrada: h.hora_entrada,
            tolerancia_minutos: h.tolerancia_minutos ?? 10,
            activo: true,
        }));
        return this.horarioRepo.save(news);
    }
    getHorarios(empleado_id, scope) {
        return this.horarioRepo.find({ where: { empleado_id, tenant_id: scope.tenant_id } });
    }
};
exports.EmpleadosService = EmpleadosService;
exports.EmpleadosService = EmpleadosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(empleado_entity_1.Empleado)),
    __param(1, (0, typeorm_1.InjectRepository)(horario_empleado_entity_1.HorarioEmpleado)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], EmpleadosService);
//# sourceMappingURL=empleados.service.js.map