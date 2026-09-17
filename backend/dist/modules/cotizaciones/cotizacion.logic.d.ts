import { CotizacionEstado } from './cotizacion.entity';
import { CotizacionItem } from './cotizacion-version.entity';
export declare function puedeCotizar(estado: CotizacionEstado): boolean;
export declare function puedeResponder(estado: CotizacionEstado): boolean;
export declare function folioCotizacion(yy: string, consecutivo: number): string;
export declare function calcularTotales(items: CotizacionItem[], precios: Map<number, number>, descuento: number): {
    items: CotizacionItem[];
    subtotal: number;
    total: number;
};
export declare function vigenciaHasta(desde: Date, dias: number): string;
export declare function estaVigente(vigencia_hasta: string, hoy: Date): boolean;
export declare function direccionPlana(dir: any): string | null;
