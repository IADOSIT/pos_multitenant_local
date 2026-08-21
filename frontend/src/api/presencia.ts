import { io, Socket } from 'socket.io-client';

// Cliente del monitor de presencia. Es ESTRICTAMENTE OPCIONAL: si falla, la app
// debe seguir funcionando identica. Por eso no lanza nunca, no muestra toasts y
// no escribe en consola. Un cajero trabajando offline no debe enterarse de que
// este modulo existe.

let socket: Socket | null = null;
let tokenActual: string | null = null;

// El POS se instala tambien on-premise, donde VITE_API_URL apunta a localhost.
// Ahi el monitor no aplica (vive solo en la nube), asi que ni se intenta conectar.
const apiUrl = import.meta.env.VITE_API_URL || '/api';
const esNube = !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1');

function baseSocket(): string {
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://posapi.iados.online';
}

function puedeConectar(): boolean {
  return esNube && typeof navigator !== 'undefined' && navigator.onLine;
}

export function iniciarPresencia(token: string, rutaInicial: string): void {
  if (!puedeConectar() || !token) return;
  if (socket) return;

  tokenActual = token;
  try {
    socket = io(`${baseSocket()}/presencia`, {
      transports: ['websocket'],
      auth: { token, ruta: rutaInicial },
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
    });
    // Silencio deliberado: sin la red, fallar es lo esperado, no un error que
    // haya que reportarle al cajero.
    socket.on('connect_error', () => {});
  } catch {
    socket = null;
  }
}

export function reportarPantalla(ruta: string): void {
  try {
    if (socket?.connected) socket.emit('pantalla', { ruta });
  } catch {
    // fire-and-forget: nunca propagar
  }
}

export function getPresenciaSocket(): Socket | null {
  return socket;
}

export function detenerPresencia(): void {
  try {
    socket?.disconnect();
  } catch {
    // ignorado
  }
  socket = null;
}

/** Reconecta con el token ya conocido. La usa el listener de 'online'. */
export function reanudarPresencia(rutaActual: string): void {
  if (socket || !tokenActual) return;
  iniciarPresencia(tokenActual, rutaActual);
}
