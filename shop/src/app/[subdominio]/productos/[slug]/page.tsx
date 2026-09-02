import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchTiendaInfo, fetchCategorias, fetchProductoSlug } from '@/lib/api'
import { CartProvider } from '@/hooks/useCart'
import Navbar from '@/components/Navbar'
import StoreFooter from '@/components/StoreFooter'
import AddToCartButton from './AddToCartButton'
import SolicitarCotizacion from './SolicitarCotizacion'
import { TEXTO_COTIZACION } from '@/lib/cotizacion'

interface PageProps {
  params: { subdominio: string; slug: string }
}

export default async function ProductoPage({ params }: PageProps) {
  const { subdominio, slug } = params
  const [info, categorias, producto] = await Promise.all([
    fetchTiendaInfo(subdominio),
    fetchCategorias(subdominio),
    fetchProductoSlug(subdominio, slug),
  ])
  if (!info || !producto) notFound()

  const imagenes: string[] = [
    ...(producto.imagen_url ? [producto.imagen_url] : []),
    ...(producto.imagenes_extra || []),
  ]
  const esMayoreo = info.modo_mayoreo && producto.precio_mayoreo != null
  const qtyMin = producto.qty_min_mayoreo ?? info.qty_min_mayoreo
  const esCotizacion = !!producto.cotizacion

  return (
    <CartProvider>
      <Navbar categorias={categorias} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
          <Link href={`/${subdominio}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Inicio</Link>
          <span>/</span>
          <Link href={`/${subdominio}/productos`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Productos</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-text)' }}>{producto.nombre}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {/* Galería */}
          <div>
            {imagenes.length > 0 ? (
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-surface-hover)', aspectRatio: '1/1', marginBottom: 12 }}>
                <img src={imagenes[0]} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-hover)', aspectRatio: '1/1', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: 'var(--color-text-subtle)' }}>📦</div>
            )}
            {imagenes.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {imagenes.map((img, i) => (
                  <img key={i} src={img} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid var(--color-border)', flexShrink: 0 }} />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {producto.categoria && (
              <p style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>{producto.categoria}</p>
            )}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px', lineHeight: 1.3 }}>
              {producto.nombre}
            </h1>
            {producto.sku && <p style={{ fontSize: 12, color: 'var(--color-text-subtle)', margin: '0 0 16px' }}>SKU: {producto.sku}</p>}

            {/* Precios */}
            <div style={{ margin: '0 0 20px', padding: '16px', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: esCotizacion ? 20 : 28, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-display)', margin: '0 0 4px' }}>
                {esCotizacion ? TEXTO_COTIZACION : `$${Number(producto.precio_venta).toFixed(2)}`}
              </p>
              {!esCotizacion && esMayoreo && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--color-mayoreo)', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
                  <p style={{ color: 'var(--color-mayoreo-text)', fontSize: 13, fontWeight: 700, margin: 0 }}>
                    💼 ${Number(producto.precio_mayoreo).toFixed(2)} comprando {qtyMin}+ unidades
                  </p>
                </div>
              )}
              {producto.stock != null && (
                <p style={{ fontSize: 12, color: producto.stock > 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: 8, fontWeight: 600 }}>
                  {producto.stock > 0 ? `✓ En stock (${producto.stock})` : '✗ Sin stock'}
                </p>
              )}
            </div>

            {/* Add to cart — o solicitud de cotizacion si la pieza no tiene precio de lista */}
            {esCotizacion ? (
              <SolicitarCotizacion
                producto={producto}
                contacto={{
                  telefono: info.empresa?.telefono,
                  email: info.empresa?.email,
                  nombre: info.nombre_tienda || info.empresa?.nombre,
                }}
              />
            ) : (
              <AddToCartButton
                producto={producto}
                modoMayoreo={info.modo_mayoreo}
                qtyMinMayoreoGlobal={info.qty_min_mayoreo}
                subdominio={subdominio}
              />
            )}

            {/* Descripción */}
            {(producto.descripcion_larga || producto.descripcion) && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Descripción</p>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                  {producto.descripcion_larga || producto.descripcion}
                </p>
              </div>
            )}

            {/* Tags */}
            {producto.etiquetas && producto.etiquetas.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {producto.etiquetas.map((tag: string) => (
                  <span key={tag} style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <StoreFooter tiendaNombre={info.nombre_tienda} empresaNombre={info.empresa?.nombre} contacto={info.preferencias?.contacto} />
    </CartProvider>
  )
}
