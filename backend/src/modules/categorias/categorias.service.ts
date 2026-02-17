import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './categoria.entity';

@Injectable()
export class CategoriasService {
  constructor(@InjectRepository(Categoria) private repo: Repository<Categoria>) {}

  findAll(scope: any) {
    return this.repo.find({
      where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, activo: true },
      order: { orden: 'ASC', nombre: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['productos'] });
  }

  create(data: Partial<Categoria>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Categoria>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }
}
