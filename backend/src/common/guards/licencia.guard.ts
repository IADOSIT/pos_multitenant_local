import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { LicenciasService } from '../../modules/licencias/licencias.service';

// Routes that bypass license check
// Llamadas servicio-a-servicio: ya van autenticadas por InternalSecretGuard y
// no representan a un usuario cuya licencia se pueda evaluar.
// /api/bridge: descarga del instalador del bridge; se baja en la PC de la caja,
// sin sesion iniciada, y solo entrega el mismo binario para todas las tiendas.
// /api/mantenimiento va aqui a proposito: respaldar y revertir es precisamente
// lo que un cliente con la licencia bloqueada necesita poder hacer. Igual exige
// sesion y rol admin/superadmin en su propio controlador.
const BYPASS_PATHS = ['/api/auth', '/api/licencias', '/api/health', '/api/deploy', '/api/mantenimiento', '/api/notificaciones', '/api/uploads', '/api/menu-digital/view', '/api/menu-digital/receive', '/api/public/logistica', '/api/public/biometrico', '/api/internal/', '/api/bridge'];

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
