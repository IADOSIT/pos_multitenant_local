'use client'
import Link from 'next/link'
import { useShopTheme } from './ThemeProvider'

export default function HeroSection({ info }: { info: any }) {
  const { theme, subdominio } = useShopTheme()

  if (theme.heroStyle === 'dark-accent') {
    return (
      <div style={{ background: 'var(--color-bg)', borderBottom: `1px solid var(--color-border)`, padding: '48px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 30% 50%, rgba(245,158,11,0.06), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <div style={{ width: '100%', height: 1, background: 'var(--color-primary)', marginBottom: 32, opacity: 0.4 }} />
          {info.logo_url && <img src={info.logo_url} alt="logo" style={{ height: 40, objectFit: 'contain', marginBottom: 16, filter: 'brightness(0) saturate(100%) invert(71%) sepia(79%) saturate(400%) hue-rotate(1deg) brightness(101%) contrast(101%)' }} />}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            {info.nombre_tienda || info.empresa?.nombre}
          </h1>
          {info.descripcion && <p style={{ fontSize: 15, color: 'var(--color-text-muted)', maxWidth: 480, lineHeight: 1.6, margin: '0 0 28px' }}>{info.descripcion}</p>}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={`/${subdominio}/productos`} style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', padding: '12px 28px', fontWeight: 700, fontSize: 13, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ver Catálogo →
            </Link>
            {info.modo_mayoreo && (
              <span style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '12px 20px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                💼 PRECIO MAYOREO DISPONIBLE
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (theme.heroStyle === 'warm-block') {
    return (
      <div style={{ padding: '24px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 12 }}>
          <div style={{ background: `linear-gradient(135deg, var(--color-primary), #ea580c)`, borderRadius: 'var(--radius-lg)', padding: '48px 40px' }}>
            {info.logo_url && <img src={info.logo_url} alt="logo" style={{ height: 44, objectFit: 'contain', marginBottom: 16, filter: 'brightness(0) invert(1)' }} />}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>
              {info.nombre_tienda || info.empresa?.nombre}
            </h1>
            {info.descripcion && <p style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', margin: '0 0 24px' }}>{info.descripcion}</p>}
            <Link href={`/${subdominio}/productos`} style={{ background: '#fff', color: 'var(--color-primary)', padding: '12px 28px', borderRadius: 'var(--radius-pill)', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>
              Ver productos
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {info.modo_mayoreo && (
              <div style={{ background: '#7c3aed', borderRadius: 'var(--radius-lg)', padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', margin: '0 0 4px' }}>🛒 Mayoreo disponible</p>
                <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, margin: 0 }}>Precios especiales en compras grandes</p>
              </div>
            )}
            <div style={{ background: '#dc2626', borderRadius: 'var(--radius-lg)', padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', margin: '0 0 4px' }}>🔥 Productos frescos</p>
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, margin: 0 }}>Catálogo actualizado en tiempo real</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // gradient-blue (lumina default)
  return (
    <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', padding: '64px 16px', textAlign: 'center' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {info.logo_url && <img src={info.logo_url} alt="logo" style={{ height: 48, objectFit: 'contain', marginBottom: 20, filter: 'brightness(0) invert(1)' }} />}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>
          {info.nombre_tienda || info.empresa?.nombre}
        </h1>
        {info.descripcion && <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', margin: '0 0 32px', lineHeight: 1.6 }}>{info.descripcion}</p>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/${subdominio}/productos`} style={{ background: '#fff', color: '#1e40af', padding: '12px 32px', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Ver productos
          </Link>
          {info.modo_mayoreo && (
            <Link href={`/${subdominio}/productos`} style={{ border: '2px solid rgba(255,255,255,.5)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              💼 Cotizar al mayoreo
            </Link>
          )}
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>✓ Pagos seguros</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>📦 Envío disponible</span>
        </div>
      </div>
    </div>
  )
}
