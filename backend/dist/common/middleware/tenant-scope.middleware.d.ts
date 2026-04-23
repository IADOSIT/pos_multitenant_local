import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export interface TenantRequest extends Request {
    tenantScope?: {
        tenant_id: number;
        empresa_id: number;
        tienda_id: number;
        rol: string;
        modulo?: string | null;
    };
}
export declare class TenantScopeMiddleware implements NestMiddleware {
    use(req: TenantRequest, res: Response, next: NextFunction): void;
}
