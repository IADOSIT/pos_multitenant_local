import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchTiendaInfo, fetchCategorias, fetchProductos } from '@/lib/api'
import { THEMES } from '@/themes'
import Navbar from '@/components/Navbar'
import StoreFooter from '@/components/StoreFooter'
import ProductCard from '@/components/ProductCard'
import HeroSection from '@/components/HeroSection'
import { CartProvider } from '@/hooks/useCart'

export default async function HomePage({ params }: { params: { subdominio: string } }) {
  const { subdominio } = params
  const [info, categorias, productosRes] = await Promise.all([
    fetchTiendaInfo(subdominio),
    fetchCategorias(subdominio),
    fetchProductos(subdominio, { limit: '8', ordenar: 'novedad' }),
  ])
  if (!info) notFound()

  const productos = productosRes.data || []
  const theme = THEMES[info.tema_id as keyof typeof THEMES] ?? THEMES.lumina

  return (
    <CartProvider>
      <Navbar categorias={categorias} />
      <HeroSection info={info} />

      {/* Categorías */}
      {categorias.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '48px auto', padding: '0 16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 20 }}>
            Categorías
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {categorias.map((cat: any) => (
              <Link key={cat.id} href={`/${subdominio}/productos?categoria_id=${cat.id}`}
                style={{ display: 'block', textDecoration: 'none', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center', transition: 'box-shadow .2s', boxShadow: 'var(--shadow-card)' }}>
                {cat.imagen_url && (
                  <img src={cat.imagen_url} alt={cat.nombre} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, margin: '0 auto 8px' }} />
                )}
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{cat.nombre}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{cat.total_productos} productos</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Productos recientes */}
      {productos.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto 64px', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              Productos recientes
            </h2>
            <Link href={`/${subdominio}/productos`} style={{ fontSize: 13, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              Ver todos →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(theme.gridCols, 4)}, 1fr)`, gap: 16 }}>
            {productos.map((p: any) => (
              <ProductCard key={p.id} producto={p} subdominio={subdominio} modoMayoreo={info.modo_mayoreo} qtyMinMayoreo={info.qty_min_mayoreo} />
            ))}
          </div>
        </section>
      )}

      <StoreFooter tiendaNombre={info.nombre_tienda} empresaNombre={info.empresa?.nombre} />
    </CartProvider>
  )
}
