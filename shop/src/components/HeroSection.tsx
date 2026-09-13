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

  if (theme.heroStyle === 'produce-market') {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', padding: '40px 16px 56px' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'var(--color-primary)', opacity: 0.08 }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'var(--color-accent)', opacity: 0.08 }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 32, alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', padding: '5px 14px', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 16 }}>
              🌱 Fresco todos los días
            </span>
            {info.logo_url && <img src={info.logo_url} alt="logo" style={{ height: 40, objectFit: 'contain', marginBottom: 14, display: 'block' }} />}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 14px', lineHeight: 1.15 }}>
              {info.nombre_tienda || info.empresa?.nombre}
            </h1>
            {info.descripcion && <p style={{ fontSize: 15, color: 'var(--color-text-muted)', maxWidth: 460, lineHeight: 1.6, margin: '0 0 26px' }}>{info.descripcion}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href={`/${subdominio}/productos`} style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', padding: '13px 30px', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Ver catálogo 🧺
              </Link>
              {info.modo_mayoreo && (
                <span style={{ background: 'var(--color-mayoreo)', color: 'var(--color-mayoreo-text)', padding: '13px 22px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  💼 Precio mayoreo
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { emoji: '🍅', label: 'Frutas y verduras' },
              { emoji: '🥖', label: 'Panadería' },
              { emoji: '🧀', label: 'Lácteos y frescos' },
              { emoji: '🧺', label: 'Despensa' },
            ].map((c, i) => (
              <div key={c.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px 16px', textAlign: 'center', boxShadow: 'var(--shadow-card)', transform: i % 2 === 1 ? 'translateY(14px)' : 'none' }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>{c.emoji}</div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-display)' }}>{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (theme.heroStyle === 'boutique-brush') {
    const nombre = info.nombre_tienda || info.empresa?.nombre || 'Boutique'
    const inicial = nombre.trim().charAt(0).toUpperCase()
    const servicios = [
      { icono: '🚚', titulo: 'Envío a todo México', detalle: 'Rastrea tu pedido en línea' },
      { icono: '💬', titulo: 'Te atendemos por WhatsApp', detalle: 'Resolvemos dudas antes de comprar' },
      { icono: '🎀', titulo: 'Novedades cada semana', detalle: 'Piezas nuevas en el catálogo' },
      { icono: '🛍️', titulo: 'Aparta y recoge en tienda', detalle: 'Sin costo de envío' },
    ]

    return (
      <>
        <section style={{ background: 'linear-gradient(180deg, var(--color-surface-hover), var(--color-bg))', padding: '56px 16px 64px', overflow: 'hidden' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--color-primary)', margin: '0 0 18px' }}>
                Novedades para ti
              </p>
              {info.logo_url && <img src={info.logo_url} alt="logo" style={{ height: 42, objectFit: 'contain', marginBottom: 18, display: 'block' }} />}
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 6.5vw, 72px)', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 16px', lineHeight: 1.02, letterSpacing: '-.01em' }}>
                {nombre}
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-text-muted)', maxWidth: 420, lineHeight: 1.7, margin: '0 0 30px' }}>
                {info.descripcion || 'Accesorios, bisutería y regalos elegidos pieza por pieza. Lo que ves en el catálogo está disponible hoy.'}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href={`/${subdominio}/productos`} style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', padding: '14px 34px', borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none' }}>
                  Ver colección
                </Link>
                {info.modo_mayoreo && (
                  <span style={{ border: '1px solid var(--color-mayoreo)', color: 'var(--color-mayoreo)', padding: '13px 24px', borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                    Precio mayoreo
                  </span>
                )}
              </div>
            </div>

            {/* Firma del tema: la pincelada. El logo (o la inicial) va montado encima. */}
            <div style={{ position: 'relative', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 420 320" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="brochazo" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="55%" stopColor="var(--color-accent)" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
                <g transform="rotate(-8 210 160)">
                  <path fill="url(#brochazo)" d="M18,250 C82,196 150,152 236,120 C286,101 336,88 382,86 C404,85 412,104 396,118 C372,139 322,152 276,169 C214,192 148,224 92,264 C62,285 30,278 18,250 Z" />
                  <path fill="url(#brochazo)" opacity=".42" d="M60,290 C130,244 208,206 300,182 C334,173 360,176 356,190 C352,205 318,213 284,226 C224,249 160,278 116,306 C94,319 66,308 60,290 Z" />
                  <path fill="url(#brochazo)" opacity=".26" d="M228,74 C268,58 314,48 352,48 C370,48 374,60 360,66 C340,74 300,80 264,92 C244,99 218,82 228,74 Z" />
                </g>
              </svg>
              <div style={{ position: 'relative', width: 172, height: 172, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 18px 44px rgba(27,16,22,.14)', overflow: 'hidden' }}>
                {info.banner_url
                  ? <img src={info.banner_url} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'var(--font-display)', fontSize: 76, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{inicial}</span>
                }
              </div>
            </div>
          </div>
        </section>

        <section style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '22px 16px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 20 }}>
            {servicios.map(s => (
              <div key={s.titulo} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span aria-hidden style={{ fontSize: 18, lineHeight: 1.2 }}>{s.icono}</span>
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{s.titulo}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{s.detalle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
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
