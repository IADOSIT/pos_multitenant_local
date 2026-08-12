// Formato de dinero con separador de miles (es-MX): 60000 -> "60,000.00"
export const money = (n: number | string | null | undefined): string =>
  Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
