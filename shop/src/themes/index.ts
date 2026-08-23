export type ThemeId = 'lumina' | 'obsidian' | 'zest' | 'iados-abarrotes'

export interface Theme {
  id: ThemeId
  nombre: string
  modo: 'light' | 'dark'
  colorBg: string
  colorSurface: string
  colorSurfaceHover: string
  colorBorder: string
  colorPrimary: string
  colorPrimaryDark: string
  colorPrimaryText: string
  colorAccent: string
  colorAccentText: string
  colorText: string
  colorTextMuted: string
  colorTextSubtle: string
  colorSuccess: string
  colorWarning: string
  colorDanger: string
  colorMayoreo: string
  colorMayoreoText: string
  fontDisplay: string
  fontBody: string
  fontMono: string
  radiusSm: string
  radiusMd: string
  radiusLg: string
  radiusPill: string
  shadowCard: string
  shadowHover: string
  gridCols: number
  navbarStyle: 'minimal' | 'bold' | 'warm' | 'fresh'
  heroStyle: 'gradient-blue' | 'dark-accent' | 'warm-block' | 'produce-market'
  cardStyle: 'flat' | 'glass-dark' | 'rounded-warm' | 'organic'
  badgeStyle: 'pill' | 'sharp' | 'pill-fat' | 'leaf'
  buttonStyle: 'rounded' | 'sharp' | 'pill'
  /** Habilita el botón de "vista rápida" (previsualización sin salir del listado) sobre ProductCard. */
  quickView?: boolean
}

