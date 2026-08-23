'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useShopTheme } from './ThemeProvider'
import { useCart } from '@/hooks/useCart'

export default function Navbar({ categorias }: { categorias: any[] }) {
  const { theme, tiendaInfo, subdominio } = useShopTheme()
  const { items } = useCart()
  const totalItems = items.reduce((s, i) => s + i.qty, 0)

  if (theme.navbarStyle === 'bold') return <NavbarObsidian tiendaInfo={tiendaInfo} subdominio={subdominio} categorias={categorias} totalItems={totalItems} />
  if (theme.navbarStyle === 'warm') return <NavbarZest tiendaInfo={tiendaInfo} subdominio={subdominio} categorias={categorias} totalItems={totalItems} />
  if (theme.navbarStyle === 'fresh') return <NavbarAbarrotes tiendaInfo={tiendaInfo} subdominio={subdominio} categorias={categorias} totalItems={totalItems} />
  return <NavbarLumina tiendaInfo={tiendaInfo} subdominio={subdominio} categorias={categorias} totalItems={totalItems} />
}

function NavbarLumina({ tiendaInfo, subdominio, categorias, totalItems }: any) {
  return (
    <nav style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href={`/${subdominio}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--color-primary)', textDecoration: 'none' }}>
            {tiendaInfo?.nombre_tienda || tiendaInfo?.empresa?.nombre}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href={`/${subdominio}/productos`} style={{ fontSize: 14, color: 'var(--color-text-muted)', textDecoration: 'none' }}>Productos</Link>
            <Link href={`/${subdominio}/pedidos`} style={{ fontSize: 14, color: 'var(--color-text-muted)', textDecoration: 'none' }}>Mis pedidos</Link>
            <Link href={`/${subdominio}/carrito`} style={{ position: 'relative', color: 'var(--color-primary)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              🛒 {totalItems > 0 && <span style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: '999px', fontSize: 10, padding: '1px 5px', position: 'absolute', top: -8, right: -10 }}>{totalItems}</span>}
            </Link>
          </div>
        </div>
        {categorias.length > 0 && (
          <div style={{ display: 'flex', gap: 20, paddingBottom: 12, overflowX: 'auto' }}>
            <Link href={`/${subdominio}/productos`} style={{ fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Todo</Link>
            {categorias.map((c: any) => (
              <Link key={c.id} href={`/${subdominio}/productos?categoria_id=${c.id}`} style={{ fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{c.nombre}</Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

function NavbarObsidian({ tiendaInfo, subdominio, categorias, totalItems }: any) {
  return (
    <nav style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <Link href={`/${subdominio}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-primary)', textDecoration: 'none', letterSpacing: '1px', textTransform: 'uppercase' }}>
          ◆ {tiendaInfo?.nombre_tienda || tiendaInfo?.empresa?.nombre}
        </Link>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {categorias.slice(0, 4).map((c: any) => (
            <Link key={c.id} href={`/${subdominio}/productos?categoria_id=${c.id}`} style={{ fontSize: 11, color: 'var(--color-text-muted)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.nombre}</Link>
          ))}
          <Link href={`/${subdominio}/pedidos`} style={{ fontSize: 11, color: 'var(--color-text-muted)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mis pedidos</Link>
          <Link href={`/${subdominio}/carrito`} style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', padding: '6px 14px', fontSize: 11, fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase' }}>
            [{totalItems}]
          </Link>
        </div>
      </div>
    </nav>
  )
}

function NavbarZest({ tiendaInfo, subdominio, categorias, totalItems }: any) {
  return (
    <>
      <div style={{ background: 'var(--color-primary)', textAlign: 'center', fontSize: 12, color: '#fff', fontWeight: 600, padding: '6px 16px', fontFamily: 'var(--font-display)' }}>
        🚚 Envío disponible — Contáctanos para más información
      </div>
      <nav style={{ background: 'var(--color-surface)', borderBottom: `1px solid var(--color-border)` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            <Link href={`/${subdominio}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--color-primary)', textDecoration: 'none' }}>
              {tiendaInfo?.nombre_tienda || tiendaInfo?.empresa?.nombre}
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link href={`/${subdominio}/pedidos`} style={{ fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 600 }}>Mis pedidos</Link>
              <Link href={`/${subdominio}/carrito`} style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 18px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                🛒 {totalItems}
              </Link>
            </div>
          </div>
          {categorias.length > 0 && (
            <div style={{ display: 'flex', gap: 8, paddingBottom: 10, overflowX: 'auto' }}>
              <Link href={`/${subdominio}/productos`} style={{ fontSize: 12, background: 'var(--color-primary)', color: '#fff', padding: '4px 12px', borderRadius: 'var(--radius-pill)', textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 700 }}>Todo</Link>
              {categorias.map((c: any) => (
                <Link key={c.id} href={`/${subdominio}/productos?categoria_id=${c.id}`} style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', textDecoration: 'none', whiteSpace: 'nowrap', border: `1px solid var(--color-border)` }}>{c.nombre}</Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

function NavbarAbarrotes({ tiendaInfo, subdominio, categorias, totalItems }: any) {
  const router = useRouter()
  const [q, setQ] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (q) p.set('buscar', q)
    router.push(`/${subdominio}/productos${p.toString() ? `?${p.toString()}` : ''}`)
  }

  return (
    <nav style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 0 rgba(0,0,0,.03)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href={`/${subdominio}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span aria-hidden style={{ display: 'inline-flex', width: 34, height: 34, borderRadius: '50%', background: 'var(--color-primary)', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🥬</span>
            {tiendaInfo?.nombre_tienda || tiendaInfo?.empresa?.nombre}
          </Link>

          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', maxWidth: 480 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span aria-hidden style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.6 }}>🔍</span>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Busca frutas, verduras, despensa..."
                style={{ width: '100%', padding: '10px 14px 10px 36px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', background: 'var(--color-surface-hover)', color: 'var(--color-text)', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
              />
            </div>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <Link href={`/${subdominio}/pedidos`} style={{ fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 600 }}>Mis pedidos</Link>
            <Link href={`/${subdominio}/carrito`} style={{ position: 'relative', background: 'var(--color-primary)', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 16 }}>
              🧺
              {totalItems > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--color-accent)', color: 'var(--color-accent-text)', borderRadius: '999px', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{totalItems}</span>}
            </Link>
          </div>
        </div>

        {categorias.length > 0 && (
          <div style={{ display: 'flex', gap: 8, paddingTop: 10, overflowX: 'auto' }}>
            <Link href={`/${subdominio}/productos`} style={{ fontSize: 12, background: 'var(--color-primary)', color: '#fff', padding: '5px 14px', borderRadius: 'var(--radius-pill)', textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 700 }}>🌿 Todo</Link>
            {categorias.map((c: any) => (
              <Link key={c.id} href={`/${subdominio}/productos?categoria_id=${c.id}`} style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '5px 14px', borderRadius: 'var(--radius-pill)', textDecoration: 'none', whiteSpace: 'nowrap', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>{c.nombre}</Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
