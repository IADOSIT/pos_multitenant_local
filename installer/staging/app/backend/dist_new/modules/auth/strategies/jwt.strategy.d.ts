import { Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(payload: any): Promise<{
        id: number;
        email: string;
        nombre: string;
        rol: import("../../users/user.entity").UserRole;
        tenant_id: number;
        empresa_id: number;
        tienda_id: number;
    }>;
}
export {};
