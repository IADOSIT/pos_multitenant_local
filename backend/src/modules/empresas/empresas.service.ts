import { Injectable } from '@nestjs/common';
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
    await this.repo.update(id, data);
    return this.findOne(id);
  }
}
