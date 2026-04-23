import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Empresa } from '../empresas/empresa.entity';
export declare class AuthService {
    private usersRepo;
    private empresaRepo;
    private jwtService;
    constructor(usersRepo: Repository<User>, empresaRepo: Repository<Empresa>, jwtService: JwtService);
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: number;
            nombre: string;
            email: string;
            rol: import("../users/user.entity").UserRole;
            tenant_id: number;
            empresa_id: number;
            tienda_id: number;
            modulo: any;
            empresa_nombre: string | null;
            empresa_logo: string | null;
            config_apariencia: {
                tema: string;
                paleta: string;
            } | null;
        };
    }>;
    loginPin(pin: string, tienda_id: number, user_id?: number): Promise<{
        access_token: string;
        user: {
            id: number;
            nombre: string;
            email: string;
            rol: import("../users/user.entity").UserRole;
            tenant_id: number;
            empresa_id: number;
            tienda_id: number;
            modulo: any;
            empresa_nombre: string | null;
            empresa_logo: string | null;
            config_apariencia: {
                tema: string;
                paleta: string;
            } | null;
        };
    }>;
    getUsersByTienda(tienda_id: number): Promise<User[]>;
    verifyPin(pin: string, tienda_id: number): Promise<{
        ok: boolean;
        user: null;
    } | {
        ok: boolean;
        user: {
            id: number;
            nombre: string;
            rol: import("../users/user.entity").UserRole;
        };
    }>;
    validateUser(payload: any): Promise<User | null>;
}
