import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tienda iaDoS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head />
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
