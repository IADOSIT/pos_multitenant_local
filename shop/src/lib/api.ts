const BACKEND = process.env.NEXT_PUBLIC_API_URL || '/api'

export async function fetchTiendaInfo(subdominio: string) {
  const res = await fetch(`${BACKEND}/public/tienda/${subdominio}/info`, { next: { revalidate: 300 } })
  if (!res.ok) return null
  return res.json()
}

export async function fetchCategorias(subdominio: string) {
  const res = await fetch(`${BACKEND}/public/tienda/${subdominio}/categorias`, { next: { revalidate: 60 } })
  if (!res.ok) return []
  return res.json()
}

export async function fetchProductos(subdominio: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BACKEND}/public/tienda/${subdominio}/productos${qs ? `?${qs}` : ''}`, { next: { revalidate: 30 } })
  if (!res.ok) return { data: [], meta: {} }
  return res.json()
}

export async function fetchProductoSlug(subdominio: string, slug: string) {
  const res = await fetch(`${BACKEND}/public/tienda/${subdominio}/productos/${slug}`, { next: { revalidate: 30 } })
  if (!res.ok) return null
  return res.json()
}

export async function crearPedido(subdominio: string, body: any) {
  const res = await fetch(`${BACKEND}/public/tienda/${subdominio}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Error al crear pedido')
  }
  return res.json()
}

export async function fetchPedido(subdominio: string, numero: string) {
  const res = await fetch(`${BACKEND}/public/tienda/${subdominio}/pedidos/${numero}`)
  if (!res.ok) return null
  return res.json()
}

export async function fetchMisPedidos(subdominio: string, email: string, tel?: string) {
  const res = await fetch(`${BACKEND}/public/tienda/${subdominio}/mis-pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, tel }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Error al consultar tus pedidos')
  }
  return res.json()
}
