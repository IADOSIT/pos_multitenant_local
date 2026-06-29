import { IADOS } from '@/lib/constants'

export default function StoreFooter({ tiendaNombre, empresaNombre }: { tiendaNombre?: string; empresaNombre?: string }) {
  const nombre = tiendaNombre || empresaNombre || 'esta tienda'
  return (
    <footer style={{
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      padding: '40px 16px 24px',
      marginTop: 64,
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, marginBottom: 32 }}>
          {/* iaDoS branding */}
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Powered by</p>
            <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)', marginBottom: 4 }}>{IADOS.nombre}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{IADOS.nombre_completo}</p>
          </div>

          {/* Sobre esta tienda */}
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)', marginBottom: 10 }}>Sobre esta tienda</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              {nombre} opera en la plataforma Punto de Venta iaDoS.
            </p>
          </div>

          {/* Contacto iaDoS */}
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)', marginBottom: 10 }}>Contacto iaDoS</p>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 2 }}>
              <p>{IADOS.email}</p>
              <p>{IADOS.telefono}</p>
              <p>{IADOS.ubicacion}</p>
              <a href={IADOS.whatsapp} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
            © {new Date().getFullYear()} {IADOS.nombre} — Todos los derechos reservados.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
            Esta tienda es operada por <strong>{empresaNombre || nombre}</strong> usando la plataforma POS iaDoS.
          </p>
        </div>
      </div>
    </footer>
  )
}
