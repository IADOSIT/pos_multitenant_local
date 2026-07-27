"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarBarcodeEan13 = generarBarcodeEan13;
exports.decodeEan13PesoVariable = decodeEan13PesoVariable;
const PREFIX = '2';
function calcularDigitoVerificador(digitos11) {
    const base12 = PREFIX + digitos11;
    let suma = 0;
    for (let i = 0; i < 12; i++) {
        const n = Number(base12[i]);
        const peso = (i % 2 === 0) ? 1 : 3;
        suma += n * peso;
    }
    const modulo = suma % 10;
    return String(modulo === 0 ? 0 : 10 - modulo);
}
function generarBarcodeEan13(plu, precioCentavos) {
    if (plu < 0 || plu > 99999)
        throw new Error('PLU fuera de rango (0-99999)');
    if (precioCentavos < 0 || precioCentavos > 99999)
        throw new Error('Precio fuera de rango (hasta $999.99)');
    const pluStr = String(plu).padStart(5, '0');
    const precioStr = String(precioCentavos).padStart(5, '0');
    const digitos11 = pluStr + precioStr;
    const check = calcularDigitoVerificador(digitos11);
    return PREFIX + digitos11 + check;
}
function decodeEan13PesoVariable(code) {
    if (!/^\d{13}$/.test(code))
        return null;
    if (code[0] !== PREFIX)
        return null;
    const digitos11 = code.slice(1, 12);
    const checkEsperado = calcularDigitoVerificador(digitos11);
    if (checkEsperado !== code[12])
        return null;
    return {
        plu: Number(code.slice(1, 6)),
        precioCentavos: Number(code.slice(6, 11)),
    };
}
//# sourceMappingURL=ean13.util.js.map