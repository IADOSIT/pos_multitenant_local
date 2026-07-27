export declare function generarBarcodeEan13(plu: number, precioCentavos: number): string;
export declare function decodeEan13PesoVariable(code: string): {
    plu: number;
    precioCentavos: number;
} | null;
