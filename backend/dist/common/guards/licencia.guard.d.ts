import { CanActivate, ExecutionContext } from '@nestjs/common';
import { LicenciasService } from '../../modules/licencias/licencias.service';
export declare class LicenciaGuard implements CanActivate {
    private licenciasService;
    constructor(licenciasService: LicenciasService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
