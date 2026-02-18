import { useEffect, useRef, useCallback, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface UseNotificacionesOptions {
  onNuevoPedido?: (data: any) => void;
  onPedidoActualizado?: (data: any) => void;
  onPedidoCobrado?: (data: any) => void;
  enabled?: boolean;
}

export function useNotificaciones(options: UseNotificacionesOptions) {
  const { onNuevoPedido, onPedidoActualizado, onPedidoCobrado, enabled = true } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);

  const playAlarm = useCallback(() => {
    try {
      const audio = new Audio('/sounds/new-order.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem('pos_token');
    if (!token) return;

    const url = `${API_URL}/notificaciones/sse?token=${token}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setConnected(true);
    });

    es.addEventListener('nuevo_pedido', (e) => {
      const data = JSON.parse(e.data);
      setPedidosPendientes((prev) => prev + 1);
      playAlarm();
      onNuevoPedido?.(data);
    });

    es.addEventListener('pedido_actualizado', (e) => {
      const data = JSON.parse(e.data);
      onPedidoActualizado?.(data);
    });

    es.addEventListener('pedido_cobrado', (e) => {
      const data = JSON.parse(e.data);
      setPedidosPendientes((prev) => Math.max(0, prev - 1));
      onPedidoCobrado?.(data);
    });

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  const resetPendientes = useCallback((count: number) => {
    setPedidosPendientes(count);
  }, []);

  return { connected, pedidosPendientes, resetPendientes };
}
