import { Producto } from '../productos/producto.entity';
export declare class Categoria {
    id: number;
    tenant_id: number;
    empresa_id: number;
    nombre: string;
    descripcion: string;
    imagen_url: string;
    color: string;
    icono: string;
    orden: number;
    activo: boolean;
    es_seccion_especial: boolean;
    tipo_seccion: string;
    modulo: string;
    created_at: Date;
    updated_at: Date;
    productos: Producto[];
}
