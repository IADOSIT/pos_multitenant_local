import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchTiendaInfo } from '@/lib/api'
import { THEMES, themeToCSS } from '@/themes'
import { ThemeProvider } from '@/components/ThemeProvider'

export async function generateMetadata({ params }: { params: Promise<{ subdominio: string }> }): Promise<Metadata> {
  const { subdominio } = await params
  const info = await fetchTiendaInfo(subdominio)
  if (!info) return { title: 'Tienda no encontrada' }
  return {
    title: `${info.nombre_tienda} | Tienda en línea`,
    description: info.descripcion || `Compra en línea en ${info.nombre_tienda}`,
    openGraph: {
      title: info.nombre_tienda,
      description: info.descripcion,
      images: info.banner_url ? [info.banner_url] : info.logo_url ? [info.logo_url] : [],
    },
    themeColor: info.color_primario || '#1e40af',
  }
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ subdominio: string }>
}) {
  const { subdominio } = await params
  const info = await fetchTiendaInfo(subdominio)
  if (!info) notFound()

  const themeId = info.tema_id || 'lumina'
  const theme = THEMES[themeId as keyof typeof THEMES] ?? THEMES.lumina
  const cssVars = themeToCSS(theme)

  const fontLinks: Record<string, string> = {
    lumina: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500&display=swap',
    obsidian: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap',
    zest: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap',
  }

  return (
    <html lang="es" data-theme={theme.id} data-mode={theme.modo}>
      <head>
        <style>{`:root { ${cssVars} }`}</style>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontLinks[themeId] || fontLinks.lumina} rel="stylesheet" />
      </head>
      <body style={{
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        margin: 0,
        minHeight: '100vh',
      }}>
        <ThemeProvider theme={theme} tiendaInfo={info} subdominio={subdominio}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
