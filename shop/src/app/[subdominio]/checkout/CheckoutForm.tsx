'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { crearPedido } from '@/lib/api'

type Step = 1 | 2 | 3

interface DatosContacto {
  nombre: string
  email: string
  tel: string
}

interface DatosEnvio {
  calle: string
  numero: string
  colonia: string
  ciudad: string
  estado: string
  cp: string
  referencias: string
}

export default function CheckoutForm({ subdominio, info }: { subdominio: string; info: any }) {
  const { items, calcularTotal, clearCart } = useCart()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contacto, setContacto] = useState<DatosContacto>({ nombre: '', email: '', tel: '' })
  const [envio, setEnvio] = useState<DatosEnvio>({ calle: '', numero: '', colonia: '', ciudad: '', estado: '', cp: '', referencias: '' })
  const [notas, setNotas] = useState('')

  const { subtotal, esMayoreo } = calcularTotal(info.qty_min_mayoreo, info.modo_mayoreo)
  const iva = info.iva_incluido ? 0 : subtotal * 0.16
  const total = subtotal + iva

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: '0 16px' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🛒</p>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>Tu carrito está vacío</p>
        <Link href={`/${subdominio}/productos`} style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', padding: '12px 28px', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Ver productos
        </Link>
      </div>
    )
  }

  async function handleConfirmar() {
    setLoading(true)
    setError('')
    try {
      const body = {
        cliente_nombre: contacto.nombre,
        cliente_email: contacto.email,
        cliente_tel: contacto.tel,
        direccion_envio: envio,
        notas_cliente: notas,
        items: items.map(item => {
          const qtyMin = item.qtyMinMayor ?? info.qty_min_mayoreo
          const aplicaMayor = info.modo_mayoreo && item.precioMayor != null && item.qty >= qtyMin
          return {
            producto_id: item.productoId,
            nombre: item.nombre,
            sku: item.sku,
            qty: item.qty,
            precio_unitario: aplicaMayor ? item.precioMayor : item.precio,
            precio_mayoreo: item.precioMayor,
          }
        }),
      }
      const pedido = await crearPedido(subdominio, body)
      clearCart()
      router.push(`/${subdominio}/pedido/${pedido.numero_pedido}`)
    } catch {
      setError('Ocurrió un error al procesar tu pedido. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 13,
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4, display: 'block' }

  return (
    <div style={{ maxWidth: 920, margin: '32px auto', padding: '0 16px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Finalizar compra</h1>

      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
        {(['Datos', 'Envío', 'Confirmar'] as const).map((label, i) => {
          const n = (i + 1) as Step
          const active = step === n
          const done = step > n
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: active || done ? 'var(--color-primary)' : 'var(--color-surface-hover)', border: `2px solid ${active || done ? 'var(--color-primary)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: active || done ? 'var(--color-primary-text)' : 'var(--color-text-subtle)' }}>
                  {done ? '✓' : n}
                </div>
                <span style={{ fontSize: 11, color: active ? 'var(--color-primary)' : 'var(--color-text-subtle)', fontWeight: active ? 700 : 400 }}>{label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 2, background: done ? 'var(--color-primary)' : 'var(--color-border)', margin: '0 8px', marginBottom: 20 }} />}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Form */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          {/* Step 1: Datos de contacto */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>Datos de contacto</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nombre completo *</label>
                  <input style={inputStyle} value={contacto.nombre} onChange={e => setContacto({ ...contacto, nombre: e.target.value })} placeholder="Tu nombre" />
                </div>
                <div>
                  <label style={labelStyle}>Correo electrónico *</label>
                  <input style={inputStyle} type="email" value={contacto.email} onChange={e => setContacto({ ...contacto, email: e.target.value })} placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label style={labelStyle}>Teléfono *</label>
                  <input style={inputStyle} type="tel" value={contacto.tel} onChange={e => setContacto({ ...contacto, tel: e.target.value })} placeholder="10 dígitos" />
                </div>
              </div>
              <button
                onClick={() => {
                  if (!contacto.nombre || !contacto.email || !contacto.tel) { setError('Completa todos los campos de contacto'); return }
                  setError(''); setStep(2)
                }}
                style={{ marginTop: 24, background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Continuar →
              </button>
            </div>
          )}

          {/* Step 2: Envío */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>Dirección de envío</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Calle *</label>
                  <input style={inputStyle} value={envio.calle} onChange={e => setEnvio({ ...envio, calle: e.target.value })} placeholder="Nombre de la calle" />
                </div>
                <div>
                  <label style={labelStyle}>Número *</label>
                  <input style={inputStyle} value={envio.numero} onChange={e => setEnvio({ ...envio, numero: e.target.value })} placeholder="Exterior / Interior" />
                </div>
                <div>
                  <label style={labelStyle}>C.P. *</label>
                  <input style={inputStyle} value={envio.cp} onChange={e => setEnvio({ ...envio, cp: e.target.value })} placeholder="Código postal" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Colonia *</label>
                  <input style={inputStyle} value={envio.colonia} onChange={e => setEnvio({ ...envio, colonia: e.target.value })} placeholder="Colonia o fraccionamiento" />
                </div>
                <div>
                  <label style={labelStyle}>Ciudad *</label>
                  <input style={inputStyle} value={envio.ciudad} onChange={e => setEnvio({ ...envio, ciudad: e.target.value })} placeholder="Ciudad o municipio" />
                </div>
                <div>
                  <label style={labelStyle}>Estado *</label>
                  <input style={inputStyle} value={envio.estado} onChange={e => setEnvio({ ...envio, estado: e.target.value })} placeholder="Estado" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Referencias / Indicaciones</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={envio.referencias} onChange={e => setEnvio({ ...envio, referencias: e.target.value })} placeholder="Color de fachada, entre calles, etc." />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notas para el pedido</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={notas} onChange={e => setNotas(e.target.value)} placeholder="¿Alguna indicación adicional?" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => { setError(''); setStep(1) }} style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Atrás</button>
                <button
                  onClick={() => {
                    if (!envio.calle || !envio.numero || !envio.colonia || !envio.ciudad || !envio.estado || !envio.cp) { setError('Completa la dirección de envío'); return }
                    setError(''); setStep(3)
                  }}
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Revisar pedido →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmar */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>Revisar y confirmar</h2>
              <div style={{ background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Datos de contacto</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{contacto.nombre}</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{contacto.email}</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{contacto.tel}</p>
              </div>
              <div style={{ background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Dirección de envío</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{envio.calle} {envio.numero}, Col. {envio.colonia}</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{envio.ciudad}, {envio.estado}, C.P. {envio.cp}</p>
                {envio.referencias && <p style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 4 }}>Ref: {envio.referencias}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                {items.map(item => (
                  <div key={item.productoId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text)' }}>{item.nombre} × {item.qty}</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>${(item.precio * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {error && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => { setError(''); setStep(2) }} style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Atrás</button>
                <button
                  onClick={handleConfirmar}
                  disabled={loading}
                  style={{ flex: 1, background: loading ? 'var(--color-text-subtle)' : 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}>
                  {loading ? 'Procesando...' : '✓ Confirmar pedido'}
                </button>
              </div>
            </div>
          )}

          {step !== 3 && error && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>

        {/* Resumen lateral */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, height: 'fit-content', position: 'sticky', top: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px' }}>Tu pedido</h2>
          {items.map(item => (
            <div key={item.productoId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>{item.nombre} ×{item.qty}</span>
              <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>${(item.precio * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 12, paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {iva > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                <span>IVA</span><span>${iva.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginTop: 8, fontFamily: 'var(--font-display)' }}>
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
          {esMayoreo && (
            <div style={{ marginTop: 12, background: 'var(--color-mayoreo)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
              <p style={{ color: 'var(--color-mayoreo-text)', fontSize: 11, fontWeight: 700, margin: 0 }}>💼 Precio mayoreo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
