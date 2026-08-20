export interface MonedaConfig {
  activa?: boolean;
  codigo?: string;
  tipo_cambio_actual?: number;
  modo_visualizacion?: 'ambas' | 'solo_base' | 'solo_secundaria';
}

const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Da formato a un monto en pesos (MXN) respetando la configuracion de moneda de la empresa:
// si esta activa, agrega/reemplaza con el equivalente en la moneda secundaria (ej. USD).
// El monto MXN sigue siendo el que realmente se cobra; esto es solo presentacion.
export function formatMonto(mxn: number, moneda?: MonedaConfig): string {
  const activa = moneda?.activa && (moneda?.tipo_cambio_actual || 0) > 0;
  if (!activa) return `$${fmt(mxn)}`;

  const codigo = moneda?.codigo || 'USD';
  const convertido = mxn / (moneda!.tipo_cambio_actual as number);

  if (moneda?.modo_visualizacion === 'solo_secundaria') return `$${fmt(convertido)} ${codigo}`;
  if (moneda?.modo_visualizacion === 'solo_base') return `$${fmt(mxn)}`;
  return `$${fmt(mxn)} MXN ~ $${fmt(convertido)} ${codigo}`;
}
