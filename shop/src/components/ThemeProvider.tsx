'use client'
import { createContext, useContext } from 'react'
import type { Theme } from '@/themes'

interface ThemeContextValue {
  theme: Theme
  tiendaInfo: any
  subdominio: string
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ theme, tiendaInfo, subdominio, children }: ThemeContextValue & { children: React.ReactNode }) {
  return <ThemeContext.Provider value={{ theme, tiendaInfo, subdominio }}>{children}</ThemeContext.Provider>
}

export function useShopTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useShopTheme must be used inside ThemeProvider')
  return ctx
}
