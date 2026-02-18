/**
 * EMC Abastos API Client
 * Consumes Laravel backend endpoints with empresa_id scoping
 */

const API_BASE = import.meta.env.API_BASE_URL || '/api/v1';

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  image_url?: string;
  display_image: string;
  categoria_id: number;
  activo: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  productos_count?: number;
}

export interface Empresa {
  id: number;
  nombre: string;
  handle: string;
  brand_nombre_publico?: string;
  brand_color?: string;
  logo_url?: string;
  settings?: Record<string, any>;
  theme?: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    mode: 'light' | 'dark';
    styles?: Record<string, string>;
  };
}

export interface CartItem {
  producto_id: number;
  qty: number;
  producto?: Producto;
}

class ApiClient {
  private storeHandle: string | null = null;

  setStore(handle: string) {
    this.storeHandle = handle;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add store handle header if set
    if (this.storeHandle) {
      (headers as Record<string, string>)['X-Store-Handle'] = this.storeHandle;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Store/Empresa
  async getStore(handle: string): Promise<Empresa> {
    return this.fetch(`/stores/${handle}`);
  }

  // Products
  async getProducts(params?: { categoria_id?: number; search?: string }): Promise<Producto[]> {
    const query = new URLSearchParams();
    if (params?.categoria_id) query.set('categoria_id', String(params.categoria_id));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return this.fetch(`/products${qs ? `?${qs}` : ''}`);
  }

  async getProduct(id: number): Promise<Producto> {
    return this.fetch(`/products/${id}`);
  }

  // Categories
  async getCategories(): Promise<Categoria[]> {
    return this.fetch('/categories');
  }

  // Cart
  async getCart(): Promise<{ items: CartItem[]; total: number; count: number }> {
    return this.fetch('/cart');
  }

  async addToCart(productoId: number, qty: number = 1): Promise<{ success: boolean; message: string; cart_count: number }> {
    return this.fetch('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ producto_id: productoId, qty }),
    });
  }

  async updateCart(productoId: number, qty: number): Promise<{ success: boolean }> {
    return this.fetch('/cart/update', {
      method: 'POST',
      body: JSON.stringify({ producto_id: productoId, qty }),
    });
  }

  async removeFromCart(productoId: number): Promise<{ success: boolean }> {
    return this.fetch('/cart/remove', {
      method: 'POST',
      body: JSON.stringify({ producto_id: productoId }),
    });
  }
}

export const api = new ApiClient();
export default api;
