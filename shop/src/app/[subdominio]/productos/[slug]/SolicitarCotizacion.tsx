'use client'
// Sustituye al boton de "Agregar al carrito" cuando el producto se vende por cotizacion.
// No toca el carrito a proposito: sin precio de lista, un pedido web quedaria en $0
// (el backend tambien lo rechaza), asi que la conversion aqui es contactar a la tienda.
import { linkCotizacion } from '@/lib/cotizacion'

interface Props {
  producto: any
  contacto: { telefono?: string | null; email?: string | null; nombre?: string | null }
}

export default function SolicitarCotizacion({ producto, contacto }: Props) {
  const link = linkCotizacion(producto, contacto)
  const esWhatsApp = link?.startsWith('https://wa.me/')

  return (
    <div>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-text)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 0',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
          }}
        >
          {esWhatsApp ? 'Solicitar cotización por WhatsApp' : 'Solicitar cotización por correo'}
        </a>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
          Comunícate con la tienda para cotizar esta pieza.
        </p>
      )}

      <p style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 10, lineHeight: 1.6 }}>
        Esta pieza no tiene precio de lista. Te confirmamos precio y disponibilidad al momento.
      </p>
    </div>
  )
}
