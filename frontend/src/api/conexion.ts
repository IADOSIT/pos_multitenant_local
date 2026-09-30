import { useEffect, useRef, useState } from 'react';

/**
 * Estado REAL de la conexion con el servidor.
 *
 * `navigator.onLine` no sirve para una tienda con internet malo: solo dice si la
 * PC tiene una interfaz de red arriba. Con el modem prendido pero sin salida a
 * internet vale `true`, asi que el POS se creia en linea, mandaba cada peticion
 * por red y se quedaba esperando los 10 s del timeout. Entre el arranque del POS
 * y el del menu lateral son ~15 peticiones, y el navegador solo abre 6 a la vez:
 * el resultado era una app congelada medio minuto, una y otra vez, porque los
 * sondeos periodicos repetian el ciclo.
 *
 * Aqui se lleva un cortacircuitos: a los dos errores de red seguidos se da el
 * servidor por caido y `client.ts` deja de intentar (falla al instante, y cada
 * pantalla cae a su cache o a su modo offline sin colgarse). Mientras esta
 * caido, un latido contra `/health` — barato y publico — comprueba si volvio; al
 * primer 200 se reanuda todo.
 *
 * Un timeout NO cuenta como error de red: ver `marcarFalloLento()`. Confundirlos
 * era lo que dejaba a una tienda con internet perfecto en modo offline cada vez
 * que el VPS se ponia lento un instante.
 */

const UMBRAL_FALLOS = 2;          // errores de red seguidos para dar por caido el servidor
const TIMEOUT_LATIDO = 4000;      // el latido tiene que fallar rapido
const PRIMERA_ESPERA = 700;       // confirmacion casi inmediata al dar por caido
const ESPERA_MIN = 5000;
const ESPERA_MAX = 30000;

let servidorVivo = true;
let fallos = 0;
let espera = ESPERA_MIN;
let timer: ReturnType<typeof setTimeout> | null = null;
let latiendo = false;
// Una sola confirmacion en vuelo: al arrancar salen ~15 peticiones en paralelo y
// un momento lento las agota casi todas juntas.
let confirmando = false;