export const THEMES: Record<ThemeId, Theme> = {
  lumina: {
    id: 'lumina', nombre: 'Lumina', modo: 'light',
    colorBg: '#f8fafc', colorSurface: '#ffffff', colorSurfaceHover: '#f1f5f9',
    colorBorder: '#e2e8f0', colorPrimary: '#1e40af', colorPrimaryDark: '#1e3a8a',
    colorPrimaryText: '#ffffff', colorAccent: '#3b82f6', colorAccentText: '#ffffff',
    colorText: '#0f172a', colorTextMuted: '#475569', colorTextSubtle: '#94a3b8',
    colorSuccess: '#16a34a', colorWarning: '#d97706', colorDanger: '#dc2626',
    colorMayoreo: '#7c3aed', colorMayoreoText: '#ffffff',
    fontDisplay: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontBody: "'Inter', 'DM Sans', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    radiusSm: '6px', radiusMd: '10px', radiusLg: '16px', radiusPill: '999px',
    shadowCard: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
    shadowHover: '0 4px 16px rgba(30,64,175,.10)',
    gridCols: 4, navbarStyle: 'minimal', heroStyle: 'gradient-blue',
    cardStyle: 'flat', badgeStyle: 'pill', buttonStyle: 'rounded',
  },
  obsidian: {
    id: 'obsidian', nombre: 'Obsidian', modo: 'dark',
    colorBg: '#0a0a0a', colorSurface: '#111111', colorSurfaceHover: '#181818',
    colorBorder: '#1f1f1f', colorPrimary: '#f59e0b', colorPrimaryDark: '#d97706',
    colorPrimaryText: '#0a0a0a', colorAccent: '#fbbf24', colorAccentText: '#0a0a0a',
    colorText: '#f4f4f5', colorTextMuted: '#a1a1aa', colorTextSubtle: '#52525b',
    colorSuccess: '#4ade80', colorWarning: '#fb923c', colorDanger: '#f87171',
    colorMayoreo: '#f59e0b', colorMayoreoText: '#0a0a0a',
    fontDisplay: "'Space Grotesk', 'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
    fontMono: "'DM Mono', 'JetBrains Mono', monospace",
    radiusSm: '4px', radiusMd: '6px', radiusLg: '10px', radiusPill: '4px',
    shadowCard: 'none', shadowHover: '0 0 0 1px #f59e0b33',
    gridCols: 3, navbarStyle: 'bold', heroStyle: 'dark-accent',
    cardStyle: 'glass-dark', badgeStyle: 'sharp', buttonStyle: 'sharp',
  },
  zest: {
    id: 'zest', nombre: 'Zest', modo: 'light',
    colorBg: '#fffbf5', colorSurface: '#ffffff', colorSurfaceHover: '#fff7ed',
    colorBorder: '#fed7aa', colorPrimary: '#f97316', colorPrimaryDark: '#ea6c0a',
    colorPrimaryText: '#ffffff', colorAccent: '#7c3aed', colorAccentText: '#ffffff',
    colorText: '#1c1917', colorTextMuted: '#78716c', colorTextSubtle: '#a8a29e',
    colorSuccess: '#16a34a', colorWarning: '#d97706', colorDanger: '#dc2626',
    colorMayoreo: '#7c3aed', colorMayoreoText: '#ffffff',
    fontDisplay: "'Nunito', 'DM Sans', sans-serif",
    fontBody: "'Nunito', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    radiusSm: '8px', radiusMd: '14px', radiusLg: '20px', radiusPill: '999px',
    shadowCard: '0 2px 8px rgba(0,0,0,.08)', shadowHover: '0 6px 18px rgba(249,115,22,.18)',
    gridCols: 4, navbarStyle: 'warm', heroStyle: 'warm-block',
    cardStyle: 'rounded-warm', badgeStyle: 'pill-fat', buttonStyle: 'pill',
  },
  'iados-abarrotes': {
    id: 'iados-abarrotes', nombre: 'iaDoS Abarrotes', modo: 'light',
    colorBg: '#f6faf1', colorSurface: '#ffffff', colorSurfaceHover: '#eef7e4',
    colorBorder: '#dfeed0', colorPrimary: '#2f9e44', colorPrimaryDark: '#217a34',
    colorPrimaryText: '#ffffff', colorAccent: '#ff7a3d', colorAccentText: '#ffffff',
    colorText: '#1b2b1e', colorTextMuted: '#5b6f5c', colorTextSubtle: '#94a596',
    colorSuccess: '#2f9e44', colorWarning: '#e8a33d', colorDanger: '#e0483e',
    colorMayoreo: '#7c3aed', colorMayoreoText: '#ffffff',
    fontDisplay: "'Fredoka', 'Baloo 2', sans-serif",
    fontBody: "'Manrope', 'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    radiusSm: '10px', radiusMd: '16px', radiusLg: '26px', radiusPill: '999px',
    shadowCard: '0 2px 10px rgba(47,158,68,.08)',
    shadowHover: '0 12px 28px rgba(47,158,68,.20)',
    gridCols: 4, navbarStyle: 'fresh', heroStyle: 'produce-market',
    cardStyle: 'organic', badgeStyle: 'leaf', buttonStyle: 'pill',
    quickView: true,
  },
}

export function themeToCSS(theme: Theme): string {
  return `
    --color-bg: ${theme.colorBg};
    --color-surface: ${theme.colorSurface};
    --color-surface-hover: ${theme.colorSurfaceHover};
    --color-border: ${theme.colorBorder};
    --color-primary: ${theme.colorPrimary};
    --color-primary-dark: ${theme.colorPrimaryDark};
    --color-primary-text: ${theme.colorPrimaryText};
    --color-accent: ${theme.colorAccent};
    --color-accent-text: ${theme.colorAccentText};
    --color-text: ${theme.colorText};
    --color-text-muted: ${theme.colorTextMuted};
    --color-text-subtle: ${theme.colorTextSubtle};
    --color-success: ${theme.colorSuccess};
    --color-warning: ${theme.colorWarning};
    --color-danger: ${theme.colorDanger};
    --color-mayoreo: ${theme.colorMayoreo};
    --color-mayoreo-text: ${theme.colorMayoreoText};
    --font-display: ${theme.fontDisplay};
    --font-body: ${theme.fontBody};
    --font-mono: ${theme.fontMono};
    --radius-sm: ${theme.radiusSm};
    --radius-md: ${theme.radiusMd};
    --radius-lg: ${theme.radiusLg};
    --radius-pill: ${theme.radiusPill};
    --shadow-card: ${theme.shadowCard};
    --shadow-hover: ${theme.shadowHover};
  `
}
