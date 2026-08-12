import { Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(req: any, payload: any): Promise<{
        id: number;
        email: string;
        nombre: string;
        rol: import("../../users/user.entity").UserRole;
        tenant_id: number;
        empresa_id: number;
        tienda_id: number;
        modulo: any;
    } | {
        tenant_id: number;
        empresa_id: number;
        tienda_id: number;
        viendo_como: boolean;
        id: number;
        email: string;
        nombre: string;
        rol: import("../../users/user.entity").UserRole;
        modulo: any;
    } | {
        tenant_id: null;
        empresa_id: null;
        tienda_id: null;
        id: number;
        email: string;
        nombre: string;
        rol: import("../../users/user.entity").UserRole;
        modulo: any;
    }>;
}
export {};
