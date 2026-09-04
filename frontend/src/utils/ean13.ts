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

// ── Dibujo del codigo de barras ──────────────────────────────────────────────
// Solo hace falta cuando la etiqueta se imprime desde el navegador (impresora
// predeterminada de Windows): la etiquetadora de red recibe ZPL y dibuja ella sola.
// Conjunto L oficial (anchos 3211, 2221, ... alternando espacio/barra). R es el
// complemento de L y G el reverso de R, asi que se derivan en vez de teclearlas
// para no arriesgar una errata en una etiqueta que despues no escanea en caja.
const L = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];
const R = L.map((p) => p.replace(/[01]/g, (b) => (b === '0' ? '1' : '0')));
const G = R.map((p) => p.split('').reverse().join(''));

// El primer digito no se dibuja: se codifica en la paridad de los digitos 2 a 7.
const PARIDAD = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL',
];

/** Devuelve los 95 modulos (1 = barra) de un EAN-13 valido, o null si no lo es. */
export function ean13Modulos(code: string): string | null {
  if (!/^\d{13}$/.test(code)) return null;
  const d = code.split('').map(Number);
  const paridad = PARIDAD[d[0]];
  let bits = '101';
  for (let i = 0; i < 6; i++) bits += (paridad[i] === 'L' ? L : G)[d[i + 1]];
  bits += '01010';
  for (let i = 7; i < 13; i++) bits += R[d[i]];
  return bits + '101';
}

/** SVG del codigo de barras (ancho/alto en cualquier unidad CSS), para la etiqueta. */
export function ean13Svg(code: string, width: string | number, height: string | number): string {
  const bits = ean13Modulos(code);
  if (!bits) return '';
  const barras = bits
    .split('')
    .map((b, i) => (b === '1' ? `<rect x="${i}" y="0" width="1" height="30" fill="#000"/>` : ''))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 95 30" preserveAspectRatio="none"
    width="${width}" height="${height}" shape-rendering="crispEdges">${barras}</svg>`;
}

export function decodeEan13PesoVariable(code: string): { plu: number; precio: number } | null {
  if (!/^\d{13}$/.test(code)) return null;
  if (code[0] !== PREFIX) return null;
  const digitos11 = code.slice(1, 12);
  if (calcularDigitoVerificador(digitos11) !== code[12]) return null;
  return {
    plu: Number(code.slice(1, 6)),
    precio: Number(code.slice(6, 12)) / 100,
  };
}
