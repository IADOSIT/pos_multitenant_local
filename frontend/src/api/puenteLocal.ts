import api from './client';

/**
 * Puente local — el hardware de la caja sin pasar por internet.
 *
 * El bridge (bascula-bridge) levanta un servidorcito en 127.0.0.1:9333 de la misma
 * computadora. El navegador le habla directo: la bascula y el cajon de dinero siguen
 * funcionando con el internet caido, que es justo el caso de la fruteria.
 *
 * La nube queda como respaldo, no como camino principal: sirve cuando el POS corre en
 * otra computadora de la tienda (ahi 127.0.0.1 no es la caja) y solo si hay internet.
 *
 * Detalles que importan:
 *  - http://127.0.0.1 NO cuenta como contenido mixto en una pagina https (el navegador
 *    lo trata como origen confiable), pero Chrome si exige el permiso de red privada:
 *    el bridge responde `Access-Control-Allow-Private-Network: true` en el preflight.
 *  - Todo aqui falla en silencio y rapido. Si el puente no esta, el POS no se entera.
 */

const PUERTO_DEFAULT = 9333;

function puerto(): number {
  // Escotilla para una caja con el 9333 ocupado: localStorage.pos_puente_puerto
  const guardado = Number(localStorage.getItem('pos_puente_puerto'));
  return guardado > 0 && guardado < 65536 ? guardado : PUERTO_DEFAULT;
}

export function baseUrlPuente(): string {
  return `http://127.0.0.1:${puerto()}`;
}

/** Cache de "hay puente": evitar un timeout por cada cobro cuando no lo hay. */
let disponible: boolean | null = null;
let revisadoEn = 0;
const VIGENCIA_OK = 60_000;   // si respondio, se le cree un minuto
const VIGENCIA_NO = 15_000;   // si no esta, se reintenta pronto (lo acaban de instalar)

