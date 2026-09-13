import { create } from 'zustand';

/**
 * Preferencia del teclado en pantalla del POS (una terminal tactil sin teclado
 * fisico necesita escribir efectivo, cantidades, nombres de cliente, etc.).
 *
 * La preferencia es por equipo, no por usuario: se guarda en localStorage porque
 * lo que decide si hace falta es el hardware de esa caja, no quien inicio sesion.
 */
export type ModoTeclado = 'auto' | 'on' | 'off';

const LS_KEY = 'pos_teclado_pantalla';

function leerModo(): ModoTeclado {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === 'on' || v === 'off' || v === 'auto') return v;
  } catch { /* localStorage bloqueado (modo privado) */ }
  return 'auto';
}

/** En 'auto' solo se enciende en equipos tactiles: una PC de escritorio no lo necesita. */
export function equipoTactil(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
}

/**
 * En 'auto' basta con que alguien teclee de verdad (o pase un codigo de barras por
 * el lector, que tambien "teclea") para que el teclado deje de aparecer: ese equipo
 * tiene con que escribir. Si el usuario lo forzo en 'on', se respeta siempre.
 */
export function tecladoHabilitado(modo: ModoTeclado, fisicoDetectado: boolean): boolean {
  if (modo === 'on') return true;
  if (modo === 'off') return false;
  return equipoTactil() && !fisicoDetectado;
}

interface TecladoState {
  modo: ModoTeclado;
  fisicoDetectado: boolean;
  setModo: (m: ModoTeclado) => void;
  toggle: () => void;
  marcarFisico: () => void;
}

export const useTecladoStore = create<TecladoState>((set, get) => ({
  modo: leerModo(),
  fisicoDetectado: false,

  setModo: (modo) => {
    try { localStorage.setItem(LS_KEY, modo); } catch { /* sin persistencia, solo esta sesion */ }
    set({ modo, fisicoDetectado: false });
  },

  toggle: () => {
    const activo = tecladoHabilitado(get().modo, get().fisicoDetectado);
    get().setModo(activo ? 'off' : 'on');
  },

  marcarFisico: () => {
    if (get().modo === 'auto' && !get().fisicoDetectado) set({ fisicoDetectado: true });
  },
}));
