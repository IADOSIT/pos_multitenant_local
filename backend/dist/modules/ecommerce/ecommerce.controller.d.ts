import { DataSource } from 'typeorm';
import { EcommerceService } from './ecommerce.service';
export declare class EcommerceController {
    private service;
    private dataSource;
    constructor(service: EcommerceService, dataSource: DataSource);
    getConfig(scope: any): Promise<import("./ecommerce-config.entity").EcommerceConfig | null>;
    upsertConfig(scope: any, body: any): Promise<import("./ecommerce-config.entity").EcommerceConfig>;
    verificarSubdominio(scope: any, sub: string): Promise<{
        disponible: boolean;
    }>;
    generarSubdominio(nombre: string): Promise<string>;
    getTemas(): {
        id: string;
        nombre: string;
        descripcion: string;
        modo: string;
        colorPrimary: string;
        colorBg: string;
    }[];
    uploadBanner(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    getProductosEcommerce(scope: any, query: any): Promise<{
        data: any;
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getProductoConfig(id: number): Promise<import("./ecommerce-producto-config.entity").EcommerceProductoConfig | null>;
    upsertProductoConfig(scope: any, id: number, body: any): Promise<import("./ecommerce-producto-config.entity").EcommerceProductoConfig>;
    bulkVisibilidad(scope: any, body: {
        ids: number[];
        visible: boolean;
    }): Promise<void>;
    listPedidos(scope: any, query: any): Promise<{
        data: import("./ecommerce-pedido.entity").EcommercePedido[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getPedido(scope: any, id: number): Promise<import("./ecommerce-pedido.entity").EcommercePedido>;
    updateEstado(scope: any, id: number, body: any): Promise<import("./ecommerce-pedido.entity").EcommercePedido>;
    cotizarPedido(scope: any, id: number, body: any): Promise<{
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
}
