import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Empresa } from '../empresas/empresa.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Empresa) private empresaRepo: Repository<Empresa>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email, activo: true },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    user.ultimo_login = new Date();
    await this.usersRepo.save(user);

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      tenant_id: user.tenant_id,
      empresa_id: user.empresa_id,
      tienda_id: user.tienda_id,
      nombre: user.nombre,
    };

    const empresa = user.empresa_id ? await this.empresaRepo.findOne({ where: { id: user.empresa_id } }) : null;

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        tenant_id: user.tenant_id,
        empresa_id: user.empresa_id,
        tienda_id: user.tienda_id,
        empresa_nombre: empresa?.nombre || null,
        empresa_logo: empresa?.logo_url || null,
        config_apariencia: empresa?.config_apariencia || null,
      },
    };
  }

  async loginPin(pin: string, tienda_id: number) {
    const user = await this.usersRepo.findOne({
      where: { pin, tienda_id, activo: true },
    });
    if (!user) throw new UnauthorizedException('PIN inválido');

    user.ultimo_login = new Date();
    await this.usersRepo.save(user);

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      tenant_id: user.tenant_id,
      empresa_id: user.empresa_id,
      tienda_id: user.tienda_id,
      nombre: user.nombre,
    };

    const empresa2 = user.empresa_id ? await this.empresaRepo.findOne({ where: { id: user.empresa_id } }) : null;

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        tenant_id: user.tenant_id,
        empresa_id: user.empresa_id,
        tienda_id: user.tienda_id,
        empresa_nombre: empresa2?.nombre || null,
        empresa_logo: empresa2?.logo_url || null,
        config_apariencia: empresa2?.config_apariencia || null,
      },
    };
  }

  async validateUser(payload: any) {
    return this.usersRepo.findOne({ where: { id: payload.sub, activo: true } });
  }
}
