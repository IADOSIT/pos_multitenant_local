import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tienda } from './tienda.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class TiendasService {
  constructor(@InjectRepository(Tienda) private repo: Repository<Tienda>) {}

  private generateSlug(nombre: string, id: number): string {
    const normalized = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s-]/g, '')    // remove non-alphanumeric except space/dash
      .trim()
      .replace(/\s+/g, '-')            // spaces to dashes
      .replace(/-+/g, '-');            // reduce multiple dashes
    const slug = `${normalized}-${id}`.substring(0, 80);
    return slug;
  }

  findAll(scope: any) {
    const where: any = {};
    if (scope.rol !== UserRole.SUPERADMIN) {
      where.tenant_id = scope.tenant_id;
      if (scope.rol !== UserRole.ADMIN) where.empresa_id = scope.empresa_id;
    }
    return this.repo.find({ where, order: { nombre: 'ASC' } });
  }

  async findOne(id: number) {
    const tienda = await this.repo.findOne({ where: { id } });
    if (tienda && !tienda.slug) {
      tienda.slug = this.generateSlug(tienda.nombre, tienda.id);
      await this.repo.save(tienda);
    }
    return tienda;
  }

  async create(data: Partial<Tienda>) {
    const saved = await this.repo.save(this.repo.create(data));
    if (!saved.slug) {
      saved.slug = this.generateSlug(saved.nombre, saved.id);
      await this.repo.save(saved);
    }
    return saved;
  }

  async update(id: number, data: Partial<Tienda>) {
    await this.repo.update(id, data);
    const tienda = await this.repo.findOne({ where: { id } });
    if (tienda && !tienda.slug) {
      tienda.slug = this.generateSlug(tienda.nombre, tienda.id);
      await this.repo.save(tienda);
    }
    return tienda;
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }

  async findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug, activo: true } });
  }
}
