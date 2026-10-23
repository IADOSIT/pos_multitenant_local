import { io, Socket } from 'socket.io-client';

// A donde se conectan los sockets en vivo (bascula, biometrico, presencia).
// En la nube la pagina sale de pos.iados.online y los sockets van a posapi.
// En la instalacion en sitio el mismo backend de la PC sirve pantallas, API y
// sockets, asi que van al mismo origen de la pagina; sin esto la caja del
// equipo en sitio buscaba la bascula en el servidor de la nube.
// VITE_SOCKET_MISMO_ORIGEN solo lo pone el build en sitio (.env.onpremise);
// el build de la nube no lo trae y se queda exactamente como estaba.
export function baseSocket(): string {
  if (import.meta.env.VITE_SOCKET_MISMO_ORIGEN === '1' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://posapi.iados.online';
}

let bioSocket: Socket | null = null;

export function getBioSocket(): Socket {
  if (!bioSocket || bioSocket.disconnected) {
    bioSocket = io(`${baseSocket()}/biometrico`, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });
  }
  return bioSocket;
}

export function disconnectBioSocket() {
  bioSocket?.disconnect();
  bioSocket = null;
}
