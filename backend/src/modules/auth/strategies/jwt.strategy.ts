import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'CAMBIAR_EN_PRODUCCION_iados_jwt_secret_key_2024',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      tenant_id: user.tenant_id,
      empresa_id: user.empresa_id,
      tienda_id: user.tienda_id,
    };
  }
}
