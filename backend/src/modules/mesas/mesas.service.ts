import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mesa, MesaAsignacion, MesaJunta } from './mesa.entity';

@Injectable()
export class MesasService {
  constructor(
    @InjectRepository(Mesa) private mesaRepo: Repository<Mesa>,
    @InjectRepository(MesaAsignacion) private asignRepo: Repository<MesaAsignacion>,
    @InjectRepository(MesaJunta) private juntaRepo: Repository<MesaJunta>,
  ) {}

  findAll(scope: any) {
    return this.mesaRepo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, tienda_id: scope.tienda_id, activo: true },
      order: { numero: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.mesaRepo.findOne({ where: { id } });
  }

  create(data: Partial<Mesa>, scope: any) {
    return this.mesaRepo.save(this.mesaRepo.create({
      ...data,
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
      tienda_id: scope.tienda_id,
    }));
  }

  async update(id: number, data: Partial<Mesa>) {
    const { id: _id, created_at, updated_at, ...clean } = data as any;
    await this.mesaRepo.update(id, clean);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.asignRepo.delete({ mesa_id: id });
    await this.juntaRepo.delete({ mesa_principal_id: id });
    await this.juntaRepo.delete({ mesa_secundaria_id: id });
    await this.mesaRepo.update(id, { activo: false });
    return { deleted: true };
  }

  // --- Asignaciones mesero <-> mesa ---

  async getAsignaciones(tienda_id: number, tenant_id: number, empresa_id: number) {
    return this.asignRepo.find({
      where: { tienda_id, tenant_id, empresa_id, activo: true },
    });
  }

  async asignarMesero(mesa_id: number, user_id: number, user_nombre: string, scope: any) {
    const existing = await this.asignRepo.findOne({
      where: { mesa_id, tienda_id: scope.tienda_id, activo: true },
    });
    if (existing) {
      await this.asignRepo.update(existing.id, { user_id, user_nombre });
      return this.asignRepo.findOne({ where: { id: existing.id } });
    }
    return this.asignRepo.save(this.asignRepo.create({
      mesa_id, user_id, user_nombre,
      tienda_id: scope.tienda_id,
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
    }));
  }

  async desasignarMesero(mesa_id: number, scope: any) {
    await this.asignRepo.delete({ mesa_id, tienda_id: scope.tienda_id });
    return { ok: true };
  }

  async getMeseroAsignado(mesa_id: number, tienda_id: number): Promise<MesaAsignacion | null> {
    return this.asignRepo.findOne({ where: { mesa_id, tienda_id, activo: true } });
  }

  // --- Juntar mesas ---

  async juntarMesas(mesa_principal_id: number, mesa_secundaria_id: number, scope: any) {
    const existe = await this.juntaRepo.findOne({
      where: { mesa_principal_id, mesa_secundaria_id, tienda_id: scope.tienda_id, activo: true },
    });
    if (existe) return existe;

    // Asignar mismo mesero de mesa principal a la secundaria
    const asignacion = await this.getMeseroAsignado(mesa_principal_id, scope.tienda_id);
    if (asignacion) {
      await this.asignarMesero(mesa_secundaria_id, asignacion.user_id, asignacion.user_nombre, scope);
    }

    return this.juntaRepo.save(this.juntaRepo.create({
      mesa_principal_id, mesa_secundaria_id,
      tienda_id: scope.tienda_id,
      tenant_id: scope.tenant_id,
      empresa_id: scope.empresa_id,
    }));
  }

  async separarMesas(mesa_principal_id: number, mesa_secundaria_id: number, tienda_id: number) {
    await this.juntaRepo.delete({ mesa_principal_id, mesa_secundaria_id, tienda_id });
    return { ok: true };
  }

  getMesasJuntas(tienda_id: number) {
    return this.juntaRepo.find({ where: { tienda_id, activo: true } });
  }

  // Genera slug único para self-order (URL del QR)
  generateSelfOrderSlug(tienda_id: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `t${tienda_id}-${rand}`;
  }
}
