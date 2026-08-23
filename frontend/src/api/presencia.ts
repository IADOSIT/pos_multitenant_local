import { io, Socket } from 'socket.io-client';

// Cliente del monitor de presencia. Es ESTRICTAMENTE OPCIONAL: si falla, la app
// debe seguir funcionando identica. Por eso no lanza nunca, no muestra toasts y
// no escribe en consola. Un cajero trabajando offline no debe enterarse de que
// este modulo existe.

let socket: Socket | null = null;
let tokenActual: string | null = null;

type Suscriptor = (s: Socket) => void;
/** Quien quiera el socket se apunta aqui; no puede depender de llegar despues. */
const suscriptores = new Set<Suscriptor>();

function avisar(s: Socket): void {
  suscriptores.forEach(fn => {
    try { fn(s); } catch { /* un suscriptor roto no puede tumbar la presencia */ }
  });
}

// El POS tambien se instala on-premise, servido por el backend en la PC del cliente
// (localhost o una IP de la LAN). El monitor vive solo en la nube, asi que solo se
// activa cuando la pagina se sirve desde el dominio de la nube.
// OJO: no sirve mirar VITE_API_URL — vale '/api' en AMBOS despliegues (lo fijan asi
// .env.production y los scripts de installer/), asi que no los distingue.
const HOST_NUBE = 'iados.online';

function esNube(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return host === HOST_NUBE || host.endsWith('.' + HOST_NUBE);
}

function baseSocket(): string {
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://posapi.iados.online';
}

function puedeConectar(): boolean {
  return presenciaDisponible() && typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Si este despliegue puede tener presencia. On-premise es NO, y ahi el modulo
 * esta apagado de raiz: sin socket y sin entrada de menu. Se exporta para que la
 * UI no tenga que repetir el dominio de la nube en un segundo archivo.
 */
export function presenciaDisponible(): boolean {
  return esNube();
}

export function iniciarPresencia(token: string, rutaInicial: string): void {
  if (!puedeConectar() || !token) return;
  if (socket) return;

  tokenActual = token;
  try {
    socket = io(`${baseSocket()}/presencia`, {
      transports: ['websocket'],
      auth: { token, ruta: rutaInicial },
      // Reintentos sin limite. Antes eran 5 x 5s = ~25s: un redeploy del backend
      // por Portainer — la via de despliegue normal de este proyecto — dura mas,
      // y como navigator.onLine sigue en true, el listener de 'online' no se
      // dispara nunca: la pestana quedaba invisible el resto del turno.
      // El backoff sube hasta 30s, asi que un backend caido no genera trafico.
      reconnectionDelay: 3000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });
    // Silencio deliberado: sin la red, fallar es lo esperado, no un error que
    // haya que reportarle al cajero.
    socket.on('connect_error', () => {});
    avisar(socket);
  } catch {
    socket = null;
  }
}

/**
 * Entrega el socket de presencia cuando exista, y de nuevo si se reemplaza
 * (cambio de token, reconexion tras un offline). Si ya existe avisa de
 * inmediato. Devuelve la funcion para darse de baja.
 *
 * Sustituye al viejo getPresenciaSocket(), que era una carrera perdida desde un
 * componente hijo: el socket lo crea un efecto de MainLayout, que es ancestro, y
 * React ejecuta los efectos de abajo hacia arriba. En un F5 directo sobre
 * /superadmin/monitor la pantalla leia null y se quedaba muerta para siempre.
 * Al ser por aviso y no por sondeo, con la presencia apagada (on-premise, sin
 * red) simplemente no llama a nadie: no hay bucle que gire en vano.
 */
export function alTenerPresencia(cb: Suscriptor): () => void {
  suscriptores.add(cb);
  if (socket) {
    try { cb(socket); } catch { /* ignorado */ }
  }
  return () => { suscriptores.delete(cb); };
}

export function reportarPantalla(ruta: string): void {
  try {
    if (socket?.connected) socket.emit('pantalla', { ruta });
  } catch {
    // fire-and-forget: nunca propagar
  }
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
  if (socket) {
    // Puede seguir existiendo pero desconectado. Reactivarlo es idempotente y
    // barato; sin esto, un socket rendido bloqueaba la recuperacion aqui mismo.
    try { if (!socket.connected) socket.connect(); } catch { /* ignorado */ }
    return;
  }
  if (!tokenActual) return;
  iniciarPresencia(tokenActual, rutaActual);
}
