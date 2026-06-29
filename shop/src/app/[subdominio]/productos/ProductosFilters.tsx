'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  categorias: any[]
  categoriaActiva?: string
  subdominio: string
  ordenar: string
  buscar?: string
  modoMayoreo: boolean
  mensajeMayoreo?: string
  qtyMin: number
}

export default function ProductosFilters({ categorias, categoriaActiva, subdominio, ordenar, buscar: buscarProp, modoMayoreo, mensajeMayoreo, qtyMin }: Props) {
  const router = useRouter()
  const [buscar, setBuscar] = useState(buscarProp || '')

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const vals = { categoria_id: categoriaActiva, ordenar, buscar: buscarProp, ...overrides }
    for (const [k, v] of Object.entries(vals)) {
      if (v) p.set(k, v)
    }
    return `/${subdominio}/productos?${p.toString()}`
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(buildUrl({ buscar: buscar || undefined, categoria_id: undefined }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Buscar */}
      <form onSubmit={handleSearch}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Buscar</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            placeholder="nombre, SKU..."
            style={{ flex: 1, padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', fontFamily: 'var(--font-body)' }}
          />
          <button type="submit" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0 12px', cursor: 'pointer', fontSize: 13 }}>🔍</button>
        </div>
      </form>

      {/* Ordenar */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Ordenar</p>
        {[
          { value: 'novedad', label: 'Más nuevos' },
          { value: 'precio_asc', label: 'Precio: menor a mayor' },
          { value: 'precio_desc', label: 'Precio: mayor a menor' },
          { value: 'nombre', label: 'Nombre A-Z' },
        ].map(op => (
          <Link key={op.value} href={buildUrl({ ordenar: op.value })}
            style={{ display: 'block', padding: '6px 10px', fontSize: 13, borderRadius: 'var(--radius-sm)', color: ordenar === op.value ? 'var(--color-primary)' : 'var(--color-text-muted)', background: ordenar === op.value ? 'var(--color-surface-hover)' : 'transparent', fontWeight: ordenar === op.value ? 700 : 400, textDecoration: 'none', marginBottom: 2 }}>
            {op.label}
          </Link>
        ))}
      </div>

      {/* Categorías */}
      {categorias.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Categorías</p>
          <Link href={buildUrl({ categoria_id: undefined })}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', fontSize: 13, borderRadius: 'var(--radius-sm)', color: !categoriaActiva ? 'var(--color-primary)' : 'var(--color-text-muted)', background: !categoriaActiva ? 'var(--color-surface-hover)' : 'transparent', fontWeight: !categoriaActiva ? 700 : 400, textDecoration: 'none', marginBottom: 2 }}>
            <span>Todos</span>
          </Link>
          {categorias.map((c: any) => (
            <Link key={c.id} href={buildUrl({ categoria_id: String(c.id) })}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', fontSize: 13, borderRadius: 'var(--radius-sm)', color: categoriaActiva == c.id ? 'var(--color-primary)' : 'var(--color-text-muted)', background: categoriaActiva == c.id ? 'var(--color-surface-hover)' : 'transparent', fontWeight: categoriaActiva == c.id ? 700 : 400, textDecoration: 'none', marginBottom: 2 }}>
              <span>{c.nombre}</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>{c.total_productos}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Mayoreo info */}
      {modoMayoreo && (
        <div style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 14, borderLeft: '3px solid var(--color-mayoreo)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-mayoreo)', marginBottom: 4 }}>💼 Precio Mayoreo</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
            {mensajeMayoreo || `Descuento especial comprando ${qtyMin}+ unidades del mismo producto.`}
          </p>
        </div>
      )}
    </div>
  )
}
