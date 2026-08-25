import { notFound } from 'next/navigation'
import { fetchTiendaInfo, fetchCategorias, fetchProductos } from '@/lib/api'
import { THEMES } from '@/themes'
import { CartProvider } from '@/hooks/useCart'
import Navbar from '@/components/Navbar'
import StoreFooter from '@/components/StoreFooter'
import ProductCard from '@/components/ProductCard'
import ProductosFilters from './ProductosFilters'

interface PageProps {
  params: { subdominio: string }
  searchParams: { categoria_id?: string; buscar?: string; ordenar?: string; page?: string }
}

export default async function ProductosPage({ params, searchParams }: PageProps) {
  const { subdominio } = params
  const { categoria_id, buscar, ordenar = 'novedad', page = '1' } = searchParams

  const [info, categorias, productosRes] = await Promise.all([
    fetchTiendaInfo(subdominio),
    fetchCategorias(subdominio),
    fetchProductos(subdominio, { categoria_id, buscar, ordenar, page, limit: '24' }),
  ])
  if (!info) notFound()

  const productos = productosRes.data || []
  const meta = productosRes.meta || { total: 0, page: 1, pages: 1 }
  const theme = THEMES[info.tema_id as keyof typeof THEMES] ?? THEMES.lumina

  return (
    <CartProvider>
      <Navbar categorias={categorias} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>
            {categoria_id ? (categorias.find((c: any) => c.id == categoria_id)?.nombre || 'Productos') : (buscar ? `Resultados: "${buscar}"` : 'Todos los productos')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            {meta.total} producto{meta.total !== 1 ? 's' : ''} encontrado{meta.total !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
          {/* Sidebar filtros */}
          <aside>
            <ProductosFilters
              categorias={categorias}
              categoriaActiva={categoria_id}
              subdominio={subdominio}
              ordenar={ordenar}
              buscar={buscar}
              modoMayoreo={info.modo_mayoreo}
              mensajeMayoreo={info.mensaje_mayoreo}
              qtyMin={info.qty_min_mayoreo}
            />
          </aside>

          {/* Grid */}
          <div>
            {productos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 16px', color: 'var(--color-text-muted)' }}>
                <p style={{ fontSize: 40, marginBottom: 16 }}>📦</p>
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No hay productos aquí</p>
                <p style={{ fontSize: 13 }}>Intenta con otra búsqueda o categoría</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(theme.gridCols, 3)}, 1fr)`, gap: 16, marginBottom: 32 }}>
                  {productos.map((p: any) => (
                    <ProductCard key={p.id} producto={p} subdominio={subdominio} modoMayoreo={info.modo_mayoreo} qtyMinMayoreo={info.qty_min_mayoreo} />
                  ))}
                </div>

                {/* Paginación */}
                {meta.pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    {Array.from({ length: meta.pages }, (_, i) => i + 1).map(p => {
                      const params = new URLSearchParams()
                      if (categoria_id) params.set('categoria_id', categoria_id)
                      if (buscar) params.set('buscar', buscar)
                      if (ordenar) params.set('ordenar', ordenar)
                      params.set('page', String(p))
                      return (
                        <a key={p} href={`/${subdominio}/productos?${params.toString()}`}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: p === meta.page ? 'var(--color-primary)' : 'var(--color-surface)',
                            color: p === meta.page ? 'var(--color-primary-text)' : 'var(--color-text-muted)',
                            textDecoration: 'none',
                            fontSize: 13,
                            fontWeight: p === meta.page ? 700 : 400,
                            border: '1px solid var(--color-border)',
                          }}>
                          {p}
                        </a>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <StoreFooter tiendaNombre={info.nombre_tienda} empresaNombre={info.empresa?.nombre} contacto={info.preferencias?.contacto} />
    </CartProvider>
  )
}
