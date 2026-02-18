import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function Products({ config }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    // Fetch products from all stores
    fetch(`${API_BASE}/public/stores`)
      .then(res => res.json())
      .then(async (data) => {
        if (data.success) {
          // Fetch products from each store
          const allProducts = []
          for (const store of data.data.slice(0, 5)) {
            try {
              const res = await fetch(`${API_BASE}/public/stores/${store.handle}/products`)
              const prodData = await res.json()
              if (prodData.success) {
                prodData.data.forEach(p => {
                  allProducts.push({ ...p, store })
                })
              }
            } catch (e) {
              console.error('Error fetching products:', e)
            }
          }
          setProducts(allProducts)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Get unique categories
  const categories = [...new Set(products.map(p => p.categoria?.nombre).filter(Boolean))]

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !selectedCategory || p.categoria?.nombre === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Catalogo de productos</h1>
          <p className="text-primary-100 text-lg">
            Productos frescos de todos nuestros proveedores
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas las categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
              <p className="text-gray-500">Intenta con otros terminos de busqueda</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} disponible{filteredProducts.length !== 1 ? 's' : ''}
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, idx) => (
                  <a
                    key={`${product.id}-${idx}`}
                    href={`/t/${product.store.handle}/producto/${product.id}`}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden group border"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={product.display_image || product.imagen_url || '/images/producto-default.svg'}
                        alt={product.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = '/images/producto-default.svg'
                        }}
                      />
                      {product.categoria && (
                        <span className="absolute top-2 left-2 px-2 py-1 bg-white/90 text-gray-700 text-xs font-medium rounded-full">
                          {product.categoria.nombre}
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Store info */}
                      <a
                        href={product.store.store_url}
                        className="flex items-center gap-2 mb-2 text-sm text-gray-500 hover:text-primary-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {product.store.logo_url ? (
                            <img src={product.store.logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                              {product.store.nombre[0]}
                            </span>
                          )}
                        </div>
                        <span className="truncate">{product.store.nombre}</span>
                      </a>

                      <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition line-clamp-2">
                        {product.nombre}
                      </h3>

                      {config?.settings?.show_prices && product.precio && (
                        <p className="text-xl font-bold text-primary-600 mt-2">
                          ${parseFloat(product.precio).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
