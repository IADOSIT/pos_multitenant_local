import { Repository } from 'typeorm';
import { PerfilNegocio } from './perfil-negocio.entity';
import { TenantPerfil } from './tenant-perfil.entity';
import { Producto } from '../productos/producto.entity';
import { Categoria } from '../categorias/categoria.entity';
export declare class PerfilesService {
    private perfilRepo;
    private tenantPerfilRepo;
    private productoRepo;
    private categoriaRepo;
    constructor(perfilRepo: Repository<PerfilNegocio>, tenantPerfilRepo: Repository<TenantPerfil>, productoRepo: Repository<Producto>, categoriaRepo: Repository<Categoria>);
    getPerfilActivo(tenant_id: number): Promise<any>;
    private getCarbonHieloConfig;
    activarPerfil(tenant_id: number, empresa_id: number, tienda_id: number, perfil_clave: string, scope: any): Promise<any>;
    desactivarPerfil(tenant_id: number, perfil_clave: string): Promise<void>;
    seedCarbonHielo(tenant_id: number, empresa_id: number, scope: any): Promise<any>;
    getAlertasStock(tenant_id: number, empresa_id: number, modulo?: string): Promise<any[]>;
    getResumenModulo(tenant_id: number, empresa_id: number, modulo: string): Promise<any>;
}
