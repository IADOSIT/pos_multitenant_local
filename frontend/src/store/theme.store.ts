import { create } from 'zustand';

export type ThemeName = 'default' | 'moderno' | 'elegante' | 'neon' | 'compacto';
export type PaletteName = 'default' | 'esmeralda' | 'purpura' | 'rubi' | 'oceano';

interface ThemeState {
  theme: ThemeName;
  palette: PaletteName;
  setTheme: (t: ThemeName) => void;
  setPalette: (p: PaletteName) => void;
  applyFromEmpresa: (config: { tema?: string; paleta?: string } | null | undefined) => void;
  resetToDefault: () => void;
}

function applyToDOM(theme: ThemeName, palette: PaletteName) {
  const el = document.documentElement;
  el.dataset.theme = theme === 'default' ? '' : theme;
  el.dataset.palette = palette === 'default' ? '' : palette;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'default',
  palette: 'default',

  setTheme: (theme) => {
    set((s) => {
      applyToDOM(theme, s.palette);
      return { theme };
    });
  },

  setPalette: (palette) => {
    set((s) => {
      applyToDOM(s.theme, palette);
      return { palette };
    });
  },

  applyFromEmpresa: (config) => {
    const theme = (config?.tema as ThemeName) || 'default';
    const palette = (config?.paleta as PaletteName) || 'default';
    applyToDOM(theme, palette);
    set({ theme, palette });
  },

  resetToDefault: () => {
    applyToDOM('default', 'default');
    set({ theme: 'default', palette: 'default' });
  },
}));

// On first load: start with default (will be overridden by applyFromEmpresa on login)
applyToDOM('default', 'default');
