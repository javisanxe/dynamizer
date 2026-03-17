import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dynamizer',
  description: 'Juegos sociales en tiempo real para grupos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
