import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './empresa.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class EmpresasService {
  constructor(@InjectRepository(Empresa) private repo: Repository<Empresa>) {}

  findAll(scope: any) {
    const where: any = {};
    if (scope.rol !== UserRole.SUPERADMIN) where.tenant_id = scope.tenant_id;
    return this.repo.find({ where, relations: ['tiendas'], order: { nombre: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['tiendas'] });
  }

  create(data: Partial<Empresa>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Empresa>) {
    const { id: _id, created_at, updated_at, tiendas, ...clean } = data as any;
    await this.repo.update(id, clean);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }

  async setConfigEspecial(
    id: number,
    data: { mostrar_precios?: boolean; precio_manual?: boolean; notif_cliente_estados?: boolean },
    scope: any,
  ) {
    const where: any = { id };
    if (scope.rol !== UserRole.SUPERADMIN) where.tenant_id = scope.tenant_id;
    const empresa = await this.repo.findOne({ where });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    empresa.config_especial = {
      ...(empresa.config_especial || {}),
      ...data,
    };
    const saved = await this.repo.save(empresa);
    return { config_especial: saved.config_especial };
  }

  // Usado por módulos públicos (self-order, e-commerce) para respetar la config sin exponer el resto de la entidad
  async getConfigEspecial(empresa_id: number): Promise<{ mostrar_precios: boolean; precio_manual: boolean; notif_cliente_estados: boolean }> {
    const empresa = await this.repo.findOne({ where: { id: empresa_id } });
    const cfg = empresa?.config_especial || {};
    return {
      mostrar_precios: cfg.mostrar_precios !== false, // true por defecto si undefined
      precio_manual: cfg.precio_manual === true,       // false por defecto
      notif_cliente_estados: cfg.notif_cliente_estados === true, // false por defecto
    };
  }
}
