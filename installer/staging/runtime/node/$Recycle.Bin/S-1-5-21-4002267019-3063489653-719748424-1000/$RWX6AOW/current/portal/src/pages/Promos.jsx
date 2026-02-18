import { usePromotions } from '../hooks/useApi'

export default function Promos({ config }) {
  const { promotions, loading } = usePromotions()

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
      <section className="bg-gradient-to-br from-orange-500 to-red-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Promociones y ofertas</h1>
          <p className="text-orange-100 text-lg">
            Las mejores ofertas de nuestros proveedores
          </p>
        </div>
      </section>

      {/* Promos Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {promotions.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones activas</h3>
              <p className="text-gray-500">Vuelve pronto para ver nuevas ofertas</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                {promotions.length} promocion{promotions.length !== 1 ? 'es' : ''} activa{promotions.length !== 1 ? 's' : ''}
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promo) => (
                  <a
                    key={promo.id}
                    href={promo.target_url}
                    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition overflow-hidden group border-2 border-orange-100 hover:border-orange-300"
                  >
                    {/* Promo Image */}
                    <div className="relative h-56 bg-gradient-to-br from-orange-50 to-red-50 overflow-hidden">
                      {(promo.hero_image || promo.producto?.imagen_url) && (
                        <img
                          src={promo.hero_image || promo.producto?.imagen_url}
                          alt={promo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {promo.badge_text && (
                          <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                            {promo.badge_text}
                          </span>
                        )}
                      </div>

                      {promo.discount_percent && (
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1 bg-red-500 text-white text-lg font-bold rounded-full shadow-lg">
                            -{promo.discount_percent}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Promo Info */}
                    <div className="p-5">
                      {/* Store info */}
                      {promo.store && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                            {promo.store.logo_url ? (
                              <img src={promo.store.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                {promo.store.nombre[0]}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">{promo.store.nombre}</span>
                        </div>
                      )}

                      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-orange-600 transition">
                        {promo.title}
                      </h3>

                      {promo.description && (
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{promo.description}</p>
                      )}

                      {/* Prices */}
                      {config?.settings?.show_prices && promo.promo_price && (
                        <div className="flex items-baseline gap-3 mt-3">
                          <span className="text-2xl font-bold text-orange-600">
                            ${parseFloat(promo.promo_price).toFixed(2)}
                          </span>
                          {promo.original_price && (
                            <span className="text-gray-400 line-through text-lg">
                              ${parseFloat(promo.original_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <button className="mt-4 w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition group-hover:shadow-md">
                        {promo.cta_text || 'Ver oferta'}
                      </button>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Newsletter/Contact CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No te pierdas ninguna oferta
          </h2>
          <p className="text-gray-600 mb-6">
            Siguenos en redes sociales para enterarte de las mejores promociones
          </p>
          {config?.developer?.whatsapp && (
            <a
              href={`https://wa.me/52${config.developer.whatsapp}?text=Hola, quiero recibir ofertas`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Recibir ofertas por WhatsApp
            </a>
          )}
        </div>
      </section>
    </div>
  )
}
