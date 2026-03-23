import { Categoria } from '../categorias/categoria.entity';
export declare class Producto {
    id: number;
    tenant_id: number;
    empresa_id: number;
    sku: string;
    nombre: string;
    descripcion: string;
    precio: number;
    costo: number;
    categoria_id: number;
    imagen_url: string;
    codigo_barras: string;
    unidad: string;
    impuesto_pct: number;
    disponible: boolean;
    activo: boolean;
    controla_stock: boolean;
    stock_actual: number;
    stock_minimo: number;
    orden: number;
    modificadores: any;
    created_at: Date;
    updated_at: Date;
    categoria: Categoria;
    tiendas: ProductoTienda[];
}
export declare class ProductoTienda {
    id: number;
    tenant_id: number;
    tienda_id: number;
    producto_id: number;
    precio_local: number;
    disponible: boolean;
    stock: number;
    producto: Producto;
}
