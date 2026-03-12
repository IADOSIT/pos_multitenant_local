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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLocked: false,

  login: (user, token) => {
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_user', JSON.stringify(user));
    if (user.tienda_id) {
      localStorage.setItem('pos_tienda_id', String(user.tienda_id));
    }
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
    if (user.tienda_id) {
      localStorage.setItem('pos_tienda_id', String(user.tienda_id));
    }
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
