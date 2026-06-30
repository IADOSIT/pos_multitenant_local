import { NextResponse, type NextRequest } from 'next/server'

// Rewrite hostname-based access → path-based internally
// frutalovit.pos.iados.online/ → shop:3000/frutalovit/
// Así el [subdominio] routing de Next.js sigue funcionando sin cambios
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  // host puede ser "frutalovit.pos.iados.online" o "frutalovit.pos.iados.online:3010"
  const hostname = host.split(':')[0]
  const parts = hostname.split('.')

  // Detectar *.pos.iados.online (4 partes: subdomain.pos.iados.online)
  // o cualquier subdominio que tenga al menos 4 segmentos
  const isPosSubdomain =
    parts.length >= 4 &&
    parts[parts.length - 1] === 'online' &&
    parts[parts.length - 2] === 'iados' &&
    parts[parts.length - 3] === 'pos'

  if (isPosSubdomain) {
    const subdomain = parts.slice(0, parts.length - 3).join('.')
    const pathname = request.nextUrl.pathname

    // Ya tiene el prefijo → no reescribir (evita bucle infinito)
    if (pathname === `/${subdomain}` || pathname.startsWith(`/${subdomain}/`)) {
      return NextResponse.next()
    }

    // _next/static, _next/image, favicon → no reescribir
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname === '/favicon.ico'
    ) {
      return NextResponse.next()
    }

    const rewriteUrl = new URL(`/${subdomain}${pathname}`, request.url)
    rewriteUrl.search = request.nextUrl.search
    return NextResponse.rewrite(rewriteUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
