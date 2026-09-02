// Productos sin precio de lista (`cotizacion = true` en el catalogo): la tienda no
// publica precio y el cliente pide una cotizacion por WhatsApp o correo. Aqui vive lo
// unico que comparten la tarjeta, la vista rapida y la ficha del producto.

export const TEXTO_COTIZACION = 'Precio a cotizar'

/** Numero listo para wa.me: solo digitos y con lada de Mexico si venia a 10 digitos. */
export function telefonoWhatsApp(telefono?: string | null): string | null {
  const digitos = (telefono || '').replace(/\D/g, '')
  if (digitos.length < 10) return null
  return digitos.length === 10 ? `52${digitos}` : digitos
}

export function mensajeCotizacion(producto: any, tiendaNombre?: string): string {
  const partes = [
    `Hola${tiendaNombre ? ` ${tiendaNombre}` : ''}, quiero cotizar:`,
    producto?.nombre,
    producto?.sku ? `SKU: ${producto.sku}` : null,
  ].filter(Boolean)
  return partes.join('\n')
}

/** Link de contacto para pedir la cotizacion, o null si la tienda no publico contacto. */
export function linkCotizacion(
  producto: any,
  contacto: { telefono?: string | null; email?: string | null; nombre?: string | null },
): string | null {
  const mensaje = mensajeCotizacion(producto, contacto?.nombre || undefined)
  const wa = telefonoWhatsApp(contacto?.telefono)
  if (wa) return `https://wa.me/${wa}?text=${encodeURIComponent(mensaje)}`
  if (contacto?.email) {
    return `mailto:${contacto.email}?subject=${encodeURIComponent(`Cotización: ${producto?.nombre || ''}`)}&body=${encodeURIComponent(mensaje)}`
  }
  return null
}
