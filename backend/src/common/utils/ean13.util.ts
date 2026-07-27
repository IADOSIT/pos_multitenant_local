// Codigo de barras EAN-13 de "peso variable" (estandar GS1, rango de prefijo 20-29
// reservado para uso interno/no registrado) — el mismo tipo de etiqueta que imprimen
// las basculas de fruteria en supermercados. El precio va embebido y se confia tal
// cual al escanear, sin volver a consultar la base de datos.
//
// Formato (13 digitos):
//   [0]      "2"                    prefijo de peso variable
//   [1-5]    PLU (producto.id)      5 digitos, zero-padded
//   [6-10]   precio en centavos     5 digitos (hasta $999.99)
//   [11]     digito verificador EAN-13 estandar (mod 10) sobre los 11 digitos previos

const PREFIX = '2';

function calcularDigitoVerificador(digitos11: string): string {
  // Algoritmo EAN-13: desde la derecha, alternar peso 1 y 3 sobre los primeros 12 digitos
  // (aqui tenemos 11 + 1 = 12 antes del digito verificador final).
  const base12 = PREFIX + digitos11; // 1 + 11 = 12 digitos
  let suma = 0;
  for (let i = 0; i < 12; i++) {
    const n = Number(base12[i]);
    const peso = (i % 2 === 0) ? 1 : 3;
    suma += n * peso;
  }
  const modulo = suma % 10;
  return String(modulo === 0 ? 0 : 10 - modulo);
}

export function generarBarcodeEan13(plu: number, precioCentavos: number): string {
  if (plu < 0 || plu > 99999) throw new Error('PLU fuera de rango (0-99999)');
  if (precioCentavos < 0 || precioCentavos > 99999) throw new Error('Precio fuera de rango (hasta $999.99)');
  const pluStr = String(plu).padStart(5, '0');
  const precioStr = String(precioCentavos).padStart(5, '0');
  const digitos11 = pluStr + precioStr;
  const check = calcularDigitoVerificador(digitos11);
  return PREFIX + digitos11 + check;
}

export function decodeEan13PesoVariable(code: string): { plu: number; precioCentavos: number } | null {
  if (!/^\d{13}$/.test(code)) return null;
  if (code[0] !== PREFIX) return null;
  const digitos11 = code.slice(1, 12);
  const checkEsperado = calcularDigitoVerificador(digitos11);
  if (checkEsperado !== code[12]) return null;
  return {
    plu: Number(code.slice(1, 6)),
    precioCentavos: Number(code.slice(6, 11)),
  };
}
