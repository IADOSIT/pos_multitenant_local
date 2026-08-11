import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CartItem } from '../types';

// Tickets temporales del POS modo Retail: varias ventas abiertas a la vez, persistidas
// en localStorage (no se pierden al recargar). Son temporales hasta que se confirman
// (venta completada) o se eliminan; al cambiar de sesión de caja se descartan.
export interface RetailTicket {
  id: string;
  nombre: string;
  cart: CartItem[];
  tipoServicio: 'en_sitio' | 'para_llevar';
}

interface Persisted {
  tickets: RetailTicket[];
  activeId: string | null;
  cajaId: number | null;
  seq: number;
}

const KEY = 'pos_retail_tickets_v1';

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { tickets: [], activeId: null, cajaId: null, seq: 0 };
}
function save(p: Persisted) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

interface State extends Persisted {
  /** Carga desde localStorage; si cambió la caja se descartan; garantiza 1 ticket activo. */
  hydrate: (cajaId: number | null) => RetailTicket;
  crear: () => RetailTicket;
  activar: (id: string) => RetailTicket | undefined;
  cerrar: (id: string) => RetailTicket; // elimina y devuelve el nuevo activo
  guardarActivo: (cart: CartItem[], tipoServicio: RetailTicket['tipoServicio']) => void;
  ventaCompletada: () => RetailTicket; // quita el activo (vendido) y devuelve el siguiente
  limpiarTodo: () => void;
}

export const useRetailTickets = create<State>((set, get) => ({
  ...load(),

  hydrate: (cajaId) => {
    let s: Persisted = { ...load() };
    // Descartar SOLO si se abrió una caja DISTINTA (cierre + apertura real). Si la caja
    // aún no se conoce (null, típico al recargar) o es la primera asociación, se conservan
    // los tickets para que sobrevivan a la recarga.
    if (cajaId != null && s.cajaId != null && s.cajaId !== cajaId) {
      s = { tickets: [], activeId: null, cajaId, seq: s.seq };
    } else if (s.cajaId == null && cajaId != null) {
      s.cajaId = cajaId;
    }
    if (!s.tickets.length) {
      const t: RetailTicket = { id: uuidv4(), nombre: `Ticket ${s.seq + 1}`, cart: [], tipoServicio: 'para_llevar' };
      s = { ...s, tickets: [t], activeId: t.id, seq: s.seq + 1 };
    }
    if (!s.activeId || !s.tickets.some((t) => t.id === s.activeId)) s.activeId = s.tickets[0].id;
    set(s); save(s);
    return s.tickets.find((t) => t.id === s.activeId)!;
  },

  crear: () => {
    const s = get();
    const t: RetailTicket = { id: uuidv4(), nombre: `Ticket ${s.seq + 1}`, cart: [], tipoServicio: 'para_llevar' };
    const next = { ...s, tickets: [...s.tickets, t], activeId: t.id, seq: s.seq + 1 };
    set(next); save(next);
    return t;
  },

  activar: (id) => {
    const s = get();
    const t = s.tickets.find((x) => x.id === id);
    if (!t) return undefined;
    const next = { ...s, activeId: id };
    set(next); save(next);
    return t;
  },

  cerrar: (id) => {
    const s = get();
    let tickets = s.tickets.filter((t) => t.id !== id);
    let seq = s.seq;
    if (!tickets.length) {
      const t: RetailTicket = { id: uuidv4(), nombre: `Ticket ${seq + 1}`, cart: [], tipoServicio: 'para_llevar' };
      tickets = [t]; seq += 1;
    }
    const activeId = id === s.activeId ? tickets[0].id : s.activeId;
    const next = { ...s, tickets, activeId, seq };
    set(next); save(next);
    return tickets.find((t) => t.id === activeId)!;
  },

  guardarActivo: (cart, tipoServicio) => {
    const s = get();
    if (!s.activeId) return;
    const tickets = s.tickets.map((t) => (t.id === s.activeId ? { ...t, cart, tipoServicio } : t));
    const next = { ...s, tickets };
    set(next); save(next);
  },

  ventaCompletada: () => get().cerrar(get().activeId || ''),

  limpiarTodo: () => {
    const next: Persisted = { tickets: [], activeId: null, cajaId: get().cajaId, seq: get().seq };
    set(next); save(next);
  },
}));
