import { Repository } from 'typeorm';
import { EcommerceConfig } from './ecommerce-config.entity';
import { EcommercePedido } from './ecommerce-pedido.entity';
import { EcommerceProductoConfig } from './ecommerce-producto-config.entity';
export declare class EcommerceService {
    private configRepo;
    private pedidoRepo;
    private productoConfigRepo;
    constructor(configRepo: Repository<EcommerceConfig>, pedidoRepo: Repository<EcommercePedido>, productoConfigRepo: Repository<EcommerceProductoConfig>);
    getConfig(scope: any): Promise<EcommerceConfig | null>;
    upsertConfig(scope: any, data: Partial<EcommerceConfig>): Promise<EcommerceConfig>;
    verificarSubdominio(subdominio: string, empresaId: number): Promise<{
        disponible: boolean;
    }>;
    generarSubdominioUnico(nombre: string): Promise<string>;
    getTemas(): {
        id: string;
        nombre: string;
        descripcion: string;
        modo: string;
        colorPrimary: string;
        colorBg: string;
    }[];
    getProductoConfig(productoId: number): Promise<EcommerceProductoConfig | null>;
    upsertProductoConfig(scope: any, productoId: number, data: Partial<EcommerceProductoConfig>): Promise<EcommerceProductoConfig>;
    bulkVisibilidad(scope: any, ids: number[], visible: boolean): Promise<void>;
    listPedidos(scope: any, query: any): Promise<{
        data: EcommercePedido[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getPedido(scope: any, id: number): Promise<EcommercePedido>;
    updateEstadoPedido(scope: any, id: number, estado: string, notas_internas?: string): Promise<EcommercePedido>;
    deletePedido(scope: any, id: number): Promise<{
        ok: boolean;
    }>;
    getConfigBySubdominio(subdominio: string): Promise<EcommerceConfig>;
    getPublicInfo(subdominio: string, dataSource: any): Promise<{
        nombre_tienda: any;
        descripcion: string;
        logo_url: any;
        banner_url: string;
        color_primario: string;
        color_secundario: string;
        modo_mayoreo: boolean;
        qty_min_mayoreo: number;
        mensaje_mayoreo: string;
        politica_envio: string;
        terminos: string;
        tema_id: string;
        empresa: any;
    }>;
    getPublicCategorias(subdominio: string, dataSource: any): Promise<any>;
    getPublicProductos(subdominio: string, dataSource: any, query: any): Promise<{
        data: any;
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getPublicProductoBySlug(subdominio: string, slug: string, dataSource: any): Promise<any>;
    crearPedidoPublico(subdominio: string, body: any, dataSource: any): Promise<{
        numero_pedido: string;
        total: number;
        tipo_venta: "menudeo" | "mayoreo";
        estado: string;
    }>;
    getPublicPedido(subdominio: string, numero_pedido: string, dataSource: any): Promise<{
        numero_pedido: string;
        estado: string;
        tipo_venta: "menudeo" | "mayoreo";
        subtotal: number;
        descuento: number;
        iva: number;
        total: number;
        items: any[];
        cliente_nombre: string;
        cliente_email: string;
        cliente_tel: string;
        direccion_envio: any;
        notas_cliente: string;
        created_at: Date;
    }>;
}
