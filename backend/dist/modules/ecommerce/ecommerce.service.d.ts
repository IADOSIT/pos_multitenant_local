import { Repository } from 'typeorm';
import { EcommerceConfig } from './ecommerce-config.entity';
import { EcommercePedido } from './ecommerce-pedido.entity';
import { EcommerceProductoConfig } from './ecommerce-producto-config.entity';
import { Cliente } from './cliente.entity';
import { PedidosService } from '../pedidos/pedidos.service';
export declare class EcommerceService {
    private configRepo;
    private pedidoRepo;
    private productoConfigRepo;
    private clienteRepo;
    private pedidosService;
    constructor(configRepo: Repository<EcommerceConfig>, pedidoRepo: Repository<EcommercePedido>, productoConfigRepo: Repository<EcommerceProductoConfig>, clienteRepo: Repository<Cliente>, pedidosService: PedidosService);
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
    cotizarPedido(scope: any, id: number, dto: any): Promise<{
        folio_pos: string;
        id: number;
        empresa_id: number;
        tenant_id: number;
        cliente_id: number | null;
        numero_pedido: string;
        tipo_venta: "menudeo" | "mayoreo";
        cliente_nombre: string;
        cliente_email: string;
        cliente_tel: string;
        direccion_envio: any;
        items: any[];
        subtotal: number;
        descuento: number;
        iva: number;
        total: number;
        estado: string;
        pedido_id: number | null;
        notas_cliente: string;
        cliente_empresa: string | null;
        notas_internas: string;
        created_at: Date;
        updated_at: Date;
    }>;
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
        preferencias: any;
        empresa: {
            nombre: any;
            telefono: any;
            email: any;
            direccion: any;
            logo_url: any;
        } | null;
        campos_formulario: import("../empresas/campos-formulario.helper").CamposFormulario;
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
    private mostrarPreciosParaEmpresa;
    getPublicProductoBySlug(subdominio: string, slug: string, dataSource: any): Promise<any>;
    crearPedidoPublico(subdominio: string, body: any, dataSource: any): Promise<{
        numero_pedido: string;
        total: number;
        tipo_venta: "menudeo" | "mayoreo";
        estado: string;
    }>;
    private upsertCliente;
    getHistorialPedidos(subdominio: string, email: string, tel: string | undefined, dataSource: any): Promise<{
        numero_pedido: string;
        estado: string;
        tipo_venta: "menudeo" | "mayoreo";
        total: number;
        items_count: any;
        created_at: Date;
    }[]>;
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
