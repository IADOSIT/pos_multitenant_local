import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchTiendaInfo, fetchCategorias, fetchPedido } from '@/lib/api'
import { ESTADOS_PEDIDO } from '@/lib/constants'
import { CartProvider } from '@/hooks/useCart'
import Navbar from '@/components/Navbar'
import StoreFooter from '@/components/StoreFooter'

interface PageProps {
  params: { subdominio: string; numero: string }
}

export default async function PedidoPage({ params }: PageProps) {
  const { subdominio, numero } = params
  const [info, categorias, pedido] = await Promise.all([
    fetchTiendaInfo(subdominio),
    fetchCategorias(subdominio),
    fetchPedido(subdominio, numero),
  ])
  if (!info || !pedido) notFound()

  const estadoInfo = ESTADOS_PEDIDO[pedido.estado as keyof typeof ESTADOS_PEDIDO] ?? { label: pedido.estado, color: '#64748b', icon: '📋' }
  const pasos = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado']
  const pasoActual = pasos.indexOf(pedido.estado)

  return (
    <CartProvider>
      <Navbar categorias={categorias} />
      <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{pedido.estado === 'entregado' ? '✅' : pedido.estado === 'cancelado' ? '❌' : '📦'}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
            {pedido.estado === 'pendiente' ? '¡Pedido recibido!' : pedido.estado === 'entregado' ? '¡Pedido entregado!' : `Pedido ${estadoInfo.label.toLowerCase()}`}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            Número de pedido: <strong style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{pedido.numero_pedido}</strong>
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: estadoInfo.color + '22', border: `1px solid ${estadoInfo.color}44`, borderRadius: 'var(--radius-pill)', padding: '6px 16px', marginTop: 8 }}>
            <span>{estadoInfo.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: estadoInfo.color }}>{estadoInfo.label}</span>
          </div>
        </div>

        {/* Timeline (solo si no está cancelado) */}
        {pedido.estado !== 'cancelado' && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>Estado del pedido</p>
            <div style={{ display: 'flex', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 14, left: 14, right: 14, height: 2, background: 'var(--color-border)', zIndex: 0 }} />
              <div style={{ position: 'absolute', top: 14, left: 14, height: 2, width: `${Math.max(0, pasoActual / (pasos.length - 1)) * 100}%`, background: 'var(--color-primary)', zIndex: 1, transition: 'width .3s' }} />
              {pasos.map((paso, i) => {
                const done = i <= pasoActual
                const estadoI = ESTADOS_PEDIDO[paso as keyof typeof ESTADOS_PEDIDO]
                return (
                  <div key={paso} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 2 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? 'var(--color-primary)' : 'var(--color-surface)', border: `2px solid ${done ? 'var(--color-primary)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      {done ? '✓' : <span style={{ color: 'var(--color-text-subtle)' }}>{i + 1}</span>}
                    </div>
                    <span style={{ fontSize: 10, color: done ? 'var(--color-primary)' : 'var(--color-text-subtle)', fontWeight: done ? 700 : 400, textAlign: 'center' }}>
                      {estadoI?.icon} {estadoI?.label || paso}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Datos contacto */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Datos de contacto</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{pedido.cliente_nombre}</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{pedido.cliente_email}</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{pedido.cliente_tel}</p>
          </div>
          {/* Dirección */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Dirección de envío</p>
            {pedido.direccion_envio && (
              <>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{pedido.direccion_envio.calle} {pedido.direccion_envio.numero}</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>Col. {pedido.direccion_envio.colonia}</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>{pedido.direccion_envio.ciudad}, {pedido.direccion_envio.estado}</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0' }}>C.P. {pedido.direccion_envio.cp}</p>
              </>
            )}
          </div>
        </div>

        {/* Productos */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>Productos</p>
          {(pedido.items || []).map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
              <div>
                <p style={{ color: 'var(--color-text)', fontWeight: 600, margin: '0 0 2px' }}>{item.nombre}</p>
                {item.sku && <p style={{ color: 'var(--color-text-subtle)', fontSize: 11, margin: 0 }}>SKU: {item.sku}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--color-text)', fontWeight: 600, margin: '0 0 2px' }}>${Number(item.precio_unitario).toFixed(2)}</p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 11, margin: 0 }}>× {item.qty}</p>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-primary)' }}>${Number(pedido.total).toFixed(2)}</span>
          </div>
        </div>

        {pedido.notas_cliente && (
          <div style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Tus notas</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>{pedido.notas_cliente}</p>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <Link href={`/${subdominio}/productos`} style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', padding: '12px 32px', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
            Seguir comprando
          </Link>
        </div>
      </div>
      <StoreFooter tiendaNombre={info.nombre_tienda} empresaNombre={info.empresa?.nombre} />
    </CartProvider>
  )
}
