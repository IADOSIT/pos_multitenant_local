import { useState } from 'react';

interface NavbarProps {
  appName: string;
  logoUrl?: string;
  cartCount: number;
  onCartClick?: () => void;
}

export default function Navbar({ appName, logoUrl, cartCount, onCartClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={appName}
                className="h-10 lg:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <div
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {appName.charAt(0)}
              </div>
            )}
            <span className="hidden sm:block font-heading text-xl lg:text-2xl font-bold text-slate-800">
              {appName}
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-slate-600 hover:text-brand-primary font-medium transition-colors">
              Inicio
            </a>
            <a href="/productos" className="text-slate-600 hover:text-brand-primary font-medium transition-colors">
              Productos
            </a>
            <a href="/contacto" className="text-slate-600 hover:text-brand-primary font-medium transition-colors">
              Contacto
            </a>
          </div>

          {/* Cart Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={onCartClick}
              className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center animate-scale-in"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 animate-slide-up">
          <div className="px-4 py-4 space-y-3">
            <a href="/" className="block py-2 text-slate-600 hover:text-brand-primary font-medium">
              Inicio
            </a>
            <a href="/productos" className="block py-2 text-slate-600 hover:text-brand-primary font-medium">
              Productos
            </a>
            <a href="/contacto" className="block py-2 text-slate-600 hover:text-brand-primary font-medium">
              Contacto
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
