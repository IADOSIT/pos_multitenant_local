import { create } from 'zustand';
import { CartItem, Producto, CajaActiva } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface POSState {
  cart: CartItem[];
  cajaActiva: CajaActiva | null;
  categoriaActiva: number | null;

  setCajaActiva: (caja: CajaActiva | null) => void;
  setCategoriaActiva: (id: number | null) => void;

  addToCart: (producto: Producto, cantidad?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, cantidad: number) => void;
  updateItemNotes: (itemId: string, notas: string) => void;
  clearCart: () => void;

  getSubtotal: () => number;
  getImpuestos: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  cajaActiva: null,
  categoriaActiva: null,

  setCajaActiva: (caja) => set({ cajaActiva: caja }),
  setCategoriaActiva: (id) => set({ categoriaActiva: id }),

  addToCart: (producto, cantidad = 1) => {
    const cart = get().cart;
    const existing = cart.find(
      (i) => i.producto_id === producto.id && !i.modificadores && !i.notas,
    );

    if (existing) {
      set({
        cart: cart.map((i) =>
          i.id === existing.id
            ? {
                ...i,
                cantidad: i.cantidad + cantidad,
                subtotal: (i.cantidad + cantidad) * i.precio,
              }
            : i,
        ),
      });
    } else {
      const impuestoPct = (producto as any).impuesto_pct || 0;
      const precio = Number(producto.precio);
      const item: CartItem = {
        id: uuidv4(),
        producto_id: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        precio,
        cantidad,
        descuento: 0,
        impuesto: precio * cantidad * (impuestoPct / 100),
        subtotal: precio * cantidad,
      };
      set({ cart: [...cart, item] });
    }
  },

  removeFromCart: (itemId) =>
    set({ cart: get().cart.filter((i) => i.id !== itemId) }),

  updateQuantity: (itemId, cantidad) => {
    if (cantidad <= 0) {
      get().removeFromCart(itemId);
      return;
    }
    set({
      cart: get().cart.map((i) =>
        i.id === itemId ? { ...i, cantidad, subtotal: cantidad * i.precio } : i,
      ),
    });
  },

  updateItemNotes: (itemId, notas) =>
    set({ cart: get().cart.map((i) => (i.id === itemId ? { ...i, notas } : i)) }),

  clearCart: () => set({ cart: [] }),

  getSubtotal: () => get().cart.reduce((s, i) => s + i.subtotal, 0),
  getImpuestos: () => get().cart.reduce((s, i) => s + i.impuesto, 0),
  getTotal: () => get().getSubtotal() + get().getImpuestos(),
  getItemCount: () => get().cart.reduce((s, i) => s + i.cantidad, 0),
}));
