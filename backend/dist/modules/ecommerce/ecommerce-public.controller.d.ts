import { DataSource } from 'typeorm';
import { EcommerceService } from './ecommerce.service';
export declare class EcommercePublicController {
    private service;
    private dataSource;
    constructor(service: EcommerceService, dataSource: DataSource);
    getInfo(sub: string): Promise<{
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
    getCategorias(sub: string): Promise<any>;
    getProductos(sub: string, query: any): Promise<{
        data: any;
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getProducto(sub: string, slug: string): Promise<any>;
    crearPedido(sub: string, body: any): Promise<{
        numero_pedido: string;
        total: number;
        tipo_venta: "menudeo" | "mayoreo";
        estado: string;
    }>;
    trackPedido(sub: string, numero: string): Promise<{
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
    historialPedidos(sub: string, body: {
        email: string;
        tel?: string;
    }): Promise<{
        numero_pedido: string;
        estado: string;
        tipo_venta: "menudeo" | "mayoreo";
        total: number;
        items_count: any;
        created_at: Date;
    }[]>;
}
