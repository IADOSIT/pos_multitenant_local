import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStores } from '../hooks/useApi'

export default function Stores({ config }) {
  const { stores, loading } = useStores()
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  // Extract unique tags from all stores
  const allTags = [...new Set(stores.flatMap(s => s.tags || []))]

  // Filter stores
  const filteredStores = stores.filter(store => {
    const matchesSearch = !search ||
      store.nombre.toLowerCase().includes(search.toLowerCase()) ||
      store.descripcion?.toLowerCase().includes(search.toLowerCase())
    const matchesTag = !selectedTag || store.tags?.includes(selectedTag)
    return matchesSearch && matchesTag
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
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Directorio de tiendas</h1>
          <p className="text-primary-100 text-lg">
            Encuentra tu proveedor ideal en el mercado de abastos
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
                placeholder="Buscar tiendas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Tags filter */}
            {allTags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    !selectedTag
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedTag === tag
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stores Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredStores.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron tiendas</h3>
              <p className="text-gray-500">Intenta con otros terminos de busqueda</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                {filteredStores.length} tienda{filteredStores.length !== 1 ? 's' : ''} disponible{filteredStores.length !== 1 ? 's' : ''}
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map((store) => (
                  <a
                    key={store.id}
                    href={store.store_url}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden group border"
                  >
                    {/* Store Banner/Logo */}
                    <div className="relative h-32 bg-gradient-to-br from-primary-100 to-primary-200">
                      {store.is_featured && (
                        <span className="absolute top-3 right-3 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                          Destacada
                        </span>
                      )}
                      <div className="absolute -bottom-8 left-4">
                        <div className="w-16 h-16 rounded-xl bg-white shadow-md flex items-center justify-center overflow-hidden">
                          {store.logo_url ? (
                            <img src={store.logo_url} alt={store.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-primary-600">{store.nombre[0]}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Store Info */}
                    <div className="p-4 pt-12">
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition">
                        {store.nombre}
                      </h3>
                      {store.descripcion && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{store.descripcion}</p>
                      )}

                      {/* Tags */}
                      {store.tags && store.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {store.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform inline-flex items-center">
                          Visitar tienda
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                        {store.producto_count > 0 && (
                          <span className="text-gray-400 text-sm">
                            {store.producto_count} productos
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Become a vendor CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Quieres vender en la plataforma?
          </h2>
          <p className="text-gray-600 mb-6">
            Si tienes un negocio en el mercado de abastos y quieres llegar a mas clientes, contactanos
          </p>
          {config?.developer?.whatsapp && (
            <a
              href={`https://wa.me/52${config.developer.whatsapp}?text=Hola, me interesa vender en la plataforma`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar por WhatsApp
            </a>
          )}
        </div>
      </section>
    </div>
  )
}
