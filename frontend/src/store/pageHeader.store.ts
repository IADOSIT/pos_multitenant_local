import { create } from 'zustand';
import { useEffect } from 'react';
import type { ComponentType, ReactNode } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */

// Header estandarizado de las pantallas admin (todas menos el POS).
// Cada pantalla declara su título/subtítulo/icono y sus acciones (toolbar) con
// usePageHeader(); el MainLayout lo renderiza como una barra de ancho completo,
// separada del contenido de la pantalla.
export interface PageHeaderConfig {
  title: string;
  subtitle?: string;
  icon?: ComponentType<any>;
  actions?: ReactNode; // botones / toolbar del lado derecho
}

interface State {
  config: PageHeaderConfig | null;
  setConfig: (c: PageHeaderConfig | null) => void;
}

export const usePageHeaderStore = create<State>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));

// Hook para que una pantalla fije su header. Se actualiza en cada render para que
// los botones (con closures a estado) queden siempre frescos, y se limpia al salir.
export function usePageHeader(config: PageHeaderConfig) {
  useEffect(() => {
    usePageHeaderStore.getState().setConfig(config);
  });
  useEffect(() => () => usePageHeaderStore.getState().setConfig(null), []);
}
