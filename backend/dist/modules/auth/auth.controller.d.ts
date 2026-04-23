import { AuthService } from './auth.service';
import { LoginDto, LoginPinDto, VerifyPinDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
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
    loginPin(dto: LoginPinDto): Promise<{
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
    getUsersByTienda(tienda_id: string): Promise<import("../users/user.entity").User[]>;
    verifyPin(dto: VerifyPinDto): Promise<{
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
    getProfile(req: any): any;
}
