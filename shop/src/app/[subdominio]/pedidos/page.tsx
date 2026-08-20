import { notFound } from 'next/navigation'
import { fetchTiendaInfo, fetchCategorias } from '@/lib/api'
import { CartProvider } from '@/hooks/useCart'
import Navbar from '@/components/Navbar'
import StoreFooter from '@/components/StoreFooter'
import MisPedidosView from './MisPedidosView'

interface PageProps {
  params: { subdominio: string }
}

export default async function MisPedidosPage({ params }: PageProps) {
  const { subdominio } = params
  const [info, categorias] = await Promise.all([fetchTiendaInfo(subdominio), fetchCategorias(subdominio)])
  if (!info) notFound()

  return (
    <CartProvider>
      <Navbar categorias={categorias} />
      <MisPedidosView subdominio={subdominio} />
      <StoreFooter tiendaNombre={info.nombre_tienda} empresaNombre={info.empresa?.nombre} />
    </CartProvider>
  )
}
