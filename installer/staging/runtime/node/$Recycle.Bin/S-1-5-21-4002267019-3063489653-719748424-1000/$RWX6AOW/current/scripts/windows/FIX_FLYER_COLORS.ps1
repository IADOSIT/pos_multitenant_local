# FIX_FLYER_COLORS.ps1
# Aplica mejoras a la seccion de productos destacados del portal
# Ejecutar como Administrador

Write-Host "=== EMC Abastos - Fix Flyer Colors ===" -ForegroundColor Cyan

# 1. Stop IIS
Write-Host "`n[1/4] Deteniendo IIS..." -ForegroundColor Yellow
iisreset /stop

Start-Sleep -Seconds 2

# 2. Update PortalController.php - agregar accent_color al API
Write-Host "[2/4] Actualizando PortalController..." -ForegroundColor Yellow
$portalControllerPath = "C:\sites\emc_abastos\current\app\Http\Controllers\Api\Public\PortalController.php"
$content = Get-Content $portalControllerPath -Raw

$oldText = @"
        return response()->json([
            'success' => true,
            'data' => [
                'enabled' => true,
                'title' => `$config['flyer_title'] ?? 'Productos destacados',
                'subtitle' => `$config['flyer_subtitle'] ?? 'Del mercado de abastos a tu negocio',
                'products' => `$formattedProducts,
            ],
        ]);
"@

$newText = @"
        return response()->json([
            'success' => true,
            'data' => [
                'enabled' => true,
                'title' => `$config['flyer_title'] ?? 'Productos destacados',
                'subtitle' => `$config['flyer_subtitle'] ?? 'Del mercado de abastos a tu negocio',
                'accent_color' => `$config['flyer_accent_color'] ?? null,
                'products' => `$formattedProducts,
            ],
        ]);
"@

$content = $content -replace [regex]::Escape($oldText), $newText
Set-Content $portalControllerPath -Value $content -Encoding UTF8
Write-Host "  PortalController actualizado" -ForegroundColor Green

# 3. Update Home.jsx with new design
Write-Host "[3/4] Actualizando Home.jsx del portal..." -ForegroundColor Yellow
$homeJsxContent = @'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStores, usePromotions, useFlyer } from '../hooks/useApi'

export default function Home({ config }) {
  const { stores } = useStores()
  const { promotions } = usePromotions()
  const { flyer } = useFlyer()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (flyer.products?.length > 3) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % Math.ceil(flyer.products.length / 3))
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [flyer.products?.length])

  const accentColor = flyer.accent_color

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 fade-in">
              {config?.hero?.title || 'Compra directo del mercado de abastos'}
            </h1>
            <p className="text-xl lg:text-2xl text-primary-100 mb-8">
              {config?.hero?.subtitle || 'Los mejores precios, la mejor calidad'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/tiendas" className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-lg">
                {config?.hero?.cta_text || 'Explorar tiendas'}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <a href="#como-funciona" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition">Como funciona</a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products - Professional Design */}
      {flyer.enabled && flyer.products?.length > 0 && (
        <section className="relative py-16 overflow-hidden" style={accentColor ? { background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)` } : { background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10 animate-pulse" style={{ background: accentColor || '#e2e8f0' }}></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 animate-pulse" style={{ background: accentColor || '#e2e8f0', animationDelay: '1s' }}></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl lg:text-4xl font-bold mb-3 ${accentColor ? 'text-white' : 'text-gray-900'}`}>{flyer.title || 'Productos destacados'}</h2>
              {flyer.subtitle && <p className={`text-lg ${accentColor ? 'text-white/80' : 'text-gray-600'}`}>{flyer.subtitle}</p>}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {flyer.products.slice(currentSlide * 3, currentSlide * 3 + 6).map((product, index) => (
                <a key={product.id} href={product.store?.store_url || '#'} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: `${index * 100}ms`, opacity: 0, animation: `fadeInUp 0.5s ease forwards ${index * 0.1}s` }}>
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    <img src={product.display_image || '/images/producto-default.svg'} alt={product.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" onError={(e) => { e.target.src = '/images/producto-default.svg' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {product.store && <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full shadow-sm">{product.store.nombre}</span>}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">{product.nombre}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary-600">${product.precio?.toFixed(2)}</span>
                      <span className="text-sm text-gray-500 flex items-center gap-1 group-hover:text-primary-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        Ver tienda
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {flyer.products.length > 6 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: Math.ceil(flyer.products.length / 3) }).map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentSlide === i ? `w-8 ${accentColor ? 'bg-white' : 'bg-primary-600'}` : `${accentColor ? 'bg-white/40 hover:bg-white/60' : 'bg-gray-300 hover:bg-gray-400'}`}`} />
                ))}
              </div>
            )}

            <div className="text-center mt-10">
              <Link to="/productos" className={`inline-flex items-center px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${accentColor ? 'bg-white text-gray-800 hover:bg-gray-50' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
                Ver todos los productos
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
          <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </section>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Ofertas destacadas</h2>
            <p className="text-gray-600 mb-8">Las mejores promociones de nuestros proveedores</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.slice(0, 6).map((promo) => (
                <a key={promo.id} href={promo.target_url} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden group">
                  <div className="relative h-48 bg-gray-100">
                    {(promo.hero_image || promo.producto?.imagen_url) && <img src={promo.hero_image || promo.producto?.imagen_url} alt={promo.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />}
                    {promo.badge_text && <span className="absolute top-3 left-3 px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full">{promo.badge_text}</span>}
                    {promo.discount_percent && <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">-{promo.discount_percent}%</span>}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-primary-600 font-medium mb-1">{promo.store?.nombre}</p>
                    <h3 className="font-bold text-gray-900 mb-2">{promo.title}</h3>
                    {config?.settings?.show_prices && promo.promo_price && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary-600">${promo.promo_price}</span>
                        {promo.original_price && <span className="text-gray-400 line-through">${promo.original_price}</span>}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it Works */}
      <section id="como-funciona" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Como funciona</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Comprar en el mercado de abastos nunca fue tan facil</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[{ icon: '🏪', title: 'Elige tu proveedor', desc: 'Explora nuestro directorio de proveedores verificados' },{ icon: '🛒', title: 'Agrega al carrito', desc: 'Selecciona los productos que necesitas' },{ icon: '🚚', title: 'Recibe tu pedido', desc: 'Recoge en tienda o recibe a domicilio' }].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stores */}
      {stores.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tiendas destacadas</h2>
                <p className="text-gray-600">Proveedores verificados del mercado</p>
              </div>
              <Link to="/tiendas" className="text-primary-600 hover:text-primary-700 font-medium">Ver todas →</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stores.slice(0, 4).map((store) => (
                <a key={store.id} href={store.store_url} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition text-center group">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {store.logo_url ? <img src={store.logo_url} alt={store.nombre} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-gray-400">{store.nombre[0]}</span>}
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition">{store.nombre}</h3>
                  {store.descripcion && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{store.descripcion}</p>}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Por que elegirnos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[{ icon: '✓', title: 'Precios de mayoreo', desc: 'Precios directos del mercado' },{ icon: '🔒', title: 'Compra segura', desc: 'Multiples metodos de pago' },{ icon: '📦', title: 'Productos frescos', desc: 'Directo del proveedor' },{ icon: '💬', title: 'Soporte directo', desc: 'Comunicacion con proveedores' }].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">{item.icon}</div>
                <div><h3 className="font-bold text-gray-900">{item.title}</h3><p className="text-sm text-gray-600 mt-1">{item.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {[{ q: 'Como me registro?', a: 'Puedes comprar sin registrarte.' },{ q: 'Metodos de pago?', a: 'Efectivo, transferencia y MercadoPago.' },{ q: 'Entregas a domicilio?', a: 'Depende de cada proveedor.' },{ q: 'Como ser proveedor?', a: 'Contactanos por WhatsApp.' }].map((faq, i) => (
              <details key={i} className="bg-white rounded-lg shadow-sm group">
                <summary className="p-4 cursor-pointer font-medium text-gray-900 flex justify-between items-center">{faq.q}<svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></summary>
                <p className="px-4 pb-4 text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Listo para comprar?</h2>
          <p className="text-xl text-primary-100 mb-8">Explora las tiendas y encuentra lo que necesitas</p>
          <Link to="/tiendas" className="inline-flex items-center px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-lg">
            Ver tiendas disponibles
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
'@

Set-Content "C:\sites\emc_abastos\current\portal\src\pages\Home.jsx" -Value $homeJsxContent -Encoding UTF8
Write-Host "  Home.jsx actualizado" -ForegroundColor Green

# 4. Rebuild portal
Write-Host "[4/4] Reconstruyendo portal React..." -ForegroundColor Yellow
Set-Location "C:\sites\emc_abastos\current\portal"
npm run build 2>$null

if (Test-Path "C:\sites\emc_abastos\current\portal\dist") {
    Remove-Item "C:\sites\emc_abastos\current\public\portal\*" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item "C:\sites\emc_abastos\current\portal\dist\*" "C:\sites\emc_abastos\current\public\portal\" -Recurse -Force
    Write-Host "  Portal reconstruido y desplegado" -ForegroundColor Green
}

# 5. Clear Laravel caches
Write-Host "`nLimpiando caches de Laravel..." -ForegroundColor Yellow
Set-Location "C:\sites\emc_abastos\current"
C:\php\php.exe artisan config:clear
C:\php\php.exe artisan cache:clear
C:\php\php.exe artisan config:cache
C:\php\php.exe artisan route:cache
C:\php\php.exe artisan view:cache

# 6. Start IIS
Write-Host "`nIniciando IIS..." -ForegroundColor Yellow
iisreset /start

Write-Host "`n=== COMPLETADO ===" -ForegroundColor Green
Write-Host "Cambios aplicados:" -ForegroundColor White
Write-Host "  - Seccion de productos con diseño profesional" -ForegroundColor Gray
Write-Host "  - Sin color de fondo por defecto (fondo neutro elegante)" -ForegroundColor Gray
Write-Host "  - Animacion fadeInUp en productos" -ForegroundColor Gray
Write-Host "  - Color configurable desde Admin > Portal > Flyer" -ForegroundColor Gray
Write-Host "`nPrueba en: /portal/" -ForegroundColor Cyan
