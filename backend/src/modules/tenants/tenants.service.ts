import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private repo: Repository<Tenant>) {}

  findAll() {
    return this.repo.find({ order: { nombre: 'ASC' }, relations: ['empresas'] });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['empresas', 'empresas.tiendas'] });
  }

  async create(data: Partial<Tenant>) {
    const slug = data.nombre.toLowerCase().replace(/\s+/g, '-');
    const exists = await this.repo.findOne({ where: { slug } });
    if (exists) throw new BadRequestException('Ya existe un tenant con ese nombre');
    return this.repo.save(this.repo.create({ ...data, slug }));
  }

  async update(id: number, data: Partial<Tenant>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }
}