function hayRed(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/** Lo unico que debe consultar la app para saber si vale la pena ir a la red. */
export function hayConexion(): boolean {
  return hayRed() && servidorVivo;
}

function avisar(): void {
  try {
    window.dispatchEvent(new CustomEvent('conexion:cambio', { detail: hayConexion() }));
  } catch { /* SSR */ }
}

function pararLatido(): void {
  if (timer) clearTimeout(timer);
  timer = null;
}

function programarLatido(): void {
  pararLatido();
  timer = setTimeout(async () => {
    const vivo = await latir();
    if (!vivo) {
      espera = Math.min(espera * 1.5, ESPERA_MAX);
      programarLatido();
    }
  }, espera);
}

function cambiarEstado(vivo: boolean): void {
  if (servidorVivo === vivo) return;
  servidorVivo = vivo;
  fallos = 0;
  if (vivo) {
    espera = ESPERA_MIN;
    pararLatido();
  } else {
    // Aqui ya se dio por caido. El latido casi inmediato sigue siendo la red de
    // seguridad para el camino rapido (`marcarFalloRed`, que corta sin preguntar):
    // si el servidor si contesta, se cierra el corte enseguida. Los timeouts ya no
    // llegan aqui sin haber pasado por su propia confirmacion.
    espera = PRIMERA_ESPERA;
    programarLatido();
    espera = ESPERA_MIN;
  }
  avisar();
}

/** Una respuesta del servidor — la que sea — prueba que si se puede llegar. */
export function marcarExito(): void {
  fallos = 0;
  cambiarEstado(true);
}

/**
 * Error sin respuesta y sin camino: DNS que no resuelve, TCP rechazado, CORS. Eso
 * falla rapido y de verdad, asi que se corta igual de rapido: es para lo que se
 * hizo el cortacircuitos.
 */
export function marcarFalloRed(): void {
  if (!servidorVivo) return;
  fallos += 1;
  if (fallos >= UMBRAL_FALLOS) cambiarEstado(false);
}

/**
 * Se agoto el tiempo de espera (los 10 s de axios). NO es lo mismo que un corte:
 * un VPS ocupado un instante, o una consulta pesada, tarda mas que el timeout y se
 * veia identico a un cable desconectado. Y como las peticiones salen en paralelo,
 * un solo momento lento producia varios "fallos" de golpe: la tienda aparecia
 * offline teniendo internet perfecto.
 *
 * La diferencia es CUANDO se confirma. Antes se cortaba y se preguntaba despues
 * (el latido de los 700 ms), y ese parpadeo bastaba para dejar una pantalla con su
 * mensaje de error para siempre. Ahora se pregunta primero: si `/health` contesta,
 * no pasa nada. Solo si el latido tambien falla se da el servidor por caido, asi
 * que se conserva lo que importa de verdad — dejar de gastar 10 s por peticion
 * cuando la tienda esta sin internet.
 */
export function marcarFalloLento(): void {
  if (!servidorVivo) return;
  fallos += 1;
  if (fallos < UMBRAL_FALLOS) return;
  if (confirmando) return;
  confirmando = true;
  latir()
    .then((vivo) => { if (!vivo && servidorVivo) cambiarEstado(false); })
    .catch(() => { /* latir() ya atrapa lo suyo; esto es por si acaso */ })
    .finally(() => { confirmando = false; });
}

/**
 * Pregunta directa al servidor, por fuera de axios (no pasa por el
 * cortacircuitos, si no nunca podria cerrarse). Devuelve si contesto.
 */
export async function latir(): Promise<boolean> {
  if (latiendo) return servidorVivo;
  if (!hayRed()) { avisar(); return false; }
  latiendo = true;
  const ctrl = new AbortController();
  const corte = setTimeout(() => ctrl.abort(), TIMEOUT_LATIDO);
  try {
    const base = import.meta.env.VITE_API_URL || '/api';
    const res = await fetch(`${base}/health?_=${Date.now()}`, {
      signal: ctrl.signal,
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    // Un 502 de nginx es "hay wifi pero el API no responde": para el POS es lo
    // mismo que no tener internet, asi que solo un 2xx cuenta como vivo.
    if (res.ok) { cambiarEstado(true); return true; }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(corte);
    latiendo = false;
  }
}

/** Sondeo inmediato para acciones manuales ("Sincronizar ahora", reintentar). */
export async function comprobarConexion(): Promise<boolean> {
  if (!hayRed()) return false;
  if (servidorVivo) return true;
  return latir();
}

let vigilando = false;

/** Se arranca una sola vez (MainLayout). Idempotente. */
export function iniciarVigilanciaConexion(): void {
  if (vigilando || typeof window === 'undefined') return;
  vigilando = true;
  // Recuperar el wifi no significa tener internet: se confirma con un latido.
  // Latido de arranque: si la tienda ya esta sin internet, en ~4 s el corte queda
  // abierto y el resto de las peticiones del arranque fallan al instante en vez de
  // consumir sus 10 s de timeout una tras otra.
  latir().then((vivo) => { if (!vivo) { marcarFalloRed(); marcarFalloRed(); } });

  window.addEventListener('online', () => { espera = ESPERA_MIN; avisar(); latir(); });
  window.addEventListener('offline', () => { avisar(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !servidorVivo) latir();
  });
}

/**
 * Vuelve a ejecutar una carga cuando la conexion REGRESA.
 *
 * Los loaders de las pantallas corren una sola vez, al montarse. Sin esto, un
 * parpadeo del cortacircuitos dejaba la pantalla con su mensaje de error de forma
 * permanente aunque el internet volviera al segundo: nadie reintentaba, y el boton
 * "Reintentar" tambien fallaba al instante mientras el corte seguia abierto.
 *
 * Solo dispara en la transicion caido -> vivo, nunca al montar, asi que no duplica
 * la carga inicial. `recargar` se guarda en un ref: la funcion se recrea en cada
 * render y no debe volver a suscribir el listener.
 */
export function useRecargarAlVolver(recargar: () => void): void {
  const ref = useRef(recargar);
  ref.current = recargar;

  useEffect(() => {
    let previo = hayConexion();
    const h = () => {
      const ahora = hayConexion();
      if (ahora && !previo) ref.current();
      previo = ahora;
    };
    window.addEventListener('conexion:cambio', h);
    window.addEventListener('online', h);
    return () => {
      window.removeEventListener('conexion:cambio', h);
      window.removeEventListener('online', h);
    };
  }, []);
}

/** Estado de conexion para los componentes. */
export function useConexion(): boolean {
  const [enLinea, setEnLinea] = useState(hayConexion());
  useEffect(() => {
    const h = () => setEnLinea(hayConexion());
    window.addEventListener('conexion:cambio', h);
    window.addEventListener('online', h);
    window.addEventListener('offline', h);
    return () => {
      window.removeEventListener('conexion:cambio', h);
      window.removeEventListener('online', h);
      window.removeEventListener('offline', h);
    };
  }, []);
  return enLinea;
}
