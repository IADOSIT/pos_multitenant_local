import { useState, useCallback } from 'react';
import api from '../lib/api';
import type { CartItem } from '../lib/api';

/**
 * Hook for cart state management.
 * Consumes Laravel session-based cart via API endpoints.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCart();
      setItems(data.items);
      setCount(data.count);
      setTotal(data.total);
    } catch {
      // Cart fetch failed - keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (productoId: number, qty: number = 1) => {
    const result = await api.addToCart(productoId, qty);
    if (result.success) {
      setCount(result.cart_count);
    }
    return result;
  }, []);

  const updateItem = useCallback(async (productoId: number, qty: number) => {
    const result = await api.updateCart(productoId, qty);
    if (result.success) await refresh();
    return result;
  }, [refresh]);

  const removeItem = useCallback(async (productoId: number) => {
    const result = await api.removeFromCart(productoId);
    if (result.success) await refresh();
    return result;
  }, [refresh]);

  return { items, count, total, loading, refresh, addItem, updateItem, removeItem };
}
