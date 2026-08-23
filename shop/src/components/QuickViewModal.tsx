'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCart } from '@/hooks/useCart'

interface Props {
  producto: any
  subdominio: string
  modoMayoreo: boolean
  qtyMinMayoreo: number
  onClose: () => void
}

export default function QuickViewModal({ producto, subdominio, modoMayoreo, qtyMinMayoreo, onClose }: Props) {
  const { addItem, items } = useCart()
  const [qty, setQty] = useState(1)

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onEsc); document.body.style.overflow = '' }
  }, [onClose])

  const slug = producto.slug || producto.id
  const imagenes: string[] = [producto.imagen_url, ...(producto.imagenes_extra || [])].filter(Boolean)
  const esMayoreo = modoMayoreo && producto.precio_mayoreo != null
  const qtyMin = producto.qty_min_mayoreo ?? qtyMinMayoreo
  const inCart = items.find((i) => i.productoId === producto.id)
  const sinStock = producto.stock === 0

  function handleAdd() {
    addItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio_venta),
      precioMayor: producto.precio_mayoreo ? Number(producto.precio_mayoreo) : null,
      qtyMinMayor: producto.qty_min_mayoreo ?? null,
      stock: producto.stock ?? 999,
      imagen: imagenes[0] || '',
      sku: producto.sku || '',
    }, qty)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,15,.55)', backdropFilter: 'blur(2px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}
        className="quickViewGrid"
      >
        <div style={{ background: 'var(--color-surface-hover)', aspectRatio: '1/1', position: 'relative' }}>
          {imagenes[0] ? (
            <img src={imagenes[0]} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, color: 'var(--color-text-subtle)' }}>📦</div>
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ position: 'absolute', top: 12, left: 12, width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ×
          </button>
          {imagenes.length > 1 && (
            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', gap: 6, overflowX: 'auto' }}>
              {imagenes.slice(0, 5).map((img, i) => (
                <div key={i} style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', border: '2px solid rgba(255,255,255,.8)', flexShrink: 0 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          {producto.categoria && (
            <p style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{producto.categoria}</p>
          )}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.3 }}>
            {producto.nombre}
          </h2>
          {producto.sku && <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', margin: '0 0 14px' }}>SKU: {producto.sku}</p>}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
              ${Number(producto.precio_venta).toFixed(2)}
            </span>
            {esMayoreo && (
              <span style={{ fontSize: 13, color: 'var(--color-mayoreo)', fontWeight: 700 }}>
                ${Number(producto.precio_mayoreo).toFixed(2)} ×{qtyMin}+
              </span>
            )}
          </div>

          {producto.stock != null && (
            <p style={{ fontSize: 12, color: producto.stock > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, margin: '0 0 14px' }}>
              {producto.stock > 0 ? `✓ En stock (${producto.stock})` : '✗ Sin stock'}
            </p>
          )}

          {(producto.descripcion_larga || producto.descripcion) && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {producto.descripcion_larga || producto.descripcion}
            </p>
          )}

          {producto.etiquetas && producto.etiquetas.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {producto.etiquetas.map((tag: string) => (
                <span key={tag} style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontSize: 11, color: 'var(--color-text-muted)' }}>{tag}</span>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 34, height: 38, border: 'none', background: 'var(--color-surface-hover)', color: 'var(--color-text)', fontSize: 16, cursor: 'pointer' }}>−</button>
              <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(producto.stock || 999, q + 1))} style={{ width: 34, height: 38, border: 'none', background: 'var(--color-surface-hover)', color: 'var(--color-text)', fontSize: 16, cursor: 'pointer' }}>+</button>
            </div>
            <button
              onClick={handleAdd}
              disabled={sinStock}
              style={{ flex: 1, background: inCart ? 'var(--color-success)' : 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: sinStock ? 'not-allowed' : 'pointer', opacity: sinStock ? 0.5 : 1 }}
            >
              {sinStock ? 'Sin stock' : inCart ? `✓ En carrito (${inCart.qty}) — agregar más` : 'Agregar al carrito'}
            </button>
          </div>

          <Link href={`/${subdominio}/productos/${slug}`} style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'none', textAlign: 'center' }}>
            Ver ficha completa →
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .quickViewGrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
