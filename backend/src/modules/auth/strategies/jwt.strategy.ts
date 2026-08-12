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
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const user = await this.authService.validateUser(payload);
    if (!user) throw new UnauthorizedException();
    const base = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      tenant_id: user.tenant_id,
      empresa_id: user.empresa_id,
      tienda_id: user.tienda_id,
      modulo: (user as any).modulo || null,
    };

    // "Ver como tienda": el superadmin puede elegir una tienda desde el selector global del
    // frontend (MainLayout) y esta cabecera hace que TODO el backend (que ya filtra por
    // TenantScope en cada modulo) opere sobre esa tienda especifica, sin tocar ningun
    // controlador/servicio existente. rol se mantiene 'superadmin' (sigue pasando @Roles),
    // solo cambian tenant_id/empresa_id/tienda_id.
    if (user.rol === 'superadmin') {
      const vTenant  = parseInt(req.headers['x-view-tenant-id'], 10);
      const vEmpresa = parseInt(req.headers['x-view-empresa-id'], 10);
      const vTienda  = parseInt(req.headers['x-view-tienda-id'], 10);
      if (Number.isInteger(vTenant) && Number.isInteger(vEmpresa) && Number.isInteger(vTienda)) {
        return { ...base, tenant_id: vTenant, empresa_id: vEmpresa, tienda_id: vTienda, viendo_como: true };
      }
      // Superadmin SIN "ver como" tienda: scope realmente nulo (no cae al tenant/empresa
      // propios de la cuenta superadmin). Así los endpoints por-tienda (productos POS,
      // dashboard, caja, etc.) devuelven vacío en vez de datos de la tienda del superadmin.
      // Los endpoints globales (tenants, empresas, usuarios, licencias, listar tiendas)
      // ramifican por rol === 'superadmin', no por estos ids, así que no se ven afectados.
      return { ...base, tenant_id: null, empresa_id: null, tienda_id: null };
    }

    return base;
  }
}
