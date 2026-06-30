import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Empresa } from '../empresas/empresa.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Empresa) private empresaRepo: Repository<Empresa>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    let user: User | null;
    try {
      user = await this.usersRepo.findOne({ where: { email, activo: true } });
    } catch (err) {
      this.logger.error(`[login] DB error en findOne(email=${email}): ${err.message}`, err.stack);
      throw new InternalServerErrorException(`DB error: ${err.message}`);
    }

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    user.ultimo_login = new Date();
    try {
      await this.usersRepo.save(user);
    } catch (err) {
      this.logger.error(`[login] DB error en save(user.id=${user.id}): ${err.message}`, err.stack);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      tenant_id: user.tenant_id,
      empresa_id: user.empresa_id,
      tienda_id: user.tienda_id,
      nombre: user.nombre,
      modulo: (user as any).modulo || null,
    };

    let empresa: Empresa | null = null;
    try {
      empresa = user.empresa_id ? await this.empresaRepo.findOne({ where: { id: user.empresa_id } }) : null;
    } catch (err) {
      this.logger.error(`[login] DB error en findOne empresa(id=${user.empresa_id}): ${err.message}`, err.stack);
    }

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
        modulo: (user as any).modulo || null,
        empresa_nombre: empresa?.nombre || null,
        empresa_logo: empresa?.logo_url || null,
        config_apariencia: empresa?.config_apariencia || null,
      },
    };
  }

  async loginPin(pin: string, tienda_id: number, user_id?: number) {
    const where: any = { pin, tienda_id, activo: true };
    if (user_id) where.id = user_id;
    const user = await this.usersRepo.findOne({ where });
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
      modulo: (user as any).modulo || null,
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
        modulo: (user as any).modulo || null,
        empresa_nombre: empresa2?.nombre || null,
        empresa_logo: empresa2?.logo_url || null,
        config_apariencia: empresa2?.config_apariencia || null,
      },
    };
  }

  async getUsersByTienda(tienda_id: number) {
    const users = await this.usersRepo.find({
      where: { tienda_id, activo: true },
      select: ['id', 'nombre', 'rol'],
      order: { nombre: 'ASC' },
    });
    return users;
  }

  async verifyPin(pin: string, tienda_id: number) {
    const user = await this.usersRepo.findOne({
      where: { pin, tienda_id, activo: true },
    });
    if (!user) return { ok: false, user: null };
    return { ok: true, user: { id: user.id, nombre: user.nombre, rol: user.rol } };
  }

  async validateUser(payload: any) {
    return this.usersRepo.findOne({ where: { id: payload.sub, activo: true } });
  }
}
