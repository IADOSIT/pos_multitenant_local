/**
 * De cual bascula lee ESTA computadora.
 *
 * El problema que resuelve: una tienda puede tener varias basculas — la de la caja de
 * cobro, la del kiosko de autoservicio, la del mostrador de salchichoneria — cada una
 * por USB a una PC distinta. Todas comparten el mismo `tienda_token` (config_bascula
 * tiene una sola fila por tienda), asi que todos los bridges publican su peso en la
 * misma room y las lecturas se pisan entre si.
 *
 * Por que en localStorage y no en la base: esto describe UNA COMPUTADORA, no al
 * negocio. Las tres PCs de la fruteria son la misma tienda y necesitan tres respuestas
 * distintas; en `config_bascula` no cabe, y aunque cupiera seria la respuesta
 * equivocada. Por eso vive aqui, al lado del puerto del puente local
 * (`pos_puente_puerto`), que es un dato del mismo tipo.
 */

export type ModoOrigen = 'auto' | 'apagado' | 'local' | 'red';

export interface OrigenBascula {
  modo: ModoOrigen;
  /** Solo con modo 'red': nombre de la estacion cuyo peso se acepta. */
  estacion: string;
}

const CLAVE = 'pos_bascula_origen';

/**
 * 'auto' es el default a proposito: se comporta EXACTAMENTE como se comportaba el POS
 * antes de que existiera esta preferencia — el puente local manda y la nube queda de
 * respaldo. Asi ninguna tienda que ya esta operando cambia de comportamiento por
 * instalar esta version.
 */
export const ORIGEN_DEFAULT: OrigenBascula = { modo: 'auto', estacion: '' };

export function leerOrigen(): OrigenBascula {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return ORIGEN_DEFAULT;
    if (raw.startsWith('red:')) {
      const estacion = raw.slice(4).trim();
      // "red" sin estacion no significa nada: se cae al default en vez de dejar la
      // pantalla sin peso y sin explicacion.
      return estacion ? { modo: 'red', estacion } : ORIGEN_DEFAULT;
    }
    if (raw === 'apagado' || raw === 'local' || raw === 'auto') return { modo: raw, estacion: '' };
    return ORIGEN_DEFAULT;
  } catch {
    return ORIGEN_DEFAULT; // modo privado / storage bloqueado
  }
}

export function guardarOrigen(origen: OrigenBascula): void {
  const raw = origen.modo === 'red' ? `red:${origen.estacion}` : origen.modo;
  try { localStorage.setItem(CLAVE, raw); } catch { /* modo privado */ }
}

/** ¿Se acepta el peso que llega por el puente local (127.0.0.1) de esta misma PC? */
export function aceptaLocal(origen: OrigenBascula): boolean {
  return origen.modo === 'auto' || origen.modo === 'local';
}

/**
 * ¿Se acepta este `weight-update` de la nube?
 *
 * `hayPuenteLocal` importa solo en 'auto': con bascula propia conectada, la de la nube
 * sobra y es justo la que provoca que el peso brinque entre estaciones. Sin puente
 * (el POS corre en una PC sin bascula), la nube es el unico camino y se acepta, que es
 * como venia funcionando.
 */
export function aceptaNube(
  origen: OrigenBascula,
  estacionDelPeso: string | undefined,
  hayPuenteLocal: boolean,
): boolean {
  switch (origen.modo) {
    case 'apagado': return false;
    case 'local':   return false;
    case 'red':     return (estacionDelPeso || 'Principal') === origen.estacion;
    case 'auto':    return !hayPuenteLocal;
    default:        return !hayPuenteLocal;
  }
}

/** Texto corto para la pantalla, para que el cajero sepa que esta leyendo. */
export function describirOrigen(origen: OrigenBascula): string {
  switch (origen.modo) {
    case 'apagado': return 'Bascula apagada — el peso se captura a mano';
    case 'local':   return 'Bascula de esta computadora';
    case 'red':     return `Bascula en red: ${origen.estacion}`;
    default:        return 'Automatico (la de esta computadora, si hay)';
  }
}
