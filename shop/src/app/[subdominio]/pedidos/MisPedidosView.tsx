'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchMisPedidos } from '@/lib/api'
import { ESTADOS_PEDIDO } from '@/lib/constants'

interface PedidoResumen {
  numero_pedido: string
  estado: string
  tipo_venta: string
  total: number
  items_count: number
  created_at: string
}

const STORAGE_KEY = 'pos_shop_lookup'

export default function MisPedidosView({ subdominio }: { subdominio: string }) {
  const [email, setEmail] = useState('')
  const [tel, setTel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pedidos, setPedidos] = useState<PedidoResumen[] | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (saved.email) setEmail(saved.email)
      if (saved.tel) setTel(saved.tel)
    } catch { /* localStorage no disponible o dato corrupto, ignorar */ }
  }, [])

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Ingresa el correo que usaste al comprar'); return }
    setLoading(true)
    setError('')
    try {
      const data = await fetchMisPedidos(subdominio, email.trim(), tel.trim())
      setPedidos(data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: email.trim(), tel: tel.trim() }))
    } catch (e: any) {
      setError(e?.message || 'No pudimos consultar tus pedidos')
      setPedidos(null)
    } finally {
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
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
        Mis pedidos
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Consulta tus compras con el correo (y opcionalmente el teléfono) que usaste al pagar. No necesitas cuenta ni contraseña.
      </p>

      <form onSubmit={handleBuscar} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Correo electrónico *</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label style={labelStyle}>Teléfono (opcional)</label>
            <input style={inputStyle} type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="10 dígitos" />
          </div>
        </div>
        {error && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ background: loading ? 'var(--color-text-subtle)' : 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}
        >
          {loading ? 'Buscando...' : 'Buscar mis pedidos'}
        </button>
      </form>

      {pedidos !== null && (
        pedidos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>No encontramos pedidos con esos datos.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {pedidos.map((p) => {
              const estadoInfo = ESTADOS_PEDIDO[p.estado] ?? { label: p.estado, color: '#64748b', icon: '📋' }
              return (
                <Link
                  key={p.numero_pedido}
                  href={`/${subdominio}/pedido/${p.numero_pedido}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', textDecoration: 'none' }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px', fontFamily: 'var(--font-mono)' }}>{p.numero_pedido}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                      {new Date(p.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} · {p.items_count} {p.items_count === 1 ? 'artículo' : 'artículos'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>${Number(p.total).toFixed(2)}</p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: estadoInfo.color + '22', border: `1px solid ${estadoInfo.color}44`, borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontSize: 11, fontWeight: 700, color: estadoInfo.color }}>
                      {estadoInfo.icon} {estadoInfo.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
