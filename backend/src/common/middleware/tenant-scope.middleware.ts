import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantScope?: {
    tenant_id: number;
    empresa_id: number;
    tienda_id: number;
    rol: string;
  };
}

@Injectable()
export class TenantScopeMiddleware implements NestMiddleware {
  use(req: TenantRequest, res: Response, next: NextFunction) {
    if (req['user']) {
      const user = req['user'] as any;
      req.tenantScope = {
        tenant_id: user.tenant_id,
        empresa_id: user.empresa_id,
        tienda_id: user.tienda_id,
        rol: user.rol,
      };
    }
    next();
  }
}
