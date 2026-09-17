import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

// Autenticacion servicio-a-servicio para las llamadas que POS_STORE_API hace al
// POS por la red interna de docker. No hay usuario ni JWT: el scope sale del
// registro que se esta tocando, no de un token.
@Injectable()
export class InternalSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const esperado = process.env.INTERNAL_API_SECRET || '';
    // Sin secreto configurado el endpoint queda cerrado, no abierto.
    if (!esperado) return false;

    const req = context.switchToHttp().getRequest();
    const recibido = String(req?.headers?.['x-internal-secret'] || '');
    if (recibido.length !== esperado.length) return false;
    return crypto.timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
  }
}
