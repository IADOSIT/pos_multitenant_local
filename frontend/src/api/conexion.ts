import { useEffect, useState } from 'react';

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
    // Dos peticiones lentas (un reporte pesado, por ejemplo) tambien se ven como
    // fallos de red. Antes de dejar a la tienda en modo offline se confirma con
    // un latido casi inmediato: si el servidor contesta, no pasa nada.
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

/** Error sin respuesta (DNS, TCP, timeout): candidato a corte de internet. */
export function marcarFalloRed(): void {
  if (!servidorVivo) return;
  fallos += 1;
  if (fallos >= UMBRAL_FALLOS) cambiarEstado(false);
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
