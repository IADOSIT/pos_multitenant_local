import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tienda } from './tienda.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class TiendasService {
  constructor(@InjectRepository(Tienda) private repo: Repository<Tienda>) {}

  findAll(scope: any) {
    const where: any = {};
    if (scope.rol !== UserRole.SUPERADMIN) {
      where.tenant_id = scope.tenant_id;
      if (scope.rol !== UserRole.ADMIN) where.empresa_id = scope.empresa_id;
    }
    return this.repo.find({ where, order: { nombre: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Tienda>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Tienda>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
