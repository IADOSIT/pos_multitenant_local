import { create } from 'zustand';
import { User } from '../types';
import { useThemeStore } from './theme.store';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => {
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
    // Apply empresa theme
    useThemeStore.getState().applyFromEmpresa(user.config_apariencia);
  },

  logout: () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    set({ user: null, token: null, isAuthenticated: false });
    // Reset to default theme
    useThemeStore.getState().resetToDefault();
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('pos_token');
    const userStr = localStorage.getItem('pos_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      set({ user, token, isAuthenticated: true });
      // Apply empresa theme on reload
      useThemeStore.getState().applyFromEmpresa(user.config_apariencia);
    }
  },
}));
