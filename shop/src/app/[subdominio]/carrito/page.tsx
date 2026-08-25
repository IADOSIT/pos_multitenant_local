import { notFound } from 'next/navigation'
import { fetchTiendaInfo, fetchCategorias } from '@/lib/api'
import { CartProvider } from '@/hooks/useCart'
import Navbar from '@/components/Navbar'
import StoreFooter from '@/components/StoreFooter'
import CarritoView from './CarritoView'

interface PageProps {
  params: { subdominio: string }
}

export default async function CarritoPage({ params }: PageProps) {
  const { subdominio } = params
  const [info, categorias] = await Promise.all([fetchTiendaInfo(subdominio), fetchCategorias(subdominio)])
  if (!info) notFound()

  return (
    <CartProvider>
      <Navbar categorias={categorias} />
      <CarritoView subdominio={subdominio} info={info} />
      <StoreFooter tiendaNombre={info.nombre_tienda} empresaNombre={info.empresa?.nombre} contacto={info.preferencias?.contacto} />
    </CartProvider>
  )
}
