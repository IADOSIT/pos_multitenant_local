import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Empresa } from '../empresas/empresa.entity';
import { Tienda } from '../tiendas/tienda.entity';
import { CreateUserWizardDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Tenant) private tenantsRepo: Repository<Tenant>,
    @InjectRepository(Empresa) private empresasRepo: Repository<Empresa>,
    @InjectRepository(Tienda) private tiendasRepo: Repository<Tienda>,
  ) {}

  async findAll(scope: any) {
    const where: any = {};
    if (scope.rol !== UserRole.SUPERADMIN) {
      where.tenant_id = scope.tenant_id;
      if (scope.rol !== UserRole.ADMIN) {
        where.empresa_id = scope.empresa_id;
      }
    }
    return this.usersRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async findOne(id: number, scope: any) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    if (scope.rol !== UserRole.SUPERADMIN && user.tenant_id !== scope.tenant_id) {
      throw new ForbiddenException();
    }
    return user;
  }

  async createWithWizard(dto: CreateUserWizardDto, scope: any) {
    if (scope.rol !== UserRole.SUPERADMIN && scope.rol !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo SuperAdmin o Admin pueden crear usuarios');
    }

    let tenant_id = dto.tenant_id;
    let empresa_id = dto.empresa_id;
    let tienda_id = dto.tienda_id;

    // SuperAdmin: puede crear tenant/empresa/tienda
    if (scope.rol === UserRole.SUPERADMIN) {
      if (dto.nuevo_tenant) {
        const tenant = this.tenantsRepo.create({
          nombre: dto.nuevo_tenant.nombre,
          slug: dto.nuevo_tenant.nombre.toLowerCase().replace(/\s+/g, '-'),
          razon_social: dto.nuevo_tenant.razon_social,
          rfc: dto.nuevo_tenant.rfc,
        });
        const saved = await this.tenantsRepo.save(tenant);
        tenant_id = saved.id;
      }

      if (dto.nueva_empresa && tenant_id) {
        const empresa = this.empresasRepo.create({
          tenant_id,
          nombre: dto.nueva_empresa.nombre,
          razon_social: dto.nueva_empresa.razon_social,
        });
        const saved = await this.empresasRepo.save(empresa);
        empresa_id = saved.id;
      }

      if (dto.nueva_tienda && tenant_id && empresa_id) {
        const tienda = this.tiendasRepo.create({
          tenant_id,
          empresa_id,
          nombre: dto.nueva_tienda.nombre,
          direccion: dto.nueva_tienda.direccion,
        });
        const saved = await this.tiendasRepo.save(tienda);
        tienda_id = saved.id;
      }
    } else {
      // Admin solo puede dentro de su tenant
      tenant_id = scope.tenant_id;
      if (!empresa_id) empresa_id = scope.empresa_id;
    }

    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email ya registrado');

    const hashedPass = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      nombre: dto.nombre,
      email: dto.email,
      password: hashedPass,
      rol: dto.rol || UserRole.CAJERO,
      pin: dto.pin,
      tenant_id,
      empresa_id,
      tienda_id,
    });

    const saved = await this.usersRepo.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async update(id: number, data: Partial<User>, scope: any) {
    const user = await this.findOne(id, scope);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    Object.assign(user, data);
    const saved = await this.usersRepo.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async toggleActive(id: number, scope: any) {
    const user = await this.findOne(id, scope);
    user.activo = !user.activo;
    return this.usersRepo.save(user);
  }
}
