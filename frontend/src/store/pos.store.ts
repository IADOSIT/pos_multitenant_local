import { create } from 'zustand';
import { CartItem, Producto, CajaActiva } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface IvaConfig {
  enabled: boolean;
  porcentaje: number;
  incluido: boolean; // true = precio ya incluye IVA
}

interface POSState {
  cart: CartItem[];
  cajaActiva: CajaActiva | null;
  categoriaActiva: number | null;
  mesaActiva: number | null;
  modoServicio: 'autoservicio' | 'mesa';
  tipoCobro: 'pago_inmediato' | 'post_pago';
  tipoServicio: 'en_sitio' | 'para_llevar';
  ivaConfig: IvaConfig;
  notaPedido: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteDireccion: string;

  setCajaActiva: (caja: CajaActiva | null) => void;
  setCategoriaActiva: (id: number | null) => void;
  setMesaActiva: (mesa: number | null) => void;
  setModoServicio: (modo: 'autoservicio' | 'mesa') => void;
  setTipoCobro: (tipo: 'pago_inmediato' | 'post_pago') => void;
  setTipoServicio: (tipo: 'en_sitio' | 'para_llevar') => void;
  setIvaConfig: (config: IvaConfig) => void;
  setNotaPedido: (v: string) => void;
  setClienteNombre: (v: string) => void;
  setClienteTelefono: (v: string) => void;
  setClienteDireccion: (v: string) => void;

  setCart: (cart: CartItem[]) => void;
  addToCart: (producto: Producto, cantidad?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, cantidad: number) => void;
  updateItemPrice: (id: string, price: number) => void;
  updateItemNotes: (itemId: string, notas: string) => void;
  updateItemPeso: (itemId: string, peso_kg: number) => void;
  setItemApartado: (itemId: string, tienda_id: number | undefined, tienda_nombre?: string) => void;
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
  mesaActiva: null,
  modoServicio: 'autoservicio',
  tipoCobro: 'pago_inmediato',
  tipoServicio: 'en_sitio',
  ivaConfig: { enabled: false, porcentaje: 16, incluido: true },
  notaPedido: '',
  clienteNombre: '',
  clienteTelefono: '',
  clienteDireccion: '',

  setCajaActiva: (caja) => set({ cajaActiva: caja }),
  setCategoriaActiva: (id) => set({ categoriaActiva: id }),
  setMesaActiva: (mesa) => set({ mesaActiva: mesa }),
  setModoServicio: (modo) => set({ modoServicio: modo }),
  setTipoCobro: (tipo) => set({ tipoCobro: tipo }),
  setTipoServicio: (tipo) => set({ tipoServicio: tipo }),
  setIvaConfig: (config) => set({ ivaConfig: config }),
  setNotaPedido: (v) => set({ notaPedido: v }),
  setClienteNombre: (v) => set({ clienteNombre: v }),
  setClienteTelefono: (v) => set({ clienteTelefono: v }),
  setClienteDireccion: (v) => set({ clienteDireccion: v }),

  setCart: (cart) => set({ cart }),

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
                subtotal: (i.cantidad + cantidad) * (i.precioManual ?? i.precio),
                apartado_tienda_id: undefined,
                apartado_tienda_nombre: undefined,
              }
            : i,
        ),
      });
    } else {
      const precio = Number(producto.precio);
      const item: CartItem = {
        id: uuidv4(),
        producto_id: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        precio,
        cantidad,
        descuento: 0,
        impuesto: 0, // Se calcula dinámicamente en getImpuestos
        subtotal: precio * cantidad,
        stock_actual: (producto as any).stock_actual !== undefined ? Number((producto as any).stock_actual) : undefined,
        controla_stock: (producto as any).controla_stock,
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
        i.id === itemId
          ? { ...i, cantidad, subtotal: cantidad * (i.precioManual ?? i.precio), apartado_tienda_id: undefined, apartado_tienda_nombre: undefined }
          : i,
      ),
    });
  },

  updateItemPrice: (id, price) =>
    set((state) => ({
      cart: state.cart.map((i) =>
        i.id === id
          ? { ...i, precioManual: price >= 0 ? price : 0, subtotal: (price >= 0 ? price : 0) * i.cantidad }
          : i,
      ),
    })),

  updateItemNotes: (itemId, notas) =>
    set({ cart: get().cart.map((i) => (i.id === itemId ? { ...i, notas } : i)) }),

  // Kilos de una linea vendida por peso — se muestran siempre en el carrito, a
  // diferencia de las notas, que dependen de que el modulo de notas este activo.
  updateItemPeso: (itemId, peso_kg) =>
    set({ cart: get().cart.map((i) => (i.id === itemId ? { ...i, peso_kg } : i)) }),

  setItemApartado: (itemId, tienda_id, tienda_nombre) =>
    set({
      cart: get().cart.map((i) =>
        i.id === itemId ? { ...i, apartado_tienda_id: tienda_id, apartado_tienda_nombre: tienda_id ? tienda_nombre : undefined } : i,
      ),
    }),

  clearCart: () => set({ cart: [], notaPedido: '', clienteNombre: '', clienteTelefono: '', clienteDireccion: '' }),

  getSubtotal: () => {
    const { cart, ivaConfig } = get();
    const bruto = cart.reduce((s, i) => s + i.subtotal, 0);
    if (ivaConfig.enabled && ivaConfig.incluido) {
      // Precio incluye IVA: subtotal = bruto / (1 + iva)
      return bruto / (1 + ivaConfig.porcentaje / 100);
    }
    return bruto;
  },

  getImpuestos: () => {
    const { cart, ivaConfig } = get();
    if (!ivaConfig.enabled) return 0;
    const bruto = cart.reduce((s, i) => s + i.subtotal, 0);
    if (ivaConfig.incluido) {
      // IVA incluido: impuesto = bruto - (bruto / (1 + iva))
      return bruto - bruto / (1 + ivaConfig.porcentaje / 100);
    }
    // IVA se suma: impuesto = bruto * iva%
    return bruto * (ivaConfig.porcentaje / 100);
  },

  getTotal: () => {
    const { cart, ivaConfig } = get();
    const bruto = cart.reduce((s, i) => s + i.subtotal, 0);
    if (!ivaConfig.enabled) return bruto;
    if (ivaConfig.incluido) return bruto; // precio ya incluye IVA
    return bruto + bruto * (ivaConfig.porcentaje / 100); // IVA se suma
  },

  getItemCount: () => get().cart.reduce((s, i) => s + i.cantidad, 0),
}));
