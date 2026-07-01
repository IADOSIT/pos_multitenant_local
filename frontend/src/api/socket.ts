import { io, Socket } from 'socket.io-client';

let bioSocket: Socket | null = null;

export function getBioSocket(): Socket {
  if (!bioSocket || bioSocket.disconnected) {
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://posapi.iados.online';
    bioSocket = io(`${base}/biometrico`, {
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
