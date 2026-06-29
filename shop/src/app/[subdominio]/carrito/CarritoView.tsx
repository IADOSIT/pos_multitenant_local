'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'

export default function CarritoView({ subdominio, info }: { subdominio: string; info: any }) {
  const { items, removeItem, updateQty, calcularTotal } = useCart()
  const router = useRouter()
  const { subtotal, esMayoreo } = calcularTotal(info.qty_min_mayoreo, info.modo_mayoreo)
  const iva = info.iva_incluido ? 0 : subtotal * 0.16
  const total = subtotal + iva

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 16px' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🛒</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Tu carrito está vacío</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>Agrega productos para continuar</p>
        <Link href={`/${subdominio}/productos`} style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', padding: '12px 32px', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '32px auto', padding: '0 16px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 24 }}>Tu carrito</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Lista items */}
        <div>
          {items.map(item => {
            const qtyMin = item.qtyMinMayor ?? info.qty_min_mayoreo
            const aplicaMayor = info.modo_mayoreo && item.precioMayor != null && item.qty >= qtyMin
            const precioUnit = aplicaMayor ? item.precioMayor! : item.precio
            return (
              <div key={item.productoId} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
                {/* Imagen */}
                <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-surface-hover)', flexShrink: 0 }}>
                  {item.imagen
                    ? <img src={item.imagen} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
                  }
                </div>
                {/* Info */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>{item.nombre}</p>
                  {item.sku && <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', margin: '0 0 8px' }}>SKU: {item.sku}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {aplicaMayor && (
                      <span style={{ fontSize: 10, background: 'var(--color-mayoreo)', color: 'var(--color-mayoreo-text)', padding: '2px 6px', borderRadius: 'var(--radius-pill)', fontWeight: 700 }}>MAYOREO</span>
                    )}
                    <span style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>${precioUnit.toFixed(2)}/u</span>
                  </div>
                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <button onClick={() => updateQty(item.productoId, item.qty - 1)} style={{ width: 28, height: 28, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}>−</button>
                    <span style={{ minWidth: 28, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.productoId, item.qty + 1)} style={{ width: 28, height: 28, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}>+</button>
                  </div>
                </div>
                {/* Total + delete */}
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-display)', margin: '0 0 8px' }}>${(precioUnit * item.qty).toFixed(2)}</p>
                  <button onClick={() => removeItem(item.productoId)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-danger)', fontFamily: 'var(--font-body)' }}>Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Resumen */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, height: 'fit-content', position: 'sticky', top: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 16px' }}>Resumen de compra</h2>
          {esMayoreo && (
            <div style={{ background: 'var(--color-mayoreo)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 16 }}>
              <p style={{ color: 'var(--color-mayoreo-text)', fontSize: 12, fontWeight: 700, margin: 0 }}>💼 Precio mayoreo aplicado</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          {iva > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              <span>IVA (16%)</span><span>${iva.toFixed(2)}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: 'var(--color-text)', marginBottom: 20, fontFamily: 'var(--font-display)' }}>
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => router.push(`/${subdominio}/checkout`)}
            style={{ width: '100%', background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 'var(--radius-md)', padding: '14px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Continuar →
          </button>
          <Link href={`/${subdominio}/productos`} style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            ← Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
