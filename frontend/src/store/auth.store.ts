import { create } from 'zustand';
import { User } from '../types';
import { useThemeStore } from './theme.store';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  lock: () => void;
  unlock: (user: User, token: string) => void;
  loadFromStorage: () => void;
}

// Hidratación SÍNCRONA desde localStorage: corre ANTES del primer render para que
// PrivateRoute no redirija a /login al recargar (y no pierdas la ruta actual).
function estadoInicial(): { user: User | null; token: string | null; isAuthenticated: boolean } {
  try {
    const token = localStorage.getItem('pos_token');
    const userStr = localStorage.getItem('pos_user');
    if (token && userStr) return { user: JSON.parse(userStr), token, isAuthenticated: true };
  } catch { /* localStorage inaccesible o JSON inválido */ }
  return { user: null, token: null, isAuthenticated: false };
}

// El login de tarjetas/PIN muestra los usuarios de la tienda ligada a este equipo
// (pos_tienda_id). El superadmin no es de ninguna tienda: su tienda_id en la base es la
// del alta (en una instalacion local, una que ni existe) y ligar el equipo a ella dejaba
// el login con las tarjetas de demostracion en vez de las de la tienda real.
function ligarDispositivo(user: any) {
  if (user?.rol === 'superadmin') return;
  if (user?.tienda_id) {
    localStorage.setItem('pos_tienda_id', String(user.tienda_id));
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...estadoInicial(),
  isLocked: false,

  login: (user, token) => {
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_user', JSON.stringify(user));
    ligarDispositivo(user);
    set({ user, token, isAuthenticated: true, isLocked: false });
    useThemeStore.getState().applyFromEmpresa(user.config_apariencia);
  },

  logout: () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    set({ user: null, token: null, isAuthenticated: false, isLocked: false });
    useThemeStore.getState().resetToDefault();
  },

  lock: () => {
    set({ isLocked: true });
  },

  unlock: (user, token) => {
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_user', JSON.stringify(user));
    ligarDispositivo(user);
    set({ user, token, isAuthenticated: true, isLocked: false });
    useThemeStore.getState().applyFromEmpresa(user.config_apariencia);
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('pos_token');
    const userStr = localStorage.getItem('pos_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      set({ user, token, isAuthenticated: true });
      useThemeStore.getState().applyFromEmpresa(user.config_apariencia);
    }
  },
}));
