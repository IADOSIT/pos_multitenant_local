// Decodificador de codigo de barras EAN-13 "de peso variable" (bascula de autoservicio).
// Espejo del algoritmo de backend/src/common/utils/ean13.util.ts — mantener sincronizados.
const PREFIX = '2';

function calcularDigitoVerificador(digitos11: string): string {
  const base12 = PREFIX + digitos11;
  let suma = 0;
  for (let i = 0; i < 12; i++) {
    const n = Number(base12[i]);
    const peso = i % 2 === 0 ? 1 : 3;
    suma += n * peso;
  }
  const modulo = suma % 10;
  return String(modulo === 0 ? 0 : 10 - modulo);
}

export function decodeEan13PesoVariable(code: string): { plu: number; precio: number } | null {
  if (!/^\d{13}$/.test(code)) return null;
  if (code[0] !== PREFIX) return null;
  const digitos11 = code.slice(1, 12);
  if (calcularDigitoVerificador(digitos11) !== code[12]) return null;
  return {
    plu: Number(code.slice(1, 6)),
    precio: Number(code.slice(6, 11)) / 100,
  };
}
