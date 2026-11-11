// Aviso de "venta cobrada" para modulos opcionales (p. ej. Control de Repartidores).
//
// PayModal lo dispara DESPUES de terminar el cobro normal; quien no lo escuche no
// nota nada. Nunca debe tumbar el cobro: todo va en try/catch.

export interface VentaCobradaDetalle {
  venta_id?: number | null;
  folio?: string | null;
  folio_offline?: string | null;
  total?: number | null;
  tipo_servicio?: string | null;
  pedido_id?: number | null;
}

export const EVENTO_VENTA_COBRADA = 'venta:cobrada';

export function avisarVentaCobrada(detalle: VentaCobradaDetalle) {
  try {
    window.dispatchEvent(new CustomEvent<VentaCobradaDetalle>(EVENTO_VENTA_COBRADA, { detail: detalle }));
  } catch {
    /* un oyente roto nunca afecta la venta */
  }
}
