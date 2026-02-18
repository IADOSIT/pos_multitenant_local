import { useState } from 'react';
import type { Producto } from '../lib/api';

interface ProductCardProps {
  producto: Producto;
  onAddToCart?: (id: number) => void;
}

export default function ProductCard({ producto, onAddToCart }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    if (isAdding || !onAddToCart) return;

    setIsAdding(true);
    try {
      await onAddToCart(producto.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setIsAdding(false);
    }
  };

  const imageSrc = producto.display_image || producto.image_url || '/images/producto-default.svg';

  return (
    <div className="group bg-white rounded-premium-lg shadow-premium overflow-hidden transition-all duration-300 hover:shadow-premium-lg hover:-translate-y-1">
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-slate-100">
        <img
          src={imageSrc}
          alt={producto.nombre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/producto-default.svg';
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-heading font-semibold text-slate-800 line-clamp-2 min-h-[2.5rem]">
          {producto.nombre}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-brand-primary">
            ${producto.precio.toFixed(2)}
          </span>

          <button
            onClick={handleAdd}
            disabled={isAdding}
            className={`
              px-4 py-2 rounded-full font-medium text-sm transition-all duration-200
              ${added
                ? 'bg-emerald-500 text-white'
                : 'bg-brand-primary text-white hover:opacity-90'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isAdding ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : added ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              'Agregar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
