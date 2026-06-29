'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'

interface Props {
  producto: any
  modoMayoreo: boolean
  qtyMinMayoreoGlobal: number
  subdominio: string
}

export default function AddToCartButton({ producto, modoMayoreo, qtyMinMayoreoGlobal, subdominio }: Props) {
  const { addItem, items } = useCart()
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const inCart = items.find(i => i.productoId === producto.id)
  const esMayoreo = modoMayoreo && producto.precio_mayoreo != null
  const qtyMin = producto.qty_min_mayoreo ?? qtyMinMayoreoGlobal
  const aplicaMayor = esMayoreo && qty >= qtyMin
  const precioUnitario = aplicaMayor ? Number(producto.precio_mayoreo) : Number(producto.precio_venta)

  function handleAdd() {
    addItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio_venta),
      precioMayor: producto.precio_mayoreo ? Number(producto.precio_mayoreo) : null,
      qtyMinMayor: producto.qty_min_mayoreo ?? null,
      stock: producto.stock ?? 999,
      imagen: producto.imagen_url || producto.imagenes_extra?.[0] || '',
      sku: producto.sku || '',
    }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div>
      {/* Selector cantidad */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 }}>Cantidad:</p>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, background: 'var(--color-surface-hover)', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ width: 48, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>{qty}</span>
          <button onClick={() => setQty(q => Math.min(q + 1, producto.stock ?? 999))} style={{ width: 36, height: 36, background: 'var(--color-surface-hover)', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
        {esMayoreo && aplicaMayor && (
          <span style={{ fontSize: 11, background: 'var(--color-mayoreo)', color: 'var(--color-mayoreo-text)', padding: '3px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 700 }}>
            PRECIO MAYOREO
          </span>
        )}
        {esMayoreo && !aplicaMayor && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {qtyMin - qty} más para precio mayoreo
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Total:</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
          ${(precioUnitario * qty).toFixed(2)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleAdd}
          disabled={producto.stock === 0}
          style={{
            flex: 1,
            background: added ? 'var(--color-success)' : 'var(--color-primary)',
            color: added ? '#fff' : 'var(--color-primary-text)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '14px 0',
            fontSize: 14,
            fontWeight: 700,
            cursor: producto.stock === 0 ? 'not-allowed' : 'pointer',
            opacity: producto.stock === 0 ? 0.5 : 1,
            fontFamily: 'var(--font-body)',
            transition: 'background .2s',
          }}>
          {added ? '✓ Agregado al carrito' : (producto.stock === 0 ? 'Sin stock' : '+ Agregar al carrito')}
        </button>
        {inCart && (
          <button
            onClick={() => router.push(`/${subdominio}/carrito`)}
            style={{ padding: '14px 20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, cursor: 'pointer', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}>
            Ver carrito →
          </button>
        )}
      </div>
    </div>
  )
}
