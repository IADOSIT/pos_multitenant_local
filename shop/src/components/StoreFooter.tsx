import { IADOS } from '@/lib/constants'

interface ContactoConfig {
  activo?: boolean
  telefono?: string; mostrar_telefono?: boolean
  whatsapp?: string; mostrar_whatsapp?: boolean; whatsapp_mensaje?: string
  nombre_contacto?: string; mostrar_nombre?: boolean
  redes?: { facebook?: string; instagram?: string; tiktok?: string; x?: string }
}

const REDES_LABEL: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', x: 'X (Twitter)' }

function soloDigitos(v: string) {
  return v.replace(/\D/g, '')
}

export default function StoreFooter({ tiendaNombre, empresaNombre, contacto }: { tiendaNombre?: string; empresaNombre?: string; contacto?: ContactoConfig }) {
  const nombre = tiendaNombre || empresaNombre || 'esta tienda'
  const mostrarContacto = !!contacto?.activo && (
    (contacto.mostrar_telefono && contacto.telefono) ||
    (contacto.mostrar_whatsapp && contacto.whatsapp) ||
    (contacto.mostrar_nombre && contacto.nombre_contacto) ||
    Object.values(contacto.redes || {}).some(Boolean)
  )
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

          {/* Contacto de la tienda */}
          {mostrarContacto && (
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)', marginBottom: 10 }}>
                {(contacto?.mostrar_nombre && contacto.nombre_contacto) || `Contacta a ${nombre}`}
              </p>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 2 }}>
                {contacto?.mostrar_telefono && contacto.telefono && (
                  <p><a href={`tel:${soloDigitos(contacto.telefono)}`} style={{ color: 'inherit', textDecoration: 'none' }}>📞 {contacto.telefono}</a></p>
                )}
                {contacto?.mostrar_whatsapp && contacto.whatsapp && (
                  <p>
                    <a
                      href={`https://wa.me/${soloDigitos(contacto.whatsapp)}${contacto.whatsapp_mensaje ? `?text=${encodeURIComponent(contacto.whatsapp_mensaje)}` : ''}`}
                      target="_blank" rel="noreferrer"
                      style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
                    >
                      💬 WhatsApp
                    </a>
                  </p>
                )}
                {contacto?.redes && Object.entries(contacto.redes).filter(([, url]) => url).map(([red, url]) => (
                  <p key={red}>
                    <a href={url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {REDES_LABEL[red] || red}
                    </a>
                  </p>
                ))}
              </div>
            </div>
          )}

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
