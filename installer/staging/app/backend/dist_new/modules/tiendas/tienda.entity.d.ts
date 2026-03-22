import { Empresa } from '../empresas/empresa.entity';
export declare class Tienda {
    id: number;
    tenant_id: number;
    empresa_id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    zona_horaria: string;
    slug: string;
    folio_pedido_counter: number;
    folio_venta_counter: number;
    config_ticket: any;
    config_impresora: any;
    config_pos: {
        modo_servicio: 'autoservicio' | 'mesa';
        tipo_cobro_mesa: 'pago_inmediato' | 'post_pago';
        num_mesas: number;
        iva_enabled: boolean;
        iva_porcentaje: number;
        iva_incluido: boolean;
    };
    activo: boolean;
    created_at: Date;
    updated_at: Date;
    empresa: Empresa;
}
