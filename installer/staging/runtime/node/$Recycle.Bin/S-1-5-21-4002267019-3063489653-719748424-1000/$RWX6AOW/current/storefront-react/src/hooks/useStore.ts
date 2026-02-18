import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { Empresa } from '../lib/api';

/**
 * Hook for resolving store (empresa) context.
 * Fetches empresa config by handle and sets API scoping.
 */
export function useStore(handle: string) {
  const [store, setStore] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;

    api.setStore(handle);
    setLoading(true);
    setError(null);

    api.getStore(handle)
      .then((data) => {
        setStore(data);

        // Apply theme CSS variables to document root
        if (data.theme?.styles) {
          const root = document.documentElement;
          for (const [key, value] of Object.entries(data.theme.styles)) {
            root.style.setProperty(key, value);
          }
        }
        if (data.brand_color) {
          document.documentElement.style.setProperty('--brand-primary', data.brand_color);
        }
      })
      .catch((err) => {
        setError(err.message || 'Store not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [handle]);

  return { store, loading, error };
}
