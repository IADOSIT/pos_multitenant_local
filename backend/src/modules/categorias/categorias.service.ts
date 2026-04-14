import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './categoria.entity';

@Injectable()
export class CategoriasService {
  constructor(@InjectRepository(Categoria) private repo: Repository<Categoria>) {}

  findAll(scope: any) {
    const adminRoles = ['superadmin', 'admin', 'manager'];
    const where: any = { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true };
    if (scope.modulo && !adminRoles.includes(scope.rol)) {
      where.modulo = scope.modulo;
    }
    return this.repo.find({ where, order: { orden: 'ASC', nombre: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['productos'] });
  }

  create(data: Partial<Categoria>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Categoria>) {
    const { id: _id, created_at, updated_at, ...rest } = data as any;
    const clean: any = { ...rest };
    if (clean.imagen_url === '') clean.imagen_url = null;
    delete clean.productos;
    await this.repo.update(id, clean);
    return this.findOne(id);
  }

  async softDelete(id: number) {
    await this.repo.update(id, { activo: false });
    return { deleted: true };
  }
}
