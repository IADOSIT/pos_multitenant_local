'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { crearPedido } from '@/lib/api'

type Step = 1 | 2 | 3

const DEFAULT_CAMPOS: Record<string, any> = {
  nombre:    { activo: true,  requerido: true,  selforder: true,  ecommerce: true,  label: 'Nombre' },
  email:     { activo: false, requerido: false, selforder: false, ecommerce: true,  label: 'Correo electrónico' },
  telefono:  { activo: false, requerido: false, selforder: true,  ecommerce: true,  label: 'Teléfono' },
  direccion: { activo: false, requerido: false, selforder: false, ecommerce: false, label: 'Dirección' },
  empresa:   { activo: false, requerido: false, selforder: false, ecommerce: false, label: 'Empresa / Razón Social' },
  notas:     { activo: true,  requerido: false, selforder: true,  ecommerce: true,  label: 'Notas / Comentarios' },
}

export default function CheckoutForm({ subdominio, info }: { subdominio: string; info: any }) {
  const campos: Record<string, any> = info.campos_formulario || DEFAULT_CAMPOS
  const { items, calcularTotal, clearCart } = useCart()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const setField = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }))

  // Derivar si la dirección aplica (controla si aparece el paso 2)
  const direccionActiva = !!(campos.direccion?.activo && campos.direccion?.ecommerce)
  const steps = ['Datos', ...(direccionActiva ? ['Dirección'] : []), 'Confirmar']
  const stepNumbers: Step[] = direccionActiva ? [1, 2, 3] : [1, 3]

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

  function handleStep1Continue() {
    const camposContacto = Object.entries(campos).filter(([key, cfg]: [string, any]) =>
      cfg.activo && cfg.ecommerce && key !== 'direccion' && key !== 'notas'
    )
    const campoFaltante = camposContacto.find(([key, cfg]: [string, any]) =>
      cfg.requerido && !formData[key]?.trim()
    )
    if (campoFaltante) {
      setError(`El campo "${(campoFaltante[1] as any).label}" es obligatorio`)
      return
    }
    setError('')
    setStep(direccionActiva ? 2 : 3)
  }

  function handleStep2Continue() {
    const faltante = ['dir_calle', 'dir_numero', 'dir_colonia', 'dir_ciudad', 'dir_estado', 'dir_cp']
      .find(k => !formData[k]?.trim())
    if (faltante) { setError('Completa la dirección de envío'); return }
    setError('')
    setStep(3)
  }

  async function handleConfirmar() {
    setLoading(true)
    setError('')
    try {
      const direccionObj = direccionActiva ? {
        calle: formData['dir_calle'] || '',
        numero: formData['dir_numero'] || '',
        colonia: formData['dir_colonia'] || '',
        ciudad: formData['dir_ciudad'] || '',
        estado: formData['dir_estado'] || '',
        cp: formData['dir_cp'] || '',
        referencias: formData['dir_referencias'] || '',
      } : undefined

      const body = {
        cliente_nombre: formData['nombre'] || '',
        cliente_email: formData['email'] || '',
        cliente_tel: formData['telefono'] || '',
        cliente_empresa: formData['empresa'] || '',
        notas_cliente: formData['notas'] || '',
        direccion_envio: direccionObj,
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
    } catch (e: any) {
      setError(e?.message || 'Ocurrió un error al procesar tu pedido. Por favor intenta de nuevo.')
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
        {steps.map((label, i) => {
          const n = stepNumbers[i]
          const active = step === n
          const done = step > n
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: active || done ? 'var(--color-primary)' : 'var(--color-surface-hover)', border: `2px solid ${active || done ? 'var(--color-primary)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: active || done ? 'var(--color-primary-text)' : 'var(--color-text-subtle)' }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 11, color: active ? 'var(--color-primary)' : 'var(--color-text-subtle)', fontWeight: active ? 700 : 400 }}>{label}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? 'var(--color-primary)' : 'var(--color-border)', margin: '0 8px', marginBottom: 20 }} />}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Form */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          {/* Step 1: Datos de contacto — dinámico */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>
                Datos de contacto
              </h2>
              <div style={{ display: 'grid', gap: 16 }}>
                {Object.entries(campos)
                  .filter(([key, cfg]: [string, any]) => cfg.activo && cfg.ecommerce && key !== 'direccion' && key !== 'notas')
                  .map(([key, cfg]: [string, any]) => (
                    <div key={key}>
                      <label style={labelStyle}>{cfg.label}{cfg.requerido ? ' *' : ''}</label>
                      <input
                        style={inputStyle}
                        type={key === 'email' ? 'email' : key === 'telefono' ? 'tel' : 'text'}
                        value={formData[key] || ''}
                        onChange={e => setField(key, e.target.value)}
                        placeholder={key === 'email' ? 'correo@ejemplo.com' : key === 'telefono' ? '10 dígitos' : cfg.label}
                      />
                    </div>
                  ))
                }
                {/* Notas en el paso 1 si están activas y no hay paso de dirección */}
                {!direccionActiva && campos.notas?.activo && campos.notas?.ecommerce && (
                  <div>
                    <label style={labelStyle}>{campos.notas.label}</label>
                    <textarea
                      style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 60 }}
                      value={formData['notas'] || ''}
                      onChange={e => setField('notas', e.target.value)}
                      placeholder="¿Alguna indicación adicional?"
                    />
                  </div>
                )}
              </div>
              <button onClick={handleStep1Continue} style={{ marginTop: 24, background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Continuar →
              </button>
              {error && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 8 }}>{error}</p>}
            </div>
          )}

          {/* Step 2: Envío — solo si direccionActiva */}
          {direccionActiva && step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>Dirección de envío</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Calle *</label>
                  <input style={inputStyle} value={formData['dir_calle'] || ''} onChange={e => setField('dir_calle', e.target.value)} placeholder="Nombre de la calle" />
                </div>
                <div>
                  <label style={labelStyle}>Número *</label>
                  <input style={inputStyle} value={formData['dir_numero'] || ''} onChange={e => setField('dir_numero', e.target.value)} placeholder="Exterior / Interior" />
                </div>
                <div>
                  <label style={labelStyle}>C.P. *</label>
                  <input style={inputStyle} value={formData['dir_cp'] || ''} onChange={e => setField('dir_cp', e.target.value)} placeholder="Código postal" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Colonia *</label>
                  <input style={inputStyle} value={formData['dir_colonia'] || ''} onChange={e => setField('dir_colonia', e.target.value)} placeholder="Colonia o fraccionamiento" />
                </div>
                <div>
                  <label style={labelStyle}>Ciudad *</label>
                  <input style={inputStyle} value={formData['dir_ciudad'] || ''} onChange={e => setField('dir_ciudad', e.target.value)} placeholder="Ciudad o municipio" />
                </div>
                <div>
                  <label style={labelStyle}>Estado *</label>
                  <input style={inputStyle} value={formData['dir_estado'] || ''} onChange={e => setField('dir_estado', e.target.value)} placeholder="Estado" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Referencias / Indicaciones</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={formData['dir_referencias'] || ''} onChange={e => setField('dir_referencias', e.target.value)} placeholder="Color de fachada, entre calles, etc." />
                </div>
                {/* Notas al final del paso de dirección */}
                {campos.notas?.activo && campos.notas?.ecommerce && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{campos.notas.label}</label>
                    <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={formData['notas'] || ''} onChange={e => setField('notas', e.target.value)} placeholder="¿Alguna indicación adicional?" />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => { setError(''); setStep(1) }} style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Atrás</button>
                <button onClick={handleStep2Continue} style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Revisar pedido →
                </button>
              </div>
              {error && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 8 }}>{error}</p>}
            </div>
          )}

          {/* Step 3: Confirmar — muestra solo datos completados */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>Revisar y confirmar</h2>
              <div style={{ background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Tus datos</p>
                {Object.entries(campos)
                  .filter(([key, cfg]: [string, any]) => cfg.activo && cfg.ecommerce && key !== 'direccion' && key !== 'notas' && formData[key]?.trim())
                  .map(([key, cfg]: [string, any]) => (
                    <p key={key} style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>
                      <strong>{cfg.label}:</strong> {formData[key]}
                    </p>
                  ))
                }
              </div>
              {direccionActiva && formData['dir_calle'] && (
                <div style={{ background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Dirección de envío</p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{formData['dir_calle']} {formData['dir_numero']}, Col. {formData['dir_colonia']}</p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{formData['dir_ciudad']}, {formData['dir_estado']}, C.P. {formData['dir_cp']}</p>
                  {formData['dir_referencias'] && <p style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 4 }}>Ref: {formData['dir_referencias']}</p>}
                </div>
              )}
              {formData['notas']?.trim() && (
                <div style={{ background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{campos.notas?.label || 'Notas'}</p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{formData['notas']}</p>
                </div>
              )}
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
                <button onClick={() => { setError(''); setStep(direccionActiva ? 2 : 1) }} style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Atrás</button>
                <button
                  onClick={handleConfirmar}
                  disabled={loading}
                  style={{ flex: 1, background: loading ? 'var(--color-text-subtle)' : 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}>
                  {loading ? 'Procesando...' : '✓ Confirmar pedido'}
                </button>
              </div>
            </div>
          )}
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
