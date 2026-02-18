import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { LicenciasService } from '../../modules/licencias/licencias.service';

// Routes that bypass license check
const BYPASS_PATHS = ['/api/auth', '/api/licencias', '/api/health', '/api/notificaciones', '/api/uploads'];

@Injectable()
export class LicenciaGuard implements CanActivate {
  constructor(private licenciasService: LicenciasService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const path = req.path || req.url;

    // Skip for non-protected routes
    if (BYPASS_PATHS.some(p => path.startsWith(p))) return true;

    // Superadmin never restricted
    if (req.user?.rol === 'superadmin') return true;

    // Need authenticated user with tenant
    const tenantId = req.user?.tenant_id;
    if (!tenantId) return true; // Let auth guard handle

    const estado = await this.licenciasService.getEstado(tenantId);

    // Attach license info to request
    req.licencia = estado;

    // If expired and blocked, only allow GET requests (read-only)
    if (estado.bloqueada) {
      if (req.method === 'GET') return true;
      throw new ForbiddenException({
        message: 'Licencia expirada. Solo lectura habilitada.',
        code: 'LICENSE_EXPIRED',
        licencia: estado,
      });
    }

    return true;
  }
}
