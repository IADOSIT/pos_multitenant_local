import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleado } from './empleado.entity';
import { HorarioEmpleado } from './horario-empleado.entity';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado) private readonly repo: Repository<Empleado>,
    @InjectRepository(HorarioEmpleado) private readonly horarioRepo: Repository<HorarioEmpleado>,
  ) {}

  findAll(scope: any) {
    return this.repo.find({ where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id }, order: { nombre: 'ASC' } });
  }

  async findOne(id: number, scope: any) {
    const e = await this.repo.findOne({ where: { id, tenant_id: scope.tenant_id } });
    if (!e) throw new NotFoundException('Empleado no encontrado');
    return e;
  }

  create(data: any, scope: any) {
    return this.repo.save(this.repo.create({ ...data, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id }));
  }

  async update(id: number, data: any, scope: any) {
    const e = await this.findOne(id, scope);
    const { fmd_template, fmd_enrolled_at, tenant_id, empresa_id, ...safe } = data;
    Object.assign(e, safe);
    return this.repo.save(e);
  }

  async toggle(id: number, scope: any) {
    const e = await this.findOne(id, scope);
    e.activo = !e.activo;
    return this.repo.save(e);
  }

  async setFmdTemplate(id: number, fmdB64: string, scope: any) {
    const e = await this.findOne(id, scope);
    e.fmd_template = fmdB64;
    e.fmd_enrolled_at = new Date();
    return this.repo.save(e);
  }

  async clearFmdTemplate(id: number, scope: any) {
    const e = await this.findOne(id, scope);
    e.fmd_template = null;
    e.fmd_enrolled_at = null;
    return this.repo.save(e);
  }

  // Usado por el bridge para descargar templates
  getTemplates(empresa_id: number) {
    return this.repo.find({
      where: { empresa_id, activo: true },
      select: ['id', 'nombre', 'apellido', 'fmd_template'],
    });
  }

  // Usado por asistencia.service.ts
  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async setHorario(empleado_id: number, horarios: any[], scope: any) {
    await this.findOne(empleado_id, scope);
    await this.horarioRepo.delete({ empleado_id });
    const news = horarios
      .filter((h) => h.activo && h.hora_entrada)
      .map((h) =>
        this.horarioRepo.create({
          empleado_id,
          empresa_id: scope.empresa_id,
          tenant_id: scope.tenant_id,
          dia_semana: h.dia_semana,
          hora_entrada: h.hora_entrada,
          tolerancia_minutos: h.tolerancia_minutos ?? 10,
          activo: true,
        }),
      );
    return this.horarioRepo.save(news);
  }

  getHorarios(empleado_id: number, scope: any) {
    return this.horarioRepo.find({ where: { empleado_id, tenant_id: scope.tenant_id } });
  }
}