async function pedir(ruta: string, init: RequestInit = {}, ms = 1500): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(baseUrlPuente() + ruta, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`Puente local respondio ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/** Estado del bridge local, o null si no hay puente en esta computadora. */
export async function estadoPuente(): Promise<any | null> {
  try {
    const data = await pedir('/estado');
    disponible = true;
    revisadoEn = Date.now();
    return data;
  } catch {
    disponible = false;
    revisadoEn = Date.now();
    return null;
  }
}

/** ¿Vale la pena intentar el puente? Usa la cache; solo sondea cuando vencio. */
export async function hayPuenteLocal(): Promise<boolean> {
  const vigencia = disponible ? VIGENCIA_OK : VIGENCIA_NO;
  if (disponible !== null && Date.now() - revisadoEn < vigencia) return disponible;
  await estadoPuente();
  return !!disponible;
}

/** Manda el pulso al cajon por el puente local. Devuelve false si no se pudo. */
export async function abrirCajonLocal(): Promise<boolean> {
  try {
    const r = await pedir('/cajon/abrir', { method: 'POST' }, 4000);
    disponible = true;
    revisadoEn = Date.now();
    return !!r?.ok;
  } catch {
    disponible = false;
    revisadoEn = Date.now();
    return false;
  }
}

/**
 * Abre el cajon: primero local (funciona sin internet), y si no hay puente, por la nube.
 * Nunca lanza — un cajon que no abrio no debe tumbar el cobro.
 */
export async function abrirCajon(tiendaId?: number): Promise<{ ok: boolean; via: string }> {
  if (await hayPuenteLocal()) {
    if (await abrirCajonLocal()) return { ok: true, via: 'local' };
  }
  if (!tiendaId) return { ok: false, via: 'ninguno' };
  try {
    await api.post(`/bascula/cajon/${tiendaId}/abrir`);
    return { ok: true, via: 'nube' };
  } catch {
    return { ok: false, via: 'ninguno' };
  }
}

/** Peso actual (una sola lectura). null si no hay puente o no hay bascula. */
export async function pesoLocal(): Promise<{ peso_kg: number; estable: boolean } | null> {
  try {
    const r = await pedir('/peso');
    disponible = true;
    revisadoEn = Date.now();
    return typeof r?.peso_kg === 'number' ? r : null;
  } catch {
    disponible = false;
    revisadoEn = Date.now();
    return null;
  }
}

/**
 * Peso en vivo por SSE. Devuelve la funcion para darse de baja.
 * `onEstado` avisa si el puente quedo conectado (true) o no se pudo (false), para que
 * la pantalla decida si sigue usando el socket de la nube.
 */
export function suscribirPeso(
  onPeso: (peso: { peso_kg: number; estable: boolean }) => void,
  onEstado?: (vivo: boolean) => void,
): () => void {
  let es: EventSource | null = null;
  let cerrado = false;

  try {
    es = new EventSource(baseUrlPuente() + '/eventos');
  } catch {
    onEstado?.(false);
    return () => {};
  }

  es.addEventListener('open', () => {
    if (cerrado) return;
    disponible = true;
    revisadoEn = Date.now();
    onEstado?.(true);
  });

  es.addEventListener('peso', (ev: MessageEvent) => {
    if (cerrado) return;
    try {
      const data = JSON.parse(ev.data);
      if (typeof data?.peso_kg === 'number') onPeso(data);
    } catch {
      /* un evento mal formado no vale tirar la suscripcion */
    }
  });

  es.addEventListener('error', () => {
    if (cerrado) return;
    // EventSource reintenta solo; aqui solo se avisa para que la pantalla no se
    // quede esperando un peso que no va a llegar.
    disponible = false;
    revisadoEn = Date.now();
    onEstado?.(false);
  });

  return () => {
    cerrado = true;
    try { es?.close(); } catch { /* ya estaba cerrado */ }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Configuracion del cajon, cacheada para que sirva sin internet
// ─────────────────────────────────────────────────────────────────────────────
//  El cobro offline no puede ir a preguntar al servidor si el cajon esta activo.
//  Mismo patron que la configuracion del ticket: se guarda la ultima bajada y esa
//  es la que manda mientras no haya red.

export interface CajonCfg {
  activo: boolean;
  abrir_en: 'efectivo' | 'siempre' | 'manual';
  pedir_pin: boolean;
}

const CLAVE_CAJON = 'pos_cajon_cfg';

const CAJON_APAGADO: CajonCfg = { activo: false, abrir_en: 'efectivo', pedir_pin: false };

/** Guarda lo que interesa del config de bascula que ya baja el POS. */
export function guardarCajonCfg(config: any): CajonCfg {
  const cfg: CajonCfg = {
    activo: !!config?.cajon_activo,
    abrir_en: (config?.cajon_abrir_en || 'efectivo') as CajonCfg['abrir_en'],
    pedir_pin: !!config?.cajon_pedir_pin,
  };
  try { localStorage.setItem(CLAVE_CAJON, JSON.stringify(cfg)); } catch { /* modo privado */ }
  return cfg;
}

export function cajonCfgCache(): CajonCfg {
  try {
    const raw = localStorage.getItem(CLAVE_CAJON);
    if (!raw) return CAJON_APAGADO;
    return { ...CAJON_APAGADO, ...JSON.parse(raw) };
  } catch {
    return CAJON_APAGADO;
  }
}

/**
 * ¿Toca abrir el cajon al cerrar esta venta?
 * 'efectivo' (lo normal) solo cuando el cobro incluyo billetes; 'manual' nunca solo.
 */
export function debeAbrirPorVenta(metodo: string, huboEfectivo: boolean): boolean {
  const cfg = cajonCfgCache();
  if (!cfg.activo) return false;
  if (cfg.abrir_en === 'manual') return false;
  if (cfg.abrir_en === 'siempre') return true;
  return metodo === 'efectivo' || (metodo === 'mixto' && huboEfectivo);
}
