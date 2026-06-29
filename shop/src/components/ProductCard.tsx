'use client'
import Link from 'next/link'
import { useShopTheme } from './ThemeProvider'
import { useCart } from '@/hooks/useCart'

interface Props {
  producto: any
  subdominio: string
  modoMayoreo: boolean
  qtyMinMayoreo: number
}

export default function ProductCard({ producto, subdominio, modoMayoreo, qtyMinMayoreo }: Props) {
  const { theme } = useShopTheme()
  const { addItem, items } = useCart()

  const slug = producto.slug || producto.id
  const imagen = producto.imagenes_extra?.[0] || producto.imagen_url || null
  const esMayoreo = modoMayoreo && producto.precio_mayoreo != null
  const qtyMin = producto.qty_min_mayoreo ?? qtyMinMayoreo
  const inCart = items.find(i => i.productoId === producto.id)

  const radius = theme.cardStyle === 'rounded-warm' ? 'var(--radius-lg)' : theme.cardStyle === 'glass-dark' ? 'var(--radius-sm)' : 'var(--radius-md)'
  const border = theme.cardStyle === 'glass-dark' ? '1px solid var(--color-border)' : '1px solid var(--color-border)'

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    addItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio_venta),
      precioMayor: producto.precio_mayoreo ? Number(producto.precio_mayoreo) : null,
      qtyMinMayor: producto.qty_min_mayoreo ?? null,
      stock: producto.stock ?? 999,
      imagen: imagen || '',
      sku: producto.sku || '',
    })
  }

  const btnRadius = theme.buttonStyle === 'pill' ? 'var(--radius-pill)' : theme.buttonStyle === 'sharp' ? '0' : 'var(--radius-sm)'

  return (
    <Link href={`/${subdominio}/productos/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'var(--color-surface)',
        border,
        borderRadius: radius,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        transition: 'box-shadow .2s, transform .2s',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-hover)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
      >
        {/* Imagen */}
        <div style={{ aspectRatio: '1/1', background: 'var(--color-surface-hover)', overflow: 'hidden', position: 'relative' }}>
          {imagen
            ? <img src={imagen} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'var(--color-text-subtle)' }}>📦</div>
          }
          {esMayoreo && (
            <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--color-mayoreo)', color: 'var(--color-mayoreo-text)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: theme.badgeStyle === 'sharp' ? '2px' : 'var(--radius-pill)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mayoreo
            </span>
          )}
          {producto.stock === 0 && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Sin stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {producto.categoria && (
            <p style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{producto.categoria}</p>
          )}
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
            {producto.nombre}
          </p>
          {producto.sku && <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', margin: '0 0 8px' }}>SKU: {producto.sku}</p>}

          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
                ${Number(producto.precio_venta).toFixed(2)}
              </span>
              {esMayoreo && (
                <span style={{ fontSize: 12, color: 'var(--color-mayoreo)', fontWeight: 600 }}>
                  ${Number(producto.precio_mayoreo).toFixed(2)} ×{qtyMin}+
                </span>
              )}
            </div>
            <button
              onClick={handleAdd}
              disabled={producto.stock === 0}
              style={{
                width: '100%',
                background: inCart ? 'var(--color-success)' : 'var(--color-primary)',
                color: inCart ? '#fff' : 'var(--color-primary-text)',
                border: 'none',
                borderRadius: btnRadius,
                padding: '9px 0',
                fontSize: 12,
                fontWeight: 700,
                cursor: producto.stock === 0 ? 'not-allowed' : 'pointer',
                opacity: producto.stock === 0 ? 0.5 : 1,
                fontFamily: 'var(--font-body)',
                transition: 'background .2s',
              }}
            >
              {inCart ? `✓ En carrito (${inCart.qty})` : '+ Agregar'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
